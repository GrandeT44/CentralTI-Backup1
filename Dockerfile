FROM node:26-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM node:26-alpine
WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/server ./server
COPY --from=build /app/dist ./dist
ENV PORT=8080 HOST=0.0.0.0 CENTRAL_TI_DB_PATH=/app/local-data/central-ti.sqlite
EXPOSE 8080
CMD ["node", "server/index.mjs"]
