FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY bot ./bot
COPY server_config.json ./server_config.json

# Build metadata (passed via --build-arg from CI / fly deploy)
ARG BOT_BUILD_SHA="unknown"
ARG BOT_BUILD_MSG=""
ARG BOT_BUILD_DATE=""
ENV BOT_BUILD_SHA=${BOT_BUILD_SHA} \
    BOT_BUILD_MSG=${BOT_BUILD_MSG} \
    BOT_BUILD_DATE=${BOT_BUILD_DATE}

# Persistent data goes here (mounted volume on fly.io)
RUN mkdir -p /data
ENV DB_PATH=/data/competitions.db

CMD ["python", "-m", "bot.main"]
