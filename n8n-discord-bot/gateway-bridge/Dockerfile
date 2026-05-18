FROM node:20-alpine

WORKDIR /app

COPY package.json ./

RUN npm install --omit=dev

COPY src ./src

ENV NODE_ENV=production \
    TZ=Asia/Riyadh

CMD ["node", "src/index.js"]
