import asyncio
import json
import logging
import os
import re
import secrets
import sqlite3
import tempfile
import time
from typing import Optional, List, Dict, Any, Tuple

from server.app.schemas.transcript import (
    TranscriptResponse,
    TranscriptSegment,
    VideoInfo,
    TranscriptLanguage,
)

logger = logging.getLogger("transcriptly.staging")


def parse_timestamp_to_seconds(ts_str: str) -> Optional[float]:
    """
    Parses timestamp string like '1:24', '01:24', '1:02:30', or '75.5' into float seconds.
    """
    ts_str = ts_str.strip().strip("[]()")
    parts = ts_str.split(":")
    try:
        if len(parts) == 3:
            h, m, s = parts
            return int(h) * 3600 + int(m) * 60 + float(s.replace(",", "."))
        elif len(parts) == 2:
            m, s = parts
            return int(m) * 60 + float(s.replace(",", "."))
        elif len(parts) == 1:
            return float(parts[0].replace(",", "."))
    except (ValueError, TypeError):
        return None
    return None


def parse_raw_text_to_segments(raw_text: str) -> List[Dict[str, Any]]:
    """
    Parses pasted YouTube transcript text into structured raw segments.
    Supports:
    - Multi-line YouTube transcript format (timestamp line followed by text line)
    - Inline timestamp format: '[01:23] Text content'
    - Fallback plain text paragraphs (generates synthetic monotonically increasing timestamps)
    """
    if not raw_text or not raw_text.strip():
        return []

    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    segments: List[Dict[str, Any]] = []

    # Pattern for timestamp line e.g. "0:05" or "1:02:30"
    ts_pattern = re.compile(r"^(?:\[|\()?(\d{1,2}:)?(\d{1,2}:\d{2})(?:\.\d{1,3})?(?:\]|\))?$")
    # Pattern for inline timestamp e.g. "[0:05] Some text" or "0:05 Some text"
    inline_pattern = re.compile(r"^(?:\[|\()?(\d{1,2}:)?(\d{1,2}:\d{2})(?:\.\d{1,3})?(?:\]|\))?\s+(.+)$")

    idx = 0
    # 1. Try checking for multiline timestamp-text pairs
    has_multiline_timestamps = any(ts_pattern.match(l) for l in lines[:10])

    if has_multiline_timestamps:
        while idx < len(lines):
            line = lines[idx]
            ts_match = ts_pattern.match(line)
            if ts_match:
                parsed_time = parse_timestamp_to_seconds(line)
                idx += 1
                if idx < len(lines):
                    text_line = lines[idx]
                    if not ts_pattern.match(text_line):
                        segments.append({
                            "start": parsed_time if parsed_time is not None else 0.0,
                            "text": text_line,
                            "duration": 3.0,
                        })
                        idx += 1
                        continue
                    else:
                        # consecutive timestamps, continue
                        continue
            else:
                inline_match = inline_pattern.match(line)
                if inline_match:
                    ts_part = inline_match.group(0).split()[0]
                    text_part = line[len(ts_part):].strip()
                    parsed_time = parse_timestamp_to_seconds(ts_part)
                    segments.append({
                        "start": parsed_time if parsed_time is not None else 0.0,
                        "text": text_part,
                        "duration": 3.0,
                    })
                else:
                    # Line without timestamp, append to previous segment if exists or create new
                    if segments:
                        segments[-1]["text"] += " " + line
                    else:
                        segments.append({"start": 0.0, "text": line, "duration": 3.0})
            idx += 1
    else:
        # Check for inline timestamps on each line
        any_inline = any(inline_pattern.match(l) for l in lines[:10])
        if any_inline:
            for line in lines:
                inline_match = inline_pattern.match(line)
                if inline_match:
                    parts = line.split(None, 1)
                    parsed_time = parse_timestamp_to_seconds(parts[0])
                    text_part = parts[1] if len(parts) > 1 else ""
                    if text_part:
                        segments.append({
                            "start": parsed_time if parsed_time is not None else 0.0,
                            "text": text_part,
                            "duration": 3.0,
                        })
                else:
                    if segments:
                        segments[-1]["text"] += " " + line
                    else:
                        segments.append({"start": 0.0, "text": line, "duration": 3.0})
        else:
            # Fallback: Plain text paragraphs. Estimate ~0.35s per word.
            running_time = 0.0
            for para in lines:
                words = para.split()
                est_duration = max(2.0, len(words) * 0.35)
                segments.append({
                    "start": running_time,
                    "text": para,
                    "duration": est_duration,
                })
                running_time += est_duration

    # Calculate realistic durations between consecutive segments if duration is default
    for i in range(len(segments) - 1):
        diff = segments[i + 1]["start"] - segments[i]["start"]
        if 0.5 <= diff <= 30.0:
            segments[i]["duration"] = round(diff, 2)

    return segments


