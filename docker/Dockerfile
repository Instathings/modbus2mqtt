FROM node:12.16.2

WORKDIR /app
COPY package.json .

RUN apt-get update
RUN apt-get install git
RUN npm i

COPY lib ./lib
COPY index.js docker/run.sh data/configuration.yaml ./

RUN chmod +x /app/run.sh
RUN mkdir /app/data

ARG COMMIT
RUN echo "{\"hash\": \"$COMMIT\"}" > .hash.json

ENTRYPOINT ["./run.sh"]
