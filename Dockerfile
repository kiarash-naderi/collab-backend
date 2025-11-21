# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /app

# اول پکیج‌ها و tsconfig
COPY package*.json tsconfig.json ./
RUN npm ci

# بعد src و prisma
COPY src ./src
COPY prisma ./prisma

# بعد generate و build
RUN npx prisma generate
RUN npm run build   

# Runtime
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["node", "dist/server.js"]