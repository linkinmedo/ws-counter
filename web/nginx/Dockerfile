FROM nginx:1.21.4-alpine

RUN apk update; \
    apk upgrade;
RUN apk add --no-cache certbot python3 python3-dev py3-pip build-base libressl-dev musl-dev libffi-dev && \
    pip3 install pip --upgrade && \
    pip3 install certbot-nginx;
COPY nginx.conf /etc/nginx/nginx.conf
RUN mkdir /var/www && mkdir /var/www/html && mkdir /var/www/html/web && touch /var/www/html/web/index.html
COPY ws.conf /etc/nginx/conf.d/default.conf
COPY counter-web:/app/dist /var/www/html
RUN echo '0 */12 * * * root certbot -q renew --nginx' > /etc/crontabs/root
CMD [ "sh", "-c", "crond -l 2 && nginx -g 'daemon off;'" ]
