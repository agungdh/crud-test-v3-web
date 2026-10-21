# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:24-bookworm-slim AS build

WORKDIR /app

# Install dependencies first so Docker can cache this layer
COPY package.json package-lock.json ./
RUN npm ci

# Build the static Angular bundle
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM nginx:stable-bookworm AS runtime

# SPA-aware nginx config (history API fallback + asset caching)
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Angular application builder emits browser assets to dist/<project>/browser
COPY --from=build /app/dist/untitled/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
