import { promises as fs } from "node:fs";
import path from "node:path";
import { readConfig, root } from "./lib.ts";

async function main() {
  const config = await readConfig();
  if (!config.scenes.length) throw new Error("video.config.json must contain at least one scene");
  if (config.duration.width !== 1080 || config.duration.height !== 1440) {
    throw new Error("Template currently expects native 1080x1440. Edit index.html intentionally for other sizes.");
  }
  await fs.writeFile(
    path.join(root, "video.config.js"),
    `window.WWV_CONFIG = ${JSON.stringify(config, null, 2)};\n`,
    "utf8",
  );
  await fs.mkdir(path.join(root, "output", "qa"), { recursive: true });
  console.log(`synced ${config.scenes.length} scene(s)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
