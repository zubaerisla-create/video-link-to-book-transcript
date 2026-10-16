import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from server.app.main import app
from server.app.schemas.transcript import TranscriptSegment
from server.app.services.formatter_service import format_transcript_paragraphs
from server.app.services.translation_service import translation_manager, TranslationError

client = TestClient(app)


def test_bangla_original_formatting_preserves_script():
    """Verify Bangla captions preserve Bengali script and dari (।) punctuation."""
    raw_bangla_segments = [
        {"text": "আমি বাংলায় গান গাই।", "start": 0.0, "duration": 2.5},
        {"text": "আমি বাংলার গান গাই।", "start": 2.6, "duration": 3.0},
        {"text": "আমি আমার আমিকে চিরদিন এই বাংলায় খুঁজে পাই।", "start": 5.8, "duration": 4.0},
    ]

    cleaned, paragraphs, srt, word_count, char_count = format_transcript_paragraphs(
        raw_bangla_segments, paragraph_length="medium"
    )

    assert len(paragraphs) >= 1
    assert "আমি বাংলায় গান গাই।" in paragraphs[0]
    assert "আমি বাংলার গান গাই।" in paragraphs[0]
    assert "বাংলায় খুঁজে পাই।" in paragraphs[0]
    assert word_count > 0
    assert char_count > 0
    assert "00:00:00,000 --> 00:00:02,500" in srt


def test_arabic_urdu_punctuation_formatting():
    """Verify Arabic and Urdu terminal punctuation marks are respected as sentence boundaries."""
    raw_arabic_segments = [
        {"text": "كيف حالك اليوم؟", "start": 0.0, "duration": 2.0},
        {"text": "الحمد لله رب العالمين.", "start": 2.2, "duration": 2.5},
    ]

    cleaned, paragraphs, srt, word_count, char_count = format_transcript_paragraphs(
        raw_arabic_segments, paragraph_length="short"
    )
    assert len(paragraphs) >= 1
    assert "كيف حالك اليوم؟" in paragraphs[0]
    assert "الحمد لله رب العالمين." in paragraphs[0]


