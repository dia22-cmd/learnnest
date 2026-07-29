import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.submission import (
    SubmissionResponse,
    SubmissionListResponse,
    SubmissionCreate,
)
from app.services import submission_service

router = APIRouter(prefix="/api/v1/submissions", tags=["submissions"])


@router.post(
    "/", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED
)
def submit_answer(data: SubmissionCreate, db: Session = Depends(get_db)):
    try:
        submission = submission_service.submit_answer(
            db=db,
            question_id=data.question_id,
            child_name=data.child_name,
            answer_given=data.answer_given,
        )
        return {"success": True, "data": submission}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while submitting: {str(e)}",
        )


@router.get("/{material_id}", response_model=SubmissionListResponse)
def get_submissions(
    material_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        submissions = submission_service.get_submissions_by_material(
            db=db, material_id=material_id, parent_id=current_user.id
        )
        return {"success": True, "data": submissions}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
