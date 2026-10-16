import logging
from fastapi import APIRouter, HTTPException, Query, status

from server.app.schemas.transcript import (
    TranscriptRequest,
    TranscriptResponse,
    LanguagesResponse,
    VideoInfo,
    ErrorResponse,
)
from server.app.services.youtube_service import (
    extract_video_id,
    get_video_info,
    list_transcript_languages,
    fetch_raw_transcript,
    fetch_raw_transcript_with_retry,
    try_youtube_translate_track,
    YouTubeError,
)
from server.app.services.transcript_coordinator import (
    coordinator,
    sanitize_details,
)
from server.app.services.formatter_service import (
    format_transcript_paragraphs,
)
from server.app.services.translation_service import (
    translation_manager,
    get_language_display_name,
    TranslationError,
)
from server.app.services.speech_service import (
    transcribe_youtube_audio,
    SpeechRecognitionError,
)

logger = logging.getLogger("transcriptly.api")
router = APIRouter(prefix="/api")


@router.get(
    "/health",
    summary="Health check",
    response_model=dict,
    tags=["System"],
)
async def health_check():
    return {
        "status": "healthy",
        "service": "Transcriptly API",
        "version": "1.1.0",
        "speech_fallback_supported": True,
        "translation_supported": True,
    }


@router.get(
    "/video-info",
    summary="Retrieve video metadata",
    response_model=VideoInfo,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
    tags=["YouTube"],
)
async def video_info(video_id: str = Query(..., description="11-character YouTube video ID or URL")):
    try:
        vid = extract_video_id(video_id)
    except YouTubeError as e:
        raise HTTPException(status_code=e.status_code, detail={"detail": e.message, "code": e.code})

    info = await get_video_info(vid)
    if not info:
        return VideoInfo(video_id=vid, title=None, author=None, thumbnail_url=None)
    return info


@router.get(
    "/transcript/languages",
    summary="List available caption languages",
    response_model=LanguagesResponse,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        429: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
    tags=["Transcript"],
)
@router.get(
    "/transcript/languages",
    summary="List available caption languages for a YouTube video",
    response_model=LanguagesResponse,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        429: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
    tags=["Transcript"],
)
async def get_transcript_languages(
    video_id: str = Query(..., description="11-character YouTube video ID or URL")
):
    try:
        vid = extract_video_id(video_id)
        # Check raw cache first if available
        cached_raw = await coordinator.cache.get_raw(f"{vid}:auto")
        if cached_raw and "available_languages" in cached_raw:
            return LanguagesResponse(video_id=vid, languages=cached_raw["available_languages"])
        languages = list_transcript_languages(vid)
        return LanguagesResponse(video_id=vid, languages=languages)
    except YouTubeError as e:
        headers = {"Retry-After": str(e.retry_after)} if e.retry_after else {}
        detail_data = {"detail": e.message, "code": e.code}
        if e.retry_after:
            detail_data["retry_after"] = e.retry_after
        raise HTTPException(status_code=e.status_code, headers=headers, detail=detail_data)
    except Exception as e:
        sanitized = sanitize_details(e)
        logger.error("Failed to list transcript languages for %s: %s", video_id, sanitized)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"detail": f"An unexpected error occurred: {sanitized}", "code": "INTERNAL_ERROR"},
        )


