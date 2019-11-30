import { env } from "shelljs";
import tmp from "tmp";

export const diskCacheDir: string =
  env["ELEVATION_TILE_CACHE_DIR"] || tmp.dirSync().name;
export const inMemoryCacheMaxTiles = 100;

// Based on native resolutions in https://github.com/tilezen/joerd/blob/master/docs/data-sources.md, -1 because of 512px tile resolution
export const zoom = 13;

export const tileResolution = 512;
