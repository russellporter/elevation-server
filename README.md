# Installation

1. Install GDAL 2.4+ compiled with `--with-libtiff=internal --with-geotiff=internal`
2. `npm install` for the rest

# Configuration

Set `ELEVATION_TILE_CACHE_DIR` to the dir you want the GeoTIFF tiles to be cached in

If you want to add an in memory cache of elevation points, set `ELEVATION_CACHE_REDIS_URL` to the URL for a Redis server.
