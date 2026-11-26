FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node grade.mjs server.mjs ./
ENV HOST=0.0.0.0 PORT=8787
EXPOSE 8787
USER node
CMD ["node", "server.mjs"]
