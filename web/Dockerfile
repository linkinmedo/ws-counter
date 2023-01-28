# build stage
FROM node:16-alpine as build-stage
RUN apk add --no-cache yarn
WORKDIR /app
COPY package.json ./
COPY yarn.lock ./
RUN yarn install
COPY . .
RUN yarn build

# production stage
FROM nginx:stable-alpine as production-stage
EXPOSE 80
RUN apk update; \
    apk upgrade;
RUN apk add --no-cache certbot python3 python3-dev py3-pip build-base libressl-dev musl-dev libffi-dev && \
    pip3 install pip --upgrade && \
    pip3 install certbot-nginx;
COPY nginx/nginx.conf /etc/nginx/nginx.conf
RUN mkdir /var/www && mkdir /var/www/html && mkdir /var/www/html/web && touch /var/www/html/web/index.html
COPY nginx/ws.conf /etc/nginx/conf.d/default.conf
COPY --from=build-stage /app/dist /usr/share/nginx/html
RUN echo '0 */12 * * * root certbot -q renew --nginx' > /etc/crontabs/root
CMD [ "sh", "-c", "crond -l 2 && nginx -g 'daemon off;'" ]
