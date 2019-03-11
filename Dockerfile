FROM node:alpine
WORKDIR '/root/.credentials'
ADD .credentials .
WORKDIR '/app'
COPY ./package.json ./
RUN npm install
COPY . .
CMD [ "node", "index.js" ]
