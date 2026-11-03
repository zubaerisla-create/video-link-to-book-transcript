import pytest
from fastapi.testclient import TestClient
from server.app.main import app
from server.app.db.database import Base, engine, SessionLocal
from server.app.db.models import User, Book

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_test_db():
    # Setup fresh tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_signup_and_login():
    # 1. Signup with mismatched passwords
    res = client.post(
        "/api/auth/signup",
        json={
            "full_name": "Test User",
            "email": "test@example.com",
            "password": "Password123!",
            "confirm_password": "WrongPassword123!",
        },
    )
    assert res.status_code == 422

    # 2. Valid signup
    res = client.post(
        "/api/auth/signup",
        json={
            "full_name": "Abdullah Reader",
            "email": "reader@example.com",
            "password": "SecurePassword123!",
            "confirm_password": "SecurePassword123!",
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert data["user"]["email"] == "reader@example.com"
    assert "token" in data
    assert "transcriptly_auth_token" in res.cookies

    token = data["token"]

    # 3. Duplicate signup rejected
    res_dup = client.post(
        "/api/auth/signup",
        json={
            "full_name": "Another User",
            "email": "reader@example.com",
            "password": "SecurePassword123!",
            "confirm_password": "SecurePassword123!",
        },
    )
    assert res_dup.status_code == 400

    # 4. Login with wrong password
    res_bad = client.post(
        "/api/auth/login",
        json={"email": "reader@example.com", "password": "WrongPassword!"},
    )
    assert res_bad.status_code == 401

    # 5. Valid login
    res_login = client.post(
        "/api/auth/login",
        json={"email": "reader@example.com", "password": "SecurePassword123!"},
    )
    assert res_login.status_code == 200
    assert "transcriptly_auth_token" in res_login.cookies

    # 6. Get profile /api/auth/me
    res_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    assert res_me.json()["full_name"] == "Abdullah Reader"

    # 7. Logout clears cookie
    res_logout = client.post("/api/auth/logout")
    assert res_logout.status_code == 200


def test_books_lifecycle_and_security():
    # Create two users
    res_u1 = client.post(
        "/api/auth/signup",
        json={
            "full_name": "User One",
            "email": "u1@example.com",
            "password": "Password123!",
            "confirm_password": "Password123!",
        },
    )
    token1 = res_u1.json()["token"]

    res_u2 = client.post(
        "/api/auth/signup",
        json={
            "full_name": "User Two",
            "email": "u2@example.com",
            "password": "Password123!",
            "confirm_password": "Password123!",
        },
    )
    token2 = res_u2.json()["token"]

    # 1. User 1 saves a book (with Bangla text)
    book_payload = {
        "title": "মহাবিশ্বের গোপন রহস্য ও সৃষ্টিতত্ত্ব",
        "video_id": "dQw4w9WgXcQ",
        "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "channel_title": "বিজ্ঞান ও প্রযুক্তি",
        "thumbnail_url": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        "duration_seconds": 213,
        "language": "bn",
        "language_name": "Bangla (বাংলা)",
        "detected_language": "bn",
        "is_translated": False,
        "paragraphs": [
            "প্রথম অনুচ্ছেদ: মহাবিশ্বের সৃষ্টির ইতিহাস অত্যন্ত চমৎকার এবং রহস্যময়।",
            "দ্বিতীয় অনুচ্ছেদ: আধুনিক পদার্থবিদ্যা ও জ্যোতির্বিজ্ঞানের সাহায্যে আমরা অনেক নতুন তথ্য জানতে পারছি।",
        ],
        "segments": [
            {"start": 0.0, "duration": 2.5, "text": "মহাবিশ্বের সৃষ্টির ইতিহাস"},
            {"start": 2.5, "duration": 3.0, "text": "অত্যন্ত চমৎকার এবং রহস্যময়।"},
        ],
        "srt": "1\n00:00:00,000 --> 00:00:02,500\nমহাবিশ্বের সৃষ্টির ইতিহাস\n",
    }

    res_create = client.post(
        "/api/books",
        json=book_payload,
        headers={"Authorization": f"Bearer {token1}"},
    )
    assert res_create.status_code == 201
    book_data = res_create.json()
    book_id = book_data["id"]
    assert book_data["title"] == "মহাবিশ্বের গোপন রহস্য ও সৃষ্টিতত্ত্ব"
    assert book_data["language"] == "bn"
    assert len(book_data["paragraphs"]) == 2

    # 2. User 1 lists books
    res_list = client.get("/api/books", headers={"Authorization": f"Bearer {token1}"})
    assert res_list.status_code == 200
    assert res_list.json()["total_count"] == 1

    # 3. User 2 lists books -> must be 0 (data isolation)
    res_u2_list = client.get("/api/books", headers={"Authorization": f"Bearer {token2}"})
    assert res_u2_list.status_code == 200
    assert res_u2_list.json()["total_count"] == 0

    # 4. User 2 attempts to get User 1's book -> must return 404 (IDOR prevention)
    res_idor = client.get(f"/api/books/{book_id}", headers={"Authorization": f"Bearer {token2}"})
    assert res_idor.status_code == 404

    # 5. User 1 gets their book
    res_get = client.get(f"/api/books/{book_id}", headers={"Authorization": f"Bearer {token1}"})
    assert res_get.status_code == 200
    assert res_get.json()["id"] == book_id

    # 6. User 1 updates progress
    res_prog = client.patch(
        f"/api/books/{book_id}/progress",
        json={"last_page_read": 2, "reading_progress": 75.0},
        headers={"Authorization": f"Bearer {token1}"},
    )
    assert res_prog.status_code == 200
    assert res_prog.json()["last_page_read"] == 2
    assert res_prog.json()["reading_progress"] == 75.0

    # 7. User 1 downloads PDF
    res_pdf = client.get(f"/api/books/{book_id}/pdf", headers={"Authorization": f"Bearer {token1}"})
    assert res_pdf.status_code == 200
    assert res_pdf.headers["content-type"] == "application/pdf"
    assert res_pdf.content.startswith(b"%PDF-")

    # 8. User 1 downloads TXT, JSON, SRT
    res_txt = client.get(f"/api/books/{book_id}/export/txt", headers={"Authorization": f"Bearer {token1}"})
    assert res_txt.status_code == 200
    assert "মহাবিশ্বের সৃষ্টির ইতিহাস" in res_txt.text

    res_json = client.get(f"/api/books/{book_id}/export/json", headers={"Authorization": f"Bearer {token1}"})
    assert res_json.status_code == 200
    assert res_json.json()["video_id"] == "dQw4w9WgXcQ"

    res_srt = client.get(f"/api/books/{book_id}/export/srt", headers={"Authorization": f"Bearer {token1}"})
    assert res_srt.status_code == 200

    # 9. User 1 deletes the book
    res_del = client.delete(f"/api/books/{book_id}", headers={"Authorization": f"Bearer {token1}"})
    assert res_del.status_code == 200

    # 10. Verify book is gone
    res_check = client.get(f"/api/books/{book_id}", headers={"Authorization": f"Bearer {token1}"})
    assert res_check.status_code == 404


def test_forgot_and_reset_password(monkeypatch):
    # 1. Sign up test user
    res_signup = client.post(
        "/api/auth/signup",
        json={
            "full_name": "Reset Test User",
            "email": "reset_user@example.com",
            "password": "OldPassword123!",
            "confirm_password": "OldPassword123!",
        },
    )
    assert res_signup.status_code == 201

    # 2. Mock send_reset_email to intercept generated reset link
    intercepted_emails = []

    def mock_send(to_email, reset_link, full_name):
        intercepted_emails.append({"to": to_email, "link": reset_link})

    monkeypatch.setattr("server.app.api.auth.send_reset_email", mock_send)

    # 3. Call forgot-password
    res_forgot = client.post(
        "/api/auth/forgot-password",
        json={"email": "reset_user@example.com"},
    )
    assert res_forgot.status_code == 200
    assert len(intercepted_emails) == 1
    reset_link = intercepted_emails[0]["link"]
    token = reset_link.split("token=")[1]
    assert token

    # 4. Attempt to use password reset token as a login session Bearer token -> must be rejected (401)
    res_reuse_as_session = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_reuse_as_session.status_code == 401
    assert res_reuse_as_session.json()["detail"]["code"] == "INVALID_TOKEN"

    # 5. Attempt reset with bad token
    res_bad_reset = client.post(
        "/api/auth/reset-password",
        json={
            "token": "invalid-token-xyz",
            "new_password": "BrandNewPassword123!",
            "confirm_password": "BrandNewPassword123!",
        },
    )
    assert res_bad_reset.status_code == 400

    # 6. Attempt reset with mismatched passwords
    res_mismatch = client.post(
        "/api/auth/reset-password",
        json={
            "token": token,
            "new_password": "BrandNewPassword123!",
            "confirm_password": "DifferentPassword123!",
        },
    )
    assert res_mismatch.status_code == 422

    # 7. Complete valid reset
    res_valid_reset = client.post(
        "/api/auth/reset-password",
        json={
            "token": token,
            "new_password": "BrandNewPassword123!",
            "confirm_password": "BrandNewPassword123!",
        },
    )
    assert res_valid_reset.status_code == 200

    # 8. Replay attack prevention: attempting to reuse the same token must be rejected
    res_replay = client.post(
        "/api/auth/reset-password",
        json={
            "token": token,
            "new_password": "AnotherNewPassword123!",
            "confirm_password": "AnotherNewPassword123!",
        },
    )
    assert res_replay.status_code == 400
    assert res_replay.json()["detail"]["code"] == "RESET_TOKEN_ALREADY_USED"

    # 9. Old password no longer works
    res_old_login = client.post(
        "/api/auth/login",
        json={"email": "reset_user@example.com", "password": "OldPassword123!"},
    )
    assert res_old_login.status_code == 401

    # 10. New password logs in successfully
    res_new_login = client.post(
        "/api/auth/login",
        json={"email": "reset_user@example.com", "password": "BrandNewPassword123!"},
    )
    assert res_new_login.status_code == 200
    assert res_new_login.json()["user"]["email"] == "reset_user@example.com"


def test_pdf_export_escapes_special_video_url_characters():
    from server.app.services.pdf_service import generate_book_pdf

    # Attempt XML attribute breakout in video_url
    crafted_url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ" color="#000000"><img src="http://evil.example/x"'
    pdf_bytes = generate_book_pdf(
        title='Test <script>alert(1)</script> & "Quotes"',
        paragraphs=["First paragraph with <b>tags</b> & ampersands."],
        video_url=crafted_url,
        channel_title='Channel "Name" <test>',
    )
    assert pdf_bytes.startswith(b"%PDF-")


def test_contact_api_security_and_rate_limiting(monkeypatch):
    from server.app.config import settings
    from server.app.api.contact import reset_contact_rate_limiter

    reset_contact_rate_limiter()
    monkeypatch.setattr(settings, "SMTP_USER", "smtp_test@habd.tech")
    monkeypatch.setattr(settings, "SMTP_PASSWORD", "app-password-test")
    monkeypatch.setattr(settings, "CONTACT_TO_EMAIL", "inbox@habd.tech")

    sent_messages = []

    def mock_send_contact(to_email, reply_to, subject, text_body, html_body):
        sent_messages.append({
            "to_email": to_email,
            "reply_to": reply_to,
            "subject": subject,
            "text_body": text_body,
            "html_body": html_body,
        })

    monkeypatch.setattr("server.app.api.contact.send_contact_email", mock_send_contact)

    # 1. Honeypot filled -> silently returns 200 without sending email
    res_hp = client.post(
        "/api/contact",
        json={
            "name": "Spam Bot",
            "email": "bot@example.com",
            "subject": "general",
            "message": "Buy cheap links right now!",
            "website": "https://spam.example.com",
        },
    )
    assert res_hp.status_code == 200
    assert len(sent_messages) == 0

    # 2. Rejects header injection / semicolon / quote characters in email
    for bad_email in [
        'attacker@evil.com;victim@target.com',
        '"attacker"@evil.com',
        'user(comment)@evil.com',
        'user@evil.com\r\nBcc: victim@target.com',
    ]:
        res_bad = client.post(
            "/api/contact",
            json={
                "name": "Tester",
                "email": bad_email,
                "subject": "general",
                "message": "This is a valid length test message.",
            },
        )
        assert res_bad.status_code == 400
    assert len(sent_messages) == 0

    # 3. Valid submission sends only to fixed server recipient and escapes HTML
    res_ok = client.post(
        "/api/contact",
        headers={"X-Forwarded-For": "10.0.0.99, 203.0.113.99"},
        json={
            "name": "Alice <script>",
            "email": "alice.test@example.com",
            "subject": "bug",
            "message": "Reporting a caption issue on <video> & testing.",
            "website": "",
        },
    )
    assert res_ok.status_code == 200
    assert len(sent_messages) == 1
    assert sent_messages[0]["to_email"] == "inbox@habd.tech"
    assert sent_messages[0]["reply_to"] == "alice.test@example.com"
    assert "&lt;script&gt;" in sent_messages[0]["html_body"]
    assert "<script>" not in sent_messages[0]["html_body"]

    # 4. Rate limit enforced after 5 messages from the same IP (even if client prepends spoofed XFF)
    for i in range(4):
        r = client.post(
            "/api/contact",
            headers={"X-Forwarded-For": f"10.0.0.{i}, 203.0.113.99"},
            json={
                "name": "Alice",
                "email": "alice.test@example.com",
                "subject": "general",
                "message": f"Follow-up test message number {i} with enough chars.",
            },
        )
        assert r.status_code == 200

    res_limited = client.post(
        "/api/contact",
        headers={"X-Forwarded-For": "10.0.0.250, 203.0.113.99"},
        json={
            "name": "Alice",
            "email": "alice.test@example.com",
            "subject": "general",
            "message": "Sixth message from 203.0.113.99 should be rate limited.",
        },
    )
    assert res_limited.status_code == 429
    reset_contact_rate_limiter()
