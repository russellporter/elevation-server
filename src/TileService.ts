import { spawn } from "child_process";
import * as config from "./config";
import {
  DiskCacheTileProvider,
  HTTPTileProvider,
  TileProvider
} from "./TileProvider";
import { getTileKey, getTilePosition, TileReference } from "./TileReference";

type TileInfo = {
  ref: TileReference;
  positions: [number, number][];
  coordIndices: number[];
};

export default class TileService {
  private provider: TileProvider;
  private zoom: number;

  constructor(cacheDir: string, zoom: number) {
    this.provider = new DiskCacheTileProvider(
      new HTTPTileProvider(
        "https://elevation-tiles-prod.s3.amazonaws.com/geotiff"
      ),
      cacheDir
    );
    this.zoom = zoom;
  }

  async batchGet(coords: [number, number][]): Promise<number[]> {
    const coordsByTile = new Map<string, TileInfo>();
    coords.forEach((coord, index) => {
      const tilePosition = getTilePosition(coord, config.zoom);
      const tileKey = getTileKey(tilePosition.ref);
      let tileInfo = coordsByTile.get(tileKey);
      if (!tileInfo) {
        tileInfo = {
          ref: tilePosition.ref,
          positions: [],
          coordIndices: []
        };
        coordsByTile.set(tileKey, tileInfo);
      }
      tileInfo.coordIndices.push(index);
      tileInfo.positions.push([tilePosition.x, tilePosition.y]);
    });

    const elevationsByIndices = await Promise.all(
      Array.from(coordsByTile.values()).map(async tileInfo => {
        const elevations = await this.lookupForTile(
          tileInfo.ref,
          tileInfo.positions
        );
        return tileInfo.coordIndices.map((originalIndex, arrayIndex) => [
          originalIndex,
          elevations[arrayIndex]
        ]);
      })
    );

    const elevations = new Array(coords.length);
    elevationsByIndices.flat().forEach(indexAndElevation => {
      elevations[indexAndElevation[0]] = indexAndElevation[1];
    });

    return elevations;
  }

  async lookupForTile(
    tileReference: TileReference,
    positions: [number, number][]
  ): Promise<number[]> {
    const tilePath = await this.provider.get(tileReference);
    return new Promise((resolve, reject) => {
      const process = spawn("gdallocationinfo", ["-valonly", tilePath]);

      process.stdin.write(
        positions.map(pair => pair[0] + " " + pair[1]).join("\n") + "\n"
      );
      process.stdin.end();
      let result = "";
      let error = "";
      process.stdout.on("data", data => {
        result += data;
      });
      process.stderr.on("data", data => {
        error += data;
      });
      process.on("close", code => {
        if (code === 0) {
          const elevations = result
            .split("\n")
            // Remove empty entry after trailing newline
            .slice(0, -1)
            .map(elevationString => parseFloat(elevationString));
          if (elevations.some(value => isNaN(value))) {
            reject(
              "Invalid result: " +
                result +
                " request: " +
                positions +
                " tile: " +
                tilePath
            );
          } else {
            resolve(elevations);
          }
        } else {
          reject(
            "Failed lookup (code: " +
              code +
              ", path: " +
              tilePath +
              "): " +
              error
          );
        }
      });
    });
  }
}
