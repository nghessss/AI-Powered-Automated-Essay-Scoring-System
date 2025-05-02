import asyncio
from bert_setup import get_overall_score
import httpx
from dotenv import load_dotenv
import os
import json
import httpx
from google import genai
import pandas as pd
import ollama

load_dotenv()
OLLAMA_URL = os.getenv("OLLAMA_URL")
print(OLLAMA_URL)
OLLAMA_HEALTH_ENDPOINT = f"{OLLAMA_URL}/"
OLLAMA_CHAT_ENDPOINT = f"{OLLAMA_URL}/api/chat"
print('OLLAMA_CHAT_ENDPOINT', OLLAMA_CHAT_ENDPOINT)
RETRY_DELAY = int(os.getenv("RETRY_DELAY"))
MAX_RETRIES = int(os.getenv("MAX_RETRIES"))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_KEY_2 = os.getenv("GEMINI_API_KEY_2")
BAND_DISCRIPTIOR_FILE = os.getenv("BAND_DISCRIPTIOR_FILE")

async def create_evaluation_prompt(question: str, essay: str, overall_score: float) -> str:
    prompt = (
        f"You are an IELTS Writing Task 2 examiner.\n"
        f"Evaluate the following essay based on the official IELTS scoring criteria.\n\n"
        f"Question:\n{question}\n\n"
        f"Essay:\n{essay}\n\n"
        f"The essay above received an overall IELTS Writing band score of {str(overall_score)}.\n\n"
        f"As an IELTS examiner, evaluate the following essay based on the official IELTS scoring criteria.\n\n"
        f"Return your evaluation strictly in the following JSON format:\n\n"
        f"{{\n"
        f'  "criteria": {{\n'
        f'    "task_response": {{\n'
        f'      "score": <score>,\n'
        f'      "details": [<list of detailed feedback sentences>] (MUST NOT include any comma behind this list)\n'
        f'    }},\n'
        f'    "coherence_and_cohesion": {{\n'
        f'      "score": <score>,\n'
        f'      "details": [<list of detailed feedback sentences>] (MUST NOT include any comma behind this list)\n'
        f'    }},\n'
        f'    "lexical_resource": {{\n'
        f'      "score": <score>,\n'
        f'      "details": [<list of detailed feedback sentences>] (MUST NOT include any comma behind this list)\n'
        f'    }},\n'
        f'    "grammatical_range_and_accuracy": {{\n'
        f'      "score": <score>,\n'
        f'      "details": [<list of detailed feedback sentences>] (MUST NOT include any comma behind this list)\n'
        f'    }}\n'
        f'  }},\n'
        f'  "feedback": {{\n'
        f'    "strengths": [<list of strengths>],\n'
        f'    "areasForImprovement": [<list of areas for improvement>]\n'
        f'  }}\n'
        f"}}\n\n"
        f"Rules:\n"
        f"- All keys and strings must use double quotes (\"\") according to strict JSON format.\n"
        f"- Component scores must be consistent with the given overall band score.\n"
        f"- For each 'details' list, clearly explain WHY the score was assigned, mentioning specific strengths, weaknesses, and examples from the essay.\n"
        f"- Return ONLY the JSON object. Do not add any explanations, headers, markdown, or extra text before or after.\n"
        f"- Following STRICTLY the JSON structure above to ensure the JSON is valid and parsable.\n"
    )
    return prompt


async def create_constructive_feedback_prompt(question: str, essay: str, overall_score: float) -> str:
    prompt = (
        f"You are an IELTS Writing Task 2 examiner.\n"
        f"Provide a constructive evaluation for the following essay based on the official IELTS scoring criteria.\n\n"
        f"Question:\n{question}\n\n"
        f"Essay:\n{essay}\n\n"
        f"The essay above received an overall IELTS Writing band score of {str(overall_score)}.\n\n"
        f"As an IELTS examiner, provide constructive feedback based on the official IELTS scoring criteria.\n\n"
        f"Return your evaluation strictly in the following JSON format:\n\n"
        f"{{\n"
        f'  "criteria": {{\n'
        f'    "task_response": {{\n'
        f'      "score": <score>,\n'
        f'      "strengths": [<list of specific strengths>],\n'
        f'      "areas_for_improvement": [<list of specific areas needing improvement>],\n'
        f'      "recommendations": [<list of actionable advice>]\n'
        f'    }},\n'
        f'    "coherence_and_cohesion": {{\n'
        f'      "score": <score>,\n'
        f'      "strengths": [<list of specific strengths>],\n'
        f'      "areas_for_improvement": [<list of specific areas needing improvement>],\n'
        f'      "recommendations": [<list of actionable advice>]\n'
        f'    }},\n'
        f'    "lexical_resource": {{\n'
        f'      "score": <score>,\n'
        f'      "strengths": [<list of specific strengths>],\n'
        f'      "areas_for_improvement": [<list of specific areas needing improvement>],\n'
        f'      "recommendations": [<list of actionable advice>]\n'
        f'    }},\n'
        f'    "grammatical_range_and_accuracy": {{\n'
        f'      "score": <score>,\n'
        f'      "strengths": [<list of specific strengths>],\n'
        f'      "areas_for_improvement": [<list of specific areas needing improvement>],\n'
        f'      "recommendations": [<list of actionable advice>]\n'
        f'    }}\n'
        f'  }},\n'
        f'  "overall_feedback": {{\n'
        f'    "summary": "<short paragraph summarizing key strengths and improvement directions>"\n'
        f'  }}\n'
        f"}}\n\n"
        f"Rules:\n"
        f"- All keys and strings must use double quotes (\"\") according to strict JSON format.\n"
        f"- Component scores must be consistent with the given overall band score.\n"
        f"- Focus on giving constructive feedback: mention what was done well, what needs improvement, and how to improve.\n"
        f"- Be specific and cite examples from the essay when possible.\n"
        f"- Return ONLY the JSON object. Do not add any explanations, headers, markdown, or extra text before or after.\n"
    )
    return prompt


