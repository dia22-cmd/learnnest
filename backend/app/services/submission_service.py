import json
import uuid
from sqlalchemy.orm import Session
from app.models.question import Question
from app.models.submission import Submission
from app.models.material import Material
from app.services.ai_service import evaluate_child_answer


from app.models.child import Child
from app.models.assignment import MaterialAssignment


def submit_answer(
    db: Session,
    question_id: uuid.UUID,
    child_name: str,
    answer_given: str,
    child_id: uuid.UUID | None = None,
) -> Submission:
    """
    Saves a child's answer, calls Gemini to evaluate it, and updates the record.
    Also executes the adaptive difficulty logic if a worksheet is completed.
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

    # 3. Determine difficulty snapshot
    difficulty_level = "medium"
    if child_id is not None:
        child = (
            db.query(Child)
            .filter(Child.id == child_id, Child.deleted_at.is_(None))
            .first()
        )
        if child:
            difficulty_level = child.difficulty_level

    # 4. Create the base submission record
    submission = Submission(
        question_id=question_id,
        child_name=child_name,
        child_id=child_id,
        difficulty_level=difficulty_level,
        answer_given=answer_given,
        score=None,
        feedback=None,
        suggestions=None,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    # 5. Call AI evaluation
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
        submission.score = 0
        submission.feedback = "Sorry, we had a small hiccup grading this answer. Please ask your parent to check it!"
        submission.suggestions = "Try submitting again later."
        db.commit()
        db.refresh(submission)

    # 6. Symmetrical Adaptive Difficulty calculations
    if child_id is not None:
        try:
            check_and_update_adaptive_difficulty(
                db, child_id, question.material_id, difficulty_level
            )
        except Exception as ae:
            print(f"Adaptive difficulty update failed: {ae}")

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
                "child_id": sub.child_id,
                "difficulty_level": sub.difficulty_level,
                "answer_given": sub.answer_given,
                "score": sub.score,
                "feedback": sub.feedback,
                "suggestions": sub.suggestions,
                "submitted_at": sub.submitted_at,
            }
        )

    return submissions_list


def check_and_update_adaptive_difficulty(
    db: Session, child_id: uuid.UUID, current_material_id: uuid.UUID, current_level: str
) -> None:
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        return

    # Count assigned questions
    total_questions = (
        db.query(Question)
        .filter(
            Question.material_id == current_material_id, Question.is_selected.is_(True)
        )
        .count()
    )
    if total_questions == 0:
        return

    # Count completed submissions for this material
    completed_subs = (
        db.query(Submission)
        .join(Question)
        .filter(
            Submission.child_id == child_id, Question.material_id == current_material_id
        )
        .all()
    )
    if len(completed_subs) < total_questions:
        return  # Not fully completed yet

    # Calculate current quiz score
    current_quiz_score = sum(
        s.score for s in completed_subs if s.score is not None
    ) / len(completed_subs)

    # Get previous quiz score at the same difficulty level
    prev_quiz_score = get_previous_completed_quiz_score(
        db, child_id, current_material_id, current_level
    )
    if prev_quiz_score is None:
        return  # Need at least two quizzes at the current level

    # Upgrade triggers
    if current_quiz_score >= 85 and prev_quiz_score >= 85:
        if current_level == "easy":
            child.difficulty_level = "medium"
        elif current_level == "medium":
            child.difficulty_level = "hard"
        db.commit()

    # Downgrade triggers
    elif current_quiz_score < 60 and prev_quiz_score < 60:
        if current_level == "hard":
            child.difficulty_level = "medium"
        elif current_level == "medium":
            child.difficulty_level = "easy"
        db.commit()


def get_previous_completed_quiz_score(
    db: Session,
    child_id: uuid.UUID,
    current_material_id: uuid.UUID,
    difficulty_level: str,
) -> float | None:
    assignments = (
        db.query(MaterialAssignment)
        .filter(MaterialAssignment.child_id == child_id)
        .all()
    )

    completed_quizzes = []
    for assign in assignments:
        if assign.material_id == current_material_id:
            continue
        q_count = (
            db.query(Question)
            .filter(
                Question.material_id == assign.material_id,
                Question.is_selected.is_(True),
            )
            .count()
        )
        if q_count == 0:
            continue
        subs = (
            db.query(Submission)
            .join(Question)
            .filter(
                Submission.child_id == child_id,
                Question.material_id == assign.material_id,
            )
            .all()
        )
        if len(subs) == q_count:
            # Check difficulty level snapshot
            subs.sort(key=lambda s: s.submitted_at, reverse=True)
            if subs[0].difficulty_level == difficulty_level:
                quiz_avg = sum(s.score for s in subs if s.score is not None) / len(subs)
                completed_quizzes.append((subs[0].submitted_at, quiz_avg))

    if not completed_quizzes:
        return None
    completed_quizzes.sort(key=lambda x: x[0], reverse=True)
    return completed_quizzes[0][1]
