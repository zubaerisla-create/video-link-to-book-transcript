import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from server.app.main import app
from server.app.db.database import Base, get_db
from server.app.db.models import User, DictionaryCache, UserSavedWord
from server.app.auth.security import hash_password, create_access_token

# In-memory SQLite database specifically for test isolation
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def test_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(test_db):
    def override_get_db():
        try:
            yield test_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers_user1(test_db):
    user = User(
        email="learner1@example.com",
        full_name="Learner One",
        hashed_password=hash_password("LearnerPass123!"),
        role="user",
        is_admin=False,
        is_active=True,
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)

    token = create_access_token(user_id=user.id, email=user.email)
    return {"Authorization": f"Bearer {token}", "User": user}


@pytest.fixture
def auth_headers_user2(test_db):
    user = User(
        email="learner2@example.com",
        full_name="Learner Two",
        hashed_password=hash_password("LearnerPass456!"),
        role="user",
        is_admin=False,
        is_active=True,
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)

    token = create_access_token(user_id=user.id, email=user.email)
    return {"Authorization": f"Bearer {token}", "User": user}


def test_dictionary_lookup_validation(client):
    # Empty word rejected
    res = client.get("/api/dictionary/lookup?word=")
    assert res.status_code == 422 or res.status_code == 400

    # Multi-word phrase rejected
    res = client.get("/api/dictionary/lookup?word=two words here")
    assert res.status_code == 400

    # Punctuation only rejected
    res = client.get("/api/dictionary/lookup?word=...?!")
    assert res.status_code == 400

    # Excessively long word rejected
    res = client.get(f"/api/dictionary/lookup?word={'a' * 105}")
    assert res.status_code == 422 or res.status_code == 400


def test_dictionary_lookup_curated_word_and_caching(client, test_db):
    # Lookup 'intimidated' with quotes
    res = client.get('/api/dictionary/lookup?word="intimidated!"')
    assert res.status_code == 200
    data = res.json()
    assert data["normalized_word"] == "intimidated"
    assert "ভীত" in data["bangla_meaning"]
    assert data["english_definition"] is not None
    assert data["pronunciation"] is not None
    assert data["is_saved"] is False

    # Second lookup should come from cache
    res2 = client.get("/api/dictionary/lookup?word=intimidated")
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["source"] == "cache"
    assert data2["bangla_meaning"] == data["bangla_meaning"]


def test_unauthenticated_restrictions_on_saved_words(client):
    # POST /api/dictionary/words without auth
    res = client.post(
        "/api/dictionary/words",
        json={"original_word": "courage", "bangla_meaning": "সাহস"},
    )
    assert res.status_code == 401

    # GET /api/dictionary/words without auth
    res = client.get("/api/dictionary/words")
    assert res.status_code == 401


def test_save_word_and_duplicate_idempotency(client, auth_headers_user1):
    headers = {"Authorization": auth_headers_user1["Authorization"]}

    # 1. Save word
    res = client.post(
        "/api/dictionary/words",
        headers=headers,
        json={
            "original_word": "Resilience",
            "bangla_meaning": "সহনশীলতা",
            "english_definition": "Capacity to recover quickly from difficulties.",
            "pronunciation": "/rɪˈzɪliəns/",
            "example_sentence": "Her resilience was inspiring.",
            "learning_status": "learning",
            "notes": "Important word for my essay",
        },
    )
    assert res.status_code == 201
    word_data = res.json()
    assert word_data["normalized_word"] == "resilience"
    assert word_data["bangla_meaning"] == "সহনশীলতা"
    assert word_data["notes"] == "Important word for my essay"
    saved_id = word_data["id"]

    # 2. Lookup now shows is_saved = True for user1
    lookup_res = client.get("/api/dictionary/lookup?word=resilience", headers=headers)
    assert lookup_res.status_code == 200
    assert lookup_res.json()["is_saved"] is True
    assert lookup_res.json()["saved_id"] == saved_id

    # 3. Save same word again (idempotent update, no duplicates)
    res_duplicate = client.post(
        "/api/dictionary/words",
        headers=headers,
        json={
            "original_word": "resilience",
            "bangla_meaning": "সহনশীলতা",
            "notes": "Updated note!",
            "learning_status": "learned",
        },
    )
    assert res_duplicate.status_code == 201 or res_duplicate.status_code == 200
    dup_data = res_duplicate.json()
    assert dup_data["id"] == saved_id
    assert dup_data["notes"] == "Updated note!"
    assert dup_data["learning_status"] == "learned"

    # Verify count is still 1
    list_res = client.get("/api/dictionary/words", headers=headers)
    assert list_res.status_code == 200
    assert list_res.json()["total"] == 1


