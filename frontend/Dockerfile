# --- Build stage ---
FROM node:20-alpine as build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build -- --configuration production

# --- Runtime stage ---
FROM nginxinc/nginx-unprivileged:1.27-alpine

# Copy config + static files; ensure the unprivileged user (uid 101) owns them
COPY --chown=101:101 ./nginx.conf /etc/nginx/nginx.conf
COPY --chown=101:101 --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 9080
# No USER needed (image already runs as uid 101)
# No dumb-init needed (keep attack surface minimal)
