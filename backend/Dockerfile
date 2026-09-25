FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Create upload directory
RUN mkdir -p /app/uploads

EXPOSE 5000

CMD ["node", "src/server.js"]
