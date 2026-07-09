import pytest
from unittest.mock import patch, MagicMock
from app.services import ai_service


@patch("google.generativeai.GenerativeModel.generate_content")
def test_generate_questions_success(mock_generate):
    """
    Verify that generate_questions_from_text successfully parses
    valid JSON lists returned by Gemini.
    """
    # Create mock response object
    mock_resp = MagicMock()
    mock_resp.text = """
    [
        {
            "type": "mcq",
            "question": "What is photosynthesis?",
            "options": ["A. Plant eating", "B. Plant light conversion", "C. Water absorption", "D. Soil breathing"],
            "answer": "B"
        },
        {
            "type": "short_answer",
            "question": "Name the green pigment in leaves.",
            "options": null,
            "answer": "Chlorophyll"
        }
    ]
    """
    mock_generate.return_value = mock_resp

    with patch("app.config.settings.GEMINI_API_KEY", "mock_key"):
        questions = ai_service.generate_questions_from_text("Leaves are green and convert light.", count=2)
        
        assert len(questions) == 2
        assert questions[0]["type"] == "mcq"
        assert questions[0]["question"] == "What is photosynthesis?"
        assert len(questions[0]["options"]) == 4
        assert questions[1]["type"] == "short_answer"
        assert questions[1]["options"] is None
        assert questions[1]["answer"] == "Chlorophyll"


@patch("google.generativeai.GenerativeModel.generate_content")
def test_evaluate_child_answer_success(mock_generate):
    """
    Verify that evaluate_child_answer successfully parses
    grading feedback returned by Gemini.
    """
    mock_resp = MagicMock()
    mock_resp.text = """
    {
        "score": 95,
        "feedback": "Perfect answer! You correctly identified the pigment.",
        "suggestions": "Next time, mention that it resides inside chloroplasts."
    }
    """
    mock_generate.return_value = mock_resp

    with patch("app.config.settings.GEMINI_API_KEY", "mock_key"):
        evaluation = ai_service.evaluate_child_answer(
            question_text="What is the green pigment?",
            correct_answer="Chlorophyll",
            child_name="Tina",
            answer_given="chlorophyl"
        )

        assert evaluation["score"] == 95
        assert "Perfect answer" in evaluation["feedback"]
        assert "chloroplasts" in evaluation["suggestions"]
