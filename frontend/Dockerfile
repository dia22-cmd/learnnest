FROM node:18-slim

WORKDIR /app

# Copy dependency configs
COPY package.json package-lock.json ./

# Install npm packages
RUN npm ci

# Copy source code
COPY . .

EXPOSE 5173

# Start Vite development server
CMD ["npm", "run", "dev"]
