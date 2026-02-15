# Stage 1: Build the application
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production environment
FROM node:24-alpine
WORKDIR /app
COPY --from=builder /app/.output ./
CMD ["node", "./server/index.mjs"]
