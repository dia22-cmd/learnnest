import uuid
from sqlalchemy.orm import Session
from app.models.material import Material
from app.models.question import Question
from app.services.ai_service import generate_questions_from_text


def generate_questions(
    db: Session, material_id: uuid.UUID, parent_id: uuid.UUID, count: int = 5
) -> list[Question]:
    """
    Retrieves the material, calls Gemini to generate questions, and saves them to the DB.
    """
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise ValueError("Material not found.")
    if material.parent_id != parent_id:
        raise PermissionError("Access denied.")

    if not material.raw_text:
        raise ValueError("Material has no extractable text.")

    # Call AI service
    ai_questions = generate_questions_from_text(material.raw_text, count=count)

    db_questions = []
    for q in ai_questions:
        db_q = Question(
            material_id=material.id,
            type=q["type"],
            question=q["question"],
            options=q["options"],
            answer=q["answer"],
            is_selected=False,  # Parent must select manually to assign
        )
        db.add(db_q)
        db_questions.append(db_q)

    db.commit()
    for db_q in db_questions:
        db.refresh(db_q)

    return db_questions


def get_questions_by_material(
    db: Session, material_id: uuid.UUID, parent_id: uuid.UUID | None = None
) -> list[Question]:
    """
    Retrieves questions.
    - If parent_id is specified: verifies ownership and returns ALL generated questions.
    - If parent_id is None: public/child check, returns ONLY selected (assigned) questions.
    """
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise ValueError("Material not found.")

    if parent_id is not None:
        if material.parent_id != parent_id:
            raise PermissionError("Access denied.")
        return (
            db.query(Question)
            .filter(Question.material_id == material_id)
            .order_by(Question.created_at.asc())
            .all()
        )
    else:
        # Public solver access — only return assigned questions
        return (
            db.query(Question)
            .filter(Question.material_id == material_id, Question.is_selected.is_(True))
            .order_by(Question.created_at.asc())
            .all()
        )


def select_question(
    db: Session, question_id: uuid.UUID, parent_id: uuid.UUID, is_selected: bool
) -> Question:
    """
    Toggles a question's is_selected state. Verifies parent ownership.
    """
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise ValueError("Question not found.")

    # Check ownership through material
    material = db.query(Material).filter(Material.id == question.material_id).first()
    if not material or material.parent_id != parent_id:
        raise PermissionError("Access denied.")

    question.is_selected = is_selected
    db.commit()
    db.refresh(question)
    return question
