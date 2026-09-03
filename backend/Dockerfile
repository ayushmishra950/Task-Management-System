# =========================
# Build Stage
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files first
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code + frontend build
COPY . .

# Type-check + build TypeScript to JavaScript
RUN npm run build


# =========================
# Production Stage
# =========================
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy dependency files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy backend compiled JavaScript
COPY --from=builder /app/dist ./dist

# Copy React frontend build
COPY --from=builder /app/build ./build

# Your backend port
EXPOSE 5000

# Start compiled JavaScript
CMD ["node", "dist/server.js"]
