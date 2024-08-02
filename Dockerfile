FROM ghcr.io/osgeo/gdal:ubuntu-small-3.9.1

ENV ROOTDIR /usr/local/

# Install Redis
RUN apt-get update
RUN apt-get install -y curl gpg lsb-release
RUN curl -fsSL https://packages.redis.io/gpg | gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
RUN echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/redis.list
RUN apt-get update
RUN apt-get install -y redis

# Install node
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash
RUN apt-get -y install nodejs

RUN sed -i 's/^hash-max-listpack-entries 512$/hash-max-listpack-entries 1024/' /etc/redis/redis.conf

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src

RUN npm ci --unsafe-perm

ENV NODE_ENV production

ENV ELEVATION_TILE_CACHE_DIR /var/cache/elevation-tiles
ENV ELEVATION_CACHE_REDIS_URL //127.0.0.1:6379

RUN mkdir $ELEVATION_TILE_CACHE_DIR

RUN useradd -ms /bin/bash node

USER node

COPY docker-entrypoint.sh /usr/local/bin/

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

EXPOSE 3000

CMD ["node", "dist/server.js"]