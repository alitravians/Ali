FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY bot ./bot
COPY scripts ./scripts
# server_config.json is generated at first run by scripts/setup_server.py and
# is then expected to be present (Fly volume or committed alongside the image).
COPY server_config.json ./server_config.json
RUN if [ ! -f server_config.json ]; then echo '{"channels":{},"roles":{},"categories":{}}' > server_config.json; fi

EXPOSE 8080

CMD ["python", "-m", "bot.main"]
