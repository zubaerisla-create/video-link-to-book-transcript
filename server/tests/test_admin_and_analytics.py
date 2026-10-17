import pytest
from fastapi.testclient import TestClient
from server.app.main import app
from server.app.db.database import SessionLocal, Base, engine
from server.app.db.models import User, Book, AnalyticsEvent, AdminAuditLog
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
def test_users(db_session):
    # Create normal user
    normal_email = "regular_user_test@habd.tech"
    existing_normal = db_session.query(User).filter(User.email == normal_email).first()
    if not existing_normal:
        normal_user = User(
            email=normal_email,
            full_name="Regular User",
            hashed_password=hash_password("RegularPassword123!"),
            role="user",
            is_admin=False,
            is_active=True,
        )
        db_session.add(normal_user)
        db_session.commit()
        db_session.refresh(normal_user)
    else:
        normal_user = existing_normal

    # Create admin user
    admin_email = "admin_user_test@habd.tech"
    existing_admin = db_session.query(User).filter(User.email == admin_email).first()
    if not existing_admin:
        admin_user = User(
            email=admin_email,
            full_name="Admin User",
            hashed_password=hash_password("AdminPassword123!"),
            role="admin",
            is_admin=True,
            is_active=True,
        )
        db_session.add(admin_user)
        db_session.commit()
        db_session.refresh(admin_user)
    else:
        admin_user = existing_admin

    return {"normal": normal_user, "admin": admin_user}


