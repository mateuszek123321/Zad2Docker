FROM node:18-alpine3.20

RUN apk update && \
	apk upgrade && \
    apk add --no-cache curl && \
    addgroup -S nodeapp && \
    adduser -S -G nodeapp nodeapp

#katalog roboczy
WORKDIR /usr/app

ENV PORT=80

#etykieta OCI 
LABEL org.opencontainers.image.authors="mateusz kłos"

#kopiujemy plik aplikacji do obrazu
COPY package.json WeatherApp.js ./

# instalacja zależności
RUN npm install && \
    chown -R nodeapp:nodeapp /usr/app

#uzytkownik nieuprzywilejowany 
USER nodeapp

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=1s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1


CMD [ "node", "WeatherApp.js" ]