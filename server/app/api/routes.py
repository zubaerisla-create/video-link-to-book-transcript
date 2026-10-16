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
    try_youtube_translate_track,
    YouTubeError,
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
async def get_transcript_languages(
    video_id: str = Query(..., description="11-character YouTube video ID or URL")
):
    try:
        vid = extract_video_id(video_id)
        languages = list_transcript_languages(vid)
        return LanguagesResponse(video_id=vid, languages=languages)
    except YouTubeError as e:
        raise HTTPException(status_code=e.status_code, detail={"detail": e.message, "code": e.code})
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"detail": f"An unexpected error occurred: {str(e)}", "code": "INTERNAL_ERROR"},
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
        raise HTTPException(status_code=e.status_code, detail={"detail": e.message, "code": e.code})

    # 2. Fetch video metadata via oEmbed
    video_info = await get_video_info(vid)

    transcription_method = "youtube_captions"
    track_object = None
    available_langs = []
    raw_segments = None
    lang_name = ""
    lang_code = ""
    is_gen = False
    warnings = []

    # 3. Step A: Try caption extraction first
    try:
        raw_segments, lang_name, lang_code, is_gen, available_langs, track_object = fetch_raw_transcript(
            vid, preferred_language=payload.language
        )
    except YouTubeError as caption_err:
        # If no captions and speech recognition fallback is requested
        if payload.enable_speech_fallback and caption_err.code in ("NO_CAPTIONS", "RETRIEVAL_FAILED"):
            try:
                raw_segments, lang_name, lang_code = await transcribe_youtube_audio(vid)
                transcription_method = "speech_recognition"
                is_gen = True
                warnings.append("No accessible captions found. Transcript was generated using local speech recognition.")
            except SpeechRecognitionError as speech_err:
                raise HTTPException(
                    status_code=speech_err.status_code,
                    detail={"detail": speech_err.message, "code": speech_err.code},
                )
        else:
            # Re-raise caption error with explanation of speech fallback
            hint = ""
            if not payload.enable_speech_fallback and caption_err.code == "NO_CAPTIONS":
                hint = " You can enable the Speech-to-Text fallback option to transcribe the audio locally."
            raise HTTPException(
                status_code=caption_err.status_code,
                detail={"detail": f"{caption_err.message}.{hint}", "code": caption_err.code},
            )

    # 4. Format original segments and paragraphs
    para_len = payload.paragraph_length or "medium"
    orig_cleaned_segs, orig_paragraphs, orig_srt, orig_words, orig_chars = format_transcript_paragraphs(
        raw_segments, paragraph_length=para_len
    )

    detected_lang_code = lang_code
    detected_lang_name = lang_name or get_language_display_name(lang_code)

    # 5. Translation Handling
    is_translated = False
    translated_paragraphs = None
    translated_segments = None
    translated_srt = None
    translation_provider = None
    target_lang_name = None

    if payload.language_mode == "translate" and payload.target_language:
        target_clean = payload.target_language.lower().strip()
        target_lang_name = get_language_display_name(target_clean)

        # Only translate if target is different from source
        if target_clean != detected_lang_code.lower().split("-")[0]:
            # Check if YouTube caption track can directly translate to target
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
            except TranslationError as te:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"detail": te.message, "code": te.code},
                )

    # Active output depends on whether translated
    if is_translated and translated_paragraphs:
        active_paragraphs = translated_paragraphs
        active_segments = translated_segments
        active_srt = translated_srt
        active_lang = payload.target_language
        active_lang_name = target_lang_name or get_language_display_name(payload.target_language)
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

    return TranscriptResponse(
        video_id=vid,
        video_info=video_info,
        language=active_lang,
        language_name=active_lang_name,
        detected_language=detected_lang_code,
        detected_language_name=detected_lang_name,
        is_generated=is_gen,
        transcription_method=transcription_method,
        language_mode=payload.language_mode,
        target_language=payload.target_language,
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
