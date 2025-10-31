FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Generate Prisma Client di dalam container (Linux environment)
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]
