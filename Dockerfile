FROM node:12

ENV ROOTDIR /usr/local/

# Install Redis
WORKDIR $ROOTDIR/src
ENV REDIS_VERSION 5.0.7
ADD http://download.redis.io/releases/redis-${REDIS_VERSION}.tar.gz .
RUN tar xzf redis-${REDIS_VERSION}.tar.gz
RUN cd redis-${REDIS_VERSION} && make && make install

# Install GDAL, based on https://github.com/GeographicaGS/Docker-GDAL2/blob/master/2.4.3/Dockerfile
ENV GDAL_VERSION 2.4.3
ENV OPENJPEG_VERSION 2.3.1

WORKDIR $ROOTDIR/

# Load assets

ADD http://download.osgeo.org/gdal/${GDAL_VERSION}/gdal-${GDAL_VERSION}.tar.gz $ROOTDIR/src/
ADD https://github.com/uclouvain/openjpeg/archive/v${OPENJPEG_VERSION}.tar.gz $ROOTDIR/src/openjpeg-${OPENJPEG_VERSION}.tar.gz

# Install basic dependencies
RUN apt-get update -y && apt-get install -y \
    software-properties-common \
    build-essential \
    python-dev \
    python3-dev \
    python-numpy \
    python3-numpy \
    libspatialite-dev \
    sqlite3 \
    libpq-dev \
    libcurl4-gnutls-dev \
    libproj-dev \
    libxml2-dev \
    libgeos-dev \
    libnetcdf-dev \
    libpoppler-dev \
    libspatialite-dev \
    libhdf4-alt-dev \
    libhdf5-serial-dev \
    bash-completion \
    cmake \
    # Custom addition needed for ZSTD support
    libzstd-dev

# Compile and install OpenJPEG
RUN cd src && tar -xvf openjpeg-${OPENJPEG_VERSION}.tar.gz && cd openjpeg-${OPENJPEG_VERSION}/ \
    && mkdir build && cd build \
    && cmake .. -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=$ROOTDIR \
    && make && make install && make clean \
    && cd $ROOTDIR && rm -Rf src/openjpeg*

# Compile and install GDAL
RUN cd src && tar -xvf gdal-${GDAL_VERSION}.tar.gz && cd gdal-${GDAL_VERSION} \
    && ./configure --with-python --with-spatialite --with-pg --with-curl --with-openjpeg \
    # Custom addition needed for LERC compression of GeoTIFFs
    --with-libtiff=internal --with-geojson=internal \
    && make -j $(nproc) && make install && ldconfig \
    && apt-get update -y \
    && cd $ROOTDIR && cd src/gdal-${GDAL_VERSION}/swig/python \
    && python3 setup.py build \
    && python3 setup.py install \
    && apt-get remove -y --purge build-essential \
    python-dev \
    python3-dev \
    && cd $ROOTDIR && rm -Rf src/gdal*

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
RUN chown node:node $ELEVATION_TILE_CACHE_DIR

USER node

COPY docker-entrypoint.sh /usr/local/bin/

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

EXPOSE 3000

CMD ["node", "dist/server.js"]