async def get_evaluation_feedback(user_id: str, overall_score: float, question: str , answer: str, client) -> str:
    evaluation_prompt = await create_evaluation_prompt(question, answer, overall_score)
    
    payload = {
        "model": "gemma-3-essay",
        "messages": [
            {"role": "user", "content": evaluation_prompt}
        ],
        "stream": True,
        "options": {
            "num_predict": 2048
        }
    }

    timeout = httpx.Timeout(180.0, connect=10.0)
    try:
        async with httpx.AsyncClient(timeout=timeout) as http_client:
            response = await http_client.post(OLLAMA_CHAT_ENDPOINT, json=payload)
            response.raise_for_status()

            # Ghép nội dung trả về dạng JSON line (stream)
            evaluation_text = ""
            for line in response.text.splitlines():
                try:
                    data = json.loads(line)
                    evaluation_text += data["message"]["content"]
                except Exception:
                    continue

    except httpx.HTTPError as e:
        print(f"Error calling Ollama: {e}")
        return "Failed to get feedback from Ollama."

    gemini_prompt = (
        f"You are a strict JSON fixer and formatter.\n"
        f"Your task is to take the following possibly malformed JSON and output a strictly valid, properly formatted JSON object.\n\n"
        f"---\n"
        f"{evaluation_text}\n"
        f"---\n\n"
        f"Rules:\n"
        f"- Fix all invalid syntax: mismatched or curly quotes, extra commas, missing commas, invalid string terminations, etc.\n"
        f"- Use only standard double quotes (\") for keys and string values.\n"
        f"- Output must be a single valid JSON object only.\n"
    )

    def run_gemini():
        return client.models.generate_content(
            model="models/gemini-2.0-flash-001",
            contents=gemini_prompt
        )

    gemini_response = await asyncio.to_thread(run_gemini)
    corrected_json = gemini_response.text
    return corrected_json


async def get_constructive_feedback(user_id: str, overall_score: float, question: str , answer: str, client, band_descriptors) -> str:
    constructive_prompt = await create_constructive_feedback_prompt(question, answer, overall_score)

    def run_gemini():
        return client.models.generate_content(
            model="models/gemini-2.0-flash-001",
            contents=[band_descriptors, constructive_prompt]
        )

    constructive_response = await asyncio.to_thread(run_gemini)
    constructive_text = constructive_response.text
    return constructive_text


# Hàm thay ngoặc cong thành ngoặc thẳng
def normalize_quotes(text):
    replacements = {
        '“': '"', '”': '"',
        '‘': "'", '’': "'"
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text


# Hàm loại bỏ ```json ... ```
def strip_json_fence(text):
    lines = text.strip().splitlines()
    lines = [line for line in lines if not line.strip().startswith("```")]
    return "\n".join(lines)

def read_json_from_string(text: str) -> dict:
    """
    Nhận vào một chuỗi có chứa JSON (có thể có fence ```json``` hoặc ngoặc cong),
    rồi làm sạch và parse thành dict.
    Trả về:
      - valid_json: True/False
      - top_keys: danh sách key ở cấp cao nhất (nếu valid_json)
      - parsed: object đã parse (nếu valid_json)
      - error: lỗi decode (nếu invalid)
    """
    # Làm sạch dấu ngoặc “ ” trở thành " và loại bỏ fence ``` 
    cleaned = normalize_quotes(strip_json_fence(text))
    try:
        parsed = json.loads(cleaned)
        return {
            "valid_json": True,
            "top_keys": list(parsed.keys()),
            "parsed": parsed
        }
    except json.JSONDecodeError as e:
        return {
            "valid_json": False,
            "error": str(e)
        }

async def get_feedback(question: str, answer: str) -> dict:
    """
    Compute overall score and return merged evaluation + constructive feedback.
    """
    # 1. Compute IELTS score
    overall_score = float(get_overall_score(question, answer))
    user_id = "test_user_id"  # Replace with actual user ID

    # 2. Initialize clients
    client = genai.Client(api_key=GEMINI_API_KEY)
    client_2 = genai.Client(api_key=GEMINI_API_KEY_2)
    band_descriptors = client.files.upload(file=BAND_DISCRIPTIOR_FILE)

    evaluation_task = get_evaluation_feedback(user_id, overall_score, question, answer, client_2)
    constructive_task = get_constructive_feedback(user_id, overall_score, question, answer, client, band_descriptors)

    evaluation_text, constructive_text = await asyncio.gather(evaluation_task, constructive_task)

    # 5. Parse and merge
    eval_res = read_json_from_string(evaluation_text)
    const_res = read_json_from_string(constructive_text)

    if not eval_res["valid_json"]:
        raise ValueError(f"Evaluation JSON parse error: {eval_res['error']}")
    if not const_res["valid_json"]:
        raise ValueError(f"Constructive JSON parse error: {const_res['error']}")

    return {
        "user_id": user_id,
        "overall_score": overall_score,
        "evaluation_feedback": eval_res["parsed"],
        "constructive_feedback": const_res["parsed"]
    }