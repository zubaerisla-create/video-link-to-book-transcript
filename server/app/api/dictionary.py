import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from server.app.db.database import get_db
from server.app.db.models import User
from server.app.auth.security import get_current_user, get_current_user_optional
from server.app.schemas.dictionary import (
    DictionaryLookupResponse,
    SaveWordRequest,
    UpdateWordRequest,
    SavedWordResponse,
    SavedWordListResponse,
    ReviewWordResponse,
)
from server.app.services.dictionary_service import (
    DictionaryService,
    DictionaryError,
    WordNotFoundError,
    InvalidWordError,
)

logger = logging.getLogger("transcriptly.dictionary_api")
router = APIRouter(prefix="/dictionary", tags=["Dictionary & Vocabulary"])


@router.get(
    "/lookup",
    response_model=DictionaryLookupResponse,
    status_code=status.HTTP_200_OK,
    summary="Lookup English Word with Bangla Translation",
)
def lookup_word(
    word: str = Query(..., min_length=1, max_length=100, description="Word to lookup"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Looks up English word, providing Bangla meaning, English definition,
    phonetics, and example sentences.
    Checks whether the word is already saved in the user's dictionary if authenticated.
    """
    user_id = current_user.id if current_user else None
    try:
        return DictionaryService.lookup_word(db=db, raw_word=word, user_id=user_id)
    except InvalidWordError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"detail": e.message, "code": e.code},
        )
    except WordNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": e.message, "code": e.code},
        )
    except DictionaryError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"detail": e.message, "code": e.code},
        )
    except Exception as e:
        logger.error(f"Unexpected error looking up word '{word}': {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"detail": "An unexpected error occurred during dictionary lookup.", "code": "LOOKUP_FAILED"},
        )


@router.post(
    "/words",
    response_model=SavedWordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save Word to Personal Vocabulary",
)
def save_word(
    payload: SaveWordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Saves an English word and its Bangla translation to the authenticated user's dictionary.
    Guarantees user ownership and prevents duplicate entries idempotently.
    """
    try:
        saved_entry = DictionaryService.save_word(db=db, user_id=current_user.id, payload=payload)
        return saved_entry
    except InvalidWordError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"detail": e.message, "code": e.code},
        )
    except Exception as e:
        logger.error(f"Failed to save word for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"detail": "Failed to save word to dictionary.", "code": "SAVE_FAILED"},
        )


@router.get(
    "/words",
    response_model=SavedWordListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Authenticated User's Saved Words",
)
def list_saved_words(
    search: Optional[str] = Query(None, description="Search term for word, meaning, or notes"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by learning status (all, new, learning, learned)"),
    sort: Optional[str] = Query("newest", pattern="^(newest|oldest|alphabetical)$", description="Sort order"),
    book_id: Optional[str] = Query(None, description="Filter by source book ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns paginated saved words belonging exclusively to the authenticated user.
    Includes count aggregations for learning status tabs.
    """
    return DictionaryService.list_saved_words(
        db=db,
        user_id=current_user.id,
        search=search,
        status=status_filter,
        sort=sort,
        book_id=book_id,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/words/{word_id}",
    response_model=SavedWordResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Specific Saved Word",
)
def get_saved_word(
    word_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves a single saved word entry, strictly enforcing user ownership."""
    try:
        return DictionaryService.get_saved_word(db=db, user_id=current_user.id, word_id=word_id)
    except WordNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": e.message, "code": e.code},
        )


@router.patch(
    "/words/{word_id}",
    response_model=SavedWordResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Saved Word Learning Status or Notes",
)
def update_saved_word(
    word_id: str,
    payload: UpdateWordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Updates learning status, personal notes, or meaning for an owned word."""
    try:
        return DictionaryService.update_saved_word(
            db=db,
            user_id=current_user.id,
            word_id=word_id,
            payload=payload,
        )
    except WordNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": e.message, "code": e.code},
        )


@router.delete(
    "/words/{word_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Word from User's Dictionary",
)
def delete_saved_word(
    word_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Deletes a saved word entry, strictly verifying user ownership."""
    try:
        DictionaryService.delete_saved_word(db=db, user_id=current_user.id, word_id=word_id)
        return {"success": True, "message": "Word deleted from dictionary successfully.", "id": word_id}
    except WordNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": e.message, "code": e.code},
        )


@router.get(
    "/review",
    response_model=List[ReviewWordResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Randomized Words for Vocabulary Review",
)
def get_review_words(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter review words by status"),
    limit: int = Query(20, ge=1, le=50, description="Max cards to review"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns randomized vocabulary words for interactive flashcard review."""
    return DictionaryService.get_review_words(
        db=db,
        user_id=current_user.id,
        status=status_filter,
        limit=limit,
    )
