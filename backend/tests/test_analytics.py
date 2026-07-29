import uuid
from app.models.material import Material
from app.models.question import Question
from app.models.submission import Submission


def test_get_analytics_empty(client, auth_headers):
    """
    Verify that a parent with no submissions returns success with empty data.
    """
    response = client.get("/api/v1/analytics/overview", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["data"] == {}


def test_get_analytics_with_submissions(client, db, auth_headers, test_user):
    """
    Verify that child submissions are aggregated correctly by child name and worksheet.
    """
    # 1. Create a Material
    material = Material(
        id=uuid.uuid4(),
        parent_id=test_user.id,
        title="Math Class 1",
        file_url="https://res.cloudinary.com/dummy.pdf",
        raw_text="Sample text content for math problems.",
    )
    db.add(material)
    db.commit()

    # 2. Create Questions
    q1 = Question(
        id=uuid.uuid4(),
        material_id=material.id,
        question="What is 5 + 5?",
        type="mcq",
        options=["5", "10", "15", "20"],
        answer="10",
        is_selected=True,
    )
    q2 = Question(
        id=uuid.uuid4(),
        material_id=material.id,
        question="What is 3 * 3?",
        type="short_answer",
        answer="9",
        is_selected=True,
    )
    db.add(q1)
    db.add(q2)
    db.commit()

    # 3. Create Submissions for "Liam"
    sub1 = Submission(
        id=uuid.uuid4(),
        question_id=q1.id,
        child_name="Liam",
        answer_given="10",
        score=100,
        feedback="Great job!",
        suggestions="Keep going!",
    )
    sub2 = Submission(
        id=uuid.uuid4(),
        question_id=q2.id,
        child_name="Liam",
        answer_given="8",  # incorrect
        score=0,
        feedback="Not quite, it is 9.",
        suggestions="Review multiplication.",
    )
    db.add(sub1)
    db.add(sub2)
    db.commit()

    # 4. Fetch Analytics
    response = client.get("/api/v1/analytics/overview", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()["data"]

    # Verify "Liam" stats
    assert "Liam" in data
    liam_stats = data["Liam"]
    assert liam_stats["child_name"] == "Liam"
    assert liam_stats["average_score"] == 50.0  # (100 + 0) / 2
    assert liam_stats["total_worksheets"] == 1
    assert liam_stats["total_questions"] == 2

    # Verify history progression
    assert len(liam_stats["history"]) == 1
    attempt = liam_stats["history"][0]
    assert attempt["title"] == "Math Class 1"
    assert attempt["average_score"] == 50.0
    assert attempt["material_id"] == str(material.id)


def test_get_analytics_isolation(client, db, auth_headers, test_user):
    """
    Verify that parent A cannot see submissions belonging to parent B's materials.
    """
    # Create another parent user (Parent B)
    from app.services.auth_service import hash_password
    from app.models.user import User

    other_parent = User(
        id=uuid.uuid4(),
        email="parent_b@example.com",
        password_hash=hash_password("securepassword123"),
        full_name="Parent B",
    )
    db.add(other_parent)
    db.commit()

    # Create Parent B's material
    material_b = Material(
        id=uuid.uuid4(),
        parent_id=other_parent.id,
        title="Parent B Lesson",
        file_url="https://res.cloudinary.com/dummy.pdf",
        raw_text="Parent B lesson content.",
    )
    db.add(material_b)
    db.commit()

    # Create Parent B's question and submission for "Liam"
    q_b = Question(
        id=uuid.uuid4(),
        material_id=material_b.id,
        question="Parent B question?",
        type="short_answer",
        answer="Yes",
        is_selected=True,
    )
    db.add(q_b)
    db.commit()

    sub_b = Submission(
        id=uuid.uuid4(),
        question_id=q_b.id,
        child_name="Liam",
        answer_given="Yes",
        score=100,
    )
    db.add(sub_b)
    db.commit()

    # Fetch Parent A's analytics (should be empty, cannot see Parent B's child progress)
    response = client.get("/api/v1/analytics/overview", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["data"] == {}
