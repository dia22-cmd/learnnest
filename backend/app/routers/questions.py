import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user, get_current_user_optional
from app.models.user import User
from app.schemas.question import (
    QuestionListResponse,
    QuestionGenerateInput,
    QuestionSelectInput,
    QuestionSelectResponse,
)
from app.services import question_service

router = APIRouter(prefix="/api/v1/questions", tags=["questions"])


@router.post(
    "/generate/{material_id}",
    response_model=QuestionListResponse,
    status_code=status.HTTP_201_CREATED,
)
def generate_questions(
    material_id: uuid.UUID,
    data: QuestionGenerateInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        questions = question_service.generate_questions(
            db=db,
            material_id=material_id,
            parent_id=current_user.id,
            count=data.count,
            child_id=data.child_id,
        )
        return {"success": True, "data": questions}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate questions: {str(e)}",
        )


@router.get("/{material_id}", response_model=QuestionListResponse)
def get_questions(
    material_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    try:
        parent_id = current_user.id if current_user else None
        questions = question_service.get_questions_by_material(
            db=db, material_id=material_id, parent_id=parent_id
        )
        return {"success": True, "data": questions}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.patch("/{question_id}/select", response_model=QuestionSelectResponse)
def select_question(
    question_id: uuid.UUID,
    data: QuestionSelectInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        question = question_service.select_question(
            db=db,
            question_id=question_id,
            parent_id=current_user.id,
            is_selected=data.is_selected,
        )
        return {
            "success": True,
            "data": {"id": question.id, "is_selected": question.is_selected},
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
