import re
import string
import logging
import asyncio
from typing import Optional, List, Dict, Tuple
import requests
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from server.app.db.models import DictionaryCache, UserSavedWord, get_utc_now
from server.app.schemas.dictionary import (
    DictionaryLookupResponse,
    SaveWordRequest,
    UpdateWordRequest,
    SavedWordResponse,
    WordStatusCounts,
    SavedWordListResponse,
    ReviewWordResponse,
)
from server.app.services.curated_vocabulary import CURATED_VOCABULARY

logger = logging.getLogger("transcriptly.dictionary")

# Arpabet to International Phonetic Alphabet (IPA) conversion table
ARPABET_TO_IPA = {
    "AA": "ɑ", "AE": "æ", "AH": "ʌ", "AO": "ɔ", "AW": "aʊ", "AY": "aɪ",
    "B": "b", "CH": "tʃ", "D": "d", "DH": "ð", "EH": "ɛ", "ER": "ɜr", "EY": "eɪ",
    "F": "f", "G": "ɡ", "HH": "h", "IH": "ɪ", "IY": "i", "JH": "dʒ",
    "K": "k", "L": "l", "M": "m", "N": "n", "NG": "ŋ", "OW": "oʊ", "OY": "ɔɪ",
    "P": "p", "R": "r", "S": "s", "SH": "ʃ", "T": "t", "TH": "θ",
    "UH": "ʊ", "UW": "u", "V": "v", "W": "w", "Y": "j", "Z": "z", "ZH": "ʒ",
}

PUNCTUATION_CHARS = string.punctuation + "“”‘’«»„…—–¿¡·"


class DictionaryError(Exception):
    def __init__(self, message: str, code: str = "DICTIONARY_ERROR"):
        super().__init__(message)
        self.message = message
        self.code = code


class WordNotFoundError(DictionaryError):
    def __init__(self, message: str = "Translation or definition not found for this word."):
        super().__init__(message, "WORD_NOT_FOUND")


class InvalidWordError(DictionaryError):
    def __init__(self, message: str = "Invalid word format or selection length."):
        super().__init__(message, "INVALID_WORD")


def clean_display_word(raw: str) -> str:
    """Strips outer punctuation and quotes, preserving internal hyphens/apostrophes and case."""
    if not raw:
        return ""
    text = raw.strip()
    # Normalize curly apostrophes to ASCII
    text = text.replace("’", "'").replace("‘", "'")
    # Strip leading and trailing punctuation
    return text.strip(PUNCTUATION_CHARS)


def normalize_word(raw: str) -> str:
    """Normalizes a word for duplicate detection, caching, and searching."""
    cleaned = clean_display_word(raw)
    return cleaned.lower()


def validate_word(raw: str) -> Tuple[str, str]:
    """
    Validates selection:
    - Must be a single word (with optional internal hyphen or apostrophe)
    - Length between 1 and 50 characters
    - Must contain at least one alphabetic character
    """
    if not raw or not raw.strip():
        raise InvalidWordError("Word selection cannot be empty.")
    
    # Ignore excessively long phrases or multi-line selections
    if "\n" in raw or len(raw) > 100:
        raise InvalidWordError("Selected text is too long for a single word lookup.")
    
    display = clean_display_word(raw)
    norm = normalize_word(raw)

    if not display or len(display) > 50:
        raise InvalidWordError("Word must be between 1 and 50 characters.")

    # Reject if it contains whitespace (multi-word selections)
    if any(ch.isspace() for ch in display):
        raise InvalidWordError("Please select only a single word at a time.")

    # Must contain at least one letter
    if not any(ch.isalpha() for ch in norm):
        raise InvalidWordError("Selection must contain alphabetic characters.")

    return display, norm


def arpabet_to_ipa(arpabet_str: str) -> str:
    """Converts CMU Arpabet notation to IPA format."""
    tokens = arpabet_str.strip().split()
    ipa_tokens = []
    for tok in tokens:
        stress = ""
        clean_tok = tok
        if tok[-1] in "012":
            stress = tok[-1]
            clean_tok = tok[:-1]
        ipa_char = ARPABET_TO_IPA.get(clean_tok.upper(), clean_tok.lower())
        if stress == "1":
            ipa_tokens.append("ˈ" + ipa_char)
        elif stress == "2":
            ipa_tokens.append("ˌ" + ipa_char)
        else:
            ipa_tokens.append(ipa_char)
    ipa_body = "".join(ipa_tokens)
    return f"/{ipa_body}/" if ipa_body else ""


