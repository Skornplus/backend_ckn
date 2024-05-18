FROM node:19

WORKDIR /usr/src/app
COPY . .

RUN npm install
ENV PORT=${PORT}

EXPOSE 5900
CMD [ "node", "backendckn.js" ]
