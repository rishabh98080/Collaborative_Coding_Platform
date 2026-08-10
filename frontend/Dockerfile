FROM node:20-alpine
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Build the app
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Expose port and run
EXPOSE 3001
ENV PORT=3001
CMD ["npm", "run", "start"]
