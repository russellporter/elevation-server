#!/bin/sh
set -e

chown -R node:node $ELEVATION_TILE_CACHE_DIR

exec "$@"
