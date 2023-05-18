#!/bin/sh
set -e

chown -R node:node $ELEVATION_TILE_CACHE_DIR

redis-server --dir $ELEVATION_TILE_CACHE_DIR --daemonize yes

exec "$@"
