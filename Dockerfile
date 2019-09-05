FROM rowsheet/public_docker_base:v0.0.1

# Install nginx.
RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get -y update
RUN apt-get install -y nginx

# Copy the nginx config.
COPY ./nginx_config /etc/nginx/sites-available/default

# Copy the app.
COPY ./app /app
RUN cd /app && npm install

# Setup entrypoint.
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod 755 /usr/local/bin/docker-entrypoint.sh
RUN ln -s /usr/local/bin/docker-entrypoint.sh / # backwards compat
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["postgres"]
