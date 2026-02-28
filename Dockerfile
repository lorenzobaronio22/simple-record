# Stage 1: Build the application
FROM node:24-alpine AS builder
# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++ sqlite-dev
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production environment
FROM node:24-alpine
# Runtime dependency for better-sqlite3
RUN apk add --no-cache sqlite-libs
WORKDIR /app
COPY --from=builder /app/.output ./

# Create the data directory for SQLite volume mount
RUN mkdir -p /data
VOLUME ["/data"]

ENV NUXT_SQLITE_PATH=/data/simple-record.sqlite

CMD ["node", "./server/index.mjs"]
