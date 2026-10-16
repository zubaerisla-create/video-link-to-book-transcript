import abc
import asyncio
import logging
from typing import List, Optional, Tuple, Dict
from server.app.schemas.transcript import TranscriptSegment
from server.app.services.formatter_service import format_transcript_paragraphs

logger = logging.getLogger("transcriptly.translation")

LANGUAGE_NAMES: Dict[str, str] = {
    "auto": "Auto-detect / Original language",
    "bn": "Bangla",
    "en": "English",
    "hi": "Hindi",
    "ar": "Arabic",
    "ur": "Urdu",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "ja": "Japanese",
    "pt": "Portuguese",
    "ru": "Russian",
    "zh": "Chinese",
}

# Regional code mapping for MyMemory translation API
MYMEMORY_LOCALE_MAP: Dict[str, str] = {
    "bn": "bn-IN",
    "en": "en-US",
    "hi": "hi-IN",
    "ar": "ar-SA",
    "ur": "ur-PK",
    "es": "es-ES",
    "fr": "fr-FR",
    "de": "de-DE",
    "ja": "ja-JP",
    "pt": "pt-BR",
    "ru": "ru-RU",
    "zh": "zh-CN",
}


def get_language_display_name(code: str) -> str:
    """Returns human-readable name for a language code."""
    clean_code = code.lower().split("-")[0] if code else ""
    return LANGUAGE_NAMES.get(clean_code, code.capitalize())


class TranslationError(Exception):
    def __init__(self, message: str, code: str = "TRANSLATION_FAILED"):
        super().__init__(message)
        self.message = message
        self.code = code


class BaseTranslationProvider(abc.ABC):
    @abc.abstractmethod
    def name(self) -> str:
        pass

    @abc.abstractmethod
    async def translate_text(self, text: str, source_lang: str, target_lang: str) -> str:
        """Translates a single block of text."""
        pass

    @abc.abstractmethod
    async def translate_segments(
        self,
        segments: List[TranscriptSegment],
        source_lang: str,
        target_lang: str,
    ) -> List[TranscriptSegment]:
        """
        Translates a list of TranscriptSegments, preserving start times and durations.
        """
        pass

    @abc.abstractmethod
    def is_language_supported(self, target_lang: str) -> bool:
        pass


class MyMemoryTranslationProvider(BaseTranslationProvider):
    def name(self) -> str:
        return "mymemory"

    def is_language_supported(self, target_lang: str) -> bool:
        clean = target_lang.lower().split("-")[0]
        return clean in MYMEMORY_LOCALE_MAP

    async def translate_text(self, text: str, source_lang: str, target_lang: str) -> str:
        if not text or not text.strip():
            return ""

        from deep_translator import MyMemoryTranslator

        src_locale = MYMEMORY_LOCALE_MAP.get(source_lang.lower().split("-")[0], "en-US")
        tgt_locale = MYMEMORY_LOCALE_MAP.get(target_lang.lower().split("-")[0])
        if not tgt_locale:
            raise TranslationError(
                f"Target language '{target_lang}' is not supported by the MyMemory translation provider.",
                "UNSUPPORTED_LANGUAGE"
            )

        def _do_translate():
            translator = MyMemoryTranslator(source=src_locale, target=tgt_locale)
            return translator.translate(text)

        loop = asyncio.get_running_loop()
        try:
            return await loop.run_in_executor(None, _do_translate)
        except Exception as e:
            logger.warning(f"MyMemory translation failed: {e}")
            raise TranslationError(f"Translation failed: {str(e)}", "TRANSLATION_ERROR")

    async def translate_segments(
        self,
        segments: List[TranscriptSegment],
        source_lang: str,
        target_lang: str,
    ) -> List[TranscriptSegment]:
        if not segments:
            return []

        from deep_translator import MyMemoryTranslator

        src_locale = MYMEMORY_LOCALE_MAP.get(source_lang.lower().split("-")[0], "en-US")
        tgt_locale = MYMEMORY_LOCALE_MAP.get(target_lang.lower().split("-")[0])
        if not tgt_locale:
            raise TranslationError(
                f"Target language '{target_lang}' is not supported by translation provider.",
                "UNSUPPORTED_LANGUAGE"
            )

        translator = MyMemoryTranslator(source=src_locale, target=tgt_locale)
        translated_segments: List[TranscriptSegment] = []

        # Batch translation in groups of 15 joined by newline to minimize HTTP roundtrips
        batch_size = 15
        loop = asyncio.get_running_loop()

        for i in range(0, len(segments), batch_size):
            batch = segments[i : i + batch_size]
            joined_text = "\n".join(s.text.strip() or "..." for s in batch)

            def _translate_chunk(chunk_str, b_list):
                try:
                    res_str = translator.translate(chunk_str)
                    lines = [ln.strip() for ln in res_str.split("\n")]
                    if len(lines) == len(b_list):
                        return lines
                except Exception as e:
                    logger.debug(f"Chunk translation fallback: {e}")

                # Fallback: translate line-by-line for this batch
                fallback_lines = []
                for s in b_list:
                    if not s.text.strip():
                        fallback_lines.append("")
                        continue
                    try:
                        fallback_lines.append(translator.translate(s.text.strip()))
                    except Exception:
                        fallback_lines.append(s.text)
                return fallback_lines

            translated_texts = await loop.run_in_executor(None, _translate_chunk, joined_text, batch)

            for seg, trans_text in zip(batch, translated_texts):
                translated_segments.append(
                    TranscriptSegment(
                        text=trans_text.strip() or seg.text,
                        start=seg.start,
                        duration=seg.duration,
                    )
                )

        return translated_segments


class TranslationManager:
    """
    Modular manager orchestrating YouTube caption translation and provider fallbacks.
    """
    def __init__(self):
        self.providers: Dict[str, BaseTranslationProvider] = {
            "mymemory": MyMemoryTranslationProvider(),
        }

    async def translate_transcript(
        self,
        original_segments: List[TranscriptSegment],
        source_lang: str,
        target_lang: str,
        youtube_translated_raw: Optional[List[dict]] = None,
        paragraph_length: str = "medium",
    ) -> Tuple[List[TranscriptSegment], List[str], str, str]:
        """
        Translates transcript segments and generates formatted paragraphs and SRT.
        Returns: (translated_segments, translated_paragraphs, translated_srt, provider_used)
        """
        target_clean = target_lang.lower().strip()
        source_clean = source_lang.lower().strip().split("-")[0]

        # 1. Prefer existing YouTube translated caption track if available
        if youtube_translated_raw:
            cleaned_segs, paragraphs, srt_content, _, _ = format_transcript_paragraphs(
                youtube_translated_raw, paragraph_length=paragraph_length
            )
            return cleaned_segs, paragraphs, srt_content, "youtube_captions"

        # 2. Use configured translation provider
        provider = self.providers.get("mymemory")
        if not provider or not provider.is_language_supported(target_clean):
            raise TranslationError(
                f"Translation to '{get_language_display_name(target_clean)}' ({target_clean}) is currently not supported.",
                "UNSUPPORTED_LANGUAGE"
            )

        translated_segs = await provider.translate_segments(
            original_segments, source_clean, target_clean
        )

        # Convert translated segments to dictionaries for the paragraph formatter
        dict_segs = [
            {"text": s.text, "start": s.start, "duration": s.duration}
            for s in translated_segs
        ]
        aligned_segs, paragraphs, srt_content, _, _ = format_transcript_paragraphs(
            dict_segs, paragraph_length=paragraph_length
        )

        return aligned_segs, paragraphs, srt_content, provider.name()


translation_manager = TranslationManager()
