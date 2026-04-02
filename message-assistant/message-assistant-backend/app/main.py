from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.models import (
    AnalyzeRequest,
    AnalyzeResponse,
    RestyleRequest,
    RestyleResponse,
    TranslateRequest,
    TranslateResponse,
    ImproveRequest,
    ImproveResponse,
    Classification,
)
from app.services.analyzer import (
    analyze_message,
    restyle_reply,
    translate_text,
    improve_text,
)

app = FastAPI(title="AI Message Assistant API", version="1.0.0")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    try:
        result = await analyze_message(
            message=request.message,
            api_key=request.api_key,
            mode=request.mode.value,
            context=request.context,
            language=request.language,
        )

        classification = Classification(
            message_type=result["classification"]["message_type"],
            needs_reply=result["classification"]["needs_reply"],
            reply_level=result["classification"]["reply_level"],
            priority=result["classification"]["priority"],
            confidence=result["classification"]["confidence"],
            sentiment=result["classification"]["sentiment"],
            reasoning=result["classification"]["reasoning"],
        )

        return AnalyzeResponse(
            classification=classification,
            suggested_reply=result.get("suggested_reply", ""),
            message_explanation=result.get("message_explanation", ""),
            research_needed=result.get("research_needed", False),
            research_note=result.get("research_note", ""),
            sensitive_warning=result.get("sensitive_warning", False),
            sensitive_note=result.get("sensitive_note", ""),
            urgency_note=result.get("urgency_note", ""),
            should_reply_now=result.get("should_reply_now", True),
            needs_clarification=result.get("needs_clarification", False),
            clarification_note=result.get("clarification_note", ""),
        )
    except Exception as e:
        error_msg = str(e)
        if "api_key" in error_msg.lower() or "authentication" in error_msg.lower():
            raise HTTPException(status_code=401, detail="Invalid API key. Please check your OpenAI API key.")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {error_msg}")


@app.post("/api/restyle", response_model=RestyleResponse)
async def restyle(request: RestyleRequest):
    try:
        result = await restyle_reply(
            original_message=request.original_message,
            current_reply=request.current_reply,
            style=request.style.value,
            api_key=request.api_key,
        )

        return RestyleResponse(
            restyled_reply=result["restyled_reply"],
            style_used=result.get("style_used", request.style.value),
        )
    except Exception as e:
        error_msg = str(e)
        if "api_key" in error_msg.lower() or "authentication" in error_msg.lower():
            raise HTTPException(status_code=401, detail="Invalid API key.")
        raise HTTPException(status_code=500, detail=f"Restyle failed: {error_msg}")


@app.post("/api/translate", response_model=TranslateResponse)
async def translate(request: TranslateRequest):
    try:
        result = await translate_text(
            text=request.text,
            direction=request.direction.value,
            api_key=request.api_key,
        )

        return TranslateResponse(
            translated_text=result["translated_text"],
            direction=request.direction.value,
        )
    except Exception as e:
        error_msg = str(e)
        if "api_key" in error_msg.lower() or "authentication" in error_msg.lower():
            raise HTTPException(status_code=401, detail="Invalid API key.")
        raise HTTPException(status_code=500, detail=f"Translation failed: {error_msg}")


@app.post("/api/improve", response_model=ImproveResponse)
async def improve(request: ImproveRequest):
    try:
        result = await improve_text(
            text=request.text,
            api_key=request.api_key,
        )

        return ImproveResponse(
            improved_text=result["improved_text"],
            changes_made=result.get("changes_made", "Text improved"),
        )
    except Exception as e:
        error_msg = str(e)
        if "api_key" in error_msg.lower() or "authentication" in error_msg.lower():
            raise HTTPException(status_code=401, detail="Invalid API key.")
        raise HTTPException(status_code=500, detail=f"Improvement failed: {error_msg}")
