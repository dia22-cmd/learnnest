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


def generate_questions_from_text(
    raw_text: str, count: int = 5, retries: int = 3
) -> list[dict]:
    """
    Sends material text to Gemini and asks to generate questions.
    Returns a list of dicts: [{"type": str, "question": str, "options": list|dict|None, "answer": str}]
    """
    configure_gemini()
    model = genai.GenerativeModel("gemini-2.5-flash")

    prompt = f"""
You are an expert school educator creating materials for children.
Generate exactly {count} educational questions from the study material below.

Provide a balanced mix of these question types:
1. "mcq" (Multiple Choice Question)
2. "short_answer" (Open-ended question)
3. "true_false" (True or False statement)
4. "fill_blank" (Sentence containing one or more blanks indicated by [blank_1], [blank_2], etc.)
5. "match_following" (Pairing list of concepts in left column with matching descriptions in right column.
   Generate exactly 4 pairs. IMPORTANT: If fewer than 4 clean, well-supported pairs exist in the source text,
   generate a different question type instead.)

Format the output strictly as a JSON array of objects.
Each object must contain exactly:
- "type": "mcq", "short_answer", "true_false", "fill_blank", or "match_following"
- "question": string containing the question text. For "fill_blank", the text must contain markers like "[blank_1]".
  For "match_following", this is the instruction/title.
- "options":
  - For "mcq": list of 4 choices (e.g. ["A. Option", "B. Option", ...])
  - For "true_false": exactly ["True", "False"]
  - For "fill_blank": null
  - For "match_following": a JSON object with:
    - "left": list of 4 objects with unique ID and text: [[{{"id": "l1", "text": "concept1"}}, ...]]
    - "right": list of the same 4 matching objects, but SHUFFLED in random order:
      [[{{"id": "r1", "text": "match1"}}, ...]]
- "answer":
  - For "mcq", "short_answer", "true_false": string containing the correct option or answer.
  - For "fill_blank": a JSON object mapping blank IDs to correct answers: {{"blank_1": "H2O", "blank_2": "100"}}
  - For "match_following": a JSON object mapping left IDs to their correct matching right IDs:
    {{"l1": "r1", "l2": "r2", "l3": "r3", "l4": "r4"}}

Study Material:
{raw_text}
"""

    valid_questions = []

    for attempt in range(retries):
        try:
            # We request JSON response format explicitly
            response = model.generate_content(
                prompt, generation_config={"response_mime_type": "application/json"}
            )

            content_text = response.text
            json_str = clean_json_response(content_text)
            questions = json.loads(json_str)

            if not isinstance(questions, list):
                raise ValueError("AI response is not a JSON list")

            # Validate each question item shape
            for item in questions:
                q_type = item.get("type")
                question = item.get("question")
                options = item.get("options")
                answer = item.get("answer")

                if not q_type or not question or answer is None:
                    continue

                if q_type not in [
                    "mcq",
                    "short_answer",
                    "true_false",
                    "fill_blank",
                    "match_following",
                ]:
                    continue

                # Detailed validations per type
                if q_type == "mcq":
                    if not isinstance(options, list) or len(options) < 2:
                        continue
                    answer_val = str(answer)

                elif q_type == "true_false":
                    options = ["True", "False"]
                    answer_val = str(answer)

                elif q_type == "fill_blank":
                    if "[blank_" not in question:
                        continue
                    if not isinstance(answer, dict) or len(answer) == 0:
                        continue
                    options = None
                    answer_val = json.dumps(answer)

                elif q_type == "match_following":
                    if (
                        not isinstance(options, dict)
                        or "left" not in options
                        or "right" not in options
                    ):
                        continue
                    left_list = options.get("left", [])
                    right_list = options.get("right", [])
                    if not isinstance(left_list, list) or not isinstance(
                        right_list, list
                    ):
                        continue
                    if len(left_list) != len(right_list) or len(left_list) < 2:
                        continue
                    if not isinstance(answer, dict) or len(answer) == 0:
                        continue
                    # Normalize answer structure to stringified JSON
                    answer_val = json.dumps(answer)

                else:
                    options = None
                    answer_val = str(answer)

                valid_questions.append(
                    {
                        "type": q_type,
                        "question": question,
                        "options": options,
                        "answer": answer_val,
                    }
                )

                if len(valid_questions) >= count:
                    return valid_questions[:count]

        except Exception as e:
            print(f"Attempt {attempt + 1} failed generating questions: {e}")
            if attempt == retries - 1 and len(valid_questions) == 0:
                raise ValueError(f"AI question generation failed: {str(e)}")

    # Fallback policy on retry exhaustion: pad the rest with basic MCQ/Short Answer questions
    if len(valid_questions) < count:
        missing_count = count - len(valid_questions)
        try:
            fallback_prompt = f"""
Generate exactly {missing_count} simple multiple choice questions ("mcq") from the text below.
Format strictly as a JSON array of objects with keys:
"type" (always "mcq"), "question" (string), "options" (list of 4 choices), "answer" (string).
Text:
{raw_text}
"""
            response = model.generate_content(
                fallback_prompt,
                generation_config={"response_mime_type": "application/json"},
            )
            fallback_questions = json.loads(clean_json_response(response.text))
            for item in fallback_questions:
                if len(valid_questions) >= count:
                    break
                valid_questions.append(
                    {
                        "type": "mcq",
                        "question": item.get("question", "Question"),
                        "options": item.get("options", ["A", "B", "C", "D"]),
                        "answer": str(item.get("answer", "A")),
                    }
                )
        except Exception as fe:
            print(f"Fallback question generation failed: {fe}")
            # If all fails, manually create basic questions so we never fail the batch
            while len(valid_questions) < count:
                valid_questions.append(
                    {
                        "type": "short_answer",
                        "question": "Summarize the main idea of the study material in your own words.",
                        "options": None,
                        "answer": "Accept any reasonable explanation.",
                    }
                )

    return valid_questions[:count]


