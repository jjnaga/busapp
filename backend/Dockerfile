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
COPY .env .

RUN npm install ci --only-production
CMD ["npm", "run", "start"]


