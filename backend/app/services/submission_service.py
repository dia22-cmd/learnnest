import json
import uuid
from sqlalchemy.orm import Session
from app.models.question import Question
from app.models.submission import Submission
from app.models.material import Material
from app.services.ai_service import evaluate_child_answer


def submit_answer(
    db: Session, question_id: uuid.UUID, child_name: str, answer_given: str
) -> Submission:
    """
    Saves a child's answer, calls Gemini to evaluate it, and updates the record.
    """
    # 1. Verify question exists and is selected/assigned
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise ValueError("Question not found.")
    if not question.is_selected:
        raise ValueError("This question has not been assigned by the parent.")

    # 2. Validate input keys shape
    if question.type == "fill_blank":
        try:
            correct_dict = json.loads(question.answer)
            given_dict = json.loads(answer_given) if answer_given else {}
            # Verify that all expected keys exist in the submission
            if not isinstance(given_dict, dict) or not all(
                k in given_dict for k in correct_dict.keys()
            ):
                raise ValueError(
                    "Some blanks are missing answers. Please fill in all the blank boxes!"
                )
        except json.JSONDecodeError:
            raise ValueError(
                "Invalid format. Please make sure all blank boxes are filled!"
            )

    elif question.type == "match_following":
        try:
            left_items = question.options.get("left", []) if question.options else []
            left_ids = {item["id"] for item in left_items}
            given_dict = json.loads(answer_given) if answer_given else {}
            if not isinstance(given_dict, dict):
                raise ValueError("Invalid matching answer shape.")
            # Verify that all keys in given_dict correspond to left_ids
            if not all(k in left_ids for k in given_dict.keys()):
                raise ValueError(
                    "Oops! Some of the matched items are incorrect. Please reset the match column and try again!"
                )
        except Exception as e:
            if isinstance(e, ValueError):
                raise e
            raise ValueError(
                "Matching answer format is incorrect. Please refresh and try again!"
            )

    # 3. Create the base submission record
    submission = Submission(
        question_id=question_id,
        child_name=child_name,
        answer_given=answer_given,
        score=None,
        feedback=None,
        suggestions=None,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    # 4. Call AI evaluation
    try:
        eval_result = evaluate_child_answer(
            question_text=question.question,
            correct_answer=question.answer,
            child_name=child_name,
            answer_given=answer_given,
            question_type=question.type,
        )
        submission.score = eval_result["score"]
        submission.feedback = eval_result["feedback"]
        submission.suggestions = eval_result["suggestions"]
        db.commit()
        db.refresh(submission)
    except Exception as e:
        print(f"AI Evaluation failed for submission {submission.id}: {e}")
        # We still save the submission so the parent knows they submitted,
        # but we set generic feedback to avoid crashing the submit flow
        submission.score = 0
        submission.feedback = "Sorry, we had a small hiccup grading this answer. Please ask your parent to check it!"
        submission.suggestions = "Try submitting again later."
        db.commit()
        db.refresh(submission)

    return submission


def get_submissions_by_material(
    db: Session, material_id: uuid.UUID, parent_id: uuid.UUID
) -> list[dict]:
    """
    Retrieves all student submissions for a material, including the question text.
    Only available to the parent owner.
    """
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise ValueError("Material not found.")
    if material.parent_id != parent_id:
        raise PermissionError("Access denied.")

    # Join Submission and Question to retrieve the question text alongside submission data
    results = (
        db.query(Submission, Question.question)
        .join(Question, Submission.question_id == Question.id)
        .filter(Question.material_id == material_id)
        .order_by(Submission.submitted_at.desc())
        .all()
    )

    submissions_list = []
    for sub, q_text in results:
        submissions_list.append(
            {
                "id": sub.id,
                "question_id": sub.question_id,
                "question": q_text,
                "child_name": sub.child_name,
                "answer_given": sub.answer_given,
                "score": sub.score,
                "feedback": sub.feedback,
                "suggestions": sub.suggestions,
                "submitted_at": sub.submitted_at,
            }
        )

    return submissions_list
