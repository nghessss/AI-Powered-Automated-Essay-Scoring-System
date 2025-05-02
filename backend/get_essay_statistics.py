import asyncio
import json
import pandas as pd
import re
import torch
from handle_json import read_json_from_string
import os
from google import genai

GEMINI_API_KEY_3 = os.getenv("GEMINI_API_KEY_3")

async def create_prompt_for_essay_analysis(essay: str) -> str:
    prompt = (
        "You are an AI assistant that analyzes English essays for writing quality.\n"
        "Given an essay, perform the following two tasks:\n\n"
        "1. Identify the top 5 most repeated content words (nouns, verbs, adjectives, or adverbs), "
        "excluding stopwords. These words should help detect lexical repetition or lack of paraphrasing.\n\n"
        "2. Count the number of coherence-related words (e.g., however, therefore, in addition, "
        "on the other hand, furthermore, etc.) used in the essay. These words indicate the level of logical "
        "flow and cohesion.\n\n"
        "Return the result in the following JSON format:\n\n"
        "{\n"
        '  "top_repeated_content_words": [\n'
        '    {"word": "___", "count": __},\n'
        '    {"word": "___", "count": __},\n'
        "    ...\n"
        "  ],\n"
        '  "coherence_word_count": __\n'
        "}\n\n"
        "Here is the essay:\n"
        '"""\n'
        f"{essay.strip()}\n"
        '"""'
    )
    return prompt

async def get_essay_statistics(essay: str) -> dict:
    client = genai.Client(api_key=GEMINI_API_KEY_3)
    prompt = await create_prompt_for_essay_analysis(essay)

    def run_gemini():
        return client.models.generate_content(
            model="models/gemini-2.0-flash-001",
            contents=[prompt]
        )

    response = await asyncio.to_thread(run_gemini)

    statistics_text = response.text

    stat_res = read_json_from_string(statistics_text)

    if not stat_res["valid_json"]:
        raise ValueError(f"Evaluation JSON parse error: {stat_res['error']}")

    return stat_res["parsed"]