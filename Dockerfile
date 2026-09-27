# --- build stage: compile the client ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci

COPY client client
COPY server server
RUN npm run build -w client

# --- runtime stage: prod deps + server code + built client ---
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci --omit=dev

COPY server/src server/src
COPY --from=build /app/client/dist client/dist

# The OpenRouter key is injected at runtime, never baked into the image.
USER node
EXPOSE 8787
CMD ["npm", "run", "start", "-w", "server"]
