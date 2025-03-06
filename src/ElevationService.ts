import ElevationCache from "./ElevationCache";
import { LngLat } from "./geo";
import TileService from "./TileService";

export default class ElevationService {
  private tileService: TileService;
  private alternateTileService: TileService;
  private elevationCache: ElevationCache | null;

  constructor(
    tileService: TileService,
    alternateTileService: TileService,
    elevationCache: ElevationCache | null
  ) {
    this.elevationCache = elevationCache;
    this.tileService = tileService;
    this.alternateTileService = alternateTileService;
  }

  async batchGet(coords: LngLat[]): Promise<(number | null)[]> {
    if (this.elevationCache) {
      const elevations = await this.elevationCache.batchGet(coords);

      // TODO: Make use of partial cache hits.
      if (!elevations.includes("miss")) {
        return elevations as (number | null)[];
      }
    }

    const alternateElevationsPromise =
      this.alternateTileService.batchGet(coords);
    const baseElevations = await this.tileService.batchGet(coords);
    const alternateElevations = await alternateElevationsPromise;

    // zip together the two arrays
    const elevations = baseElevations.map((elevation, index) => {
      const alternateElevation = alternateElevations[index];
      if (elevation !== null && alternateElevation !== null) {
        if (Math.abs(elevation - alternateElevation) > 100) {
          console.log(
            "Elevation mismatch: " +
              elevation +
              " vs " +
              alternateElevation +
              " at " +
              coords[index]
          );
          return alternateElevation;
        }
        return elevation;
      } else {
        return elevation !== null ? elevation : alternateElevation;
      }
    });

    this.elevationCache?.batchPut(
      coords.map((coord, index) => [coord[0], coord[1], elevations[index]])
    );
    return elevations;
  }
}
