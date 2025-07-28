
# ---- BASE ----
FROM node:24.4.1-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./dest

# --- Dependencies ----
# Instalar todas las dependencias para poder correr tests
FROM base as dependencies
RUN npm install
COPY . .

# --- Tests ---
FROM dependencies AS test
COPY . .
RUN npm run test

# ---- Build ---
FROM dependencies AS build
RUN npm run build
RUN npx prisma generate

# --- Production ---
FROM base as production
COPY --from=build /usr/src/app/package*.json ./
RUN npm install --only=production
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /usr/src/app/prisma ./prisma

EXPOSE 3000
CMD [ "sh", "-c", "npx prisma migrate dev && node dist/main.js" ]
