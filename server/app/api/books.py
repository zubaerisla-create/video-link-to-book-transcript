import io
import json
import logging
import re
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc

from server.app.db.database import get_db
from server.app.db.models import User, Book, BookContent
from server.app.auth.security import get_current_user
from server.app.schemas.book import (
    SaveBookRequest,
    UpdateBookRequest,
    UpdateReadingProgressRequest,
    BookSummary,
    BookDetail,
    BookListResponse,
)
from server.app.services.pdf_service import generate_book_pdf

logger = logging.getLogger("transcriptly.books")
router = APIRouter(prefix="/books", tags=["Books & Library"])


import urllib.parse


def calculate_pages(paragraphs: list[str]) -> int:
    """Estimates book page count assuming ~250 words per page."""
    total_words = sum(len(p.split()) for p in paragraphs if p.strip())
    if total_words == 0:
        return max(1, len(paragraphs))
    return max(1, (total_words + 249) // 250)


def build_content_disposition(filename: str) -> str:
    """Generates RFC 5987 / RFC 6266 compliant Content-Disposition with UTF-8 filename*."""
    # ASCII fallback
    ascii_name = re.sub(r'[^\x20-\x7E]', '_', filename).replace('"', '')
    if not ascii_name.strip():
        ascii_name = "transcript_book"
    encoded_name = urllib.parse.quote(filename, encoding="utf-8")
    return f'attachment; filename="{ascii_name}"; filename*=UTF-8\'\'{encoded_name}'


def sanitize_filename(title: str) -> str:
    clean = re.sub(r'[\\/*?:"<>|]', "", title).strip()
    return clean[:60] or "transcript"


@router.post(
    "",
    response_model=BookDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Save Transcript as Digital Book",
)
def save_book(
    payload: SaveBookRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Calculate word and char count
    words = sum(len(p.split()) for p in payload.paragraphs if p.strip())
    chars = sum(len(p) for p in payload.paragraphs if p.strip())
    total_pages = calculate_pages(payload.paragraphs)

    # 1. Create Book record
    new_book = Book(
        user_id=current_user.id,
        title=payload.title.strip(),
        video_id=payload.video_id.strip(),
        video_url=payload.video_url.strip(),
        channel_title=payload.channel_title.strip() if payload.channel_title else None,
        thumbnail_url=payload.thumbnail_url,
        duration_seconds=payload.duration_seconds,
        language=payload.language,
        language_name=payload.language_name,
        detected_language=payload.detected_language,
        is_translated=payload.is_translated,
        target_language=payload.target_language,
        translation_provider=payload.translation_provider,
        word_count=words,
        character_count=chars,
        reading_progress=0.0,
        last_page_read=1,
        total_pages=total_pages,
        reading_theme="light",
        font_size="medium",
    )
    db.add(new_book)
    db.flush()

    # 2. Create BookContent record
    new_content = BookContent(
        book_id=new_book.id,
        paragraphs_json=json.dumps(payload.paragraphs, ensure_ascii=False),
        segments_json=json.dumps(payload.segments, ensure_ascii=False),
        srt_text=payload.srt or "",
        original_paragraphs_json=json.dumps(payload.original_paragraphs, ensure_ascii=False)
        if payload.original_paragraphs
        else None,
        original_segments_json=json.dumps(payload.original_segments, ensure_ascii=False)
        if payload.original_segments
        else None,
        original_srt_text=payload.original_srt,
        translated_paragraphs_json=json.dumps(payload.translated_paragraphs, ensure_ascii=False)
        if payload.translated_paragraphs
        else None,
        translated_segments_json=json.dumps(payload.translated_segments, ensure_ascii=False)
        if payload.translated_segments
        else None,
    )
    db.add(new_content)
    db.commit()
    db.refresh(new_book)

    logger.info("Book saved: '%s' (id=%s) by user %s", new_book.title, new_book.id, current_user.email)

    return BookDetail(
        id=new_book.id,
        title=new_book.title,
        video_id=new_book.video_id,
        video_url=new_book.video_url,
        channel_title=new_book.channel_title,
        thumbnail_url=new_book.thumbnail_url,
        duration_seconds=new_book.duration_seconds,
        language=new_book.language,
        language_name=new_book.language_name,
        detected_language=new_book.detected_language,
        is_translated=new_book.is_translated,
        target_language=new_book.target_language,
        translation_provider=new_book.translation_provider,
        word_count=new_book.word_count,
        character_count=new_book.character_count,
        reading_progress=new_book.reading_progress,
        last_page_read=new_book.last_page_read,
        total_pages=new_book.total_pages,
        reading_theme=new_book.reading_theme,
        font_size=new_book.font_size,
        created_at=new_book.created_at,
        updated_at=new_book.updated_at,
        paragraphs=payload.paragraphs,
        segments=payload.segments,
        srt=new_content.srt_text,
        original_paragraphs=payload.original_paragraphs,
        original_segments=payload.original_segments,
        original_srt=new_content.original_srt_text,
        translated_paragraphs=payload.translated_paragraphs,
        translated_segments=payload.translated_segments,
    )


@router.get(
    "",
    response_model=BookListResponse,
    summary="List Saved Books for Dashboard",
)
def list_books(
    query: Optional[str] = Query(None, description="Search term for title or channel"),
    sort: str = Query("date_desc", description="Sort order: date_desc, date_asc, title_asc, progress_desc"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Book).filter(Book.user_id == current_user.id)

    if query:
        search_filter = f"%{query.strip()}%"
        q = q.filter(
            (Book.title.ilike(search_filter)) | (Book.channel_title.ilike(search_filter))
        )

    # Sorting
    if sort == "date_asc":
        q = q.order_by(asc(Book.created_at))
    elif sort == "title_asc":
        q = q.order_by(asc(Book.title))
    elif sort == "progress_desc":
        q = q.order_by(desc(Book.reading_progress))
    else:  # default date_desc
        q = q.order_by(desc(Book.created_at))

    books = q.all()
    summaries = [BookSummary.model_validate(b) for b in books]
    return BookListResponse(books=summaries, total_count=len(summaries))


@router.get(
    "/{book_id}",
    response_model=BookDetail,
    summary="Get Single Book Details and Content",
)
def get_book(
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = db.query(Book).filter(Book.id == book_id, Book.user_id == current_user.id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Book not found.", "code": "BOOK_NOT_FOUND"},
        )

    content = book.content
    paragraphs = json.loads(content.paragraphs_json) if content and content.paragraphs_json else []
    segments = json.loads(content.segments_json) if content and content.segments_json else []
    orig_paras = json.loads(content.original_paragraphs_json) if content and content.original_paragraphs_json else None
    orig_segs = json.loads(content.original_segments_json) if content and content.original_segments_json else None
    trans_paras = json.loads(content.translated_paragraphs_json) if content and content.translated_paragraphs_json else None
    trans_segs = json.loads(content.translated_segments_json) if content and content.translated_segments_json else None

    return BookDetail(
        id=book.id,
        title=book.title,
        video_id=book.video_id,
        video_url=book.video_url,
        channel_title=book.channel_title,
        thumbnail_url=book.thumbnail_url,
        duration_seconds=book.duration_seconds,
        language=book.language,
        language_name=book.language_name,
        detected_language=book.detected_language,
        is_translated=book.is_translated,
        target_language=book.target_language,
        translation_provider=book.translation_provider,
        word_count=book.word_count,
        character_count=book.character_count,
        reading_progress=book.reading_progress,
        last_page_read=book.last_page_read,
        total_pages=book.total_pages,
        reading_theme=book.reading_theme,
        font_size=book.font_size,
        created_at=book.created_at,
        updated_at=book.updated_at,
        paragraphs=paragraphs,
        segments=segments,
        srt=content.srt_text if content else "",
        original_paragraphs=orig_paras,
        original_segments=orig_segs,
        original_srt=content.original_srt_text if content else None,
        translated_paragraphs=trans_paras,
        translated_segments=trans_segs,
    )


@router.patch(
    "/{book_id}",
    response_model=BookSummary,
    summary="Update Book Metadata or Preferences",
)
def update_book(
    book_id: str,
    payload: UpdateBookRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = db.query(Book).filter(Book.id == book_id, Book.user_id == current_user.id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Book not found.", "code": "BOOK_NOT_FOUND"},
        )

    if payload.title is not None and payload.title.strip():
        book.title = payload.title.strip()
    if payload.reading_theme is not None:
        book.reading_theme = payload.reading_theme
    if payload.font_size is not None:
        book.font_size = payload.font_size

    db.commit()
    db.refresh(book)
    return BookSummary.model_validate(book)


@router.patch(
    "/{book_id}/progress",
    summary="Update Reading Progress and Last Read Page",
)
def update_progress(
    book_id: str,
    payload: UpdateReadingProgressRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = db.query(Book).filter(Book.id == book_id, Book.user_id == current_user.id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Book not found.", "code": "BOOK_NOT_FOUND"},
        )

    book.last_page_read = max(1, payload.last_page_read)
    book.reading_progress = max(0.0, min(100.0, payload.reading_progress))
    db.commit()

    return {
        "book_id": book.id,
        "last_page_read": book.last_page_read,
        "reading_progress": book.reading_progress,
    }


@router.delete(
    "/{book_id}",
    summary="Delete a Saved Book",
)
def delete_book(
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = db.query(Book).filter(Book.id == book_id, Book.user_id == current_user.id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Book not found.", "code": "BOOK_NOT_FOUND"},
        )

    db.delete(book)
    db.commit()
    logger.info("Book deleted: id=%s by user %s", book_id, current_user.email)
    return {"message": "Book deleted successfully."}


@router.get(
    "/{book_id}/pdf",
    summary="Download Book as PDF with Unicode Bangla Support",
)
def download_pdf(
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = db.query(Book).filter(Book.id == book_id, Book.user_id == current_user.id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Book not found.", "code": "BOOK_NOT_FOUND"},
        )

    content = book.content
    paragraphs = json.loads(content.paragraphs_json) if content and content.paragraphs_json else []

    pdf_bytes = generate_book_pdf(
        title=book.title,
        paragraphs=paragraphs,
        video_url=book.video_url,
        channel_title=book.channel_title,
        language_name=book.language_name,
        detected_language_name=book.detected_language,
        is_translated=book.is_translated,
    )

    safe_name = sanitize_filename(book.title)
    filename = f"{safe_name}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": build_content_disposition(filename)},
    )


@router.get(
    "/{book_id}/export/{format_type}",
    summary="Export Book as TXT, JSON, or SRT",
)
def export_book(
    book_id: str,
    format_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    book = db.query(Book).filter(Book.id == book_id, Book.user_id == current_user.id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Book not found.", "code": "BOOK_NOT_FOUND"},
        )

    content = book.content
    paragraphs = json.loads(content.paragraphs_json) if content and content.paragraphs_json else []
    segments = json.loads(content.segments_json) if content and content.segments_json else []
    safe_name = sanitize_filename(book.title)

    fmt = format_type.lower().strip()
    if fmt == "txt":
        header = f"{book.title}\nSource: {book.video_url}\nLanguage: {book.language_name}\n"
        if book.channel_title:
            header += f"Channel: {book.channel_title}\n"
        header += "-" * 50 + "\n\n"
        text_data = header + "\n\n".join(paragraphs)
        return Response(
            content=text_data,
            media_type="text/plain; charset=utf-8",
            headers={"Content-Disposition": build_content_disposition(f"{safe_name}.txt")},
        )
    elif fmt == "srt":
        srt_data = content.srt_text if content and content.srt_text else ""
        return Response(
            content=srt_data,
            media_type="text/plain; charset=utf-8",
            headers={"Content-Disposition": build_content_disposition(f"{safe_name}.srt")},
        )
    elif fmt == "json":
        export_payload = {
            "title": book.title,
            "video_id": book.video_id,
            "video_url": book.video_url,
            "channel_title": book.channel_title,
            "language": book.language,
            "language_name": book.language_name,
            "word_count": book.word_count,
            "paragraphs": paragraphs,
            "segments": segments,
        }
        json_str = json.dumps(export_payload, ensure_ascii=False, indent=2)
        return Response(
            content=json_str,
            media_type="application/json; charset=utf-8",
            headers={"Content-Disposition": build_content_disposition(f"{safe_name}.json")},
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"detail": f"Unsupported format: {format_type}. Allowed: txt, srt, json", "code": "INVALID_FORMAT"},
        )
