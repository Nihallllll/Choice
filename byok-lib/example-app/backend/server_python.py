"""
example-app/backend/server_python.py

Complete example: FastAPI + LangChain + BYOK middleware.
This is what a project owner writes for a Python backend.

Run:
    pip install -r requirements.txt
    uvicorn server_python:app --reload --port 3001
"""

import os
from typing import Optional
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# ── Import the BYOK library (two files) ──────────────────────────────────────
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../backend-python"))

from byok_middleware import BYOKMiddleware
from llm_factory import get_llm_from_context

# LangChain
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

app = FastAPI(title="BYOK Example API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Add BYOK middleware — this is the only middleware you add ─────────────────
app.add_middleware(BYOKMiddleware)


# ── Request models ────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    model: Optional[str] = None
    api_key: str  # frontend sends this; middleware reads it

class SummarizeRequest(BaseModel):
    text: str
    model: Optional[str] = None
    api_key: str


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/chat")
async def chat(body: ChatRequest):
    """
    Simple chat endpoint.
    get_llm_from_context() reads the user's key from BYOKMiddleware context —
    no need to pass it explicitly here.
    """
    llm = get_llm_from_context(model=body.model)
    response = await llm.ainvoke([HumanMessage(content=body.message)])
    return {"response": response.content}


@app.post("/api/summarize")
async def summarize(body: SummarizeRequest):
    """
    LangChain pipeline example — the LLM uses the user's key automatically.
    """
    llm = get_llm_from_context(model=body.model)

    prompt = ChatPromptTemplate.from_messages([
        SystemMessage(content="You are a concise summarizer. Summarize in 2-3 sentences."),
        HumanMessage(content="Summarize this: {text}"),
    ])

    chain = prompt | llm | StrOutputParser()
    summary = await chain.ainvoke({"text": body.text})
    return {"summary": summary}


@app.post("/api/chat/stream")
async def chat_stream(body: ChatRequest):
    """Streaming SSE endpoint."""
    llm = get_llm_from_context(model=body.model, streaming=True)

    async def generate():
        async for chunk in llm.astream([HumanMessage(content=body.message)]):
            if chunk.content:
                import json
                yield f"data: {json.dumps({'token': chunk.content})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
