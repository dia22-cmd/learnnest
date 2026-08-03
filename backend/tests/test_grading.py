import json
from unittest.mock import MagicMock, patch
import pytest
from app.services.ai_service import evaluate_child_answer


@pytest.fixture
def mock_gemini():
    with patch("google.generativeai.GenerativeModel") as mock_model:
        yield mock_model


def test_match_following_grading_all_correct(mock_gemini):
    # Mock Gemini response for feedback generation
    mock_instance = MagicMock()
    mock_gemini.return_value = mock_instance
    mock_response = MagicMock()
    mock_response.text = json.dumps(
        {"feedback": "Perfect match, well done!", "suggestions": "Outstanding job!"}
    )
    mock_instance.generate_content.return_value = mock_response

    correct_answer = json.dumps({"l1": "r1", "l2": "r2", "l3": "r3", "l4": "r4"})
    answer_given = json.dumps({"l1": "r1", "l2": "r2", "l3": "r3", "l4": "r4"})

    result = evaluate_child_answer(
        question_text="Match the items",
        correct_answer=correct_answer,
        child_name="Timmy",
        answer_given=answer_given,
        question_type="match_following",
    )

    assert result["score"] == 100
    assert "feedback" in result
    assert "suggestions" in result


def test_match_following_grading_half_correct(mock_gemini):
    mock_instance = MagicMock()
    mock_gemini.return_value = mock_instance
    mock_response = MagicMock()
    mock_response.text = json.dumps(
        {
            "feedback": "Good try, you got half of them!",
            "suggestions": "Look at the remaining items.",
        }
    )
    mock_instance.generate_content.return_value = mock_response

    correct_answer = json.dumps({"l1": "r1", "l2": "r2", "l3": "r3", "l4": "r4"})
    # Only l1 and l2 match correctly, l3 and l4 are swapped
    answer_given = json.dumps({"l1": "r1", "l2": "r2", "l3": "r4", "l4": "r3"})

    result = evaluate_child_answer(
        question_text="Match the items",
        correct_answer=correct_answer,
        child_name="Timmy",
        answer_given=answer_given,
        question_type="match_following",
    )

    assert result["score"] == 50


def test_match_following_grading_incomplete(mock_gemini):
    mock_instance = MagicMock()
    mock_gemini.return_value = mock_instance
    mock_response = MagicMock()
    mock_response.text = json.dumps(
        {
            "feedback": "Nice effort, some items are unpaired.",
            "suggestions": "Make sure you connect all items next time.",
        }
    )
    mock_instance.generate_content.return_value = mock_response

    correct_answer = json.dumps({"l1": "r1", "l2": "r2", "l3": "r3", "l4": "r4"})
    # Only l1 matched correctly, others left unpaired/empty
    answer_given = json.dumps({"l1": "r1"})

    result = evaluate_child_answer(
        question_text="Match the items",
        correct_answer=correct_answer,
        child_name="Timmy",
        answer_given=answer_given,
        question_type="match_following",
    )

    assert result["score"] == 25


def test_fill_blank_grading_partial(mock_gemini):
    mock_instance = MagicMock()
    mock_gemini.return_value = mock_instance
    mock_response = MagicMock()
    # Gemini returns that blank_1 is correct (true) and blank_2 is incorrect (false)
    mock_response.text = json.dumps(
        {
            "verdicts": {"blank_1": True, "blank_2": False},
            "feedback": "You got the first blank right!",
            "suggestions": "Review the second blank.",
        }
    )
    mock_instance.generate_content.return_value = mock_response

    correct_answer = json.dumps({"blank_1": "H2O", "blank_2": "100"})
    answer_given = json.dumps({"blank_1": "H2O", "blank_2": "90"})

    result = evaluate_child_answer(
        question_text="Water formula is [blank_1] and boils at [blank_2]",
        correct_answer=correct_answer,
        child_name="Timmy",
        answer_given=answer_given,
        question_type="fill_blank",
    )

    assert result["score"] == 50
    assert result["feedback"] == "You got the first blank right!"
