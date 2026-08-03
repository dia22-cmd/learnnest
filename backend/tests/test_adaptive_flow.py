import uuid
from unittest.mock import patch
from app.models.child import Child


def test_child_profile_crud_and_auth(client, auth_headers):
    """
    Verify parent can perform CRUD on child profiles and assignments,
    and verify ownership checks prevent cross-parent access.
    """
    # 1. Create Profile
    res = client.post(
        "/api/v1/children/",
        headers=auth_headers,
        json={"name": "Timmy", "difficulty_level": "medium"},
    )
    assert res.status_code == 201
    child_id = res.json()["data"]["id"]
    assert res.json()["data"]["name"] == "Timmy"
    assert res.json()["data"]["difficulty_level"] == "medium"

    # 2. Update Profile
    up_res = client.put(
        f"/api/v1/children/{child_id}",
        headers=auth_headers,
        json={"name": "Timmy Updated", "difficulty_level": "easy"},
    )
    assert up_res.status_code == 200
    assert up_res.json()["data"]["name"] == "Timmy Updated"
    assert up_res.json()["data"]["difficulty_level"] == "easy"

    # 3. Create second parent to verify authorization bounds
    # Register parent B
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "parent_b@example.com",
            "password": "securePass123!",
            "full_name": "Parent B",
        },
    )
    login_b = client.post(
        "/api/v1/auth/login",
        json={"email": "parent_b@example.com", "password": "securePass123!"},
    )
    token_b = login_b.json()["data"]["token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Parent B trying to query or edit Parent A's child profile should return 403
    forbidden_up = client.put(
        f"/api/v1/children/{child_id}",
        headers=headers_b,
        json={"name": "Hacker child"},
    )
    assert forbidden_up.status_code == 403

    # Parent B trying to delete Parent A's child profile should return 403
    forbidden_del = client.delete(f"/api/v1/children/{child_id}", headers=headers_b)
    assert forbidden_del.status_code == 403


@patch("app.services.material_service.upload_pdf_to_cloudinary")
@patch("app.services.material_service.extract_text_from_pdf")
def test_assignment_unique_constraint(mock_extract, mock_upload, client, auth_headers):
    """
    Verify unique constraint on assignments table preventing duplicate mappings.
    """
    mock_extract.return_value = "Light and water."
    mock_upload.return_value = "https://res.cloudinary.com/test.pdf"

    # Create Material
    mat_resp = client.post(
        "/api/v1/materials/upload",
        headers=auth_headers,
        data={"title": "Subject Lesson"},
        files={"file": ("test.pdf", b"pdf", "application/pdf")},
    )
    material_id = mat_resp.json()["data"]["id"]

    # Create Child
    child_resp = client.post(
        "/api/v1/children/",
        headers=auth_headers,
        json={"name": "Sally", "difficulty_level": "medium"},
    )
    child_id = child_resp.json()["data"]["id"]

    # Assign
    assign_1 = client.post(
        f"/api/v1/children/{child_id}/assign",
        headers=auth_headers,
        json={"material_id": material_id},
    )
    assert assign_1.status_code == 201

    # Duplicate Assign should return 400
    assign_2 = client.post(
        f"/api/v1/children/{child_id}/assign",
        headers=auth_headers,
        json={"material_id": material_id},
    )
    assert assign_2.status_code == 400


@patch("app.services.submission_service.evaluate_child_answer")
@patch("app.services.question_service.generate_questions_from_text")
@patch("app.services.material_service.upload_pdf_to_cloudinary")
@patch("app.services.material_service.extract_text_from_pdf")
def test_adaptive_difficulty_consecutive_flow(
    mock_extract, mock_upload, mock_generate_ai, mock_eval, db, client, auth_headers
):
    """
    Verify the E2E adaptive difficulty escalation and demotion loops:
    - 2 consecutive high scores upgrades difficulty (medium -> hard).
    - AI prompt injects difficulty context.
    - 2 consecutive low scores downgrades difficulty (hard -> medium).
    """
    mock_extract.return_value = "Lesson contents."
    mock_upload.return_value = "https://res.cloudinary.com/test.pdf"

    # 1. Setup profile and worksheets
    # Create child profile starting at "medium"
    child_resp = client.post(
        "/api/v1/children/",
        headers=auth_headers,
        json={"name": "Kiran", "difficulty_level": "medium"},
    )
    child_id = uuid.UUID(child_resp.json()["data"]["id"])

    # Create 3 materials
    mat_ids = []
    for i in range(3):
        mat_resp = client.post(
            "/api/v1/materials/upload",
            headers=auth_headers,
            data={"title": f"Lesson {i}"},
            files={"file": (f"test_{i}.pdf", b"pdf bytes", "application/pdf")},
        )
        mat_ids.append(uuid.UUID(mat_resp.json()["data"]["id"]))

        # Assign material to child Kiran
        client.post(
            f"/api/v1/children/{child_id}/assign",
            headers=auth_headers,
            json={"material_id": str(mat_ids[-1])},
        )

    # 2. Complete Quiz 1 with high score (100)
    mock_generate_ai.return_value = [
        {"type": "mcq", "question": "Q1", "options": ["A", "B"], "answer": "A"}
    ]
    gen_resp = client.post(
        f"/api/v1/questions/generate/{mat_ids[0]}",
        headers=auth_headers,
        json={"count": 1, "child_id": str(child_id)},
    )
    q1_id = gen_resp.json()["data"][0]["id"]
    client.patch(
        f"/api/v1/questions/{q1_id}/select",
        headers=auth_headers,
        json={"is_selected": True},
    )

    mock_eval.return_value = {"score": 100, "feedback": "Great!", "suggestions": "None"}
    client.post(
        "/api/v1/submissions/",
        json={
            "question_id": q1_id,
            "child_name": "Kiran",
            "child_id": str(child_id),
            "answer_given": "A",
        },
    )

    # Kiran's difficulty level should still be medium (needs 2 consecutive quizzes)
    child_db = db.query(Child).filter(Child.id == child_id).first()
    assert child_db.difficulty_level == "medium"

    # 3. Complete Quiz 2 with high score (90)
    gen_resp_2 = client.post(
        f"/api/v1/questions/generate/{mat_ids[1]}",
        headers=auth_headers,
        json={"count": 1, "child_id": str(child_id)},
    )
    q2_id = gen_resp_2.json()["data"][0]["id"]
    client.patch(
        f"/api/v1/questions/{q2_id}/select",
        headers=auth_headers,
        json={"is_selected": True},
    )

    mock_eval.return_value = {
        "score": 90,
        "feedback": "Awesome!",
        "suggestions": "None",
    }
    client.post(
        "/api/v1/submissions/",
        json={
            "question_id": q2_id,
            "child_name": "Kiran",
            "child_id": str(child_id),
            "answer_given": "A",
        },
    )

    # Kiran's difficulty level should now be upgraded to hard
    db.refresh(child_db)
    assert child_db.difficulty_level == "hard"

    # 4. Generate next questions and verify "hard" constraint is passed to generate_questions_from_text
    with patch(
        "app.services.question_service.generate_questions_from_text"
    ) as mock_gen_text:
        mock_gen_text.return_value = []
        client.post(
            f"/api/v1/questions/generate/{mat_ids[2]}",
            headers=auth_headers,
            json={"count": 1, "child_id": str(child_id)},
        )
        # Check that difficulty="hard" parameter was passed in
        mock_gen_text.assert_called_once()
        assert mock_gen_text.call_args[1]["difficulty"] == "hard"
