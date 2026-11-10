FROM node:20-bookworm-slim AS deps
WORKDIR /app/apps/web
COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci

FROM deps AS build
ARG BACKEND_PROXY_TARGET=http://api:3001
ENV BACKEND_PROXY_TARGET=$BACKEND_PROXY_TARGET
COPY apps/web/ ./
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app/apps/web
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/apps/web/.next ./.next
COPY --from=build /app/apps/web/public ./public
COPY --from=build /app/apps/web/next.config.ts ./next.config.ts
EXPOSE 3000
CMD ["npm", "run", "start"]
