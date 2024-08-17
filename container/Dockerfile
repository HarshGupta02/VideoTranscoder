FROM node:18-alpine

RUN apk update
RUN apk upgrade
RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm install

# COPY index.js .
COPY index_hls.js .
RUN mkdir -p Outputs/360p Outputs/480p Outputs/720p

CMD [ "npm", "start" ]