def evaluate_child_answer(
    question_text: str,
    correct_answer: str,
    child_name: str,
    answer_given: str,
    question_type: str = "short_answer",
    retries: int = 3,
) -> dict:
    """
    Evaluates a child's answer based on the question type.
    Returns a dict: {"score": int, "feedback": str, "suggestions": str}
    """
    configure_gemini()
    model = genai.GenerativeModel("gemini-2.5-flash")

    # 1. Deterministic evaluation for match_following
    if question_type == "match_following":
        try:
            correct_dict = json.loads(correct_answer)
            given_dict = json.loads(answer_given) if answer_given else {}
        except Exception:
            correct_dict = {}
            given_dict = {}

        correct_count = 0
        total_pairs = len(correct_dict)
        for l_id, r_id in correct_dict.items():
            if given_dict.get(l_id) == r_id:
                correct_count += 1

        score = int((correct_count / total_pairs) * 100) if total_pairs > 0 else 0

        # Ask Gemini to generate friendly feedback using the calculated score
        prompt = f"""
You are a warm, encouraging AI tutor helping a child.
The child did a matching puzzle.
Here is the performance metrics:
- Total matching items: {total_pairs}
- Successfully matched items: {correct_count}
- Calculated Score: {score}/100

Write a warm, child-friendly feedback message and some encouraging suggestions for improvement.
Child's Name: {child_name}
Question Instruction: {question_text}

Respond strictly with a JSON object containing:
- "feedback": friendly feedback focusing on effort first.
- "suggestions": positive, simple learning tips.
"""
        for attempt in range(retries):
            try:
                response = model.generate_content(
                    prompt, generation_config={"response_mime_type": "application/json"}
                )
                eval_data = json.loads(clean_json_response(response.text))
                return {
                    "score": score,
                    "feedback": eval_data.get(
                        "feedback", "Good effort matching these items!"
                    ),
                    "suggestions": eval_data.get(
                        "suggestions", "Keep practicing to get them all correct!"
                    ),
                }
            except Exception:
                if attempt == retries - 1:
                    return {
                        "score": score,
                        "feedback": (
                            f"Great try, {child_name}! You matched "
                            f"{correct_count} out of {total_pairs} items correctly."
                        ),
                        "suggestions": "Try checking the lesson material once more to match all of them!",
                    }
                time.sleep(1)

    # 2. Hybrid evaluation for fill_blank (Gemini checks semantics per blank, Python aggregates score)
    elif question_type == "fill_blank":
        prompt = f"""
You are a warm, encouraging AI tutor helping a child.
Evaluate the child's answers for a fill-in-the-blank question.

Question: {question_text}
Reference Answers (blank IDs and correct values): {correct_answer}
Child's Answers: {answer_given}
Child's Name: {child_name}

Evaluate each blank individually. Be relatively generous: allow minor spelling typos and synonyms.
Respond strictly with a JSON object containing:
- "verdicts": an object mapping each blank ID (e.g. "blank_1") to a boolean
  (true if correct/semantically close, false if wrong).
- "feedback": a friendly, encouraging message in child-friendly language.
- "suggestions": a helpful suggestion on how they can improve.
"""
        for attempt in range(retries):
            try:
                response = model.generate_content(
                    prompt, generation_config={"response_mime_type": "application/json"}
                )
                eval_data = json.loads(clean_json_response(response.text))
                verdicts = eval_data.get("verdicts", {})
                feedback = eval_data.get(
                    "feedback", "Well done working through this blank question!"
                )
                suggestions = eval_data.get(
                    "suggestions", "Try practicing similar sentences."
                )

                # Calculate score deterministically based on boolean verdicts
                total_blanks = len(verdicts)
                correct_blanks = sum(1 for v in verdicts.values() if v is True)
                score = (
                    int((correct_blanks / total_blanks) * 100)
                    if total_blanks > 0
                    else 0
                )

                return {
                    "score": score,
                    "feedback": feedback,
                    "suggestions": suggestions,
                }
            except Exception:
                if attempt == retries - 1:
                    return {
                        "score": 0,
                        "feedback": f"Great effort on this fill-in-the-blank question, {child_name}!",
                        "suggestions": "Review the sentence structure and try again.",
                    }
                time.sleep(1)

    # 3. Standard AI evaluation for MCQ, True/False, and Short Answer
    else:
        prompt = f"""
You are a warm, encouraging AI tutor helping a child.
Evaluate the child's answer to the following question against the reference answer.

Question: {question_text}
Reference Answer: {correct_answer}
Child's Name: {child_name}
Child's Answer: {answer_given}

Respond strictly with a JSON object.
The JSON object must contain exactly:
- "score": integer (0 to 100) representing how correct the answer is.
  Be relatively generous but fair. For MCQs or True/False, score must be 100 for correct, or 0 for incorrect.
  For short answers, grade based on semantic understanding.
- "feedback": a friendly, encouraging message in child-friendly language.
  Focus on what they did well first, then explain any errors simply.
- "suggestions": a helpful, positive suggestion on how they can improve or what they could add next time.
"""
        for attempt in range(retries):
            try:
                response = model.generate_content(
                    prompt, generation_config={"response_mime_type": "application/json"}
                )
                eval_data = json.loads(clean_json_response(response.text))
                return {
                    "score": int(eval_data.get("score", 0)),
                    "feedback": str(eval_data.get("feedback", "Good effort!")),
                    "suggestions": str(eval_data.get("suggestions", "Keep learning!")),
                }
            except Exception:
                if attempt == retries - 1:
                    # Direct fallback calculation for simple MCQ/True-False comparisons
                    is_correct = (
                        str(answer_given).strip().lower()
                        == str(correct_answer).strip().lower()
                    )
                    return {
                        "score": 100 if is_correct else 0,
                        "feedback": f"Good effort, {child_name}!",
                        "suggestions": (
                            "Try checking the lesson material once more."
                            if not is_correct
                            else "Perfect job!"
                        ),
                    }
                time.sleep(1)
