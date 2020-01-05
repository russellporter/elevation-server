#!/bin/sh
set -e

redis-server --dir /var/cache/elevation-tiles/ --daemonize yes

exec "$@"