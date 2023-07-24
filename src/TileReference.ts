import * as config from "./config";
export interface TileReference {
  x: number;
  y: number;
  zoom: number;
}

export interface TilePosition {
  x: number;
  y: number;
  ref: TileReference;
}

export function getTileKey(reference: TileReference): string {
  return reference.x + "-" + reference.y + "-" + reference.zoom;
}
export function getTilePosition(coords: LngLat, zoom: number): TilePosition {
  const lat = coords[1];
  const lon = coords[0];
  const x = ((lon + 180) / 360) * Math.pow(2, zoom);
  const y =
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
      ) /
        Math.PI) /
      2) *
    Math.pow(2, zoom);
  return {
    x: (x % 1) * config.tileResolution,
    y: (y % 1) * config.tileResolution,
    ref: { x: Math.floor(x), y: Math.floor(y), zoom: zoom },
  };
}

export function getTileReferencePath(ref: TileReference) {
  return ref.zoom + "/" + ref.x + "/" + ref.y + ".tif";
}
