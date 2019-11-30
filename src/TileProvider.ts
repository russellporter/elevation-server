import * as fs from "fs";
import request from "request";
import {
  compressTiff,
  fileExists,
  mkdirRecursive,
  tmpFile
} from "./FileOperations";
import {
  getTileKey,
  getTileReferencePath,
  TileReference
} from "./TileReference";

export interface TileProvider {
  get(ref: TileReference): Promise<string>;
}

export class DiskCacheTileProvider implements TileProvider {
  private backingProvider: TileProvider;
  private cacheDir: string;

  private pendingDownloads: Map<string, Promise<void>> = new Map();

  constructor(backingProvider: TileProvider, cacheDir: string) {
    this.backingProvider = backingProvider;
    this.cacheDir = cacheDir;
  }

  async get(ref: TileReference) {
    const path = this.path(ref);
    const exists = await fileExists(path);
    if (!exists) {
      const key = getTileKey(ref);
      const existingPendingDownload = this.pendingDownloads.get(key);
      if (existingPendingDownload) {
        await existingPendingDownload;
      } else {
        const pendingDownload = this.download(ref);
        this.pendingDownloads.set(key, pendingDownload);
        try {
          await pendingDownload;
        } finally {
          this.pendingDownloads.delete(key);
        }
      }
    }

    return path;
  }

  private async download(ref: TileReference) {
    await mkdirRecursive(this.dir(ref));
    const downloadPath = await this.backingProvider.get(ref);
    await compressTiff(downloadPath, this.path(ref));
    fs.unlink(downloadPath, error => {
      if (error) {
        console.log("Failed cleaning up temporary file: " + error);
      }
    });
  }

  private path(ref: TileReference) {
    return this.cacheDir + "/" + getTileReferencePath(ref);
  }

  private dir(ref: TileReference) {
    return this.path(ref)
      .split("/")
      .slice(0, -1)
      .join("/");
  }
}

async function downloadToPath(url: string, path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    request
      .get(url)
      .on("response", res => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(
            "Download (url: " +
              url +
              ") failed with status code: " +
              res.statusCode
          );
          return;
        }

        const file = fs.createWriteStream(path);
        res
          .pipe(file)
          .on("error", error => {
            reject("Failed writing to " + path + " " + error);
          })
          .on("finish", () => {
            resolve();
          });
      })
      .on("error", error => {
        reject("Failed download (path: " + url + "): " + error);
      });
  });
}

export class HTTPTileProvider implements TileProvider {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  async get(ref: TileReference): Promise<string> {
    const file = await tmpFile();
    const url = this.baseUrl + "/" + getTileReferencePath(ref);
    try {
      await downloadToPath(url, file);
    } catch {
      // retry once
      await downloadToPath(url, file);
    }

    return file;
  }
}
