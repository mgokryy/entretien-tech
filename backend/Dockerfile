# Étape 1 — Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copier les fichiers de dépendances et installer
COPY package*.json ./
RUN npm install

# Copier le reste du code
COPY . .

# Compiler TypeScript en JavaScript
RUN npm run build

# Étape 2 — Exécution
FROM node:20-alpine
WORKDIR /app

# Copier les fichiers compilés depuis l'étape builder
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# Installer uniquement les dépendances de production
RUN npm install --only=production

EXPOSE 4000
CMD ["node", "dist/index.js"]
