FROM node:22-alpine
WORKDIR /app
COPY server.js index.html ./
ENV DATA_FILE=/data/data.json
VOLUME /data
EXPOSE 80
HEALTHCHECK CMD wget -qO- http://localhost/ >/dev/null || exit 1
CMD ["node", "server.js"]
