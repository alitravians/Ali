from fastapi import FastAPI, Query
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI(title="TTS Proxy")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

GOOGLE_TTS_URL = "https://translate.googleapis.com/translate_tts"

@app.get("/tts")
async def tts(q: str = Query(..., description="Text to speak"), tl: str = Query("ar", description="Language")):
    params = {"client": "gtx", "ie": "UTF-8", "tl": tl, "q": q}
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://translate.google.com/",
    }
    async with httpx.AsyncClient(follow_redirects=False) as client:
        resp = await client.get(GOOGLE_TTS_URL, params=params, headers=headers)
        if resp.status_code == 200:
            return Response(
                content=resp.content,
                media_type="audio/mpeg",
                headers={"Cache-Control": "public, max-age=86400"},
            )
        return Response(content=resp.text, status_code=resp.status_code)

@app.get("/health")
async def health():
    return {"status": "ok"}
