import os
import shutil
import sqlite3
import pytest
from server.app.db.migrations import run_database_migrations
from server.app.db.database import engine

def test_migration_preserves_existing_legacy_data(tmp_path):
    # 1. Create a legacy database matching the current production schema (users, books, book_contents)
    db_file = tmp_path / "legacy.db"
    conn = sqlite3.connect(str(db_file))
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE users (
            id VARCHAR(36) PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            full_name VARCHAR(120) NOT NULL,
            hashed_password VARCHAR(255) NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            created_at DATETIME,
            updated_at DATETIME
        )
    """)

    cur.execute("""
        CREATE TABLE books (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            title VARCHAR(500) NOT NULL,
            video_id VARCHAR(64) NOT NULL,
            video_url VARCHAR(500) NOT NULL,
            duration_seconds INTEGER DEFAULT 0,
            language VARCHAR(16) NOT NULL,
            language_name VARCHAR(64) NOT NULL,
            word_count INTEGER DEFAULT 0,
            created_at DATETIME
        )
    """)

    cur.execute("""
        CREATE TABLE book_contents (
            id VARCHAR(36) PRIMARY KEY,
            book_id VARCHAR(36) UNIQUE NOT NULL,
            paragraphs_json TEXT NOT NULL
        )
    """)

    # Insert legacy records matching production
    cur.execute("INSERT INTO users VALUES ('u1', 'zubaerisla@gmail.com', 'Zubaer Isla', 'hash123', 1, '2026-10-16', '2026-10-16')")
    cur.execute("INSERT INTO books VALUES ('b1', 'u1', 'Test Book Title', 'vid123', 'https://youtube.com/...', 120, 'bn', 'Bangla', 500, '2026-10-16')")
    cur.execute("INSERT INTO book_contents VALUES ('c1', 'b1', '[\"Paragraph 1\", \"Paragraph 2\"]')")
    conn.commit()
    conn.close()

    # 2. Test Backup and Restore mechanism
    backup_file = tmp_path / "legacy_backup.db"
    shutil.copy2(str(db_file), str(backup_file))
    assert os.path.exists(backup_file)
    assert os.path.getsize(backup_file) == os.path.getsize(db_file)

    # 3. Apply migrations using SQLite engine pointing to this db
    from sqlalchemy import create_engine
    test_engine = create_engine(f"sqlite:///{db_file}")

    from unittest.mock import patch
    with patch("server.app.db.migrations.engine", test_engine):
        run_database_migrations()

    # 4. Verify legacy data was preserved and new columns/tables exist
    conn2 = sqlite3.connect(str(db_file))
    cur2 = conn2.cursor()

    # Verify user preserved and received default role
    user_row = cur2.execute("SELECT id, email, full_name, role, is_admin FROM users WHERE email='zubaerisla@gmail.com'").fetchone()
    assert user_row is not None
    assert user_row[0] == "u1"
    assert user_row[1] == "zubaerisla@gmail.com"
    assert user_row[3] == "user"
    assert user_row[4] == 0

    # Verify books and contents preserved
    book_row = cur2.execute("SELECT id, title, language FROM books WHERE id='b1'").fetchone()
    assert book_row == ("b1", "Test Book Title", "bn")

    content_row = cur2.execute("SELECT book_id, paragraphs_json FROM book_contents WHERE id='c1'").fetchone()
    assert content_row[0] == "b1"

    # Verify new tables were created
    table_names = [t[0] for t in cur2.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
    assert "reading_sessions" in table_names
    assert "user_saved_words" in table_names
    assert "analytics_events" in table_names
    assert "admin_audit_logs" in table_names
    assert "dictionary_cache" in table_names

    conn2.close()

    # 5. Verify backup can be restored
    restored_file = tmp_path / "restored.db"
    shutil.copy2(str(backup_file), str(restored_file))
    conn_r = sqlite3.connect(str(restored_file))
    cur_r = conn_r.cursor()
    assert cur_r.execute("SELECT count(*) FROM users").fetchone()[0] == 1
    assert cur_r.execute("SELECT count(*) FROM books").fetchone()[0] == 1
    conn_r.close()
