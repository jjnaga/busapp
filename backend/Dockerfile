# Stage 1: Build
FROM node:20 as build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of your application's code
COPY . .

RUN npm run build

# Stage 2: Run
FROM node:20 as runtime

WORKDIR /app

COPY --from=build /app/build ./build
COPY --from=build /app/package*.json ./

RUN npm install ci --only-production

COPY --from=build /app/.env .

# Set non-root user
USER node

# Start app
CMD ["node", "--unhandled-rejections=strict", "--env-file=.env", "build/index.js"]


