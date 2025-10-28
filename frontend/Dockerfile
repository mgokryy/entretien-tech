# Étape 1 — Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Étape 2 — Exécution
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app ./

# Next.js utilise le port 3000 par défaut
EXPOSE 3000

CMD ["npm", "start"]
