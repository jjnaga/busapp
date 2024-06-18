# Stage 1: Build
FROM node:20 AS build

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
FROM node:20 AS runtime

# Set the working directory inside the container
WORKDIR /app

# Copy only the built files from the build stage
COPY --from=build /app/build ./build
COPY --from=build /app/package*.json ./
COPY .env .

# Install only production dependencies
RUN npm install ci --only=production

# Set the command to start the application
CMD ["npm", "run", "start"]