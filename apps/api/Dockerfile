FROM node:20-bookworm-slim AS deps
WORKDIR /app/apps/api
COPY apps/api/package.json apps/api/package-lock.json ./
RUN npm ci

FROM deps AS build
COPY apps/api/ ./
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app/apps/api
ENV PORT=3001
COPY apps/api/package.json apps/api/package-lock.json ./
# ts-node cần cho `migration:run` (TypeORM đọc data-source.ts)
RUN npm ci
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/src ./src
COPY --from=build /app/apps/api/tsconfig.json ./tsconfig.json
ENV NODE_ENV=production
EXPOSE 3001
CMD ["sh", "-c", "npm run migration:run && node dist/main.js"]
