import { spawn } from "child_process";
import * as fs from "fs";
import tmp from "tmp";

export async function fileExists(path: string): Promise<boolean> {
  return new Promise(resolve => fs.exists(path, exists => resolve(exists)));
}
export async function tmpFile(): Promise<string> {
  return new Promise((resolve, reject) => {
    tmp.file((error, path) => {
      if (path) {
        resolve(path);
      } else {
        reject("Failed creating tmp file: " + error);
      }
    });
  });
}
export async function mkdirRecursive(path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, { recursive: true }, error => {
      if (error) {
        reject("Failed mkdir (path: " + path + "): " + error);
      } else {
        resolve();
      }
    });
  });
}
export async function compressTiff(
  inputPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const process = spawn("gdal_translate", [
      // a couple images are in 256px size for some reason
      "-outsize",
      "512",
      "0",
      "-r",
      "bicubic",
      "-q",
      "-co",
      "COMPRESS=LERC_ZSTD",
      "-co",
      "MAX_Z_ERROR=0.5",
      "-co",
      "PREDICTOR=2",
      "-co",
      "ZSTD_LEVEL=9",
      inputPath,
      outputPath
    ]);
    process.on("close", code => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          "GDAL translate failed (input path: " + inputPath + "): " + code
        );
      }
    });
  });
}
