import asyncio
import os
import uuid
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi import HTTPException
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from pydantic import BaseModel

import uvicorn
from gemma import get_feedback
from get_essay_statistics import get_essay_statistics
from grammar import get_annotated_fixed_essay
from fastapi.middleware.cors import CORSMiddleware
load_dotenv()



# MongoDB configuration
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
MONGO_URI = os.getenv("MONGODB_URI")
DB_NAME   = os.getenv("MONGODB_DB_NAME", "essay")

# Initialize Mongo client and database
client = MongoClient(MONGO_URI, server_api=ServerApi('1'))
db = client[DB_NAME]

# Define collections
feedback_col   = db["feedback"]
stats_col      = db["statistics"]
annotation_col = db["annotations"]

app = FastAPI(title="IELTS Essay Scoring API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.on_event("startup")
async def startup_db():
    # Ensure MongoDB connection is established
    _ = client
class Feedback(BaseModel):
    question: str
    answer: str

# get root
@app.get("/")
async def root():
    return {"message": "Welcome to the IELTS Essay Scoring API"}
@app.post("/get_feedback")
async def get_feedback_endpoint(question: str, answer: str):
    response = await get_feedback(question, answer)
    return response

@app.post("/get_essay_statistics")
async def get_essay_statistics_endpoint(answer: str):
    stats = await get_essay_statistics(answer)
    return stats

@app.post("/get_annotated_fixed_essay")
async def get_annotated_fixed_essay_endpoint(answer: str):
    annotated_essay = await get_annotated_fixed_essay(answer)
    return annotated_essay


@app.post("/process_essay")
async def process_essay_endpoint(request: Feedback):
    """
    Combined endpoint to run feedback, statistics, and annotation in one session.
    Stores all three results under a shared session_id.
    """
    session_id = str(uuid.uuid4())
    now = datetime.utcnow()
    question = request.question
    answer   = request.answer

    # Run services
    feedback_task  = get_feedback(question, answer)
    stats_task     = get_essay_statistics(answer)
    annotated_task = get_annotated_fixed_essay(answer)

    # 2. Chạy đồng thời, chờ cả 3 xong
    feedback, stats, annotated = await asyncio.gather(
        feedback_task,
        stats_task,
        annotated_task
    )
    # print("Annotated essay:", annotated)
    # Persist to MongoDB with shared session_id
    feedback_col.insert_one({
        "session_id": session_id,
        "question":    question,
        "answer":      answer,
        "response":    feedback,
        "created_at":  now
    })
    stats_col.insert_one({
        "session_id": session_id,
        "question":    question,
        "answer":     answer,
        "statistics": stats,
        "created_at": now
    })
    annotation_col.insert_one({
        "session_id":      session_id,
        "question":        question,
        "answer":           answer,
        "annotated_essay":  annotated,
        "created_at":       now
    })

    # Return combined results
    return {
        "session_id":     session_id,
        "feedback":       feedback,
        "statistics":     stats,
        "annotated_essay": annotated
    }

# @app.get("/sessions")
# async def list_sessions():
#     cursor = feedback_col.find(
#         {},
#         {"session_id": 1, "created_at": 1, "_id": 0}
#     ).sort("created_at", -1)

#     docs = list(cursor)
#     session_ids = [doc["session_id"] for doc in docs]
#     return {"session_ids": session_ids}
@app.get("/sessions")
async def list_sessions():
    docs = list(
        feedback_col
        .find({}, {"session_id":1, "question":1, "created_at":1})
        .sort("created_at", -1)
    )
    return {"sessions": [{"session_id": d["session_id"], "question": d["question"]} for d in docs]}

@app.get("/session/{session_id}")
async def get_session(session_id: str):
    feedback_doc = feedback_col.find_one({"session_id": session_id})
    stats_doc    = stats_col.find_one({"session_id": session_id})
    anno_doc     = annotation_col.find_one({"session_id": session_id})

    if not (feedback_doc and stats_doc and anno_doc):
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "session_id":      session_id,
        "question":        feedback_doc["question"],
        "answer":          feedback_doc["answer"],
        "feedback":        feedback_doc["response"],
        "statistics":      stats_doc["statistics"],
        "annotated_essay": anno_doc["annotated_essay"],
        "created_at":      feedback_doc["created_at"],
    }


# start the server
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port)