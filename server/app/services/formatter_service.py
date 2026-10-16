import html
import re
from typing import List, Dict, Any, Tuple
from server.app.schemas.transcript import TranscriptSegment

# Terminal punctuation marks across English, Bangla, Hindi, Arabic, Urdu, Spanish, French, etc.
TERMINAL_PUNCTUATION = {".", "!", "?", "।", "॥", "؟", "۔"}


def clean_text(raw_text: str) -> str:
    """
    Cleans raw subtitle text: unescapes HTML entities, replaces newlines and NBSP,
    and collapses redundant spaces while preserving original wording in any script.
    """
    if not raw_text:
        return ""
    text = html.unescape(raw_text)
    # Replace non-breaking spaces and line breaks
    text = text.replace("\xa0", " ").replace("\n", " ").replace("\r", " ")
    # Collapse multiple consecutive whitespace characters
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def remove_overlapping_words(prev_text: str, curr_text: str, time_overlap: bool = False) -> str:
    """
    Detects if the end of prev_text overlaps with the beginning of curr_text
    (common in rolling auto-generated captions).
    If an overlap of 1 to 6 words is found:
    - If curr_text has additional non-overlapping words (e.g. rolling words),
      returns curr_text with the overlap stripped.
    - If the entire curr_text matches the tail of prev_text, it is only stripped if
      time_overlap is True (i.e. rolling caption window). If time_overlap is False
      (the previous caption finished before the current one began), the repeated phrase
      is preserved as legitimate spoken speech.
    """
    prev_words = prev_text.split()
    curr_words = curr_text.split()

    if not prev_words or not curr_words:
        return curr_text

    max_check = min(len(prev_words), len(curr_words), 6)
    for n in range(max_check, 0, -1):
        prev_tail = [w.lower().strip(".,!?:;\"'()[]{}|।؟۔") for w in prev_words[-n:]]
        curr_head = [w.lower().strip(".,!?:;\"'()[]{}|।؟۔") for w in curr_words[:n]]
        if prev_tail == curr_head and len(prev_tail) > 0 and all(len(w) > 0 for w in prev_tail):
            if n == len(curr_words) and not time_overlap:
                return curr_text
            return " ".join(curr_words[n:])

    return curr_text


def format_srt_time(seconds: float) -> str:
    """
    Converts seconds float to SubRip time format: HH:MM:SS,mmm
    """
    if seconds < 0:
        seconds = 0.0
    total_ms = int(round(seconds * 1000))
    hours = total_ms // 3600000
    minutes = (total_ms % 3600000) // 60000
    secs = (total_ms % 60000) // 1000
    millis = total_ms % 1000
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def generate_srt(segments: List[TranscriptSegment]) -> str:
    """
    Generates standard SubRip (.srt) transcript format.
    """
    srt_blocks = []
    for idx, seg in enumerate(segments, 1):
        start_time = format_srt_time(seg.start)
        end_time = format_srt_time(seg.start + max(seg.duration, 0.1))
        text = seg.text.strip()
        srt_blocks.append(f"{idx}\n{start_time} --> {end_time}\n{text}\n")
    return "\n".join(srt_blocks)


def format_transcript_paragraphs(
    raw_segments: List[Dict[str, Any]],
    paragraph_length: str = "medium"
) -> Tuple[List[TranscriptSegment], List[str], str, int, int]:
    """
    Transforms messy subtitle segments into:
    1. Cleaned TranscriptSegments
    2. Coherent, human-readable paragraphs (supporting multilingual scripts)
    3. SRT formatted content
    4. Word count
    5. Character count

    Preserves original speaker words without hallucination, duplication, or omission.
    """
    length_configs = {
        "short": {"target_words": 50, "max_words": 80, "pause_threshold": 1.6},
        "medium": {"target_words": 100, "max_words": 160, "pause_threshold": 2.2},
        "long": {"target_words": 180, "max_words": 260, "pause_threshold": 3.0},
    }

    config = length_configs.get(paragraph_length.lower(), length_configs["medium"])
    target_words = config["target_words"]
    max_words = config["max_words"]
    pause_threshold = config["pause_threshold"]

    cleaned_segments: List[TranscriptSegment] = []
    paragraphs: List[str] = []
    current_para_segments: List[str] = []
    current_para_word_count = 0

    last_end_time = 0.0
    prev_raw_cleaned = ""

    for item in raw_segments:
        text = clean_text(item.get("text", ""))
        start = float(item.get("start", 0.0))
        duration = float(item.get("duration", 0.0))

        if not text:
            continue

        # Check for rolling subtitle duplication (subtitles overlapping in time)
        time_overlap = (last_end_time > 0 and start < (last_end_time - 0.2))
        deduped_text = remove_overlapping_words(prev_raw_cleaned, text, time_overlap=time_overlap)
        if not deduped_text.strip():
            # Whole segment was duplicate
            continue

        cleaned_seg = TranscriptSegment(text=deduped_text, start=start, duration=duration)
        cleaned_segments.append(cleaned_seg)
        prev_raw_cleaned = deduped_text

        # Determine paragraph boundary triggers:
        # 1. Timing gap / speaker pause
        pause_gap = start - last_end_time if last_end_time > 0 else 0.0
        is_long_pause = (pause_gap >= pause_threshold) and (current_para_word_count >= 20)

        # 2. Check if previous accumulated text ended with sentence boundary
        prev_ends_sentence = False
        if current_para_segments:
            last_piece = current_para_segments[-1].rstrip()
            if last_piece and last_piece[-1] in TERMINAL_PUNCTUATION:
                prev_ends_sentence = True

        should_split = False

        if is_long_pause and prev_ends_sentence:
            should_split = True
        elif current_para_word_count >= target_words and prev_ends_sentence:
            should_split = True
        elif current_para_word_count >= max_words:
            should_split = True

        if should_split and current_para_segments:
            para_text = " ".join(current_para_segments).strip()
            # Ensure spacing around standard punctuation is clean
            para_text = re.sub(r"\s+([.,!?;:।॥؟۔])", r"\1", para_text)
            paragraphs.append(para_text)
            current_para_segments = []
            current_para_word_count = 0

        # Add segment text to current paragraph
        current_para_segments.append(deduped_text)
        current_para_word_count += len(deduped_text.split())
        last_end_time = start + duration

    # Flush final paragraph
    if current_para_segments:
        para_text = " ".join(current_para_segments).strip()
        para_text = re.sub(r"\s+([.,!?;:।॥؟۔])", r"\1", para_text)
        paragraphs.append(para_text)

    # Calculate word and character count across formatted text
    full_text = " ".join(paragraphs)
    word_count = len(full_text.split()) if full_text else 0
    character_count = len(full_text)

    # Generate SRT
    srt_content = generate_srt(cleaned_segments)

    return cleaned_segments, paragraphs, srt_content, word_count, character_count