def query_datamuse_and_wiktionary(word: str) -> Dict[str, Optional[str]]:
    """
    Fetches English definition, part of speech, phonetics, and example sentences.
    Uses free Datamuse API and Wiktionary REST API.
    """
    result: Dict[str, Optional[str]] = {
        "english_definition": None,
        "pronunciation": None,
        "part_of_speech": None,
        "example_sentence": None,
    }

    # 1. Datamuse API (fast, reliable dictionary metadata)
    try:
        resp = requests.get(
            f"https://api.datamuse.com/words?sp={word}&md=drp&max=1",
            timeout=3.5,
            headers={"User-Agent": "Transcriptly/1.0 (https://habd.tech)"},
        )
        if resp.status_code == 200:
            data = resp.json()
            if data and isinstance(data, list):
                item = data[0]
                defs = item.get("defs", [])
                if defs:
                    first_def = defs[0]
                    parts = first_def.split("\t", 1)
                    if len(parts) == 2:
                        pos_map = {"n": "noun", "v": "verb", "adj": "adjective", "adv": "adverb"}
                        result["part_of_speech"] = pos_map.get(parts[0], parts[0])
                        result["english_definition"] = parts[1].strip()
                    else:
                        result["english_definition"] = first_def.strip()

                tags = item.get("tags", [])
                for t in tags:
                    if t.startswith("pron:"):
                        raw_pron = t.replace("pron:", "").strip()
                        result["pronunciation"] = arpabet_to_ipa(raw_pron)
                        break
    except Exception as e:
        logger.debug(f"Datamuse query exception for '{word}': {e}")

    # 2. Wiktionary API for example sentence or definition fallback
    try:
        wikt_resp = requests.get(
            f"https://en.wiktionary.org/api/rest_v1/page/definition/{word}",
            timeout=3.0,
            headers={"User-Agent": "Transcriptly/1.0 (https://habd.tech)"},
        )
        if wikt_resp.status_code == 200:
            w_data = wikt_resp.json()
            en_sections = w_data.get("en", [])
            for section in en_sections:
                if not result["part_of_speech"] and section.get("partOfSpeech"):
                    result["part_of_speech"] = section.get("partOfSpeech", "").lower()
                
                defs = section.get("definitions", [])
                for d in defs:
                    # Fallback English definition
                    if not result["english_definition"] and d.get("definition"):
                        clean_d = re.sub(r"<[^<]+?>", "", d.get("definition", "")).strip()
                        if clean_d:
                            result["english_definition"] = clean_d

                    # Extract example sentence
                    examples = d.get("examples", [])
                    if examples and not result["example_sentence"]:
                        clean_ex = re.sub(r"<[^<]+?>", "", examples[0]).strip()
                        if clean_ex and len(clean_ex) > 5:
                            result["example_sentence"] = clean_ex
                            break
                if result["example_sentence"]:
                    break
    except Exception as e:
        logger.debug(f"Wiktionary query exception for '{word}': {e}")

    return result


def fetch_live_translation(word: str) -> Optional[str]:
    """Translates word to Bangla using MyMemory provider."""
    from deep_translator import MyMemoryTranslator
    try:
        translator = MyMemoryTranslator(source="en-US", target="bn-IN")
        translated = translator.translate(word)
        if translated and translated.strip() and translated.strip().lower() != word.lower():
            return translated.strip()
    except Exception as e:
        logger.warning(f"MyMemory translation failed for '{word}': {e}")
    return None


