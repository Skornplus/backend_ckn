FROM node:19

WORKDIR /usr/src/app
COPY . .

RUN npm install

ARG PORT=5900
ENV PORT=${PORT}

CMD [ "node", "backendckn.js" ]
