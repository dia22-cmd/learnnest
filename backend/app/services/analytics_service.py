import uuid
from collections import defaultdict
from sqlalchemy.orm import Session
from app.models.submission import Submission
from app.models.question import Question
from app.models.material import Material


def get_parent_analytics(db: Session, parent_id: uuid.UUID) -> dict:
    """
    Fetch all submissions for materials owned by the parent.
    Calculate aggregate statistics and score history grouped by child name.
    Calculations are done purely on the backend to maintain a single source of truth.
    """
    # Fetch all submissions for materials belonging to this parent, ordered by submission date
    submissions = (
        db.query(Submission, Question.material_id, Material.title)
        .join(Question, Submission.question_id == Question.id)
        .join(Material, Question.material_id == Material.id)
        .filter(Material.parent_id == parent_id)
        .order_by(Submission.submitted_at.asc())
        .all()
    )

    # Group submissions by child name, and sub-group by material (worksheet)
    # Structure: child_name -> { (material_id, material_title) -> List[Submission] }
    child_data = defaultdict(lambda: defaultdict(list))
    for sub, mat_id, mat_title in submissions:
        # Ignore submissions that haven't been graded/scored yet
        if sub.score is not None:
            child_data[sub.child_name][(mat_id, mat_title)].append(sub)

    result = {}
    for child_name, mat_dict in child_data.items():
        history = []
        total_score_sum = 0
        total_questions_count = 0

        for (mat_id, mat_title), subs in mat_dict.items():
            scores = [s.score for s in subs]
            if not scores:
                continue

            # Worksheet average score
            mat_avg = sum(scores) / len(scores)
            # Latest submission timestamp for this worksheet
            latest_date = max(s.submitted_at for s in subs)

            history.append(
                {
                    "material_id": mat_id,
                    "title": mat_title,
                    "average_score": round(mat_avg, 2),
                    "submitted_at": latest_date,
                }
            )

            total_score_sum += sum(scores)
            total_questions_count += len(scores)

        # Sort history chronologically (ascending) for charting compatibility
        history.sort(key=lambda x: x["submitted_at"])

        # Overall average score across all questions
        overall_avg = (
            (total_score_sum / total_questions_count)
            if total_questions_count > 0
            else 0.0
        )

        result[child_name] = {
            "child_name": child_name,
            "average_score": round(overall_avg, 2),
            "total_worksheets": len(history),
            "total_questions": total_questions_count,
            "history": history,
        }

    return result
