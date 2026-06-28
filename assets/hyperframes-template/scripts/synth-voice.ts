import { promises as fs } from "node:fs";
import path from "node:path";
import { concatFileBody, ffprobeDuration, readConfig, root, run, wait } from "./lib.ts";

async function synthesize(text: string, file: string, voice: string, rate: string, pitch: string) {
  const args = [
    "exec",
    "--yes",
    "--package",
    "node-edge-tts",
    "--",
    "node-edge-tts",
    "--text",
    text,
    "--filepath",
    file,
    "--voice",
    voice,
    "--lang",
    "zh-CN",
    "--rate",
    rate,
    "--pitch",
    pitch,
    "--volume",
    "+0%",
    "--timeout",
    "60000",
  ];

  let lastError: unknown;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      await run("npm", args);
      return;
    } catch (error) {
      lastError = error;
      await fs.rm(file, { force: true });
      if (attempt < 5) await wait(1200 * attempt);
    }
  }
  throw lastError;
}

async function main() {
  const config = await readConfig();
  const outDir = path.join(root, "output", "edge-tts");
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });

  const silence = path.join(outDir, "silence-gap.mp3");
  await run("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-f",
    "lavfi",
    "-i",
    "anullsrc=channel_layout=stereo:sample_rate=48000",
    "-t",
    String(config.voice.gapSeconds),
    "-q:a",
    "9",
    "-acodec",
    "libmp3lame",
    silence,
  ]);

  const lineFiles: string[] = [];
  const timing: Array<{ index: number; start: number; end: number; duration: number }> = [];
  let cursor = 0;

  for (let index = 0; index < config.scenes.length; index += 1) {
    const file = path.join(outDir, `line-${String(index + 1).padStart(2, "0")}.mp3`);
    await synthesize(config.scenes[index].speech, file, config.voice.voice, config.voice.rate, config.voice.pitch);
    const duration = await ffprobeDuration(file);
    timing.push({
      index: index + 1,
      start: Number(cursor.toFixed(3)),
      end: Number((cursor + duration).toFixed(3)),
      duration: Number(duration.toFixed(3)),
    });
    cursor += duration;
    if (index < config.scenes.length - 1) cursor += config.voice.gapSeconds;
    lineFiles.push(file);
  }

  const fullConcat = path.join(outDir, "full.concat.txt");
  const concatInputs = lineFiles.flatMap((file, index) => (index < lineFiles.length - 1 ? [file, silence] : [file]));
  await fs.writeFile(fullConcat, concatFileBody(concatInputs), "utf8");

  const mp3Out = path.join(outDir, "narration.mp3");
  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", fullConcat, "-c", "copy", mp3Out]);

  const wavOut = path.join(root, "output", "narration.wav");
  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", mp3Out, "-ar", "48000", "-ac", "2", wavOut]);

  const duration = await ffprobeDuration(wavOut);
  await fs.writeFile(
    path.join(outDir, "timing.json"),
    JSON.stringify({ duration: Number(duration.toFixed(3)), voice: config.voice, items: timing }, null, 2),
    "utf8",
  );
  console.log(`voice=${wavOut}`);
  console.log(`duration=${duration.toFixed(3)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
