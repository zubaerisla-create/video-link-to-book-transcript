import json
import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from server.app.main import app
from server.app.db.database import SessionLocal, Base, engine
from server.app.db.models import User, Book, BookContent, ReadingSession, UserSavedWord, AnalyticsEvent
from server.app.auth.security import hash_password, create_access_token

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def test_data(db_session):
    # 1. Normal user
    user1 = User(
        email="reader_user@habd.tech",
        full_name="Reader User",
        hashed_password=hash_password("Password123!"),
        role="user",
        is_admin=False,
        is_active=True,
    )
    # 2. Admin user
    admin_user = User(
        email="admin_super@habd.tech",
        full_name="Admin Super",
        hashed_password=hash_password("AdminPass123!"),
        role="admin",
        is_admin=True,
        is_active=True,
    )
    # 3. Other user
    other_user = User(
        email="other_user@habd.tech",
        full_name="Other User",
        hashed_password=hash_password("Password123!"),
        role="user",
        is_admin=False,
        is_active=True,
    )
    db_session.add_all([user1, admin_user, other_user])
    db_session.commit()
    db_session.refresh(user1)
    db_session.refresh(admin_user)
    db_session.refresh(other_user)

    # User 1 book
    book1 = Book(
        user_id=user1.id,
        title="Learning English with Podcasts",
        video_id="abc12345",
        video_url="https://youtube.com/watch?v=abc12345",
        channel_title="English Daily",
        language="en",
        language_name="English",
        detected_language="en",
        word_count=500,
        character_count=2500,
        total_pages=3,
        last_page_read=1,
        reading_progress=33.0,
    )
    db_session.add(book1)
    db_session.commit()
    db_session.refresh(book1)

    content1 = BookContent(
        book_id=book1.id,
        paragraphs_json=json.dumps(["Paragraph 1", "Paragraph 2", "Paragraph 3"]),
        segments_json=json.dumps([]),
        srt_text="1\n00:00:00,000 --> 00:00:01,000\nParagraph 1",
    )
    db_session.add(content1)

    # Saved words for User 1
    w1 = UserSavedWord(
        user_id=user1.id,
        original_word="intimidated",
        normalized_word="intimidated",
        bangla_meaning="ভীত বা আতঙ্কিত",
        english_definition="frightened or overawed",
        learning_status="learning",
        source_book_id=book1.id,
        source_book_title=book1.title,
    )
    w2 = UserSavedWord(
        user_id=user1.id,
        original_word="resilience",
        normalized_word="resilience",
        bangla_meaning="স্থিতিস্থাপকতা",
        english_definition="capacity to recover quickly",
        learning_status="learned",
        source_book_id=book1.id,
        source_book_title=book1.title,
    )
    db_session.add_all([w1, w2])
    db_session.commit()

    return {
        "user1": user1,
        "admin": admin_user,
        "other": other_user,
        "book1": book1,
        "token_user1": create_access_token(user1.id, user1.email),
        "token_admin": create_access_token(admin_user.id, admin_user.email),
        "token_other": create_access_token(other_user.id, other_user.email),
    }


def test_reading_session_lifecycle_and_capping(test_data, db_session):
    """
    Verifies the complete reading session lifecycle:
    start -> active heartbeat -> server duration capping -> safe session end.
    """
    token = test_data["token_user1"]
    book = test_data["book1"]
    session_id = f"test-session-{book.id}-123"

    # 1. Start Session
    start_res = client.post(
        f"/api/books/{book.id}/reading/start",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "session_id": session_id,
            "last_page_read": 1,
            "reading_progress": 33.0,
            "device_type": "desktop",
        },
    )
    assert start_res.status_code == 200
    start_json = start_res.json()
    assert start_json["status"] == "active"
    assert start_json["duration_seconds"] == 0

    # 2. Heartbeat 1 (valid 25 seconds)
    hb1 = client.post(
        f"/api/books/{book.id}/reading/heartbeat",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "session_id": session_id,
            "active_seconds": 25,
            "last_page_read": 2,
            "reading_progress": 66.0,
        },
    )
    assert hb1.status_code == 200
    assert hb1.json()["total_active_seconds"] == 25
    assert hb1.json()["last_page_read"] == 2

    # 3. Heartbeat 2 with duration forgery attempt (180 seconds payload capped to 60s)
    hb2 = client.post(
        f"/api/books/{book.id}/reading/heartbeat",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "session_id": session_id,
            "active_seconds": 90,  # exceeds 60s server cap, should be capped to 60s
            "last_page_read": 3,
            "reading_progress": 100.0,
        },
    )
    assert hb2.status_code == 200
    # 25 + capped 60 = 85 seconds
    assert hb2.json()["total_active_seconds"] == 85
    assert hb2.json()["reading_progress"] == 100.0

    # 4. End Session safely
    end_res = client.post(
        f"/api/books/{book.id}/reading/end",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "session_id": session_id,
            "final_active_seconds": 15,
            "last_page_read": 3,
            "reading_progress": 100.0,
        },
    )
    assert end_res.status_code == 200
    # 85 + 15 = 100 seconds
    assert end_res.json()["status"] == "ended"
    assert end_res.json()["total_active_seconds"] == 100

    # Verify database state
    sess_in_db = db_session.query(ReadingSession).filter(ReadingSession.session_id == session_id).first()
    assert sess_in_db is not None
    assert sess_in_db.duration_seconds == 100
    assert sess_in_db.is_active is False
    assert sess_in_db.end_time is not None


