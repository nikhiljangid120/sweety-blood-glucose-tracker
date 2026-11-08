FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["sh", "-c", "node src/scripts/migrate.js && node src/scripts/seed.js && node src/server.js"]
