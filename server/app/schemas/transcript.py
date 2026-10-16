from typing import Optional, List
from pydantic import BaseModel, Field

class TranscriptRequest(BaseModel):
    url: str = Field(..., description="YouTube video URL")
    language: Optional[str] = Field(None, description="Preferred language code (e.g. 'en')")
    paragraph_length: Optional[str] = Field(
        "medium",
        description="Paragraph length mode: 'short', 'medium', or 'long'"
    )

class TranscriptSegment(BaseModel):
    text: str
    start: float
    duration: float

class TranscriptLanguage(BaseModel):
    code: str
    name: str
    is_generated: bool = False
    is_translatable: bool = False

class VideoInfo(BaseModel):
    video_id: str
    title: Optional[str] = None
    author: Optional[str] = None
    thumbnail_url: Optional[str] = None

class TranscriptResponse(BaseModel):
    video_id: str
    video_info: Optional[VideoInfo] = None
    language: str
    language_name: str
    is_generated: bool
    available_languages: List[TranscriptLanguage]
    paragraphs: List[str]
    segments: List[TranscriptSegment]
    srt: str
    word_count: int
    character_count: int

class LanguagesResponse(BaseModel):
    video_id: str
    languages: List[TranscriptLanguage]

class ErrorResponse(BaseModel):
    detail: str
    code: str
