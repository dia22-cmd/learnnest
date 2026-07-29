import uuid
from sqlalchemy.orm import Session
from app.models.material import Material
from app.services.cloudinary_service import upload_pdf_to_cloudinary
from app.services.pdf_service import extract_text_from_pdf


def create_material(
    db: Session, parent_id: uuid.UUID, title: str, file_bytes: bytes, filename: str
) -> Material:
    """
    Creates a new Material.
    1. Uploads PDF to Cloudinary.
    2. Extracts raw text from PDF.
    3. Saves material record to database.
    """
    # 1. Extract text first to ensure PDF is valid and has content before uploading
    raw_text = extract_text_from_pdf(file_bytes)
    if not raw_text:
        raise ValueError(
            "Could not extract any text from the uploaded PDF. Please ensure it is a text-based PDF."
        )

    # 2. Upload to Cloudinary
    file_url = None
    try:
        # Avoid file collision by using a random unique prefix or uuid
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_url = upload_pdf_to_cloudinary(file_bytes, unique_filename)
    except Exception as e:
        # We fail if Cloudinary fails to store our reference file
        raise ValueError(f"Failed to upload material file: {str(e)}")

    # 3. Save to database
    db_material = Material(
        parent_id=parent_id, title=title, file_url=file_url, raw_text=raw_text
    )
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material


def get_materials_by_parent(db: Session, parent_id: uuid.UUID) -> list[Material]:
    """
    Retrieves all active materials owned by a specific parent.
    """
    return (
        db.query(Material)
        .filter(Material.parent_id == parent_id)
        .order_by(Material.created_at.desc())
        .all()
    )


def get_material_by_id(
    db: Session, material_id: uuid.UUID, parent_id: uuid.UUID
) -> Material | None:
    """
    Retrieves a material by ID, verifying it belongs to the parent.
    """
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        return None
    if material.parent_id != parent_id:
        raise PermissionError("Access to this material is denied.")
    return material
