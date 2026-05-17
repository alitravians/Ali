FROM n8nio/n8n:latest

USER root

RUN mkdir -p /data /home/node/.n8n \
    && chown -R node:node /data /home/node/.n8n

USER node

ENV N8N_USER_FOLDER=/home/node/.n8n \
    DB_TYPE=sqlite \
    DB_SQLITE_DATABASE=/data/database.sqlite \
    N8N_PORT=5678 \
    N8N_PROTOCOL=https \
    GENERIC_TIMEZONE=Asia/Riyadh \
    TZ=Asia/Riyadh \
    EXECUTIONS_MODE=regular \
    N8N_DEFAULT_LOCALE=ar

EXPOSE 5678

CMD ["n8n", "start"]
