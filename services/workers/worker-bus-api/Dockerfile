# Stage 1: Build
FROM node:20-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of your application's code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Run
FROM node:20-alpine AS runtime

# Set Node environment to production
ENV NODE_ENV=production


# Set the working directory inside the container
WORKDIR /app

# Copy only the built files from the build stage
COPY --from=build /app/build ./build
COPY --from=build /app/package*.json ./

# Install only production dependencies
RUN npm install ci --only=production 

COPY --from=build /app/.env .

# Set non-root user
USER node

# Set the command to start the application
CMD ["node", "--unhandled-rejections=strict", "--env-file=.env", "build/index.js"]