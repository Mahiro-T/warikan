FROM denoland/deno:alpine-2.1.4

WORKDIR /app

# Install Node.js for npm packages (required by Fresh)
RUN apk add --no-cache nodejs npm

# Copy dependency files
COPY deno.json deno.lock ./

# Cache dependencies
RUN deno install

# Copy the rest of the application
COPY . .

# Expose the port
EXPOSE 8000

# Start the application
CMD ["deno", "task", "dev"]
