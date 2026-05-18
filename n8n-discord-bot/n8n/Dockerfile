FROM n8nio/n8n:1.74.1

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

# The upstream n8nio/n8n image's ENTRYPOINT already runs `n8n` (via tini +
# docker-entrypoint.sh). The CMD becomes the args passed to that script, so
# specifying ["n8n", "start"] would resolve to `n8n n8n start` and fail with
# "command n8n not found". Use ["start"] to keep behaviour identical to the
# default entrypoint.
CMD ["start"]
