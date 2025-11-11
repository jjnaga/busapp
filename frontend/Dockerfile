FROM node:20-alpine as build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# Unprivileged NGINX (runs as uid 101)
FROM nginxinc/nginx-unprivileged:1.27-alpine

RUN apk add --no-cache dumb-init
COPY ./nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

USER 101
EXPOSE 9080
ENTRYPOINT ["dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]
