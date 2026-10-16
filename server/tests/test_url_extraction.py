import pytest
from server.app.services.youtube_service import extract_video_id, YouTubeError

def test_extract_video_id_standard_watch():
    url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    assert extract_video_id(url) == "dQw4w9WgXcQ"

def test_extract_video_id_watch_with_params():
    url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120s&ab_channel=RickAstley"
    assert extract_video_id(url) == "dQw4w9WgXcQ"

def test_extract_video_id_youtu_be():
    url = "https://youtu.be/dQw4w9WgXcQ"
    assert extract_video_id(url) == "dQw4w9WgXcQ"

def test_extract_video_id_youtu_be_with_param():
    url = "https://youtu.be/dQw4w9WgXcQ?t=45"
    assert extract_video_id(url) == "dQw4w9WgXcQ"

def test_extract_video_id_shorts():
    url = "https://www.youtube.com/shorts/dQw4w9WgXcQ"
    assert extract_video_id(url) == "dQw4w9WgXcQ"

def test_extract_video_id_embed():
    url = "https://www.youtube.com/embed/dQw4w9WgXcQ"
    assert extract_video_id(url) == "dQw4w9WgXcQ"

def test_extract_video_id_direct_id():
    video_id = "dQw4w9WgXcQ"
    assert extract_video_id(video_id) == "dQw4w9WgXcQ"

def test_extract_video_id_invalid_urls():
    invalid_cases = [
        "",
        "   ",
        "https://vimeo.com/12345678",
        "https://www.google.com",
        "https://www.youtube.com/watch?v=tooshort",
        "https://www.youtube.com/watch?v=waytoolongvideoidstring123",
        "random string not a url",
    ]
    for case in invalid_cases:
        with pytest.raises(YouTubeError):
            extract_video_id(case)
