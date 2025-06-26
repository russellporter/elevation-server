import tmp from "tmp";

export const diskCacheDir: string =
  process.env["ELEVATION_TILE_CACHE_DIR"] || tmp.dirSync().name;
export const inMemoryCacheMaxTiles = 100;

// Based on native resolutions in https://github.com/tilezen/joerd/blob/master/docs/data-sources.md, -1 because of 512px tile resolution
// Zoom reduced to 12 as it seems to have less data holes / stitching issues
export const zoom = 12;

export const tileResolution = 512;

export const fractionalDigits = 2;