class StagingService:
    """
    Manages short-lived, single-use staged transcript imports.
    Backed by a shared SQLite store in WAL mode, ensuring atomic consumption
    and cross-process consistency even when Uvicorn runs with multiple workers.
    Tokens are cryptographically secure, expire after TTL (5m),
    and are atomically consumed upon retrieval to prevent reuse.
    """
    def __init__(self, db_path: Optional[str] = None, ttl_seconds: int = 300, max_entries: int = 500):
        self.ttl_seconds = ttl_seconds
        self.max_entries = max_entries
        if db_path:
            self.db_path = db_path
        elif os.getenv("STAGED_IMPORTS_DB"):
            self.db_path = os.getenv("STAGED_IMPORTS_DB")
        else:
            # Persistent, restricted application data directory: <project_root>/data/staged_imports.sqlite3
            project_root = os.path.dirname(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            )
            data_dir = os.path.join(project_root, "data")
            try:
                os.makedirs(data_dir, mode=0o700, exist_ok=True)
                self.db_path = os.path.join(data_dir, "staged_imports.sqlite3")
            except OSError:
                self.db_path = os.path.join(tempfile.gettempdir(), "transcriptly_staged_imports.sqlite3")

        self._init_db()

    def _init_db(self) -> None:
        try:
            parent = os.path.dirname(self.db_path)
            if parent:
                os.makedirs(parent, mode=0o700, exist_ok=True)

            with sqlite3.connect(self.db_path, timeout=15.0) as conn:
                conn.execute("PRAGMA journal_mode=WAL;")
                conn.execute("PRAGMA synchronous=NORMAL;")
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS staged_imports (
                        token TEXT PRIMARY KEY,
                        created_at REAL NOT NULL,
                        expires_at REAL NOT NULL,
                        data TEXT NOT NULL
                    )
                """)
                conn.execute("CREATE INDEX IF NOT EXISTS idx_staged_expires ON staged_imports(expires_at)")
                conn.commit()

            # Set restricted file permissions (owner read/write only)
            if os.path.isfile(self.db_path):
                try:
                    os.chmod(self.db_path, 0o600)
                except OSError:
                    pass
        except Exception as e:
            logger.error("Failed to initialize staged imports SQLite database at %s: %s", self.db_path, e)

    async def stage(self, response: TranscriptResponse) -> Tuple[str, int]:
        """
        Stores a TranscriptResponse and returns (import_token, expires_in_seconds).
        """
        token = secrets.token_urlsafe(32)
        now = time.time()
        expires_at = now + self.ttl_seconds
        data_json = json.dumps(response.model_dump())

        def _do_stage():
            with sqlite3.connect(self.db_path, timeout=15.0) as conn:
                # Purge expired entries
                conn.execute("DELETE FROM staged_imports WHERE expires_at <= ?", (now,))
                # Cap max entries by deleting oldest if needed
                cur = conn.execute("SELECT count(*) FROM staged_imports")
                count = cur.fetchone()[0]
                if count >= self.max_entries:
                    conn.execute("""
                        DELETE FROM staged_imports WHERE token IN (
                            SELECT token FROM staged_imports ORDER BY created_at ASC LIMIT ?
                        )
                    """, (count - self.max_entries + 1,))
                conn.execute(
                    "INSERT INTO staged_imports (token, created_at, expires_at, data) VALUES (?, ?, ?, ?)",
                    (token, now, expires_at, data_json)
                )
                conn.commit()

        await asyncio.to_thread(_do_stage)
        return token, self.ttl_seconds

    async def get_and_consume(self, token: str) -> Optional[TranscriptResponse]:
        """
        Atomically retrieves and consumes the staged transcript.
        Once consumed, the token cannot be reused across any worker process.
        Returns None if not found or expired.
        """
        now = time.time()

        def _do_consume() -> Optional[str]:
            with sqlite3.connect(self.db_path, timeout=15.0) as conn:
                # Clean expired records
                conn.execute("DELETE FROM staged_imports WHERE expires_at <= ?", (now,))
                cur = conn.execute("SELECT expires_at, data FROM staged_imports WHERE token = ?", (token,))
                row = cur.fetchone()
                if not row:
                    return None
                expires_at, data_json = row
                # Consume immediately
                conn.execute("DELETE FROM staged_imports WHERE token = ?", (token,))
                conn.commit()
                if now >= expires_at:
                    return None
                return data_json

        data_json = await asyncio.to_thread(_do_consume)
        if not data_json:
            return None

        try:
            parsed = json.loads(data_json)
            return TranscriptResponse(**parsed)
        except Exception as e:
            logger.error("Failed to deserialize staged transcript data for token %s: %s", token, e)
            return None

    async def clear(self) -> None:
        """Clears all staged entries (useful for testing)."""
        def _do_clear():
            with sqlite3.connect(self.db_path, timeout=15.0) as conn:
                conn.execute("DELETE FROM staged_imports")
                conn.commit()

        await asyncio.to_thread(_do_clear)


# Global singleton staging service
staging_service = StagingService()
