import geohash from "ngeohash";
import { createClient, RedisClientType } from "redis";
import { fractionalDigits } from "./config";

export default class ElevationCache {
  private client: RedisClientType;
  constructor(redisCacheURL: string) {
    this.client = createClient({ url: redisCacheURL });

    this.client.connect();
  }

  async batchGet(coords: LngLat[]): Promise<(number | null)[]> {
    const operations = coords.map((coord) => {
      return this.client.GEOSEARCH(
        "elevation",
        {
          longitude: coord[0],
          latitude: coord[1],
        },
        { radius: 5, unit: "m" },
        {
          SORT: "ASC",
          COUNT: 1,
        }
      );
    });

    const results = await Promise.all(operations);

    return results.map((matches) =>
      matches.length !== 0 ? Number.parseFloat(matches[0].split(":")[1]) : null
    );
  }

  async batchPut(
    coordsWithElevation: [number, number, number][]
  ): Promise<void> {
    const operations = coordsWithElevation.map((coord) => {
      return this.client.GEOADD("elevation", {
        longitude: coord[0],
        latitude: coord[1],
        member:
          geohash.encode(coord[1], coord[0], 10) +
          ":" +
          coord[2].toFixed(fractionalDigits),
      });
    });
    await Promise.all(operations);
  }
}
