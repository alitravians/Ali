FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# ffmpeg is required by discord.py voice + yt-dlp post-processing.
# libopus0 is required by PyNaCl for voice encoding.
RUN apt-get update && apt-get install -y --no-install-recommends \
        ffmpeg \
        libopus0 \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# IMPORTANT: ``davey`` (DAVE protocol) MUST be present here -- discord.py
# 2.7+ raises ``RuntimeError('davey library needed in order to use voice')``
# at VoiceClient construction time if it isn't. The DAVE protocol is
# disabled at runtime instead, by ``bot/main.py::_disable_dave_protocol``.

COPY bot ./bot
COPY server_config.json ./server_config.json

CMD ["python", "-m", "bot.main"]
