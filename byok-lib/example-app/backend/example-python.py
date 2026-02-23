import os
import sys
import json

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../backend-python/src"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

from backend_python.byok_middleware import BYOKMiddleware
from backend_python.llm_factory import get_llm_from_context

from langchain_core.messages import HumanMessage

app = FastAPI(title="BYOK Example — Python")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.add_middleware(BYOKMiddleware)


class ChatRequest(BaseModel):
    message: str
    model: Optional[str] = None
    api_key: str


@app.get("/health")
async def health():
    return {"status": "ok", "backend": "python"}


@app.post("/api/chat")
async def chat(body: ChatRequest):
    llm = get_llm_from_context(model=body.model)
    result = await llm.ainvoke([HumanMessage(content=body.message)])
    return {"response": result.content}


@app.post("/api/chat/stream")
async def chat_stream(body: ChatRequest):
    llm = get_llm_from_context(model=body.model, streaming=True)

    async def generate():
        async for chunk in llm.astream([HumanMessage(content=body.message)]):
            if chunk.content:
                yield f"data: {json.dumps({'token': chunk.content})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
