FROM nginx:alpine
COPY html/ /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/
COPY imagenes/ /usr/share/nginx/html/imagenes/
EXPOSE 80