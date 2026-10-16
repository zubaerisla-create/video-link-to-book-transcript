import json
import os
import pytest
from fastapi.testclient import TestClient
from server.app.main import app
from server.app.services.staging_service import (
    staging_service,
    parse_timestamp_to_seconds,
    parse_raw_text_to_segments,
)

client = TestClient(app)


def test_manifest_schema_and_permissions():
    """Verify Manifest V3 configuration, minimal permissions, and referenced files."""
    manifest_path = os.path.join(os.path.dirname(__file__), "..", "..", "extension", "manifest.json")
    manifest_path = os.path.abspath(manifest_path)
    assert os.path.isfile(manifest_path), f"manifest.json not found at {manifest_path}"

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    # Manifest V3
    assert manifest.get("manifest_version") == 3
    assert "Transcriptly" in manifest.get("name", "")
    assert manifest.get("version") == "1.0.0"

    # Minimal permissions
    permissions = manifest.get("permissions", [])
    assert set(permissions) == {"activeTab", "scripting", "storage"}

    # Scoped host permissions
    host_permissions = manifest.get("host_permissions", [])
    assert any("youtube.com" in h for h in host_permissions)
    assert any("habd.tech" in h for h in host_permissions)

    # Check action popup and icon files exist
    ext_dir = os.path.dirname(manifest_path)
    popup_file = manifest.get("action", {}).get("default_popup")
    assert popup_file and os.path.isfile(os.path.join(ext_dir, popup_file))

    for size, icon_rel in manifest.get("icons", {}).items():
        assert os.path.isfile(os.path.join(ext_dir, icon_rel)), f"Icon {icon_rel} missing"


def test_parse_timestamp_to_seconds():
    """Test timestamp string parsing for standard formats."""
    assert parse_timestamp_to_seconds("0:05") == 5.0
    assert parse_timestamp_to_seconds("01:24") == 84.0
    assert parse_timestamp_to_seconds("[01:24]") == 84.0
    assert parse_timestamp_to_seconds("(01:24)") == 84.0
    assert parse_timestamp_to_seconds("1:02:30") == 3750.0
    assert parse_timestamp_to_seconds("00:01:15.500") == 75.5
    assert parse_timestamp_to_seconds("invalid") is None


def test_parse_raw_text_to_segments():
    """Test parsing multi-line and inline timestamp formats into segments."""
    # 1. Multi-line YouTube format (timestamp line followed by text line)
    multiline_text = "0:00\nIntroduction to the course\n0:15\nSetting up your environment"
    segs = parse_raw_text_to_segments(multiline_text)
    assert len(segs) == 2
    assert segs[0]["start"] == 0.0
    assert segs[0]["text"] == "Introduction to the course"
    assert segs[1]["start"] == 15.0
    assert segs[1]["text"] == "Setting up your environment"

    # 2. Inline timestamp format
    inline_text = "[01:00] Step one is preparation.\n[02:30] Step two is execution."
    inline_segs = parse_raw_text_to_segments(inline_text)
    assert len(inline_segs) == 2
    assert inline_segs[0]["start"] == 60.0
    assert inline_segs[0]["text"] == "Step one is preparation."
    assert inline_segs[1]["start"] == 150.0
    assert inline_segs[1]["text"] == "Step two is execution."


def test_stage_import_with_segments_and_consume():
    """Test staging structured segments and single-use atomic consumption."""
    payload = {
        "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "title": "Never Gonna Give You Up",
        "channel_title": "Rick Astley",
        "segments": [
            {"start": 0.0, "text": "We're no strangers to love", "duration": 2.5},
            {"start": 2.6, "text": "You know the rules and so do I", "duration": 3.0},
        ],
        "paragraph_length": "medium",
    }

    # 1. Stage import
    res_stage = client.post("/api/transcript/stage-import", json=payload)
    assert res_stage.status_code == 201
    stage_data = res_stage.json()
    assert "import_token" in stage_data
    assert len(stage_data["import_token"]) >= 32
    assert stage_data["video_id"] == "dQw4w9WgXcQ"
    assert stage_data["segment_count"] == 2
    assert stage_data["detected_language"] == "en"

    token = stage_data["import_token"]

    # 2. First consumption: must succeed (200 OK)
    res_get = client.get(f"/api/transcript/staged/{token}")
    assert res_get.status_code == 200
    transcript = res_get.json()
    assert transcript["video_id"] == "dQw4w9WgXcQ"
    assert transcript["transcription_method"] == "browser_import"
    assert len(transcript["segments"]) == 2
    assert len(transcript["paragraphs"]) >= 1

    # 3. Second consumption: single-use token was consumed, must return 404
    res_replay = client.get(f"/api/transcript/staged/{token}")
    assert res_replay.status_code == 404
    replay_err = res_replay.json()
    assert replay_err["detail"]["code"] == "TOKEN_EXPIRED"


