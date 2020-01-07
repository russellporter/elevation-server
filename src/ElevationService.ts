import ElevationCache from "./ElevationCache";
import TileService from "./TileService";

export default class ElevationService {
  private tileService: TileService;
  private elevationCache: ElevationCache | null;

  constructor(tileService: TileService, elevationCache: ElevationCache | null) {
    this.elevationCache = elevationCache;
    this.tileService = tileService;
  }

  async batchGet(coords: [number, number][]): Promise<number[]> {
    if (this.elevationCache) {
      const elevations = await this.elevationCache.batchGet(coords);

      // TODO: Make use of partial cache hits.
      if (!elevations.includes(null)) {
        return elevations as number[];
      }
    }

    const elevations = await this.tileService.batchGet(coords);

    this.elevationCache &&
      this.elevationCache.batchPut(
        coords.map((coord, index) => [coord[0], coord[1], elevations[index]])
      );
    return elevations;
  }
}
