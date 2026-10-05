# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install all dependencies (including devDependencies for build)
COPY package.json package-lock.json ./
RUN npm ci

# Generate Prisma Client for the current platform
COPY src/prisma/ ./src/prisma/
RUN npx prisma generate --schema=src/prisma/schema.prisma

# Copy source and build TypeScript
COPY src/ ./src/
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy production dependencies, built code, and Prisma artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/prisma ./src/prisma
COPY package.json ./

EXPOSE 4000

CMD ["node", "dist/index.js"]
