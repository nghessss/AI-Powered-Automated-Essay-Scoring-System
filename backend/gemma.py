from bert_setup import get_overall_score
import ollama
import asyncio
import pandas as pd
import httpx
import asyncio
# import load_dotenv
from dotenv import load_dotenv
import os
import json
load_dotenv()
OLLAMA_URL = os.getenv("OLLAMA_URL")
print(OLLAMA_URL)
OLLAMA_HEALTH_ENDPOINT = f"{OLLAMA_URL}/"
OLLAMA_CHAT_ENDPOINT = f"{OLLAMA_URL}/api/chat"
print('OLLAMA_CHAT_ENDPOINT', OLLAMA_CHAT_ENDPOINT)
RETRY_DELAY = int(os.getenv("RETRY_DELAY"))
MAX_RETRIES = int(os.getenv("MAX_RETRIES"))



async def create_prompt(question: str, essay: str, overall_score: float) -> str:
    prompt = (
        f"You are an IELTS Writing Task 2 examiner.\n"
        f"Evaluate the following essay based on the official IELTS scoring criteria.\n\n"
        f"Question:\n{question}\n\n"
        f"Essay:\n{essay}\n\n"
        f"The essay above received an overall IELTS Writing band score of {str(overall_score)}.\n\n"
        f"As an IELTS examiner, evaluate the following essay based on the official IELTS scoring criteria "
        f"and the given overall band score WITHOUT changing it.\n\n"
        f"Return your evaluation strictly in the following JSON format:\n\n"
        f"The breakdown score has to be consistent with the overall band score, and is an integer, and the average need to be equal to {str(overall_score)} .\n"
        f"{{\n"
        f'  "criteria": {{\n'
        f'    "task_response": {{\n'
        f'      "score": <score>,\n'
        f'      "details": [<list of detailed feedback sentences>]\n'
        f'    }},\n'
        f'    "coherence_and_cohesion": {{\n'
        f'      "score": <score>,\n'
        f'      "details": [<list of detailed feedback sentences>]\n'
        f'    }},\n'
        f'    "lexical_resource": {{\n'
        f'      "score": <score>,\n'
        f'      "details": [<list of detailed feedback sentences>]\n'
        f'    }},\n'
        f'    "grammatical_range_and_accuracy": {{\n'
        f'      "score": <score>,\n'
        f'      "details": [<list of detailed feedback sentences>]\n'
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
    )
    return prompt


  # seconds

async def wait_for_ollama():
    async with httpx.AsyncClient() as client:
        for attempt in range(MAX_RETRIES):
            try:
                print(f"calling to ollama health endpoint {OLLAMA_HEALTH_ENDPOINT}")
                response = await client.get(OLLAMA_HEALTH_ENDPOINT)
                if response.status_code == 200:
                    return True
            except httpx.RequestError:
                pass
            print(f"Waiting for Ollama to be ready... (attempt {attempt + 1})")
            await asyncio.sleep(RETRY_DELAY)
        print("Ollama is not available after several retries.")
        return False

import httpx
import time

async def get_feedback(question: str, answer: str) -> str:
    is_ready = await wait_for_ollama()
    if not is_ready:
        return "Ollama server is not responding."

    overall_score = get_overall_score(question, answer)
    prompt = await create_prompt(question, answer, overall_score)
    # prompt = f"Give feedback on this IELTS essay: {answer}"
    payload = {
        "model": "gemma-3-essay",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "stream": True,
        "options": {
            "num_predict": 2048
        }
    }

    # Allow up to 2 minutes total timeout, 10 sec for connection
    timeout = httpx.Timeout(180.0, connect=10.0)

    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.post(OLLAMA_CHAT_ENDPOINT, json=payload)
            response.raise_for_status()
            
            # If the API returns streamed chunks as JSON lines, split and join
            full_text = ""
            for line in response.text.splitlines():
                data = json.loads(line)
                full_text += data["message"]["content"]

            return full_text

        except httpx.HTTPError as e:
            print(f"Error calling Ollama: {e}")
            return "Failed to get feedback from Ollama."
