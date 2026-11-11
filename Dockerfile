# Conecta Bancaribe V4.11.3 - contenedor de validación técnica (NO producción)
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-bookworm-slim
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
RUN groupadd --system --gid 1001 conecta && useradd --system --uid 1001 --gid conecta --home-dir /app conecta
COPY --from=builder --chown=conecta:conecta /app/package.json /app/package-lock.json ./
COPY --from=builder --chown=conecta:conecta /app/node_modules ./node_modules
COPY --from=builder --chown=conecta:conecta /app/.next ./.next
COPY --from=builder --chown=conecta:conecta /app/public ./public
RUN mkdir -p /app/data && chown -R conecta:conecta /app/data
USER conecta
EXPOSE 3000
CMD ["npm","run","start"]