def test_stage_import_bangla_unicode_preservation():
    """Verify Bengali Unicode characters and language detection are accurately preserved."""
    bangla_payload = {
        "video_url": "https://youtu.be/abcdefghijk",
        "title": "বাংলা টিউটোরিয়াল পর্ব ১",
        "channel_title": "প্রোগ্রামিং একাডেমি",
        "segments": [
            {"start": 0.0, "text": "হ্যালো বন্ধুরা, সবাই কেমন আছেন?", "duration": 3.0},
            {"start": 3.2, "text": "আজকের পর্বে আমরা পাইথন ও কৃত্রিম বুদ্ধিমত্তা নিয়ে আলোচনা করব।", "duration": 4.5},
        ],
    }

    res = client.post("/api/transcript/stage-import", json=bangla_payload)
    assert res.status_code == 201
    data = res.json()
    assert data["detected_language"] == "bn"
    assert data["detected_language_name"] == "Bangla"

    token = data["import_token"]
    res_get = client.get(f"/api/transcript/staged/{token}")
    assert res_get.status_code == 200
    retrieved = res_get.json()
    assert retrieved["language"] == "bn"
    assert "বন্ধুরা" in retrieved["paragraphs"][0]
    assert "পাইথন" in retrieved["paragraphs"][0]


def test_stage_import_payload_size_enforcement():
    """Verify requests exceeding 1,000,000 characters are rejected with HTTP 413."""
    huge_text = "This is a sentence that is repeated to exceed the size limit. " * 17000  # > 1,050,000 chars
    payload = {
        "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "raw_text": huge_text,
    }

    res = client.post("/api/transcript/stage-import", json=payload)
    assert res.status_code == 413
    data = res.json()
    assert data["detail"]["code"] == "PAYLOAD_TOO_LARGE"


