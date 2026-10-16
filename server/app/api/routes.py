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
    YouTubeError,
)
from server.app.services.formatter_service import (
    format_transcript_paragraphs,
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
        "version": "1.0.0",
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
    summary="Extract and format transcript",
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

    # 2. Concurrently or sequentially fetch metadata and transcripts
    # Fetch video info (oEmbed)
    video_info = await get_video_info(vid)

    # 3. Retrieve raw transcript tracks
    try:
        raw_segments, lang_name, lang_code, is_gen, available_langs = fetch_raw_transcript(
            vid, preferred_language=payload.language
        )
    except YouTubeError as e:
        raise HTTPException(status_code=e.status_code, detail={"detail": e.message, "code": e.code})
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"detail": f"Failed to retrieve transcript: {str(e)}", "code": "EXTRACTION_FAILED"},
        )

    # 4. Format segments into clean paragraphs and SRT
    para_len = payload.paragraph_length or "medium"
    cleaned_segs, paragraphs, srt_content, word_cnt, char_cnt = format_transcript_paragraphs(
        raw_segments, paragraph_length=para_len
    )

    return TranscriptResponse(
        video_id=vid,
        video_info=video_info,
        language=lang_code,
        language_name=lang_name,
        is_generated=is_gen,
        available_languages=available_langs,
        paragraphs=paragraphs,
        segments=cleaned_segs,
        srt=srt_content,
        word_count=word_cnt,
        character_count=char_cnt,
    )
