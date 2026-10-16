import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from server.app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "Transcriptly API"


def test_invalid_url_transcript():
    response = client.post("/api/transcript", json={"url": "https://invalid-url.com"})
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert data["detail"]["code"] == "INVALID_URL"


@patch("server.app.api.routes.get_video_info")
@patch("server.app.api.routes.fetch_raw_transcript")
def test_successful_transcript_extraction(mock_fetch_transcript, mock_get_video_info):
    mock_get_video_info.return_value = {
        "video_id": "dQw4w9WgXcQ",
        "title": "Never Gonna Give You Up",
        "author": "Rick Astley",
        "thumbnail_url": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
    }

    mock_raw_segments = [
        {"text": "We're no strangers to love.", "start": 0.0, "duration": 2.5},
        {"text": "You know the rules and so do I.", "start": 2.6, "duration": 3.0},
    ]

    mock_available_langs = [
        {"code": "en", "name": "English", "is_generated": False, "is_translatable": True}
    ]

    mock_track = MagicMock()
    mock_track.is_translatable = False

    mock_fetch_transcript.return_value = (
        mock_raw_segments,
        "English",
        "en",
        False,
        mock_available_langs,
        mock_track,
    )

    response = client.post(
        "/api/transcript",
        json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "paragraph_length": "medium"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["video_id"] == "dQw4w9WgXcQ"
    assert data["language"] == "en"
    assert data["is_generated"] is False
    assert len(data["paragraphs"]) >= 1
    assert "We're no strangers to love. You know the rules and so do I." in data["paragraphs"][0]
    assert len(data["segments"]) == 2
    assert "00:00:00,000 --> 00:00:02,500" in data["srt"]
    assert data["word_count"] > 0
    assert data["character_count"] > 0
