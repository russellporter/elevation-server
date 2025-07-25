import compression from "compression"; // compresses requests
import express from "express";
import TileService from "./TileService";
import * as config from "./config";
import { LatLng, LngLat } from "./geo";
import logger from "./util/logger";

// Create Express server
const app = express();

// Express configuration
app.set("port", process.env.PORT || 3000);
app.use(compression());
app.use(express.json({ limit: "1mb" }));

const tileService = new TileService(config.diskCacheDir, config.zoom);

// Using a POST API in order to be able to accept larger payloads of points to process
app.post("/points/elevation", async (req, res) => {
  const pointsLatLng: LatLng[] = req.body;
  if (
    !Array.isArray(pointsLatLng) ||
    pointsLatLng.some(
      (point) =>
        !Array.isArray(point) ||
        point.length !== 2 ||
        typeof point[0] !== "number" ||
        typeof point[1] !== "number"
    )
  ) {
    res.sendStatus(400);
    return;
  }

  const pointsLngLat: LngLat[] = pointsLatLng.map((point) => [
    point[1],
    point[0],
  ]);

  try {
    const elevations = await tileService.batchGet(pointsLngLat);

    res.json(elevations);
  } catch (error) {
    logger.error("Error serving elevation request: " + error);
    res.sendStatus(500);
  }
});

export default app;
