FROM node:20-bookworm-slim

ENV NODE_ENV=production \
    NPM_CONFIG_LOGLEVEL=warn

# ffmpeg + libopus for @discordjs/voice + opus encoding fallback
# python3/build-essential are needed by some optional native deps (sodium, opus).
RUN apt-get update && apt-get install -y --no-install-recommends \
        ffmpeg \
        libopus0 \
        ca-certificates \
        python3 \
        make \
        g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
# Install runtime deps. Skip optional dev/test/script lifecycle hooks.
RUN npm install --omit=dev --no-audit --no-fund

COPY src ./src
COPY server_config.json ./server_config.json

CMD ["node", "src/index.js"]
