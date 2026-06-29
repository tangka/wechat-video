import path from "node:path";
import { ensureConfiguredBgm, ensureParent, pathExists, readConfig, root, run } from "./lib.ts";

async function main() {
  const config = await readConfig();
  await ensureConfiguredBgm(config);
  const silent = path.join(root, "output", "silent.mp4");
  const narration = path.join(root, "output", "narration.wav");
  if (!(await pathExists(silent))) throw new Error("Missing output/silent.mp4. Run npm run render:silent first.");
  if (!(await pathExists(narration))) throw new Error("Missing output/narration.wav. Run npm run voice first.");

  await ensureParent(config.outputs.video);
  await ensureParent(config.outputs.cover);

  const duration = config.duration.targetSeconds;
  const videoOut = path.join(root, config.outputs.video);
  const voiceGain = config.audio?.voiceGain ?? 1.25;
  const targetI = config.audio?.targetI ?? -13;
  const targetLRA = config.audio?.targetLRA ?? 11;
  const targetTP = config.audio?.targetTP ?? -1.5;
  const finalLoudness = `loudnorm=I=${targetI}:LRA=${targetLRA}:TP=${targetTP}:print_format=none,alimiter=limit=0.98,aresample=48000`;

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
      `[1:a]volume=${voiceGain},apad,atrim=0:${duration}[voice];[2:a]volume=${config.bgm.volume},atrim=0:${duration},afade=t=in:st=0:d=${config.bgm.fadeIn},afade=t=out:st=${fadeOutStart}:d=${config.bgm.fadeOut}[bgm];[voice][bgm]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,${finalLoudness}[a]`,
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
      `[1:a]volume=${voiceGain},apad,atrim=0:${duration},${finalLoudness}[a]`,
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
