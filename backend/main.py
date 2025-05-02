from fastapi import FastAPI
from gemma import get_feedback
from get_essay_statistics import get_essay_statistics
import uvicorn
app = FastAPI(title="IELTS Essay Scoring API")
# get root
@app.get("/")
async def root():
    return {"message": "Welcome to the IELTS Essay Scoring API"}

@app.post("/get_feedback")
async def get_feedback_endpoint(
    question: str,
    answer: str,
):
    """
    Endpoint to get feedback on the answer to a question.
    """
    response = await get_feedback(question, answer)
    return response

@app.post("/get_essay_statistics")
async def get_essay_statistics_endpoint(answer: str):
    stats = await get_essay_statistics(answer)
    return stats

# start the server
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)