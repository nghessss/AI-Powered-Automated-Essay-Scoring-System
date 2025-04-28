from bert_setup import get_overall_score
import ollama
import asyncio
import pandas as pd

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

async def get_feedback(question:str , answer: str) -> str:
    overall_score = get_overall_score(question, answer)

    prompt = await create_prompt(question, answer, overall_score)
    
    response = ollama.chat(
        model='gemma-3-essay',
        messages=[
            {"role": "user", "content": prompt}
        ],
        stream=False,
        options={
            "num_predict": 2048
        }
    )

    generated_text = response['message']['content']

    return generated_text

# if __name__ == "__main__":
#     df = pd.read_csv('55_samples.csv')
#     question = df['question'][1]
#     answer = df['answer'][1]
#     overall_score = df['overall'][1]
#     # asyncio.run(get_feedback(question, answer))
#     result = asyncio.run(get_feedback(question, answer))
#     print(result)