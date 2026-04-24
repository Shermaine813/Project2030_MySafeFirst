# Use Node 20 slim for a smaller, faster container
FROM node:20-slim

# Set the working directory
WORKDIR /usr/src/app

# Copy package files first (for better caching)
COPY package*.json ./

# Install ALL dependencies (including devDependencies needed for build)
RUN npm install

# Copy all project files
COPY . .

# Run the build: 
# 1. Vite compiles the frontend
# 2. TSC compiles the backend into /dist
RUN npm run build

# Remove dev dependencies to keep the final image light
RUN npm prune --production

# Expose port 8080 (Cloud Run's default)
EXPOSE 8080
ENV PORT=8080

# Start using the compiled JavaScript file
CMD ["npm", "start"]
