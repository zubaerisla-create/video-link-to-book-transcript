from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class DictionaryLookupResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    word: str
    normalized_word: str
    bangla_meaning: str
    english_definition: Optional[str] = None
    pronunciation: Optional[str] = None
    example_sentence: Optional[str] = None
    part_of_speech: Optional[str] = None
    is_saved: bool = False
    saved_id: Optional[str] = None
    source: str = "cache"


class SaveWordRequest(BaseModel):
    original_word: str = Field(..., min_length=1, max_length=128)
    bangla_meaning: str = Field(..., min_length=1, max_length=2000)
    english_definition: Optional[str] = Field(None, max_length=2000)
    pronunciation: Optional[str] = Field(None, max_length=255)
    example_sentence: Optional[str] = Field(None, max_length=2000)
    part_of_speech: Optional[str] = Field(None, max_length=64)
    source_book_id: Optional[str] = Field(None, max_length=36)
    source_book_title: Optional[str] = Field(None, max_length=512)
    notes: Optional[str] = Field(None, max_length=4000)
    learning_status: Optional[str] = Field("learning", max_length=32)


class UpdateWordRequest(BaseModel):
    notes: Optional[str] = Field(None, max_length=4000)
    learning_status: Optional[str] = Field(None, max_length=32)
    bangla_meaning: Optional[str] = Field(None, max_length=2000)
    english_definition: Optional[str] = Field(None, max_length=2000)
    example_sentence: Optional[str] = Field(None, max_length=2000)


class SavedWordResponse(BaseModel):
    id: str
    user_id: str
    original_word: str
    normalized_word: str
    bangla_meaning: str
    english_definition: Optional[str] = None
    pronunciation: Optional[str] = None
    example_sentence: Optional[str] = None
    part_of_speech: Optional[str] = None
    source_book_id: Optional[str] = None
    source_book_title: Optional[str] = None
    notes: Optional[str] = None
    learning_status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WordStatusCounts(BaseModel):
    total: int = 0
    new: int = 0
    learning: int = 0
    learned: int = 0


class SavedWordListResponse(BaseModel):
    items: List[SavedWordResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    counts: WordStatusCounts


class ReviewWordResponse(BaseModel):
    id: str
    original_word: str
    bangla_meaning: str
    english_definition: Optional[str] = None
    pronunciation: Optional[str] = None
    example_sentence: Optional[str] = None
    learning_status: str
    notes: Optional[str] = None