@patch("server.app.api.routes.get_video_info")
@patch("server.app.api.routes.fetch_raw_transcript")
def test_bangla_video_in_original_mode_stays_bangla(mock_fetch_transcript, mock_get_video_info):
    """Verify that a Bangla video in original mode preserves Bangla without auto-translating."""
    mock_get_video_info.return_value = {
        "video_id": "banglaVid01",
        "title": "Bangla Tech Talk",
        "author": "Bangla Channel",
        "thumbnail_url": "https://i.ytimg.com/vi/banglaVid01/hqdefault.jpg"
    }

    mock_raw_segments = [
        {"text": "সবাইকে স্বাগতম আমাদের নতুন ভিডিওতে।", "start": 0.0, "duration": 3.0},
        {"text": "আজকে আমরা কৃত্রিম বুদ্ধিমত্তা নিয়ে আলোচনা করব।", "start": 3.2, "duration": 4.0},
    ]
    mock_langs = [
        {"code": "bn", "name": "Bangla", "is_generated": True, "is_translatable": True}
    ]

    mock_track = MagicMock()
    mock_track.is_translatable = True
    mock_track.language_code = "bn"
    mock_track.language = "Bangla"

    mock_fetch_transcript.return_value = (
        mock_raw_segments,
        "Bangla",
        "bn",
        True,
        mock_langs,
        mock_track,
    )

    response = client.post(
        "/api/transcript",
        json={
            "url": "https://www.youtube.com/watch?v=banglaVid01",
            "language_mode": "original",
            "paragraph_length": "medium"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert data["detected_language"] == "bn"
    assert data["language"] == "bn"
    assert data["is_translated"] is False
    assert "সবাইকে স্বাগতম আমাদের নতুন ভিডিওতে।" in data["paragraphs"][0]
    assert data["original_paragraphs"] == data["paragraphs"]


@patch("server.app.api.routes.get_video_info")
@patch("server.app.api.routes.fetch_raw_transcript")
@patch("server.app.services.translation_service.translation_manager.translate_transcript")
def test_translation_to_bangla_target(mock_translate_transcript, mock_fetch_transcript, mock_get_video_info):
    """Verify translating English video into Bangla target preserves timestamps and alignment."""
    mock_get_video_info.return_value = {
        "video_id": "englishVid1",
        "title": "English Speech",
        "author": "Speaker",
        "thumbnail_url": "https://i.ytimg.com/vi/englishVid1/hqdefault.jpg"
    }

    mock_raw_segments = [
        {"text": "Hello everyone, welcome.", "start": 0.0, "duration": 2.0},
        {"text": "Today we learn Python.", "start": 2.1, "duration": 2.5},
    ]
    mock_langs = [{"code": "en", "name": "English", "is_generated": False, "is_translatable": True}]
    mock_track = MagicMock()
    mock_track.is_translatable = False  # force provider translation

    mock_fetch_transcript.return_value = (
        mock_raw_segments,
        "English",
        "en",
        False,
        mock_langs,
        mock_track,
    )

    # Mock translation result
    mock_trans_segs = [
        TranscriptSegment(text="সবাইকে হ্যালো, স্বাগতম।", start=0.0, duration=2.0),
        TranscriptSegment(text="আজ আমরা পাইথন শিখব।", start=2.1, duration=2.5),
    ]
    mock_trans_paras = ["সবাইকে হ্যালো, স্বাগতম। আজ আমরা পাইথন শিখব।"]
    mock_trans_srt = "1\n00:00:00,000 --> 00:00:02,000\nসবাইকে হ্যালো, স্বাগতম。\n"

    mock_translate_transcript.return_value = (
        mock_trans_segs,
        mock_trans_paras,
        mock_trans_srt,
        "mymemory",
    )

    response = client.post(
        "/api/transcript",
        json={
            "url": "https://www.youtube.com/watch?v=englishVid1",
            "language_mode": "translate",
            "target_language": "bn",
            "paragraph_length": "medium"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert data["is_translated"] is True
    assert data["detected_language"] == "en"
    assert data["target_language"] == "bn"
    assert data["translation_provider"] == "mymemory"
    assert "সবাইকে হ্যালো" in data["paragraphs"][0]
    # Original is still accessible!
    assert "Hello everyone, welcome." in data["original_paragraphs"][0]
    # Segments align in start times
    assert data["segments"][0]["start"] == data["original_segments"][0]["start"]


@patch("server.app.api.routes.get_video_info")
@patch("server.app.api.routes.fetch_raw_transcript")
@patch("server.app.api.routes.transcribe_youtube_audio")
def test_speech_recognition_fallback_when_captions_missing(
    mock_speech_transcribe, mock_fetch_transcript, mock_get_video_info
):
    """Verify fallback to speech recognition when captions are disabled and fallback is enabled."""
    from server.app.services.youtube_service import YouTubeError

    mock_get_video_info.return_value = {
        "video_id": "noCaption01",
        "title": "No Captions Video",
        "author": "Creator",
        "thumbnail_url": None
    }

    # Simulate missing captions
    mock_fetch_transcript.side_effect = YouTubeError("No captions found for this video", "NO_CAPTIONS", 404)

    # Simulate faster-whisper transcribing Bangla audio
    mock_speech_transcribe.return_value = (
        [{"text": "এটি একটি স্পিচ টু টেক্সট পরীক্ষা।", "start": 0.5, "duration": 3.0}],
        "Bangla",
        "bn",
    )

    response = client.post(
        "/api/transcript",
        json={
            "url": "https://www.youtube.com/watch?v=noCaption01",
            "enable_speech_fallback": True,
            "language_mode": "original",
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert data["transcription_method"] == "speech_recognition"
    assert data["detected_language"] == "bn"
    assert "এটি একটি স্পিচ টু টেক্সট পরীক্ষা।" in data["paragraphs"][0]
    assert len(data["warnings"]) > 0


@patch("server.app.api.routes.get_video_info")
@patch("server.app.api.routes.fetch_raw_transcript")
def test_captions_missing_without_fallback_returns_404_with_hint(
    mock_fetch_transcript, mock_get_video_info
):
    """Verify that when captions are missing and fallback is NOT enabled, 404 returns with helpful hint."""
    from server.app.services.youtube_service import YouTubeError

    mock_get_video_info.return_value = None
    mock_fetch_transcript.side_effect = YouTubeError("No captions found for this video", "NO_CAPTIONS", 404)

    response = client.post(
        "/api/transcript",
        json={
            "url": "https://www.youtube.com/watch?v=noCaption01",
            "enable_speech_fallback": False,
        }
    )

    assert response.status_code == 404
    data = response.json()
    assert data["detail"]["code"] == "NO_CAPTIONS"
    assert "Speech-to-Text" in data["detail"]["detail"]


def test_unsupported_translation_language_pair():
    """Verify that requesting an unsupported target language code raises user-friendly error."""
    provider = translation_manager.providers["mymemory"]
    assert provider.is_language_supported("xyz123") is False


def test_detect_script_language_inference():
    """Verify detect_script_language correctly identifies Unicode script languages."""
    from server.app.services.youtube_service import detect_script_language

    assert detect_script_language("SSC ও HSC GPA অনুযায়ী কোন দেশে পড়তে পারবেন? | Study Abroad Guide") == "bn"
    assert detect_script_language("পাইথন প্রোগ্রামিং শিখুন সহজে") == "bn"
    assert detect_script_language("मशीन लर्निंग कैसे सीखें") == "hi"
    assert detect_script_language("تعلم البرمجة للمبتدئين") == "ar"
    assert detect_script_language("Learn Python for Beginners") is None
    assert detect_script_language("") is None
    assert detect_script_language(None) is None


def test_detect_original_track_rejects_conflicting_english_auto_track_for_bangla_title():
    """Verify that detect_original_track rejects YouTube's auto-generated 'en' track when title is Bengali."""
    from server.app.services.youtube_service import detect_original_track

    # Mock an auto-generated English caption track
    mock_en_track = MagicMock()
    mock_en_track.language_code = "en"
    mock_en_track.language = "English (auto-generated)"
    mock_en_track.is_generated = True

    track_list = [mock_en_track]
    bangla_title = "SSC ও HSC GPA অনুযায়ী কোন দেশে পড়তে পারবেন? | Study Abroad Guide"

    # Should NOT return the English track; should return None so speech fallback can run!
    selected = detect_original_track(track_list, video_title=bangla_title)
    assert selected is None


def test_detect_original_track_prioritizes_bangla_when_available():
    """Verify that detect_original_track chooses the Bangla track when title is Bengali."""
    from server.app.services.youtube_service import detect_original_track

    mock_en_track = MagicMock()
    mock_en_track.language_code = "en"
    mock_en_track.is_generated = True

    mock_bn_track = MagicMock()
    mock_bn_track.language_code = "bn"
    mock_bn_track.is_generated = False

    track_list = [mock_en_track, mock_bn_track]
    bangla_title = "SSC ও HSC GPA অনুযায়ী কোন দেশে পড়তে পারবেন? | Study Abroad Guide"

    selected = detect_original_track(track_list, video_title=bangla_title)
    assert selected == mock_bn_track


@patch("server.app.api.routes.get_video_info")
@patch("server.app.services.youtube_service.YouTubeTranscriptApi")
@patch("server.app.api.routes.transcribe_youtube_audio")
def test_bangla_video_with_only_english_captions_falls_back_to_whisper_bangla(
    mock_speech_transcribe, mock_yt_api_cls, mock_get_video_info
):
    """
    Regression test for video 4rWvW5ZRkNc:
    A Bangla video where YouTube only offers an auto-generated English caption track.
    In original mode, the app must reject the English track and transcribe the spoken Bangla.
    """
    mock_get_video_info.return_value = {
        "video_id": "4rWvW5ZRkNc",
        "title": "SSC ও HSC GPA অনুযায়ী কোন দেশে পড়তে পারবেন? | Study Abroad Guide",
        "author": "Munzereen Shahid",
        "thumbnail_url": "https://i.ytimg.com/vi/4rWvW5ZRkNc/hqdefault.jpg"
    }

    # YouTube API returns only auto-generated 'en' track
    mock_en_track = MagicMock()
    mock_en_track.language_code = "en"
    mock_en_track.language = "English (auto-generated)"
    mock_en_track.is_generated = True
    mock_en_track.is_translatable = True

    mock_api_instance = MagicMock()
    mock_api_instance.list.return_value = [mock_en_track]
    mock_yt_api_cls.return_value = mock_api_instance

    # Mock Whisper speech recognition detecting Bangla
    mock_speech_transcribe.return_value = (
        [
            {"text": "এসএসসি এবং এইচএসসি জিপিএ অনুযায়ী কোন কোন দেশে আপনি পড়াশোনা করতে পারবেন?", "start": 0.0, "duration": 4.5},
            {"text": "আজকের ভিডিওতে আমরা বিস্তারিত আলোচনা করব।", "start": 4.6, "duration": 3.2},
        ],
        "Bangla",
        "bn",
    )

    response = client.post(
        "/api/transcript",
        json={
            "url": "https://youtu.be/4rWvW5ZRkNc",
            "language_mode": "original",
            "enable_speech_fallback": True,
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert data["transcription_method"] == "speech_recognition"
    assert data["detected_language"] == "bn"
    assert data["detected_language_name"] == "Bangla"
    assert data["language"] == "bn"
    assert data["is_translated"] is False
    assert data["target_language"] is None
    assert "এসএসসি এবং এইচএসসি" in data["paragraphs"][0]


@patch("server.app.api.routes.get_video_info")
@patch("server.app.services.youtube_service.YouTubeTranscriptApi")
def test_english_original_mode_returns_english_captions_without_translating(
    mock_yt_api_cls, mock_get_video_info
):
    """
    Regression test for English original mode:
    An English video with English captions returns English verbatim without translation.
    """
    mock_get_video_info.return_value = {
        "video_id": "engVid99001",
        "title": "Learn Python in 10 Minutes",
        "author": "Tech Creator",
        "thumbnail_url": None,
    }

    mock_en_track = MagicMock()
    mock_en_track.language_code = "en"
    mock_en_track.language = "English (auto-generated)"
    mock_en_track.is_generated = True
    mock_en_track.is_translatable = True

    mock_raw_fetched = MagicMock()
    mock_raw_fetched.to_raw_data.return_value = [
        {"text": "Welcome to Python tutorial.", "start": 0.0, "duration": 2.5},
        {"text": "Let us get started.", "start": 2.6, "duration": 2.0},
    ]
    mock_en_track.fetch.return_value = mock_raw_fetched

    mock_api_instance = MagicMock()
    mock_api_instance.list.return_value = [mock_en_track]
    mock_yt_api_cls.return_value = mock_api_instance

    response = client.post(
        "/api/transcript",
        json={
            "url": "https://www.youtube.com/watch?v=engVid99001",
            "language_mode": "original",
            "enable_speech_fallback": False,
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert data["transcription_method"] == "youtube_captions"
    assert data["detected_language"] == "en"
    assert data["language"] == "en"
    assert data["is_translated"] is False
    assert "Welcome to Python tutorial." in data["paragraphs"][0]

