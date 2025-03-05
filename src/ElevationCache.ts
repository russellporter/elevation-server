import geohash from "ngeohash";
import { createClient, RedisClientType } from "redis";
import { fractionalDigits } from "./config";
import { LngLat, LngLatMaybeEle } from "./geo";

export default class ElevationCache {
  private client: RedisClientType;
  constructor(redisCacheURL: string) {
    this.client = createClient({ url: redisCacheURL });

    this.client.connect();
  }

  async batchGet(coords: LngLat[]): Promise<(number | null | "miss")[]> {
    const operations = coords.map((coord) => {
      const [hashKey, hashField] = this.hash(coord);
      return this.client.HGET("e:" + hashKey, hashField);
    });

    const results = await Promise.all(operations);

    return results.map((match) => {
      if (match === undefined) {
        return "miss";
      }
      return match !== "" ? Number.parseFloat(match) : null;
    });
  }

  async batchPut(coordsWithElevation: LngLatMaybeEle[]): Promise<void> {
    const operations = coordsWithElevation.map((coord) => {
      const [hashKey, hashField] = this.hash(coord);

      return this.client.HSET(
        "e:" + hashKey,
        hashField,
        coord[2]?.toFixed(fractionalDigits) ?? ""
      );
    });
    await Promise.all(operations);
  }

  private hash(coords: LngLat | LngLatMaybeEle): [string, string] {
    const geo = geohash.encode(coords[1], coords[0], 9);
    // Allocate a redis hash for a ±2.4 km area
    const hashKey = geo.slice(0, 5);
    const hashField = geo.slice(-4);
    return [hashKey, hashField];
  }
}
