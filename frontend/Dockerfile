# Multi-stage production image for the HMB frontend.
# Stage 1 builds the static bundle; stage 2 serves it with nginx.
#
# Vite inlines VITE_* variables at BUILD time, so they're passed as build args:
#   docker build -t hmb-frontend \
#     --build-arg VITE_API_URL=https://api.hmb.app \
#     --build-arg VITE_MAPBOX_TOKEN=pk.xxxxx .

# --- Build stage ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ARG VITE_MAPBOX_TOKEN
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN
RUN npm run build

# --- Serve stage ---
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
