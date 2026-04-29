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
# Defensive: ensure ``davey`` (DAVE protocol) is NEVER installed. If it
# leaks in via a transitive dependency or a future requirements edit, this
# uninstall keeps ``has_dave=False`` in discord.py so the bot never opts
# into DAVE end-to-end encryption. See requirements.txt for the full
# explanation.
RUN pip uninstall -y davey || true

COPY bot ./bot
COPY server_config.json ./server_config.json

CMD ["python", "-m", "bot.main"]