@router.post(
    "/transcript",
    summary="Extract, transcribe, format, and translate transcript",
    response_model=TranscriptResponse,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        429: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
    tags=["Transcript"],
)
async def extract_transcript(payload: TranscriptRequest):
    # 1. Validate URL and extract video ID
    try:
        vid = extract_video_id(payload.url)
    except YouTubeError as e:
        headers = {"Retry-After": str(e.retry_after)} if e.retry_after else {}
        detail_data = {"detail": e.message, "code": e.code}
        if e.retry_after:
            detail_data["retry_after"] = e.retry_after
        raise HTTPException(status_code=e.status_code, headers=headers, detail=detail_data)

    preferred_lang = payload.language if (payload.language and payload.language.lower() != "auto") else "auto"
    para_len = payload.paragraph_length or "medium"
    lang_mode = payload.language_mode or "original"
    target_lang = payload.target_language if lang_mode == "translate" else "none"
    speech_fb = "1" if payload.enable_speech_fallback else "0"

    response_cache_key = f"{vid}:{preferred_lang}:{para_len}:{lang_mode}:{target_lang}:{speech_fb}"
    raw_cache_key = f"{vid}:{preferred_lang}:{speech_fb}"

    # Check full response cache first
    cached_resp = await coordinator.cache.get_response(response_cache_key)
    if cached_resp is not None:
        logger.info("Serving full transcript response from memory cache for %s", response_cache_key)
        return cached_resp

    async def _execute_job():
        # Double-check response cache within leader task
        cached_inner = await coordinator.cache.get_response(response_cache_key)
        if cached_inner is not None:
            return cached_inner

        # Check raw cache to avoid re-fetching from YouTube when only formatting/translation changes
        cached_raw = await coordinator.cache.get_raw(raw_cache_key)
        video_info = None
        video_title = None
        track_object = None

        if cached_raw is not None:
            logger.info("Reusing cached raw transcript segments for %s", raw_cache_key)
            raw_segments = cached_raw["raw_segments"]
            lang_name = cached_raw["lang_name"]
            lang_code = cached_raw["lang_code"]
            is_gen = cached_raw["is_gen"]
            available_langs = cached_raw["available_languages"]
            video_info = cached_raw.get("video_info")
            video_title = cached_raw.get("video_title")
            transcription_method = cached_raw.get("transcription_method", "youtube_captions")
            warnings = list(cached_raw.get("warnings", []))
        else:
            # Enforce concurrency queue limit before making upstream network requests
            acquired = await coordinator.acquire_concurrency_slot()
            if not acquired:
                logger.warning("Concurrency queue timeout for video %s", vid)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    headers={"Retry-After": "5"},
                    detail={
                        "detail": "Server is processing maximum concurrent transcript requests. Please retry in a few moments.",
                        "code": "SERVER_BUSY",
                        "retry_after": 5,
                    },
                )

            try:
                # Fetch video metadata via oEmbed
                video_info = await get_video_info(vid)
                if video_info:
                    if isinstance(video_info, dict):
                        video_title = video_info.get("title")
                    else:
                        video_title = getattr(video_info, "title", None)

                logger.info(
                    "Received transcript extraction request: vid=%s, language_mode=%s, preferred_language=%s, "
                    "target_language=%s, enable_speech_fallback=%s, title='%s'",
                    vid,
                    payload.language_mode,
                    payload.language,
                    payload.target_language,
                    payload.enable_speech_fallback,
                    video_title,
                )

                transcription_method = "youtube_captions"
                available_langs = []
                raw_segments = None
                lang_name = ""
                lang_code = ""
                is_gen = False
                warnings = []

                try:
                    raw_segments, lang_name, lang_code, is_gen, available_langs, track_object = await fetch_raw_transcript_with_retry(
                        vid,
                        preferred_language=payload.language,
                        video_title=video_title,
                        fetcher=fetch_raw_transcript,
                    )
                    logger.info(
                        "Selected caption track for %s: lang_code='%s', lang_name='%s', is_generated=%s, is_translated=False",
                        vid,
                        lang_code,
                        lang_name,
                        is_gen,
                    )
                except YouTubeError as caption_err:
                    logger.warning(
                        "Caption extraction failed or original track unavailable for %s: %s (code=%s)",
                        vid,
                        caption_err.message,
                        caption_err.code,
                    )
                    # Speech recognition fallback only if requested and captions are missing or blocked
                    if payload.enable_speech_fallback and caption_err.code in ("NO_CAPTIONS", "RETRIEVAL_FAILED", "YOUTUBE_BLOCKED"):
                        logger.info("Initiating local speech recognition fallback via faster-whisper for %s...", vid)
                        try:
                            raw_segments, lang_name, lang_code = await transcribe_youtube_audio(
                                vid, preferred_language=payload.language
                            )
                            transcription_method = "speech_recognition"
                            is_gen = True
                            logger.info(
                                "Speech recognition fallback completed for %s: detected_language='%s' (%s)",
                                vid,
                                lang_code,
                                lang_name,
                            )
                            warnings.append(
                                f"No accessible captions found. Transcript was generated using local speech recognition ({lang_name})."
                            )
                        except SpeechRecognitionError as speech_err:
                            logger.error("Speech recognition fallback failed for %s: %s", vid, speech_err.message)
                            headers = {"Retry-After": "30"} if speech_err.status_code == 429 else {}
                            detail_data = {"detail": speech_err.message, "code": speech_err.code}
                            if speech_err.status_code == 429:
                                detail_data["retry_after"] = 30
                            raise HTTPException(
                                status_code=speech_err.status_code,
                                headers=headers,
                                detail=detail_data,
                            )
                    else:
                        hint = ""
                        if not payload.enable_speech_fallback and caption_err.code in ("NO_CAPTIONS", "YOUTUBE_BLOCKED"):
                            hint = " You can enable the Speech-to-Text fallback option to transcribe the audio locally."
                        headers = {"Retry-After": str(caption_err.retry_after)} if caption_err.retry_after else {}
                        detail_data = {"detail": f"{caption_err.message}.{hint}".strip(), "code": caption_err.code}
                        if caption_err.retry_after:
                            detail_data["retry_after"] = caption_err.retry_after
                        raise HTTPException(
                            status_code=caption_err.status_code,
                            headers=headers,
                            detail=detail_data,
                        )

                # Store successful raw segments in cache
                await coordinator.cache.set_raw(raw_cache_key, {
                    "raw_segments": raw_segments,
                    "lang_name": lang_name,
                    "lang_code": lang_code,
                    "is_gen": is_gen,
                    "available_languages": available_langs,
                    "video_info": video_info,
                    "video_title": video_title,
                    "transcription_method": transcription_method,
                    "warnings": warnings,
                })
            finally:
                await coordinator.release_concurrency_slot()

        # Format paragraphs
        orig_cleaned_segs, orig_paragraphs, orig_srt, orig_words, orig_chars = format_transcript_paragraphs(
            raw_segments, paragraph_length=para_len
        )

        detected_lang_code = lang_code
        detected_lang_name = lang_name or get_language_display_name(lang_code)

        # Translation handling
        is_translated = False
        translated_paragraphs = None
        translated_segments = None
        translated_srt = None
        translation_provider = None
        target_lang_name = None
        effective_target_language = None

        if payload.language_mode == "translate" and payload.target_language:
            effective_target_language = payload.target_language
            target_clean = payload.target_language.lower().strip()
            target_lang_name = get_language_display_name(target_clean)

            # Only translate if target is different from source
            if target_clean != detected_lang_code.lower().split("-")[0]:
                youtube_trans_raw = None
                if track_object:
                    youtube_trans_raw = try_youtube_translate_track(track_object, target_clean)

                try:
                    trans_segs, trans_paras, trans_srt, provider_used = await translation_manager.translate_transcript(
                        original_segments=orig_cleaned_segs,
                        source_lang=detected_lang_code,
                        target_lang=target_clean,
                        youtube_translated_raw=youtube_trans_raw,
                        paragraph_length=para_len,
                    )
                    is_translated = True
                    translated_paragraphs = trans_paras
                    translated_segments = trans_segs
                    translated_srt = trans_srt
                    translation_provider = provider_used
                    logger.info(
                        "Translation completed for %s: source='%s', target='%s', provider='%s'",
                        vid,
                        detected_lang_code,
                        target_clean,
                        provider_used,
                    )
                except TranslationError as te:
                    logger.error("Translation failed for %s: %s", vid, te.message)
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail={"detail": te.message, "code": te.code},
                    )

        # Active output
        if is_translated and translated_paragraphs:
            active_paragraphs = translated_paragraphs
            active_segments = translated_segments
            active_srt = translated_srt
            active_lang = effective_target_language or payload.target_language
            active_lang_name = target_lang_name or get_language_display_name(active_lang)
            active_word_count = sum(len(p.split()) for p in active_paragraphs)
            active_char_count = sum(len(p) for p in active_paragraphs)
        else:
            active_paragraphs = orig_paragraphs
            active_segments = orig_cleaned_segs
            active_srt = orig_srt
            active_lang = detected_lang_code
            active_lang_name = detected_lang_name
            active_word_count = orig_words
            active_char_count = orig_chars

        response_data = TranscriptResponse(
            video_id=vid,
            video_info=video_info,
            language=active_lang,
            language_name=active_lang_name,
            detected_language=detected_lang_code,
            detected_language_name=detected_lang_name,
            is_generated=is_gen,
            transcription_method=transcription_method,
            language_mode=payload.language_mode,
            target_language=effective_target_language,
            target_language_name=target_lang_name,
            is_translated=is_translated,
            translation_provider=translation_provider,
            available_languages=available_langs,
            paragraphs=active_paragraphs,
            segments=active_segments,
            srt=active_srt,
            original_paragraphs=orig_paragraphs,
            original_segments=orig_cleaned_segs,
            original_srt=orig_srt,
            translated_paragraphs=translated_paragraphs,
            translated_segments=translated_segments,
            translated_srt=translated_srt,
            word_count=active_word_count,
            character_count=active_char_count,
            warnings=warnings,
        )

        # Save successful response in memory cache
        await coordinator.cache.set_response(response_cache_key, response_data)
        return response_data

    # Use single-flight coordinator so duplicate concurrent requests share the same job
    return await coordinator.single_flight.execute(response_cache_key, _execute_job)
