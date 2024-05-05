FROM node:19

WORKDIR /usr/src/app
COPY . .

RUN npm install
ENV PORT=5900

EXPOSE 5900
CMD [ "node", "tmpckn.js" ]
