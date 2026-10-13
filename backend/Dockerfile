# ── Build ───────────────────────────────────────────────
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
# Dev dependencies are needed to compile, whatever NODE_ENV the platform passes in.
RUN npm ci --include=dev
COPY . .
RUN npm run build && npm prune --omit=dev

# ── Run ─────────────────────────────────────────────────
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/main.js"]
