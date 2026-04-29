FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# No native audio libs needed. Lavalink (the separate `music-lavalink-am`
# fly.io app) handles ffmpeg, opus, PyNaCl and the DAVE/MLS handshake. This
# Python service only speaks the Discord *gateway* (text WebSocket) and the
# Lavalink REST/WS API -- both pure-Python.
RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY bot ./bot
COPY server_config.json ./server_config.json

CMD ["python", "-m", "bot.main"]
