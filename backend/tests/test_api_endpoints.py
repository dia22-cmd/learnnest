from unittest.mock import patch


def test_auth_flow(client):
    """
    Verify that user registration and login work correctly.
    """
    # 1. Register
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "parent_test@example.com",
            "password": "securePass123!",
            "full_name": "John Doe",
        },
    )
    assert reg_resp.status_code == 200
    assert reg_resp.json()["success"] is True

    # 2. Login
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "parent_test@example.com", "password": "securePass123!"},
    )
    assert login_resp.status_code == 200
    assert "token" in login_resp.json()["data"]


@patch("app.services.material_service.upload_pdf_to_cloudinary")
@patch("app.services.material_service.extract_text_from_pdf")
def test_material_upload_and_list(mock_extract, mock_upload, client, auth_headers):
    """
    Verify PDF upload process:
    - Cloudinary upload is mock-saved
    - Text extraction is mocked
    - DB record is successfully created
    """
    mock_extract.return_value = "This is some mock study text about photosynthesis."
    mock_upload.return_value = "https://res.cloudinary.com/hssawakl/raw/upload/test.pdf"

    # Upload file (mock PDF)
    file_data = {"file": ("test.pdf", b"mock pdf bytes", "application/pdf")}
    form_data = {"title": "Science Chapter 1"}

    upload_resp = client.post(
        "/api/v1/materials/upload",
        headers=auth_headers,
        data=form_data,
        files=file_data,
    )

    assert upload_resp.status_code == 201
    material_data = upload_resp.json()["data"]
    assert material_data["title"] == "Science Chapter 1"
    assert (
        material_data["file_url"]
        == "https://res.cloudinary.com/hssawakl/raw/upload/test.pdf"
    )

    # Verify material listing
    list_resp = client.get("/api/v1/materials/", headers=auth_headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()["data"]) == 1
    assert list_resp.json()["data"][0]["id"] == material_data["id"]


@patch("app.services.question_service.generate_questions_from_text")
@patch("app.services.material_service.upload_pdf_to_cloudinary")
@patch("app.services.material_service.extract_text_from_pdf")
def test_question_generation_and_selection(
    mock_extract, mock_upload, mock_generate_ai, client, auth_headers
):
    """
    Verify that generating questions from material, and toggling is_selected, works as expected.
    """
    # 1. Create a Material
    mock_extract.return_value = "Photosynthesis is light conversion."
    mock_upload.return_value = "https://res.cloudinary.com/test.pdf"
    file_data = {"file": ("test.pdf", b"pdf bytes", "application/pdf")}
    form_data = {"title": "Bio 1"}
    mat_resp = client.post(
        "/api/v1/materials/upload",
        headers=auth_headers,
        data=form_data,
        files=file_data,
    )
    material_id = mat_resp.json()["data"]["id"]

    # 2. Mock AI generation output
    mock_generate_ai.return_value = [
        {
            "type": "mcq",
            "question": "What pigment absorbs light?",
            "options": ["A. Red", "B. Chlorophyll", "C. Blue", "D. Yellow"],
            "answer": "B. Chlorophyll",
        },
        {
            "type": "short_answer",
            "question": "Where does photosynthesis occur?",
            "options": None,
            "answer": "Chloroplasts",
        },
    ]

    # Generate questions
    gen_resp = client.post(
        f"/api/v1/questions/generate/{material_id}",
        headers=auth_headers,
        json={"count": 2},
    )
    assert gen_resp.status_code == 201
    questions = gen_resp.json()["data"]
    assert len(questions) == 2
    assert questions[0]["is_selected"] is False
    assert questions[1]["is_selected"] is False

    question_id = questions[0]["id"]

    # 3. Toggle selection (Parent selects question)
    select_resp = client.patch(
        f"/api/v1/questions/{question_id}/select",
        headers=auth_headers,
        json={"is_selected": True},
    )
    assert select_resp.status_code == 200
    assert select_resp.json()["data"]["is_selected"] is True

    # 4. Public question query (Unauthenticated/Child view)
    # Child solve view should only see questions where is_selected == True
    public_resp = client.get(f"/api/v1/questions/{material_id}")
    assert public_resp.status_code == 200
    public_questions = public_resp.json()["data"]
    assert len(public_questions) == 1
    assert public_questions[0]["id"] == question_id

    # Parent question query (Authenticated)
    # Parent should see all questions (both selected and unselected)
    parent_resp = client.get(f"/api/v1/questions/{material_id}", headers=auth_headers)
    assert parent_resp.status_code == 200
    assert len(parent_resp.json()["data"]) == 2


@patch("app.services.submission_service.evaluate_child_answer")
@patch("app.services.question_service.generate_questions_from_text")
@patch("app.services.material_service.upload_pdf_to_cloudinary")
@patch("app.services.material_service.extract_text_from_pdf")
def test_student_submission_flow(
    mock_extract, mock_upload, mock_generate_ai, mock_eval, client, auth_headers
):
    """
    Verify the student submission and evaluation flow:
    - Save answer and fetch mock grading
    - Parent can fetch submissions history for the material
    """
    # 1. Create a Material
    mock_extract.return_value = "Photosynthesis."
    mock_upload.return_value = "https://res.cloudinary.com/test.pdf"
    file_data = {"file": ("test.pdf", b"pdf bytes", "application/pdf")}
    form_data = {"title": "Bio 1"}
    mat_resp = client.post(
        "/api/v1/materials/upload",
        headers=auth_headers,
        data=form_data,
        files=file_data,
    )
    material_id = mat_resp.json()["data"]["id"]

    # 2. Create questions and select one
    mock_generate_ai.return_value = [
        {
            "type": "mcq",
            "question": "What is green?",
            "options": ["A. Soil", "B. Leaf", "C. Sun", "D. Sky"],
            "answer": "B",
        }
    ]
    gen_resp = client.post(
        f"/api/v1/questions/generate/{material_id}",
        headers=auth_headers,
        json={"count": 1},
    )
    question_id = gen_resp.json()["data"][0]["id"]

    client.patch(
        f"/api/v1/questions/{question_id}/select",
        headers=auth_headers,
        json={"is_selected": True},
    )

    # 3. Child Submits Answer (Unauthenticated)
    mock_eval.return_value = {
        "score": 100,
        "feedback": "Correct! Leaves are green.",
        "suggestions": "Review why chlorophyll makes them green.",
    }

    sub_resp = client.post(
        "/api/v1/submissions/",
        json={
            "question_id": question_id,
            "child_name": "Arjun",
            "answer_given": "B. Leaf",
        },
    )
    assert sub_resp.status_code == 201
    sub_data = sub_resp.json()["data"]
    assert sub_data["score"] == 100
    assert "Leaves are green" in sub_data["feedback"]

    # 4. Parent views submissions list
    report_resp = client.get(f"/api/v1/submissions/{material_id}", headers=auth_headers)
    assert report_resp.status_code == 200
    submissions_list = report_resp.json()["data"]
    assert len(submissions_list) == 1
    assert submissions_list[0]["child_name"] == "Arjun"
    assert submissions_list[0]["score"] == 100
    assert submissions_list[0]["question"] == "What is green?"
