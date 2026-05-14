FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System-level deps:
#  - libjpeg-turbo + zlib are needed by Pillow at runtime for JPEG/PNG.
#  - fonts-noto-color-emoji + fonts-noto-core give us proper arabic + emoji
#    glyph coverage for the welcome card renderer. `fonts-noto-core` (NOT
#    the non-existent `fonts-noto-naskh-arabic`) ships
#    /usr/share/fonts/truetype/noto/NotoNaskhArabic-{Regular,Bold}.ttf on
#    Debian bookworm — those exact paths are what `bot/welcome_card.py`
#    expects.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        fonts-noto-color-emoji \
        fonts-noto-core \
        libjpeg62-turbo \
        zlib1g \
    && rm -rf /var/lib/apt/lists/*

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