class DictionaryService:
    @staticmethod
    def lookup_word(
        db: Session,
        raw_word: str,
        user_id: Optional[str] = None,
    ) -> DictionaryLookupResponse:
        display_word, norm_word = validate_word(raw_word)

        # 1. Check if user already saved this word
        is_saved = False
        saved_id = None
        if user_id:
            user_saved = (
                db.query(UserSavedWord)
                .filter(
                    UserSavedWord.user_id == user_id,
                    UserSavedWord.normalized_word == norm_word,
                )
                .first()
            )
            if user_saved:
                is_saved = True
                saved_id = user_saved.id

        # 2. Check Database Cache
        cached_entry = (
            db.query(DictionaryCache)
            .filter(DictionaryCache.normalized_word == norm_word)
            .first()
        )
        if cached_entry:
            return DictionaryLookupResponse(
                word=display_word,
                normalized_word=norm_word,
                bangla_meaning=cached_entry.bangla_meaning,
                english_definition=cached_entry.english_definition,
                pronunciation=cached_entry.pronunciation,
                example_sentence=cached_entry.example_sentence,
                part_of_speech=cached_entry.part_of_speech,
                is_saved=is_saved,
                saved_id=saved_id,
                source="cache",
            )

        # 3. Check Curated High-Frequency Vocabulary Dataset
        if norm_word in CURATED_VOCABULARY:
            data = CURATED_VOCABULARY[norm_word]
            try:
                new_cache = DictionaryCache(
                    word=display_word,
                    normalized_word=norm_word,
                    bangla_meaning=data["bangla_meaning"],
                    english_definition=data.get("english_definition"),
                    pronunciation=data.get("pronunciation"),
                    example_sentence=data.get("example_sentence"),
                    part_of_speech=data.get("part_of_speech"),
                    provider="curated_dataset",
                )
                db.add(new_cache)
                db.commit()
            except Exception as e:
                db.rollback()
                logger.warning(f"Failed to persist curated word to cache: {e}")

            return DictionaryLookupResponse(
                word=display_word,
                normalized_word=norm_word,
                bangla_meaning=data["bangla_meaning"],
                english_definition=data.get("english_definition"),
                pronunciation=data.get("pronunciation"),
                example_sentence=data.get("example_sentence"),
                part_of_speech=data.get("part_of_speech"),
                is_saved=is_saved,
                saved_id=saved_id,
                source="dataset",
            )

        # 4. Dynamic Provider Lookup
        bangla_meaning = fetch_live_translation(display_word)
        if not bangla_meaning and norm_word != display_word:
            bangla_meaning = fetch_live_translation(norm_word)

        if not bangla_meaning:
            raise WordNotFoundError(
                f"Bangla translation is currently unavailable for '{display_word}'. Please try another word."
            )

        # Fetch English definition, pronunciation, and examples
        metadata = query_datamuse_and_wiktionary(norm_word)

        # Save to DB cache so subsequent lookups are 0ms
        try:
            new_cache = DictionaryCache(
                word=display_word,
                normalized_word=norm_word,
                bangla_meaning=bangla_meaning,
                english_definition=metadata.get("english_definition"),
                pronunciation=metadata.get("pronunciation"),
                example_sentence=metadata.get("example_sentence"),
                part_of_speech=metadata.get("part_of_speech"),
                provider="mymemory+datamuse",
            )
            db.add(new_cache)
            db.commit()
        except Exception as e:
            db.rollback()
            logger.warning(f"Failed to persist dynamic lookup to cache: {e}")

        return DictionaryLookupResponse(
            word=display_word,
            normalized_word=norm_word,
            bangla_meaning=bangla_meaning,
            english_definition=metadata.get("english_definition"),
            pronunciation=metadata.get("pronunciation"),
            example_sentence=metadata.get("example_sentence"),
            part_of_speech=metadata.get("part_of_speech"),
            is_saved=is_saved,
            saved_id=saved_id,
            source="provider",
        )

    @staticmethod
    def save_word(
        db: Session,
        user_id: str,
        payload: SaveWordRequest,
    ) -> UserSavedWord:
        display_word, norm_word = validate_word(payload.original_word)

        # Check for existing entry (Idempotent saving)
        existing = (
            db.query(UserSavedWord)
            .filter(
                UserSavedWord.user_id == user_id,
                UserSavedWord.normalized_word == norm_word,
            )
            .first()
        )

        if existing:
            # Update optional fields if provided
            if payload.notes:
                existing.notes = payload.notes
            if payload.learning_status:
                existing.learning_status = payload.learning_status
            if payload.source_book_id and not existing.source_book_id:
                existing.source_book_id = payload.source_book_id
                existing.source_book_title = payload.source_book_title
            if payload.example_sentence and not existing.example_sentence:
                existing.example_sentence = payload.example_sentence
            existing.updated_at = get_utc_now()
            db.commit()
            db.refresh(existing)
            return existing

        # Create new saved word entry
        new_word = UserSavedWord(
            user_id=user_id,
            original_word=display_word,
            normalized_word=norm_word,
            bangla_meaning=payload.bangla_meaning.strip(),
            english_definition=payload.english_definition.strip() if payload.english_definition else None,
            pronunciation=payload.pronunciation.strip() if payload.pronunciation else None,
            example_sentence=payload.example_sentence.strip() if payload.example_sentence else None,
            part_of_speech=payload.part_of_speech.strip() if payload.part_of_speech else None,
            source_book_id=payload.source_book_id,
            source_book_title=payload.source_book_title,
            notes=payload.notes.strip() if payload.notes else None,
            learning_status=payload.learning_status or "learning",
        )
        db.add(new_word)
        db.commit()
        db.refresh(new_word)
        return new_word

    @staticmethod
    def list_saved_words(
        db: Session,
        user_id: str,
        search: Optional[str] = None,
        status: Optional[str] = None,
        sort: Optional[str] = "newest",
        book_id: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> SavedWordListResponse:
        page = max(1, page)
        page_size = max(1, min(100, page_size))

        base_query = db.query(UserSavedWord).filter(UserSavedWord.user_id == user_id)

        # Compute status counts for the user
        all_user_words = db.query(UserSavedWord.learning_status).filter(UserSavedWord.user_id == user_id).all()
        counts_dict = {"total": len(all_user_words), "new": 0, "learning": 0, "learned": 0}
        for (st,) in all_user_words:
            if st in counts_dict:
                counts_dict[st] += 1
            else:
                counts_dict["learning"] += 1

        # Search filter
        if search and search.strip():
            term = f"%{search.strip().lower()}%"
            base_query = base_query.filter(
                or_(
                    UserSavedWord.original_word.ilike(term),
                    UserSavedWord.normalized_word.ilike(term),
                    UserSavedWord.bangla_meaning.ilike(term),
                    UserSavedWord.notes.ilike(term),
                )
            )

        # Status filter
        if status and status.lower() != "all" and status in ("new", "learning", "learned"):
            base_query = base_query.filter(UserSavedWord.learning_status == status)

        # Book ID filter
        if book_id and book_id.strip():
            base_query = base_query.filter(UserSavedWord.source_book_id == book_id.strip())

        # Total matching
        total = base_query.count()

        # Sorting
        if sort == "oldest":
            base_query = base_query.order_by(asc(UserSavedWord.created_at))
        elif sort == "alphabetical":
            base_query = base_query.order_by(asc(UserSavedWord.normalized_word))
        else:  # "newest"
            base_query = base_query.order_by(desc(UserSavedWord.created_at))

        items = base_query.offset((page - 1) * page_size).limit(page_size).all()
        total_pages = max(1, (total + page_size - 1) // page_size) if total > 0 else 1

        return SavedWordListResponse(
            items=[SavedWordResponse.model_validate(it) for it in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            counts=WordStatusCounts(**counts_dict),
        )

    @staticmethod
    def get_saved_word(db: Session, user_id: str, word_id: str) -> UserSavedWord:
        word = (
            db.query(UserSavedWord)
            .filter(
                UserSavedWord.id == word_id,
                UserSavedWord.user_id == user_id,
            )
            .first()
        )
        if not word:
            raise WordNotFoundError("Saved word not found.")
        return word

    @staticmethod
    def update_saved_word(
        db: Session,
        user_id: str,
        word_id: str,
        payload: UpdateWordRequest,
    ) -> UserSavedWord:
        word = (
            db.query(UserSavedWord)
            .filter(
                UserSavedWord.id == word_id,
                UserSavedWord.user_id == user_id,
            )
            .first()
        )
        if not word:
            raise WordNotFoundError("Saved word not found.")

        if payload.notes is not None:
            word.notes = payload.notes.strip() if payload.notes else None
        if payload.learning_status is not None:
            if payload.learning_status in ("new", "learning", "learned"):
                word.learning_status = payload.learning_status
        if payload.bangla_meaning is not None and payload.bangla_meaning.strip():
            word.bangla_meaning = payload.bangla_meaning.strip()
        if payload.english_definition is not None:
            word.english_definition = payload.english_definition.strip() if payload.english_definition else None
        if payload.example_sentence is not None:
            word.example_sentence = payload.example_sentence.strip() if payload.example_sentence else None

        word.updated_at = get_utc_now()
        db.commit()
        db.refresh(word)
        return word

    @staticmethod
    def delete_saved_word(db: Session, user_id: str, word_id: str) -> bool:
        word = (
            db.query(UserSavedWord)
            .filter(
                UserSavedWord.id == word_id,
                UserSavedWord.user_id == user_id,
            )
            .first()
        )
        if not word:
            raise WordNotFoundError("Saved word not found.")

        db.delete(word)
        db.commit()
        return True

    @staticmethod
    def get_review_words(
        db: Session,
        user_id: str,
        status: Optional[str] = None,
        limit: int = 20,
    ) -> List[ReviewWordResponse]:
        import random
        limit = max(1, min(50, limit))
        query = db.query(UserSavedWord).filter(UserSavedWord.user_id == user_id)

        if status and status != "all" and status in ("new", "learning", "learned"):
            query = query.filter(UserSavedWord.learning_status == status)

        words = query.all()
        # Randomize for review flashcards
        random.shuffle(words)
        selected = words[:limit]

        return [
            ReviewWordResponse(
                id=w.id,
                original_word=w.original_word,
                bangla_meaning=w.bangla_meaning,
                english_definition=w.english_definition,
                pronunciation=w.pronunciation,
                example_sentence=w.example_sentence,
                learning_status=w.learning_status,
                notes=w.notes,
            )
            for w in selected
        ]
