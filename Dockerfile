FROM ghcr.io/osgeo/gdal:ubuntu-small-3.9.1

ENV ROOTDIR=/usr/local/

# Install node
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash
RUN apt-get -y install nodejs

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

ENV NODE_ENV=production

ENV ELEVATION_TILE_CACHE_DIR=/var/cache/elevation-tiles

RUN mkdir $ELEVATION_TILE_CACHE_DIR

RUN useradd -ms /bin/bash node

USER node

COPY docker-entrypoint.sh /usr/local/bin/

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

EXPOSE 3000

CMD ["node", "dist/server.js"]