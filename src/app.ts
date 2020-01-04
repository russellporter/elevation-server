import compression from "compression"; // compresses requests
import express from "express";
import * as config from "./config";
import ElevationCache from "./ElevationCache";
import ElevationService from "./ElevationService";
import TileService from "./TileService";
import logger from "./util/logger";

// Create Express server
const app = express();

// Express configuration
app.set("port", process.env.PORT || 3000);
app.use(compression());
app.use(express.json({ limit: "1mb" }));

const elevationCache = config.redisCacheURL
  ? new ElevationCache(config.redisCacheURL)
  : null;
const tileService = new TileService(config.diskCacheDir, config.zoom);
const elevationService = new ElevationService(tileService, elevationCache);

// Using a POST API in order to be able to accept larger payloads of points to process
app.post("/points/elevation", async (req, res) => {
  const points: [number, number][] = req.body;
  if (
    !Array.isArray(points) ||
    points.some(
      point =>
        !Array.isArray(point) ||
        point.length !== 2 ||
        typeof point[0] !== "number" ||
        typeof point[1] !== "number"
    )
  ) {
    res.sendStatus(400);
    return;
  }

  try {
    const elevations = await elevationService.batchGet(points);

    res.json(elevations);
  } catch (error) {
    logger.error("Error serving elevation request: " + error);
    res.sendStatus(500);
  }
});

export default app;
