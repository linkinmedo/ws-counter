# build stage
FROM node:lts-alpine as build-stage
RUN apk add --no-cache yarn
WORKDIR /api
COPY package.json ./
COPY yarn.lock ./
COPY tsconfig.json ./
COPY src ./src
COPY .env ./
RUN ls -a
RUN yarn install
RUN yarn build

# production stage
FROM keymetrics/pm2:latest-alpine as production-stage
COPY package.json ./
COPY .env ./
RUN yarn install --prod
COPY ecosystem.config.js ./ 
COPY --from=build-stage /api/dist ./dist
EXPOSE 8999
CMD [ "pm2-runtime", "start", "ecosystem.config.js" ]
