import redis from "redis";
import { promisify } from "util";

export default class ElevationCache {
  private redisMultiGet: (keys: string[]) => Promise<(string | null)[]>;
  private redisMultiSet: (keysAndValues: string[]) => Promise<boolean>;

  constructor(redisCacheURL: string) {
    const client = redis.createClient(redisCacheURL);
    this.redisMultiGet = promisify(client.mget).bind(client);
    this.redisMultiSet = promisify(client.mset).bind(client);
  }

  async batchGet(coords: [number, number][]): Promise<(number | null)[]> {
    const keys = coords.map(coord => coord[0] + "," + coord[1]);
    const elevationStrings = await this.redisMultiGet(keys);

    return elevationStrings.map(str =>
      str !== null ? Number.parseFloat(str) : null
    );
  }

  async batchPut(
    coordsWithElevation: [number, number, number][]
  ): Promise<void> {
    const keyedElevations = coordsWithElevation.map(coord => [
      coord[0] + "," + coord[1],
      coord[2].toString()
    ]);
    await this.redisMultiSet(keyedElevations.flat());
  }
}
