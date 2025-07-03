import { spawn } from "child_process";
import {
  DiskCacheTileProvider,
  HTTPTileProvider,
  TileProvider,
} from "./TileProvider";
import { TileReference, getTileKey, getTilePosition } from "./TileReference";
import * as config from "./config";
import { LngLat } from "./geo";

type TileInfo = {
  ref: TileReference;
  positions: LngLat[];
  coordIndices: number[];
};

// Lowest point on earth. Data holes are represented as large negative values so should be filtered out.
const minAllowedElevation = -430;

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

  async batchGet(coords: LngLat[]): Promise<(number | null)[]> {
    const coordsByTile = new Map<string, TileInfo>();
    coords.forEach((coord, index) => {
      const tilePosition = getTilePosition(coord, this.zoom);
      const tileKey = getTileKey(tilePosition.ref);
      let tileInfo = coordsByTile.get(tileKey);
      if (!tileInfo) {
        tileInfo = {
          ref: tilePosition.ref,
          positions: [],
          coordIndices: [],
        };
        coordsByTile.set(tileKey, tileInfo);
      }
      tileInfo.coordIndices.push(index);
      tileInfo.positions.push([tilePosition.x, tilePosition.y]);
    });

    const elevationsByIndices = await Promise.all(
      Array.from(coordsByTile.values()).map(async (tileInfo) => {
        const elevations = await this.lookupForTile(
          tileInfo.ref,
          tileInfo.positions
        );
        return tileInfo.coordIndices.map((originalIndex, arrayIndex) => [
          originalIndex,
          elevations[arrayIndex],
        ]) as [number, number | null][];
      })
    );

    const elevations: (number | null)[] = new Array(coords.length);
    elevationsByIndices.flat().forEach((indexAndElevation) => {
      const index = indexAndElevation[0];
      const elevation = indexAndElevation[1];
      elevations[index] =
        elevation !== null
          ? new Number(elevation.toFixed(config.fractionalDigits)).valueOf()
          : null;
    });

    return elevations;
  }

  private async lookupForTile(
    tileReference: TileReference,
    positions: [number, number][]
  ): Promise<(number | null)[]> {
    const tilePath = await this.provider.get(tileReference);
    return new Promise((resolve, reject) => {
      const process = spawn("gdallocationinfo", ["-valonly", tilePath]);

      process.stdin.write(
        positions.map((pair) => pair[0] + " " + pair[1]).join("\n") + "\n"
      );
      process.stdin.end();
      let result = "";
      let error = "";
      process.stdout.on("data", (data) => {
        result += data;
      });
      process.stderr.on("data", (data) => {
        error += data;
      });
      process.on("close", (code) => {
        if (code === 0) {
          const elevations: (number | null)[] = result
            .split("\n")
            // Remove empty entry after trailing newline
            .slice(0, -1)
            .map((elevationString) => parseFloat(elevationString))
            .map((elevation, index) => {
              if (isNaN(elevation) || elevation < minAllowedElevation) {
                console.warn(
                  "Invalid elevation value at position " +
                    positions[index] +
                    " for tile " +
                    tilePath +
                    ": " +
                    elevation
                );
                return null;
              }

              return elevation;
            });
          resolve(elevations);
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
