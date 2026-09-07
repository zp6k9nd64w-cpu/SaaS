# Simple Dockerfile for SAAS backend
FROM node:18-alpine
WORKDIR /app

# Copy backend package and install
COPY backend/package.json backend/package-lock.json* ./backend/
WORKDIR /app/backend
RUN npm ci --only=production || npm install --only=production

# Copy full project
WORKDIR /app
COPY . /app

WORKDIR /app/backend
EXPOSE 3000
CMD ["npm", "start"]
