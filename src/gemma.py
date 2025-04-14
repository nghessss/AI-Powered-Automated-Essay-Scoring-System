from bert_setup import predict_score

async def get_feedback(userid: str, question:str , answer: str) -> str:
    ovrall_score = predict_score(question, answer)
    pass