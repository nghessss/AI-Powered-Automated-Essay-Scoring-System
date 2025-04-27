from fastapi import FastAPI
from gemma import get_feedback

app = FastAPI(title="RAG FastAPI Service with Active Recall")

app.post("/get_feedback")
async def get_feedback_endpoint(
    user_id: str,
    question: str,
    answer: str,
    ovr_score: str,
):
    """
    Endpoint to get feedback on the answer to a question.
    """
    response = await get_feedback(user_id, question, answer, ovr_score)
    return response