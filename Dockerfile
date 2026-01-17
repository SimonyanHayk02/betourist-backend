FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
# Needed because `@prisma/client` runs `prisma generate` on install.
COPY prisma/schema.prisma ./prisma/schema.prisma
RUN yarn install --frozen-lockfile

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn prisma:generate
RUN yarn build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json yarn.lock ./

EXPOSE 3000

# Run DB migrations on container start, then boot the API.
CMD ["sh", "-c", "yarn prisma:migrate:deploy && node dist/src/main.js"]


