import json
import re
import time
import google.generativeai as genai
from app.config import settings


def configure_gemini():
    """
    Configures the google-generativeai package with the GEMINI_API_KEY.
    """
    if not settings.GEMINI_API_KEY:
        raise ValueError("Gemini API key is missing (GEMINI_API_KEY).")
    genai.configure(api_key=settings.GEMINI_API_KEY)


def clean_json_response(text: str) -> str:
    """
    Cleans raw response text from the model by extracting the JSON content,
    stripping markdown code blocks (e.g. ```json ... ```) if present.
    """
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        return match.group(1).strip()
    return text


def generate_questions_from_text(raw_text: str, count: int = 5, retries: int = 3) -> list[dict]:
    """
    Sends material text to Gemini and asks to generate questions.
    Returns a list of dicts: [{"type": "mcq"|"short_answer", "question": str, "options": list|None, "answer": str}]
    """
    configure_gemini()
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = f"""
You are an expert school educator creating materials for children.
Generate exactly {count} educational questions from the study material below.

Provide a mix of multiple choice ("mcq") and "short_answer" questions.
Format the output strictly as a JSON array of objects.
Each object must contain exactly:
- "type": "mcq" or "short_answer"
- "question": string containing the question
- "options": list of 4 choices for MCQ (e.g. ["A. Option", "B. Option", ...]), or null for short_answer
- "answer": string containing the correct/reference answer

Study Material:
{raw_text}
"""

    for attempt in range(retries):
        try:
            # We request JSON response format explicitly
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            
            content_text = response.text
            json_str = clean_json_response(content_text)
            questions = json.loads(json_str)

            if not isinstance(questions, list):
                raise ValueError("AI response is not a JSON list")

            # Validate each question item shape
            valid_questions = []
            for item in questions:
                q_type = item.get("type")
                question = item.get("question")
                options = item.get("options")
                answer = item.get("answer")

                if not q_type or not question or answer is None:
                    continue

                if q_type not in ["mcq", "short_answer"]:
                    continue

                if q_type == "mcq" and (not isinstance(options, list) or len(options) < 2):
                    continue

                valid_questions.append({
                    "type": q_type,
                    "question": question,
                    "options": options if q_type == "mcq" else None,
                    "answer": answer
                })

            if len(valid_questions) > 0:
                return valid_questions

            raise ValueError("No valid questions parsed from AI response")

        except Exception as e:
            print(f"Attempt {attempt + 1} failed generating questions: {e}")
            if attempt == retries - 1:
                raise ValueError(f"AI question generation failed: {str(e)}")
            time.sleep(1)


def evaluate_child_answer(
    question_text: str,
    correct_answer: str,
    child_name: str,
    answer_given: str,
    retries: int = 3
) -> dict:
    """
    Sends the question details and child's answer to Gemini for scoring and feedback.
    Returns a dict: {"score": int, "feedback": str, "suggestions": str}
    """
    configure_gemini()
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = f"""
You are a warm, encouraging AI tutor helping a child.
Evaluate the child's answer to the following question against the reference answer.

Question: {question_text}
Reference Answer: {correct_answer}
Child's Name: {child_name}
Child's Answer: {answer_given}

Respond strictly with a JSON object.
The JSON object must contain exactly:
- "score": integer (0 to 100) representing how correct and complete the answer is. Be relatively generous but fair. (e.g. for MCQs, 100 for correct, 0 for incorrect. For short answer, score based on understanding).
- "feedback": a friendly, encouraging message in child-friendly language. Focus on what they did well first, then explain any gaps or errors simply.
- "suggestions": a helpful, positive suggestion on how they can improve or what they could add next time.
"""

    for attempt in range(retries):
        try:
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )

            content_text = response.text
            json_str = clean_json_response(content_text)
            eval_data = json.loads(json_str)

            score = eval_data.get("score")
            feedback = eval_data.get("feedback")
            suggestions = eval_data.get("suggestions")

            if score is None or not feedback or not suggestions:
                raise ValueError("Evaluation data is missing fields")

            return {
                "score": int(score),
                "feedback": str(feedback),
                "suggestions": str(suggestions)
            }

        except Exception as e:
            print(f"Attempt {attempt + 1} failed evaluating answer: {e}")
            if attempt == retries - 1:
                raise ValueError(f"AI evaluation failed: {str(e)}")
            time.sleep(1)
