# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
# Note: Since we are using raw HTML/JS modules in this specific architecture 
# we might not strictly need 'npm run build' if we aren't bundling react yet,
# but keeping it here ensures future-proofing for Vite.
RUN npm run build 

# Stage 2: Run
FROM node:18-alpine AS runner
RUN apk add --no-cache tini
WORKDIR /app

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/server ./server
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.env ./

# Install prod dependencies
RUN npm ci --omit=dev

EXPOSE 4000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server/index.js"]
