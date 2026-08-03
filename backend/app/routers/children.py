import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.child import Child
from app.models.assignment import MaterialAssignment
from app.models.material import Material
from app.schemas.child import (
    ChildCreate,
    ChildUpdate,
    ChildOut,
    AssignmentCreate,
    AssignmentOut,
)
from app.schemas.material import MaterialOut

router = APIRouter(prefix="/api/v1/children", tags=["children"])


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_profile(
    schema: ChildCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Creates a new child profile for the parent.
    """
    child = Child(
        parent_id=current_user.id,
        name=schema.name,
        difficulty_level=schema.difficulty_level,
    )
    db.add(child)
    db.commit()
    db.refresh(child)
    return {"success": True, "data": ChildOut.model_validate(child)}


@router.get("/", response_model=dict)
def list_profiles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lists all active child profiles for the parent.
    """
    profiles = (
        db.query(Child)
        .filter(Child.parent_id == current_user.id, Child.deleted_at.is_(None))
        .all()
    )
    return {"success": True, "data": [ChildOut.model_validate(p) for p in profiles]}


@router.put("/{child_id}", response_model=dict)
def update_profile(
    child_id: uuid.UUID,
    schema: ChildUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Updates child details (e.g. name, difficulty).
    """
    child = (
        db.query(Child).filter(Child.id == child_id, Child.deleted_at.is_(None)).first()
    )
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )

    # Authorization Check
    if child.parent_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this child's profile.",
        )

    if schema.name is not None:
        child.name = schema.name
    if schema.difficulty_level is not None:
        child.difficulty_level = schema.difficulty_level

    db.commit()
    db.refresh(child)
    return {"success": True, "data": ChildOut.model_validate(child)}


@router.delete("/{child_id}", response_model=dict)
def delete_profile(
    child_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Soft-deletes a child profile.
    """
    child = (
        db.query(Child).filter(Child.id == child_id, Child.deleted_at.is_(None)).first()
    )
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )

    # Authorization Check
    if child.parent_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this profile.",
        )

    child.deleted_at = datetime.utcnow()
    db.commit()
    return {"success": True, "message": "Profile successfully deleted"}


@router.post(
    "/{child_id}/assign", response_model=dict, status_code=status.HTTP_201_CREATED
)
def assign_material(
    child_id: uuid.UUID,
    schema: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Assigns a study material to a child profile.
    """
    child = (
        db.query(Child).filter(Child.id == child_id, Child.deleted_at.is_(None)).first()
    )
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )

    # Authorization checks
    if child.parent_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this child profile.",
        )

    material = db.query(Material).filter(Material.id == schema.material_id).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Material not found"
        )

    if material.parent_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this study material.",
        )

    # Check for duplicate assignment
    existing = (
        db.query(MaterialAssignment)
        .filter(
            MaterialAssignment.child_id == child_id,
            MaterialAssignment.material_id == schema.material_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This material is already assigned to the child.",
        )

    assignment = MaterialAssignment(child_id=child_id, material_id=schema.material_id)
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return {"success": True, "data": AssignmentOut.model_validate(assignment)}


@router.get("/{child_id}/assignments", response_model=dict)
def list_assignments(
    child_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lists all assigned materials for a child.
    """
    child = (
        db.query(Child).filter(Child.id == child_id, Child.deleted_at.is_(None)).first()
    )
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )

    if child.parent_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden.",
        )

    assignments = (
        db.query(MaterialAssignment)
        .filter(MaterialAssignment.child_id == child_id)
        .all()
    )
    materials = [
        db.query(Material).filter(Material.id == a.material_id).first()
        for a in assignments
    ]
    materials_out = [MaterialOut.model_validate(m) for m in materials if m]

    return {"success": True, "data": materials_out}


@router.get("/solve/{child_id}", response_model=dict)
def get_solver_assignments(child_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Public resolver link showing assigned materials for the child to solve.
    """
    child = (
        db.query(Child).filter(Child.id == child_id, Child.deleted_at.is_(None)).first()
    )
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Child profile not found"
        )

    assignments = (
        db.query(MaterialAssignment)
        .filter(MaterialAssignment.child_id == child_id)
        .all()
    )
    materials = [
        db.query(Material).filter(Material.id == a.material_id).first()
        for a in assignments
    ]
    materials_out = [MaterialOut.model_validate(m) for m in materials if m]

    return {
        "success": True,
        "data": {
            "child_name": child.name,
            "difficulty_level": child.difficulty_level,
            "materials": materials_out,
        },
    }


@router.delete("/{child_id}/assign/{material_id}", response_model=dict)
def unassign_material(
    child_id: uuid.UUID,
    material_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Unassigns a study material from a child profile.
    """
    child = (
        db.query(Child).filter(Child.id == child_id, Child.deleted_at.is_(None)).first()
    )
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )

    if child.parent_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this child profile.",
        )

    assignment = (
        db.query(MaterialAssignment)
        .filter(
            MaterialAssignment.child_id == child_id,
            MaterialAssignment.material_id == material_id,
        )
        .first()
    )
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found.",
        )

    db.delete(assignment)
    db.commit()
    return {"success": True, "message": "Material unassigned successfully."}
