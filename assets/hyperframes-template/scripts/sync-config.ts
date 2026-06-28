import { promises as fs } from "node:fs";
import path from "node:path";
import { readConfig, root } from "./lib.ts";

async function main() {
  const config = await readConfig();
  if (!config.scenes.length) throw new Error("video.config.json must contain at least one scene");
  if (config.duration.width !== 1080 || config.duration.height !== 1440) {
    throw new Error("Template currently expects native 1080x1440. Edit index.html intentionally for other sizes.");
  }
  const indexPath = path.join(root, "index.html");
  const indexHtml = await fs.readFile(indexPath, "utf8");
  if (!/<div id="root"[^>]*data-duration="[^"]+"[^>]*data-width="[^"]+"[^>]*data-height="[^"]+"/.test(indexHtml)) {
    throw new Error("Could not find root data-duration/data-width/data-height in index.html");
  }
  const syncedIndexHtml = indexHtml
    .replace(/(<div id="root"[^>]*data-duration=")[^"]+(")/, `$1${config.duration.targetSeconds}$2`)
    .replace(/(<div id="root"[^>]*data-width=")[^"]+(")/, `$1${config.duration.width}$2`)
    .replace(/(<div id="root"[^>]*data-height=")[^"]+(")/, `$1${config.duration.height}$2`);
  await fs.writeFile(indexPath, syncedIndexHtml, "utf8");
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
