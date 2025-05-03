from fastapi import FastAPI
from gemma import get_feedback
from get_essay_statistics import get_essay_statistics
from grammar import get_annotated_fixed_essay
import uvicorn
from pydantic import BaseModel
app = FastAPI(title="IELTS Essay Scoring API")

class FeedbackRequest(BaseModel):
    question: str
    answer: str
# get root
@app.get("/")
async def root():
    return {"message": "Welcome to the IELTS Essay Scoring API"}
@app.post("/get_feedback")
async def get_feedback_endpoint(request: FeedbackRequest):
    print("Received question:", request.question)
    print("Received answer:", request.answer)
    response = await get_feedback(request.question, request.answer)
    print(response)
    return response

@app.post("/get_essay_statistics")
async def get_essay_statistics_endpoint(answer: str):
    stats = await get_essay_statistics(answer)
    return stats

@app.post("/get_annotated_fixed_essay")
async def get_annotated_fixed_essay_endpoint(answer: str):
    annotated_essay = await get_annotated_fixed_essay(answer)
    return annotated_essay

# start the server
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

