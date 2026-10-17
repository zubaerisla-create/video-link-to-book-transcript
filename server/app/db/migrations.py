import logging
from sqlalchemy import text, inspect
from server.app.db.database import engine, Base

logger = logging.getLogger("transcriptly.migrations")


def run_database_migrations():
    """
    Applies safe, non-destructive, backward-compatible schema updates.
    Ensures existing user and book data is preserved untouched.
    """
    logger.info("Checking database schema migrations...")

    with engine.connect() as conn:
        inspector = inspect(conn)
        existing_tables = inspector.get_table_names()

        # 1. Update 'users' table if it exists
        if "users" in existing_tables:
            columns = {col["name"] for col in inspector.get_columns("users")}

            if "role" not in columns:
                logger.info("Adding 'role' column to users table...")
                conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(32) NOT NULL DEFAULT 'user'"))
                conn.commit()

            if "is_admin" not in columns:
                logger.info("Adding 'is_admin' column to users table...")
                conn.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT 0"))
                conn.commit()

            if "last_login_at" not in columns:
                logger.info("Adding 'last_login_at' column to users table...")
                conn.execute(text("ALTER TABLE users ADD COLUMN last_login_at DATETIME NULL"))
                conn.commit()

        # 2. Check and ensure 'user_saved_words' columns if table already exists
        if "user_saved_words" in existing_tables:
            columns = {col["name"] for col in inspector.get_columns("user_saved_words")}
            if "notes" not in columns:
                conn.execute(text("ALTER TABLE user_saved_words ADD COLUMN notes TEXT NULL"))
                conn.commit()
            if "learning_status" not in columns:
                conn.execute(text("ALTER TABLE user_saved_words ADD COLUMN learning_status VARCHAR(32) NOT NULL DEFAULT 'learning'"))
                conn.commit()
            if "part_of_speech" not in columns:
                conn.execute(text("ALTER TABLE user_saved_words ADD COLUMN part_of_speech VARCHAR(64) NULL"))
                conn.commit()

        # 3. Check and ensure 'reading_sessions' columns if table already exists
        if "reading_sessions" in existing_tables:
            columns = {col["name"] for col in inspector.get_columns("reading_sessions")}
            if "device_type" not in columns:
                conn.execute(text("ALTER TABLE reading_sessions ADD COLUMN device_type VARCHAR(32) DEFAULT 'desktop'"))
                conn.commit()

    # 4. Create any missing tables (e.g. reading_sessions, dictionary_cache, user_saved_words, analytics_events)
    from server.app.db import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema migrations completed successfully.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_database_migrations()