def test_analytics_collection_valid():
    """Verify legitimate anonymous visitor page view is recorded."""
    payload = {
        "visitor_id": "test-visitor-uuid-12345",
        "session_id": "test-session-uuid-67890",
        "event_type": "page_view",
        "page_path": "/guides/how-to-use-chrome-extension",
        "referrer": "https://google.com/search?q=transcriptly",
        "device_type": "desktop",
        "browser": "Chrome",
        "os": "Linux",
    }
    response = client.post(
        "/api/analytics/collect",
        json=payload,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "recorded"


def test_analytics_bot_exclusion():
    """Verify automated search bots and scrapers are excluded from analytics."""
    payload = {
        "visitor_id": "bot-visitor-uuid",
        "session_id": "bot-session-uuid",
        "event_type": "page_view",
        "page_path": "/",
    }
    # Googlebot
    res_googlebot = client.post(
        "/api/analytics/collect",
        json=payload,
        headers={"User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"},
    )
    assert res_googlebot.status_code == 200
    assert res_googlebot.json()["status"] == "ignored"
    assert res_googlebot.json()["reason"] == "bot_detected"

    # Python requests crawler
    res_python = client.post(
        "/api/analytics/collect",
        json=payload,
        headers={"User-Agent": "python-requests/2.31.0"},
    )
    assert res_python.status_code == 200
    assert res_python.json()["status"] == "ignored"


def test_analytics_admin_route_exclusion():
    """Verify internal admin URLs are excluded from visitor page counts."""
    payload = {
        "visitor_id": "admin-visitor-uuid",
        "session_id": "admin-session-uuid",
        "event_type": "page_view",
        "page_path": "/admin/analytics",
    }
    res = client.post("/api/analytics/collect", json=payload)
    assert res.status_code == 200
    assert res.json()["status"] == "ignored"
    assert res.json()["reason"] == "admin_route"


def test_analytics_metadata_sanitization(db_session):
    """Verify passwords, tokens, and sensitive keys are stripped from metadata."""
    from server.app.services.analytics_service import record_event
    event = record_event(
        db=db_session,
        event_type="import_attempt",
        visitor_id="vid-sanitize-test",
        session_id="sid-sanitize-test",
        page_path="/import",
        metadata={
            "password": "SuperSecretPassword123!",
            "token": "bearer-jwt-token-xyz",
            "transcript": "Full private video content...",
            "safe_metric": "youtube_captions",
            "video_id": "dQw4w9WgXcQ",
        },
    )
    assert event is not None
    assert "SuperSecretPassword123!" not in (event.metadata_json or "")
    assert "bearer-jwt-token-xyz" not in (event.metadata_json or "")
    assert "Full private video content..." not in (event.metadata_json or "")
    assert "safe_metric" in (event.metadata_json or "")


def test_admin_endpoints_require_auth():
    """Verify unauthenticated requests to /api/admin/* receive 401."""
    res = client.get("/api/admin/overview")
    assert res.status_code == 401


def test_admin_endpoints_deny_normal_users(test_users):
    """Verify regular non-admin users receive 403 Forbidden on /api/admin/*."""
    token = create_access_token(test_users["normal"].id, test_users["normal"].email)
    res = client.get("/api/admin/overview", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403
    assert res.json()["detail"]["code"] == "FORBIDDEN"


def test_admin_overview_authorized(test_users):
    """Verify administrator successfully retrieves date-filtered overview with KPIs and charts."""
    token = create_access_token(test_users["admin"].id, test_users["admin"].email)
    res = client.get("/api/admin/overview?range=7d", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert "kpis" in data
    assert "unique_visitors" in data["kpis"]
    assert "sessions" in data["kpis"]
    assert "page_views" in data["kpis"]
    assert "total_users" in data["kpis"]
    assert "time_series" in data
    assert isinstance(data["time_series"], list)
    assert "top_pages" in data


def test_admin_user_management(test_users):
    """Verify admin can list users, search, and toggle active status."""
    token = create_access_token(test_users["admin"].id, test_users["admin"].email)

    # 1. List users
    res = client.get("/api/admin/users?page=1&limit=10", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert data["total_count"] >= 2
    # Ensure password hashes are NEVER exposed
    for u in data["items"]:
        assert "hashed_password" not in u

    # 2. Search users
    res_search = client.get(
        f"/api/admin/users?search={test_users['normal'].email}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_search.status_code == 200
    assert len(res_search.json()["items"]) == 1

    # 3. Toggle status of normal user (suspend)
    res_suspend = client.patch(
        f"/api/admin/users/{test_users['normal'].id}/status",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_suspend.status_code == 200
    assert res_suspend.json()["is_active"] is False

    # 4. Reactivate user
    res_activate = client.patch(
        f"/api/admin/users/{test_users['normal'].id}/status",
        json={"is_active": True},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_activate.status_code == 200
    assert res_activate.json()["is_active"] is True


def test_admin_self_suspension_protection(test_users):
    """Verify administrator cannot suspend their own account."""
    token = create_access_token(test_users["admin"].id, test_users["admin"].email)
    res = client.patch(
        f"/api/admin/users/{test_users['admin'].id}/status",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 400
    assert res.json()["detail"]["code"] == "SELF_DEACTIVATION_PROHIBITED"


def test_admin_feature_usage(test_users):
    """Verify feature usage metrics endpoint."""
    token = create_access_token(test_users["admin"].id, test_users["admin"].email)
    res = client.get("/api/admin/feature-usage?range=30d", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert "attempts" in data
    assert "success_rate" in data
    assert "languages" in data
    assert "translation_ratio" in data


def test_admin_system_health(test_users):
    """Verify system health endpoint returns database latency without exposing secrets."""
    token = create_access_token(test_users["admin"].id, test_users["admin"].email)
    res = client.get("/api/admin/system-health", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "database" in data
    assert data["database"]["status"] == "connected"
    assert "latency_ms" in data["database"]
    assert "JWT_SECRET_KEY" not in str(data)
    assert "DATABASE_URL" not in str(data)


def test_admin_audit_logs(test_users):
    """Verify audit logs listing records previous status changes."""
    token = create_access_token(test_users["admin"].id, test_users["admin"].email)

    # Perform an audited administrative action
    client.patch(
        f"/api/admin/users/{test_users['normal'].id}/status",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {token}"},
    )

    res = client.get("/api/admin/audit-logs?page=1&limit=20", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert data["total_count"] >= 1
    # Check that audit log has admin email and action
    actions = [item["action"] for item in data["items"]]
    assert "USER_STATUS_CHANGE" in actions
