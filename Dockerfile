# Use a recent Node image
FROM node:20-alpine

# Work from the repo root
WORKDIR /app

# Copy the whole project into the image
COPY . .

# Move into the server folder where package.json lives
WORKDIR /app/server

# Install backend deps (including devDeps) and install tsx globally
RUN npm install --legacy-peer-deps --include=dev \
  && npm install -g tsx

# Environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose the port your app listens on
EXPOSE 8080

# Start the same entry file you use in dev, via global tsx
CMD ["tsx", "_core/index.ts"]
