import ElevationCache from "./ElevationCache";
import { LngLat } from "./geo";
import TileService from "./TileService";

export default class ElevationService {
  private tileService: TileService;
  private elevationCache: ElevationCache | null;

  constructor(tileService: TileService, elevationCache: ElevationCache | null) {
    this.elevationCache = elevationCache;
    this.tileService = tileService;
  }

  async batchGet(coords: LngLat[]): Promise<(number | null)[]> {
    if (this.elevationCache) {
      const elevations = await this.elevationCache.batchGet(coords);

      // TODO: Make use of partial cache hits.
      if (!elevations.includes("miss")) {
        return elevations as (number | null)[];
      }
    }

    const elevations = await this.tileService.batchGet(coords);

    this.elevationCache?.batchPut(
      coords.map((coord, index) => [coord[0], coord[1], elevations[index]])
    );
    return elevations;
  }
}
