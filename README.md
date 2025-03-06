# Installation

1. Install GDAL 2.4+ compiled with `--with-libtiff=internal --with-geotiff=internal`
2. `npm install`
3. `npm run build`

(or just run the docker container)

# Configuration

Set `ELEVATION_TILE_CACHE_DIR` to the dir you want the GeoTIFF tiles to be cached in

If you want to add an in memory cache of elevation points, set `ELEVATION_CACHE_REDIS_URL` to the URL for a Redis server.

# Usage

The service has a single API. Post latitude-longitude pairs as a JSON array to the service and receive an array of elevations as response. In case there is a no elevation data at a provided point (due to a data hole) the response will contain `null` for that point.

```sh
curl -d '[[51.3, 13.4], [51.4, 13.3]]' -XPOST -H 'Content-Type: application/json' http://localhost:3000
```

# Credits

Inspired by https://github.com/racemap/elevation-service/
