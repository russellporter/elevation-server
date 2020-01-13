#!/bin/sh
set -e

redis-server --dir /var/cache/elevation-tiles/ --appendonly yes --daemonize yes

exec "$@"
