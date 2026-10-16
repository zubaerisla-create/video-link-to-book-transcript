import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Boolean,
    Integer,
    Float,
    DateTime,
    Text,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import relationship
from server.app.db.database import Base


def get_utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    books = relationship("Book", back_populates="user", cascade="all, delete-orphan")


class Book(Base):
    __tablename__ = "books"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(512), nullable=False)
    video_id = Column(String(32), nullable=False, index=True)
    video_url = Column(String(1024), nullable=False)
    channel_title = Column(String(255), nullable=True)
    thumbnail_url = Column(String(1024), nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    
    language = Column(String(32), nullable=False)
    language_name = Column(String(128), nullable=False)
    detected_language = Column(String(32), nullable=False)
    
    is_translated = Column(Boolean, default=False, nullable=False)
    target_language = Column(String(32), nullable=True)
    translation_provider = Column(String(64), nullable=True)
    
    word_count = Column(Integer, default=0, nullable=False)
    character_count = Column(Integer, default=0, nullable=False)
    
    # Reading state
    reading_progress = Column(Float, default=0.0, nullable=False)
    last_page_read = Column(Integer, default=1, nullable=False)
    total_pages = Column(Integer, default=1, nullable=False)
    reading_theme = Column(String(16), default="light", nullable=False)
    font_size = Column(String(16), default="medium", nullable=False)

    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    user = relationship("User", back_populates="books")
    content = relationship("BookContent", back_populates="book", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_books_user_created", "user_id", "created_at"),
    )


class BookContent(Base):
    __tablename__ = "book_contents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    book_id = Column(String(36), ForeignKey("books.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    # Active formatted content (stored as serialized JSON strings for universal DB compatibility)
    paragraphs_json = Column(Text, nullable=False)
    segments_json = Column(Text, nullable=False)
    srt_text = Column(Text, nullable=False)

    # Optional original/translated preservation
    original_paragraphs_json = Column(Text, nullable=True)
    original_segments_json = Column(Text, nullable=True)
    original_srt_text = Column(Text, nullable=True)
    translated_paragraphs_json = Column(Text, nullable=True)
    translated_segments_json = Column(Text, nullable=True)

    book = relationship("Book", back_populates="content")
