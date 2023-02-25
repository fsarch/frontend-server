# Build Dockerfile
FROM node:18.12.0-bullseye-slim AS builder
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . ./
RUN npm run build

# Main Dockerfile
FROM node:18.12.0-bullseye-slim

WORKDIR /usr/src/app

ENV PORT 8080
ENV NODE_ENV production
ENV DATA_PATH /var/sfs/data

EXPOSE 8080

RUN mkdir -p /var/sfs/data

COPY package*.json ./
RUN npm install

COPY --from=builder /usr/src/app/build ./build

CMD ["node", "./build/index.js"]

