import path from "node:path";
import { ensureParent, execFileAsync, ffprobeJson, pathExists, readConfig, root, run } from "./lib.ts";

function fail(message: string): never {
  throw new Error(message);
}

async function detectMeanVolume(file: string) {
  const { stderr } = await execFileAsync(
    "ffmpeg",
    ["-hide_banner", "-nostats", "-i", file, "-map", "0:a:0", "-filter:a", "volumedetect", "-f", "null", "-"],
    { cwd: root, maxBuffer: 1024 * 1024 * 4 },
  );
  const match = stderr.match(/mean_volume:\s*(-?\d+(?:\.\d+)?) dB/);
  if (!match) fail("Unable to detect audio mean volume");
  return Number(match[1]);
}

async function main() {
  const config = await readConfig();
  const video = path.join(root, config.outputs.video);
  const cover = path.join(root, config.outputs.cover);
  if (!(await pathExists(video))) fail(`Missing video: ${video}`);
  if (!(await pathExists(cover))) fail(`Missing cover: ${cover}`);

  const videoMeta = await ffprobeJson(video);
  const stream = videoMeta.streams?.find((item: { codec_type?: string }) => item.codec_type === "video") ?? videoMeta.streams?.[0];
  if (!stream) fail("No video stream found");
  const audioStream = videoMeta.streams?.find((item: { codec_type?: string }) => item.codec_type === "audio");
  if (!audioStream) fail("No audio stream found");
  if (stream.width !== config.duration.width || stream.height !== config.duration.height) {
    fail(`Video size mismatch: got ${stream.width}x${stream.height}, expected ${config.duration.width}x${config.duration.height}`);
  }
  if (config.duration.width === 1080 && config.duration.height === 1440 && stream.display_aspect_ratio !== "3:4") {
    fail(`Expected 3:4 display aspect ratio, got ${stream.display_aspect_ratio}`);
  }

  const coverMeta = await ffprobeJson(cover);
  const coverStream = coverMeta.streams?.[0];
  if (!coverStream) fail("No cover image stream found");
  if (coverStream.width !== config.duration.width || coverStream.height !== config.duration.height) {
    fail(`Cover size mismatch: got ${coverStream.width}x${coverStream.height}, expected ${config.duration.width}x${config.duration.height}`);
  }

  const meanVolume = await detectMeanVolume(video);
  if (meanVolume < -28) {
    fail(`Audio too quiet: mean_volume=${meanVolume}dB. Increase audio.voiceGain or target a louder audio.targetI.`);
  }

  const qaDir = path.join(root, "output", "qa");
  await ensureParent(path.join(qaDir, "contact-sheet.jpg"));
  await run("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-i",
    video,
    "-vf",
    "fps=1/5,scale=270:-1:out_range=pc,format=yuvj420p,tile=5x2",
    "-frames:v",
    "1",
    "-update",
    "1",
    path.join(qaDir, "contact-sheet.jpg"),
  ]);
  await run("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-ss",
    String(config.outputs.coverAtSeconds),
    "-i",
    video,
    "-frames:v",
    "1",
    path.join(qaDir, "hero-frame.png"),
  ]);

  console.log(`qa=ok video=${stream.width}x${stream.height} aspect=${stream.display_aspect_ratio} audio_mean=${meanVolume}dB`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