def test_reading_session_unauthorized_book(test_data):
    """Verifies that users cannot track sessions on books they do not own."""
    other_token = test_data["token_other"]
    book = test_data["book1"]

    res = client.post(
        f"/api/books/{book.id}/reading/start",
        headers={"Authorization": f"Bearer {other_token}"},
        json={"session_id": "unauthorized-session-123"},
    )
    assert res.status_code == 404


def test_admin_user_activity_and_detail(test_data, db_session):
    """
    Verifies that administrators can retrieve aggregated user activities and
    detailed individual activity drilldowns.
    """
    admin_token = test_data["token_admin"]
    normal_token = test_data["token_user1"]
    user1 = test_data["user1"]
    book = test_data["book1"]

    # Record a reading session for user1
    now = datetime.now(timezone.utc)
    s1 = ReadingSession(
        session_id="session-user1-activity-test",
        user_id=user1.id,
        book_id=book.id,
        start_time=now,
        last_heartbeat_at=now,
        duration_seconds=300,
        last_page_read=2,
        reading_progress=66.0,
        is_active=False,
    )
    db_session.add(s1)
    db_session.commit()

    # 1. Non-admin access rejected
    res_forbidden = client.get(
        "/api/admin/user-activity",
        headers={"Authorization": f"Bearer {normal_token}"},
    )
    assert res_forbidden.status_code == 403

    # 2. Admin access permitted to user-activity
    res_list = client.get(
        "/api/admin/user-activity",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_list.status_code == 200
    list_json = res_list.json()
    assert "items" in list_json

    # Find user1 in the items
    u1_item = next((item for item in list_json["items"] if item["id"] == user1.id), None)
    assert u1_item is not None
    assert u1_item["reading_time_seconds"] == 300
    assert u1_item["reading_sessions_count"] == 1
    assert u1_item["vocab_saved_total"] == 2
    assert u1_item["books_count"] == 1

    # 3. Admin access to individual user activity detail
    res_detail = client.get(
        f"/api/admin/users/{user1.id}/activity",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_detail.status_code == 200
    detail_json = res_detail.json()
    assert detail_json["user"]["email"] == user1.email
    assert detail_json["reading_summary"]["total_reading_seconds"] == 300
    assert detail_json["reading_summary"]["total_reading_sessions"] == 1
    assert detail_json["vocabulary_summary"]["total_words"] == 2
    assert len(detail_json["recent_sessions"]) == 1
    assert detail_json["recent_sessions"][0]["book_title"] == book.title
    assert len(detail_json["recent_words"]) == 2
    assert len(detail_json["books"]) == 1


def test_admin_dashboard_reading_and_vocab_kpis(test_data, db_session):
    """
    Verifies that the main /api/admin/overview endpoint calculates real reading time,
    reading sessions, vocabulary metrics, DAU/WAU/MAU, and top book leaderboards.
    """
    admin_token = test_data["token_admin"]
    user1 = test_data["user1"]
    book = test_data["book1"]

    now = datetime.now(timezone.utc)
    s = ReadingSession(
        session_id="overview-test-session",
        user_id=user1.id,
        book_id=book.id,
        start_time=now,
        last_heartbeat_at=now,
        duration_seconds=120,
        last_page_read=3,
        reading_progress=100.0,
        is_active=False,
    )
    # Also log a page_view event to populate DAU
    ev = AnalyticsEvent(
        visitor_id="visitor-test-1",
        session_id="session-test-1",
        user_id=user1.id,
        event_type="page_view",
        page_path="/books",
        created_at=now,
    )
    db_session.add_all([s, ev])
    db_session.commit()

    res = client.get(
        "/api/admin/overview?range=7d",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.json()

    # Verify Reading KPIs
    kpis = data["kpis"]
    assert "reading_time_seconds" in kpis
    assert kpis["reading_time_seconds"]["value"] >= 120
    assert "reading_sessions" in kpis
    assert kpis["reading_sessions"]["value"] >= 1
    assert "total_vocab_saved" in kpis
    assert kpis["total_vocab_saved"]["value"] >= 2

    # Verify DAU/WAU/MAU
    assert "user_engagement" in data
    assert data["user_engagement"]["dau_users"] >= 1
    assert data["user_engagement"]["wau_users"] >= 1
    assert data["user_engagement"]["mau_users"] >= 1

    # Verify Vocabulary Metrics
    assert "vocabulary_metrics" in data
    assert data["vocabulary_metrics"]["total_saved"] >= 2
    assert "by_status" in data["vocabulary_metrics"]

    # Verify Top Books
    assert "top_books" in data
    assert len(data["top_books"]) >= 1
    assert data["top_books"][0]["title"] == book.title