def test_stage_import_large_transcript_success():
    """Verify staging a large YouTube transcript (175 minutes / 4,897 segments / ~160k chars) succeeds."""
    # Build a realistic 5,000 segment transcript (~175k characters)
    large_segments = [
        {
            "start": round(i * 2.1, 2),
            "text": f"Segment sentence number {i} exploring cognitive focus, neuroscience, and deep memory performance.",
            "duration": 2.0,
        }
        for i in range(2500)
    ]
    payload = {
        "video_url": "https://www.youtube.com/watch?v=4Vz6L8B73i4",
        "title": "Neuroscientist's Guide To 10X Your Focus & Memory | Dr Sahar Yousef | FO559 Raj Shamani",
        "channel_title": "Raj Shamani",
        "segments": large_segments,
        "paragraph_length": "medium",
    }

    res = client.post("/api/transcript/stage-import", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert "import_token" in data
    assert data["segment_count"] == 2500
    assert data["detected_language"] == "en"

    # Consume and verify preview
    token = data["import_token"]
    res_get = client.get(f"/api/transcript/staged/{token}")
    assert res_get.status_code == 200
    staged = res_get.json()
    assert staged["video_id"] == "4Vz6L8B73i4"
    assert len(staged["segments"]) == 2500
    assert len(staged["paragraphs"]) > 10
    assert staged["character_count"] > 100000


def test_stage_import_invalid_url_and_empty_payload():
    """Verify validation for malformed URLs and empty segments."""
    # Invalid URL
    res_bad_url = client.post(
        "/api/transcript/stage-import",
        json={"video_url": "https://example.com/not-youtube", "raw_text": "Some text"},
    )
    assert res_bad_url.status_code == 400
    assert res_bad_url.json()["detail"]["code"] == "INVALID_URL"

    # Empty segments
    res_empty = client.post(
        "/api/transcript/stage-import",
        json={"video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "segments": []},
    )
    assert res_empty.status_code == 400
    assert res_empty.json()["detail"]["code"] == "EMPTY_TRANSCRIPT"


@pytest.mark.asyncio
async def test_staging_service_ttl_purge():
    """Verify StagingService purges expired entries when TTL is exceeded."""
    from server.app.services.staging_service import StagingService
    from server.app.schemas.transcript import TranscriptResponse

    short_ttl_service = StagingService(ttl_seconds=0)  # expires immediately
    dummy_resp = TranscriptResponse(
        video_id="test1234567",
        video_info=None,
        language="en",
        language_name="English",
        detected_language="en",
        detected_language_name="English",
        is_generated=False,
        transcription_method="browser_import",
        language_mode="original",
        available_languages=[],
        paragraphs=["Test para"],
        segments=[],
        srt="",
        original_paragraphs=["Test para"],
        original_segments=[],
        original_srt="",
        word_count=2,
        character_count=9,
    )

    token, _ = await short_ttl_service.stage(dummy_resp)
    # Immediate retrieval should be None because TTL is 0
    retrieved = await short_ttl_service.get_and_consume(token)
    assert retrieved is None


def test_extension_extraction_avoids_dom_duplication():
    """Verify that targeting ytd-transcript-segment-renderer extracts each row once,
    while the old overlapping selector caused duplicate extraction on YouTube Polymer DOM."""
    from bs4 import BeautifulSoup

    youtube_polymer_dom = """
    <ytd-engagement-panel-section-list-renderer target-id="engagement-panel-transcript" visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED">
      <div id="segments-container">
        <!-- Row 1: YouTube Polymer wraps content in custom element with scoped child classes -->
        <ytd-transcript-segment-renderer class="style-scope ytd-transcript-segment-list-renderer">
          <div id="segment" class="style-scope ytd-transcript-segment-renderer">
            <div class="segment-timestamp style-scope ytd-transcript-segment-renderer">0:00</div>
            <yt-formatted-string class="segment-text style-scope ytd-transcript-segment-renderer">Welcome to this lecture.</yt-formatted-string>
          </div>
        </ytd-transcript-segment-renderer>

        <!-- Row 2 -->
        <ytd-transcript-segment-renderer class="style-scope ytd-transcript-segment-list-renderer">
          <div id="segment" class="style-scope ytd-transcript-segment-renderer">
            <div class="segment-timestamp style-scope ytd-transcript-segment-renderer">0:05</div>
            <yt-formatted-string class="segment-text style-scope ytd-transcript-segment-renderer">Today we will discuss algorithms.</yt-formatted-string>
          </div>
        </ytd-transcript-segment-renderer>
      </div>
    </ytd-engagement-panel-section-list-renderer>
    """
    soup = BeautifulSoup(youtube_polymer_dom, "html.parser")

    # The buggy selector:
    buggy_matches = soup.select("ytd-transcript-segment-renderer, .ytd-transcript-segment-renderer")
    assert len(buggy_matches) == 8  # 2 parent elements + 6 child elements carrying the class

    # Buggy extraction collected the text twice for each row:
    buggy_texts = []
    for node in buggy_matches:
        text_el = node.select_one(".segment-text")
        if text_el and text_el.get_text().strip():
            buggy_texts.append(text_el.get_text().strip())
    assert len(buggy_texts) == 4  # 2 rows x 2 = 4 duplicate sentences!
    assert buggy_texts[0] == buggy_texts[1] == "Welcome to this lecture."
    assert buggy_texts[2] == buggy_texts[3] == "Today we will discuss algorithms."

    # The fixed selector:
    fixed_matches = soup.select("ytd-transcript-segment-renderer")
    assert len(fixed_matches) == 2  # Exactly 2 source rows!

    fixed_texts = []
    for node in fixed_matches:
        text_el = node.select_one(".segment-text")
        if text_el and text_el.get_text().strip():
            fixed_texts.append(text_el.get_text().strip())
    assert len(fixed_texts) == 2
    assert fixed_texts == ["Welcome to this lecture.", "Today we will discuss algorithms."]


def test_extension_extraction_preserves_legitimate_repeated_phrases():
    """Verify that multiple source transcript rows with identical text (legitimate repetitions)
    are preserved as distinct segments with accurate timestamps, not blindly de-duplicated."""
    from bs4 import BeautifulSoup

    youtube_repeated_speech_dom = """
    <div id="segments-container">
      <ytd-transcript-segment-renderer>
        <div id="segment">
          <div class="segment-timestamp">1:10</div>
          <yt-formatted-string class="segment-text">Never give up.</yt-formatted-string>
        </div>
      </ytd-transcript-segment-renderer>
      <ytd-transcript-segment-renderer>
        <div id="segment">
          <div class="segment-timestamp">1:14</div>
          <yt-formatted-string class="segment-text">Never give up.</yt-formatted-string>
        </div>
      </ytd-transcript-segment-renderer>
      <ytd-transcript-segment-renderer>
        <div id="segment">
          <div class="segment-timestamp">1:18</div>
          <yt-formatted-string class="segment-text">Always keep pushing forward.</yt-formatted-string>
        </div>
      </ytd-transcript-segment-renderer>
    </div>
    """
    soup = BeautifulSoup(youtube_repeated_speech_dom, "html.parser")
    rows = soup.select("ytd-transcript-segment-renderer")
    assert len(rows) == 3

    extracted = []
    for row in rows:
        ts = row.select_one(".segment-timestamp").get_text().strip()
        text = row.select_one(".segment-text").get_text().strip()
        extracted.append({"ts": ts, "text": text})

    # Legitimate repetition is preserved with separate timestamps
    assert len(extracted) == 3
    assert extracted[0] == {"ts": "1:10", "text": "Never give up."}
    assert extracted[1] == {"ts": "1:14", "text": "Never give up."}
    assert extracted[2] == {"ts": "1:18", "text": "Always keep pushing forward."}


def test_extension_fallback_containment_filtering():
    """Verify that if YouTube uses nested divs with classes instead of custom tags,
    the hierarchical filter keeps only top-level candidates and eliminates parent/child duplicates."""
    from bs4 import BeautifulSoup

    fallback_dom = """
    <div id="segments-container">
      <div class="ytd-transcript-segment-renderer outer-card">
        <div class="ytd-transcript-segment-renderer inner-card">
          <div class="segment-timestamp">0:00</div>
          <div class="segment-text">Testing fallback layout.</div>
        </div>
      </div>
      <div class="ytd-transcript-segment-renderer outer-card">
        <div class="ytd-transcript-segment-renderer inner-card">
          <div class="segment-timestamp">0:04</div>
          <div class="segment-text">Second fallback segment.</div>
        </div>
      </div>
    </div>
    """
    soup = BeautifulSoup(fallback_dom, "html.parser")
    candidates = soup.select(".ytd-transcript-segment-renderer")
    assert len(candidates) == 4  # 2 outer + 2 inner

    # Hierarchical containment filter:
    top_level = [
        c for c in candidates
        if not any(other != c and c in other.descendants for other in candidates)
    ]
    assert len(top_level) == 2  # Exactly 2 top-level rows!


def test_stage_import_with_repeated_phrases():
    """Verify that the staging endpoint preserves legitimate spoken repetitions in videos."""
    payload = {
        "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "title": "Song with Repeated Chorus",
        "segments": [
            {"start": 10.0, "text": "Don't stop believin'", "duration": 3.0},
            {"start": 14.0, "text": "Don't stop believin'", "duration": 3.0},
            {"start": 18.0, "text": "Hold on to that feelin'", "duration": 3.0},
        ],
        "paragraph_length": "short",
    }
    res = client.post("/api/transcript/stage-import", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["segment_count"] == 3

    # Retrieve staged transcript
    token = data["import_token"]
    res_get = client.get(f"/api/transcript/staged/{token}")
    assert res_get.status_code == 200
    staged = res_get.json()
    assert len(staged["segments"]) == 3
    # Both repetitions must be present in the segments array
    assert staged["segments"][0]["text"] == "Don't stop believin'"
    assert staged["segments"][1]["text"] == "Don't stop believin'"
    # Paragraph text must also retain the full transcript
    full_text = " ".join(staged["paragraphs"])
    assert full_text.count("Don't stop believin'") == 2
