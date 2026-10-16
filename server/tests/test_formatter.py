from server.app.services.formatter_service import (
    clean_text,
    remove_overlapping_words,
    format_srt_time,
    generate_srt,
    format_transcript_paragraphs,
)
from server.app.schemas.transcript import TranscriptSegment


def test_clean_text():
    raw = "Not because I &amp; you doubted &#39;myself&#39;&nbsp;\nbut"
    cleaned = clean_text(raw)
    assert cleaned == "Not because I & you doubted 'myself' but"


def test_remove_overlapping_words():
    prev = "because I was told that"
    curr = "was told that I wasn't good enough."
    deduped = remove_overlapping_words(prev, curr)
    assert deduped == "I wasn't good enough."

    # When no overlap
    prev2 = "Hello world"
    curr2 = "How are you doing today"
    assert remove_overlapping_words(prev2, curr2) == curr2


def test_format_srt_time():
    assert format_srt_time(0.0) == "00:00:00,000"
    assert format_srt_time(1.36) == "00:00:01,360"
    assert format_srt_time(65.5) == "00:01:05,500"
    assert format_srt_time(3661.123) == "01:01:01,123"


def test_format_transcript_paragraphs_merging():
    # Prompt example:
    # "Not because I doubted myself, but"
    # "because I was told that I wasn't good"
    # "enough. I was told that I didn't fit in."
    segments = [
        {"text": "Not because I doubted myself, but", "start": 0.0, "duration": 2.0},
        {"text": "because I was told that I wasn't good", "start": 2.1, "duration": 2.0},
        {"text": "enough. I was told that I didn't fit in.", "start": 4.2, "duration": 2.5},
    ]

    cleaned_segs, paragraphs, srt_content, word_cnt, char_cnt = format_transcript_paragraphs(
        segments, paragraph_length="medium"
    )

    assert len(paragraphs) == 1
    # Check that text is properly merged
    expected = "Not because I doubted myself, but because I was told that I wasn't good enough. I was told that I didn't fit in."
    assert paragraphs[0] == expected
    assert word_cnt == len(expected.split())
    assert char_cnt == len(expected)
    assert len(cleaned_segs) == 3


def test_format_srt_output():
    segments = [
        TranscriptSegment(text="Hello world.", start=1.5, duration=2.0),
        TranscriptSegment(text="Second subtitle.", start=3.8, duration=1.5),
    ]
    srt = generate_srt(segments)
    assert "1\n00:00:01,500 --> 00:00:03,500\nHello world." in srt
    assert "2\n00:00:03,800 --> 00:00:05,300\nSecond subtitle." in srt
