import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.material import MaterialResponse, MaterialDetailResponse, MaterialListResponse
from app.services import material_service

router = APIRouter(prefix="/api/v1/materials", tags=["materials"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/upload", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
async def upload_material(
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Validation checks
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are accepted."
        )

    # Read bytes and check size
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size must be under 10MB."
        )

    try:
        material = material_service.create_material(
            db=db,
            parent_id=current_user.id,
            title=title,
            file_bytes=file_bytes,
            filename=file.filename
        )
        return {"success": True, "data": material}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while uploading: {str(e)}"
        )


@router.get("/", response_model=MaterialListResponse)
def get_materials(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    materials = material_service.get_materials_by_parent(db, current_user.id)
    return {"success": True, "data": materials}


@router.get("/{material_id}", response_model=MaterialDetailResponse)
def get_material_detail(
    material_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        material = material_service.get_material_by_id(db, material_id, current_user.id)
        if not material:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Material not found."
            )
        return {"success": True, "data": material}
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
