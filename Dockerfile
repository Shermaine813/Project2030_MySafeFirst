# Use the official Node image
FROM node:20-slim

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your code
COPY . .

# CRITICAL: Build the React frontend into the /dist folder
RUN npm run build

# Set environment to production
ENV NODE_ENV=production

# Cloud Run injects the PORT variable; we just need to start the server
EXPOSE 8080

# Use the start script from your package.json
CMD [ "npm", "start" ]
