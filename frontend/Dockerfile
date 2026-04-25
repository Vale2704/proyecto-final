FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 5173
ENV VITE_PROXY_API=http://backend:5000
CMD ["npm", "run", "dev"]