def test_user_ownership_and_isolation(client, auth_headers_user1, auth_headers_user2):
    headers1 = {"Authorization": auth_headers_user1["Authorization"]}
    headers2 = {"Authorization": auth_headers_user2["Authorization"]}

    # User 1 saves "eloquent"
    res1 = client.post(
        "/api/dictionary/words",
        headers=headers1,
        json={"original_word": "eloquent", "bangla_meaning": "বাগ্মী"},
    )
    word_id = res1.json()["id"]

    # User 2 list should be empty
    list_res2 = client.get("/api/dictionary/words", headers=headers2)
    assert list_res2.status_code == 200
    assert list_res2.json()["total"] == 0

    # User 2 lookup should have is_saved = False
    lookup_res2 = client.get("/api/dictionary/lookup?word=eloquent", headers=headers2)
    assert lookup_res2.status_code == 200
    assert lookup_res2.json()["is_saved"] is False

    # User 2 cannot view User 1's saved word
    get_res = client.get(f"/api/dictionary/words/{word_id}", headers=headers2)
    assert get_res.status_code == 404

    # User 2 cannot edit User 1's saved word
    patch_res = client.patch(
        f"/api/dictionary/words/{word_id}",
        headers=headers2,
        json={"notes": "Hacked note"},
    )
    assert patch_res.status_code == 404

    # User 2 cannot delete User 1's saved word
    del_res = client.delete(f"/api/dictionary/words/{word_id}", headers=headers2)
    assert del_res.status_code == 404


def test_search_filter_pagination_and_review(client, auth_headers_user1):
    headers = {"Authorization": auth_headers_user1["Authorization"]}

    # Insert 3 words with different statuses
    words_to_insert = [
        {"original_word": "courage", "bangla_meaning": "সাহস", "learning_status": "new"},
        {"original_word": "ephemeral", "bangla_meaning": "ক্ষণস্থায়ী", "learning_status": "learning"},
        {"original_word": "ubiquitous", "bangla_meaning": "সর্বব্যাপী", "learning_status": "learned"},
    ]
    for w in words_to_insert:
        client.post("/api/dictionary/words", headers=headers, json=w)

    # Search by English word
    res = client.get("/api/dictionary/words?search=courage", headers=headers)
    assert res.status_code == 200
    assert res.json()["total"] == 1
    assert res.json()["items"][0]["original_word"] == "courage"

    # Search by Bangla Unicode
    res_bn = client.get("/api/dictionary/words?search=ক্ষণস্থায়ী", headers=headers)
    assert res_bn.status_code == 200
    assert res_bn.json()["total"] == 1
    assert res_bn.json()["items"][0]["original_word"] == "ephemeral"

    # Filter by status
    res_learning = client.get("/api/dictionary/words?status=learning", headers=headers)
    assert res_learning.status_code == 200
    assert res_learning.json()["total"] == 1
    assert res_learning.json()["items"][0]["original_word"] == "ephemeral"

    # Check status counts
    counts = res_learning.json()["counts"]
    assert counts["total"] == 3
    assert counts["new"] == 1
    assert counts["learning"] == 1
    assert counts["learned"] == 1

    # Sorting alphabetical
    res_alpha = client.get("/api/dictionary/words?sort=alphabetical", headers=headers)
    items = res_alpha.json()["items"]
    assert items[0]["normalized_word"] == "courage"
    assert items[1]["normalized_word"] == "ephemeral"
    assert items[2]["normalized_word"] == "ubiquitous"

    # Update word
    first_id = items[0]["id"]
    update_res = client.patch(
        f"/api/dictionary/words/{first_id}",
        headers=headers,
        json={"learning_status": "learned", "notes": "Mastered this word!"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["learning_status"] == "learned"
    assert update_res.json()["notes"] == "Mastered this word!"

    # Review mode endpoint
    review_res = client.get("/api/dictionary/review", headers=headers)
    assert review_res.status_code == 200
    review_items = review_res.json()
    assert len(review_items) == 3

    # Delete word
    del_res = client.delete(f"/api/dictionary/words/{first_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # Total should now be 2
    after_del = client.get("/api/dictionary/words", headers=headers)
    assert after_del.json()["total"] == 2
