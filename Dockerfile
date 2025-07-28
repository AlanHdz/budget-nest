
# ---- BASE ----
FROM node:24.4.1-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./


# --- Development ---
FROM base as development
RUN npm install
EXPOSE 3000
CMD [ "npm", "run", "dev" ]

# --- Etapa BUILDER_BASE ----
# Instalar todas las dependencias para poder correr tests
FROM base AS builder_base
RUN npm install
COPY . .

# --- Tests -----
FROM builder_base as test
RUN npx prisma generate
CMD [ "npm", "run", "test" ]

# --- Etapa BUILD ---
FROM builder_base AS build
RUN npx prisma generate
RUN npm run build

# --- Production ---
FROM base as production
RUN npm install --only=production
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /usr/src/app/prisma ./prisma
COPY --from=build /usr/src/app/generated ./generated
EXPOSE 3000
CMD [ "sh", "-c", "npx prisma migrate deploy && node dist/main.js" ]
