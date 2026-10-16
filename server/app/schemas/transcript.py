from typing import Optional, List
from pydantic import BaseModel, Field

class TranscriptRequest(BaseModel):
    url: str = Field(..., description="YouTube video URL")
    language: Optional[str] = Field(None, description="Preferred language code (e.g. 'auto', 'en', 'bn')")
    paragraph_length: Optional[str] = Field(
        "medium",
        description="Paragraph length mode: 'short', 'medium', or 'long'"
    )
    language_mode: str = Field(
        "original",
        description="Language mode: 'original' (preserve spoken language) or 'translate' (translate transcript)"
    )
    target_language: Optional[str] = Field(
        None,
        description="Target translation language code (e.g. 'bn', 'en', 'hi', 'ar', 'ur', 'es', 'fr')"
    )
    enable_speech_fallback: bool = Field(
        False,
        description="Enable local speech recognition fallback if YouTube captions are unavailable"
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
    detected_language: str
    detected_language_name: str
    is_generated: bool
    transcription_method: str = Field(
        "youtube_captions",
        description="'youtube_captions' or 'speech_recognition'"
    )
    language_mode: str = "original"
    target_language: Optional[str] = None
    target_language_name: Optional[str] = None
    is_translated: bool = False
    translation_provider: Optional[str] = None
    available_languages: List[TranscriptLanguage]
    
    # Active output
    paragraphs: List[str]
    segments: List[TranscriptSegment]
    srt: str
    
    # Preserved original for side-by-side view & alignment
    original_paragraphs: List[str]
    original_segments: List[TranscriptSegment]
    original_srt: str

    # Translated data when in translate mode
    translated_paragraphs: Optional[List[str]] = None
    translated_segments: Optional[List[TranscriptSegment]] = None
    translated_srt: Optional[str] = None

    word_count: int
    character_count: int
    warnings: List[str] = []

class LanguagesResponse(BaseModel):
    video_id: str
    languages: List[TranscriptLanguage]

class ErrorResponse(BaseModel):
    detail: str
    code: str
