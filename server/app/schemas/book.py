from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field, ConfigDict


class SaveBookRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=512, description="Book title")
    video_id: str = Field(..., max_length=32, description="YouTube Video ID")
    video_url: str = Field(..., max_length=1024, description="Source YouTube Video URL")
    channel_title: Optional[str] = Field(None, max_length=255)
    thumbnail_url: Optional[str] = Field(None, max_length=1024)
    duration_seconds: Optional[int] = None
    
    language: str = Field(..., max_length=32)
    language_name: str = Field(..., max_length=128)
    detected_language: str = Field(..., max_length=32)
    
    is_translated: bool = False
    target_language: Optional[str] = Field(None, max_length=32)
    translation_provider: Optional[str] = Field(None, max_length=64)
    
    paragraphs: list[str] = Field(..., min_length=1)
    segments: list[dict[str, Any]] = Field(default_factory=list)
    srt: str = Field("")

    # Preserved original / translated
    original_paragraphs: Optional[list[str]] = None
    original_segments: Optional[list[dict[str, Any]]] = None
    original_srt: Optional[str] = None
    translated_paragraphs: Optional[list[str]] = None
    translated_segments: Optional[list[dict[str, Any]]] = None


class UpdateBookRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=512)
    reading_theme: Optional[str] = Field(None, max_length=16)
    font_size: Optional[str] = Field(None, max_length=16)


class UpdateReadingProgressRequest(BaseModel):
    last_page_read: int = Field(..., ge=1)
    reading_progress: float = Field(..., ge=0.0, le=100.0)


class BookSummary(BaseModel):
    id: str
    title: str
    video_id: str
    video_url: str
    channel_title: Optional[str]
    thumbnail_url: Optional[str]
    duration_seconds: Optional[int]
    language: str
    language_name: str
    detected_language: str
    is_translated: bool
    target_language: Optional[str]
    translation_provider: Optional[str]
    word_count: int
    character_count: int
    reading_progress: float
    last_page_read: int
    total_pages: int
    reading_theme: str
    font_size: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BookDetail(BookSummary):
    paragraphs: list[str]
    segments: list[dict[str, Any]]
    srt: str
    original_paragraphs: Optional[list[str]] = None
    original_segments: Optional[list[dict[str, Any]]] = None
    original_srt: Optional[str] = None
    translated_paragraphs: Optional[list[str]] = None
    translated_segments: Optional[list[dict[str, Any]]] = None


class BookListResponse(BaseModel):
    books: list[BookSummary]
    total_count: int
