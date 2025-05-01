# from bert_setup import predict_score
import asyncio
import ollama
import pandas as pd
from google import genai
import json

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
    print('1')
    evaluation_prompt = await create_evaluation_prompt(question, answer, overall_score)
    
    def run_ollama():
        return ollama.chat(
            model='gemma-3-essay',
            messages=[
                {"role": "user", "content": evaluation_prompt}
            ],
            stream=False,
            options={"num_predict": 1024}
        )

    evaluation_response = await asyncio.to_thread(run_ollama)
    evaluation_text = evaluation_response['message']['content']

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
    print('2')
    constructive_prompt = await create_constructive_feedback_prompt(question, answer, overall_score)

    def run_gemini():
        return client.models.generate_content(
            model="models/gemini-2.0-flash-001",
            contents=[band_descriptors, constructive_prompt]
        )

    constructive_response = await asyncio.to_thread(run_gemini)
    constructive_text = constructive_response.text
    return constructive_text


def save_feedback_outputs(user_id: str, overall_score: float, evaluation_text: str, constructive_text: str) -> dict:
    try:
        # Lưu raw evaluation text
        with open("evaluation_feedback.txt", "w", encoding="utf-8") as f:
            f.write(evaluation_text)

        # Lưu raw constructive feedback
        with open("constructive_feedback.txt", "w", encoding="utf-8") as f:
            f.write(constructive_text)

        # Lưu user_id và overall_score vào id_score.txt
        with open("id_score.txt", "w", encoding="utf-8") as f:
            f.write(f"{user_id}\n{overall_score}\n")

        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

async def main():
    df = pd.read_csv('55_samples.csv')
    question = df['question'][34]
    answer = df['answer'][34]
    overall_score = df['overall'][34]
    # overall_score = predict_score(question, answer)
    user_id = "1234"

    client = genai.Client(api_key="AIzaSyChSaXfxSdk_Yei591wuQCvY8ueRRaZDtU")
    client_2 = genai.Client(api_key="AIzaSyDz9BAztne9RYsKygNqR8dFcpn5rwjx-n4")
    band_descriptors = client.files.upload(file="Writing-Band-descriptors-Task-2.pdf")

    # 🔁 Chạy 2 hàm đồng thời
    evaluation_task = get_evaluation_feedback(user_id, overall_score, question, answer, client_2)
    constructive_task = get_constructive_feedback(user_id, overall_score, question, answer, client, band_descriptors)

    evaluation_text, constructive_text = await asyncio.gather(evaluation_task, constructive_task)

    save_feedback_outputs(
        user_id=user_id,
        overall_score=overall_score,
        evaluation_text=evaluation_text,
        constructive_text=constructive_text
    )

if __name__ == "__main__":
    asyncio.run(main())
