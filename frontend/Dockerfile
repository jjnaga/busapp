FROM node:20-alpine as build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build -- --configuration production

# Stage 2: Serve the app with Nginx
FROM nginx

# https://forums.docker.com/t/running-nginx-official-image-as-non-root/135759/17
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init

COPY ./nginx.conf /etc/nginx/nginx.conf

COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

RUN adduser --system --uid 1000 --no-create-home --disabled-login --group nginxuser


# Change ownership for Nginx directories
RUN chown -R nginxuser:nginxuser /var/cache/nginx \
    && chown -R nginxuser:nginxuser /var/log/nginx \
    && chown -R nginxuser:nginxuser /etc/nginx/conf.d \
    && touch /var/run/nginx.pid \
    && chown -R nginxuser:nginxuser /var/run/nginx.pid

USER nginxuser

EXPOSE 8080

ENTRYPOINT ["dumb-init", "nginx", "-g", "daemon off;"]