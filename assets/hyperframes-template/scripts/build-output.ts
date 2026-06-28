import path from "node:path";
import { ensureParent, pathExists, readConfig, root, run } from "./lib.ts";

async function main() {
  const config = await readConfig();
  const silent = path.join(root, "output", "silent.mp4");
  const narration = path.join(root, "output", "narration.wav");
  if (!(await pathExists(silent))) throw new Error("Missing output/silent.mp4. Run npm run render:silent first.");
  if (!(await pathExists(narration))) throw new Error("Missing output/narration.wav. Run npm run voice first.");

  await ensureParent(config.outputs.video);
  await ensureParent(config.outputs.cover);

  const duration = config.duration.targetSeconds;
  const videoOut = path.join(root, config.outputs.video);

  if (config.bgm?.file && (await pathExists(config.bgm.file))) {
    const fadeOutStart = Math.max(0, duration - config.bgm.fadeOut);
    await run("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      silent,
      "-i",
      narration,
      "-stream_loop",
      "-1",
      "-i",
      config.bgm.file,
      "-filter_complex",
      `[1:a]volume=1.0,apad,atrim=0:${duration}[voice];[2:a]volume=${config.bgm.volume},atrim=0:${duration},afade=t=in:st=0:d=${config.bgm.fadeIn},afade=t=out:st=${fadeOutStart}:d=${config.bgm.fadeOut}[bgm];[voice][bgm]amix=inputs=2:duration=first:dropout_transition=0,alimiter=limit=0.94[a]`,
      "-map",
      "0:v",
      "-map",
      "[a]",
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-shortest",
      videoOut,
    ]);
  } else {
    await run("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      silent,
      "-i",
      narration,
      "-filter_complex",
      `[1:a]volume=1.0,apad,atrim=0:${duration},alimiter=limit=0.94[a]`,
      "-map",
      "0:v",
      "-map",
      "[a]",
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-shortest",
      videoOut,
    ]);
  }

  await run("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-ss",
    String(config.outputs.coverAtSeconds),
    "-i",
    videoOut,
    "-frames:v",
    "1",
    path.join(root, config.outputs.cover),
  ]);

  console.log(`video=${videoOut}`);
  console.log(`cover=${path.join(root, config.outputs.cover)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
