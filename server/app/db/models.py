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
    UniqueConstraint,
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
    role = Column(String(32), default="user", nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    books = relationship("Book", back_populates="user", cascade="all, delete-orphan")
    saved_words = relationship("UserSavedWord", back_populates="user", cascade="all, delete-orphan")
    reading_sessions = relationship("ReadingSession", back_populates="user", cascade="all, delete-orphan")


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
    saved_words = relationship("UserSavedWord", back_populates="book")
    reading_sessions = relationship("ReadingSession", back_populates="book", cascade="all, delete-orphan")

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


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    visitor_id = Column(String(64), nullable=False, index=True)
    session_id = Column(String(64), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    event_type = Column(String(64), nullable=False, index=True)  # "page_view", "user_registration", "import_success", "import_failed", "book_created"
    page_path = Column(String(512), nullable=True, index=True)
    referrer_domain = Column(String(255), nullable=True)
    device_type = Column(String(32), nullable=True)  # "desktop", "mobile", "tablet"
    browser = Column(String(32), nullable=True)      # "Chrome", "Firefox", "Safari", etc.
    os = Column(String(32), nullable=True)           # "Windows", "macOS", "Linux", "Android", "iOS"
    country = Column(String(64), nullable=True)
    duration_ms = Column(Integer, nullable=True)
    metadata_json = Column(Text, nullable=True)      # Sanitized, non-sensitive JSON string
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False, index=True)

    __table_args__ = (
        Index("idx_analytics_type_created", "event_type", "created_at"),
        Index("idx_analytics_visitor_created", "visitor_id", "created_at"),
        Index("idx_analytics_session_created", "session_id", "created_at"),
    )


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    admin_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    admin_email = Column(String(255), nullable=False)
    action = Column(String(64), nullable=False, index=True)  # e.g. "USER_STATUS_UPDATE", "USER_ROLE_UPDATE", "ADMIN_BOOTSTRAP"
    target_type = Column(String(64), nullable=True)         # "user", "book", "system"
    target_id = Column(String(64), nullable=True)
    details_json = Column(Text, nullable=True)              # Sanitized JSON, NEVER secrets
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False, index=True)


class DictionaryCache(Base):
    __tablename__ = "dictionary_cache"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    word = Column(String(128), nullable=False)
    normalized_word = Column(String(128), unique=True, index=True, nullable=False)
    bangla_meaning = Column(Text, nullable=False)
    english_definition = Column(Text, nullable=True)
    pronunciation = Column(String(255), nullable=True)
    example_sentence = Column(Text, nullable=True)
    part_of_speech = Column(String(64), nullable=True)
    provider = Column(String(64), default="dynamic", nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )


class UserSavedWord(Base):
    __tablename__ = "user_saved_words"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    original_word = Column(String(128), nullable=False)
    normalized_word = Column(String(128), nullable=False, index=True)
    bangla_meaning = Column(Text, nullable=False)
    english_definition = Column(Text, nullable=True)
    pronunciation = Column(String(255), nullable=True)
    example_sentence = Column(Text, nullable=True)
    part_of_speech = Column(String(64), nullable=True)
    source_book_id = Column(String(36), ForeignKey("books.id", ondelete="SET NULL"), nullable=True, index=True)
    source_book_title = Column(String(512), nullable=True)
    notes = Column(Text, nullable=True)
    learning_status = Column(String(32), default="learning", nullable=False)  # "new", "learning", "learned"
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    user = relationship("User", back_populates="saved_words")
    book = relationship("Book", back_populates="saved_words")

    __table_args__ = (
        UniqueConstraint("user_id", "normalized_word", name="uq_user_saved_word"),
        Index("idx_user_words_user_created", "user_id", "created_at"),
        Index("idx_user_words_user_status", "user_id", "learning_status"),
        Index("idx_user_words_user_norm", "user_id", "normalized_word"),
    )


class ReadingSession(Base):
    __tablename__ = "reading_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(64), index=True, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    book_id = Column(String(36), ForeignKey("books.id", ondelete="CASCADE"), nullable=False, index=True)

    start_time = Column(DateTime(timezone=True), default=get_utc_now, nullable=False, index=True)
    last_heartbeat_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)

    duration_seconds = Column(Integer, default=0, nullable=False)
    last_page_read = Column(Integer, default=1, nullable=False)
    reading_progress = Column(Float, default=0.0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    device_type = Column(String(32), default="desktop", nullable=True)

    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=get_utc_now,
        onupdate=get_utc_now,
        nullable=False,
    )

    user = relationship("User", back_populates="reading_sessions")
    book = relationship("Book", back_populates="reading_sessions")

    __table_args__ = (
        Index("idx_reading_sessions_user_time", "user_id", "start_time"),
        Index("idx_reading_sessions_book_time", "book_id", "start_time"),
        Index("idx_reading_sessions_user_book", "user_id", "book_id"),
    )

