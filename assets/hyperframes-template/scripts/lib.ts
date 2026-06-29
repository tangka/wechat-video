import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

export const execFileAsync = promisify(execFile);
export const root = process.cwd();

export type VideoConfig = {
  issueDate: string;
  account: string;
  title: string;
  slug: string;
  duration: {
    targetSeconds: number;
    fps: number;
    width: number;
    height: number;
  };
  outputs: {
    video: string;
    cover: string;
    coverAtSeconds: number;
  };
  voice: {
    provider: "edge-tts";
    voice: string;
    rate: string;
    pitch: string;
    gapSeconds: number;
  };
  bgm?: {
    file: string;
    sourceUrl?: string;
    sourceName?: string;
    volume: number;
    fadeIn: number;
    fadeOut: number;
  };
  audio?: {
    voiceGain?: number;
    targetI?: number;
    targetLRA?: number;
    targetTP?: number;
  };
  brand: {
    name: string;
    footer: string;
    theme?: string;
    backgroundImage?: string;
    logo?: string;
  };
  scenes: Array<{
    eyebrow: string;
    chip: string;
    headline: string[];
    note: string;
    caption: string;
    speech: string;
    ghost?: string;
    logo?: string;
    points?: string[];
    card?: {
      label: string;
      title: string;
      body: string;
      metaLeft?: string;
      metaRight?: string;
      image?: string;
    };
  }>;
};

export async function readConfig(): Promise<VideoConfig> {
  const raw = await fs.readFile(path.join(root, "video.config.json"), "utf8");
  return JSON.parse(raw) as VideoConfig;
}

export async function pathExists(file: string) {
  try {
    await fs.stat(path.isAbsolute(file) ? file : path.join(root, file));
    return true;
  } catch {
    return false;
  }
}

export function projectPath(file: string) {
  return path.isAbsolute(file) ? file : path.join(root, file);
}

export async function ensureConfiguredBgm(config: VideoConfig) {
  if (!config.bgm?.file) return { status: "disabled" as const };
  if (await pathExists(config.bgm.file)) {
    return { status: "exists" as const, file: projectPath(config.bgm.file) };
  }
  if (!config.bgm.sourceUrl) {
    return { status: "missing" as const, file: projectPath(config.bgm.file) };
  }

  const response = await fetch(config.bgm.sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to download BGM ${config.bgm.sourceUrl}: HTTP ${response.status}`);
  }

  const target = projectPath(config.bgm.file);
  await ensureParent(config.bgm.file);
  await fs.writeFile(target, Buffer.from(await response.arrayBuffer()));
  return { status: "downloaded" as const, file: target, sourceUrl: config.bgm.sourceUrl };
}

export async function run(command: string, args: string[]) {
  await execFileAsync(command, args, { cwd: root, maxBuffer: 1024 * 1024 * 16 });
}

export async function ffprobeJson(file: string) {
  const { stdout } = await execFileAsync(
    "ffprobe",
    ["-hide_banner", "-loglevel", "error", "-show_entries", "stream=codec_type,width,height,display_aspect_ratio,duration", "-show_entries", "format=duration", "-of", "json", file],
    { cwd: root, maxBuffer: 1024 * 1024 * 4 },
  );
  return JSON.parse(stdout);
}

export async function ffprobeDuration(file: string): Promise<number> {
  const { stdout } = await execFileAsync(
    "ffprobe",
    ["-hide_banner", "-loglevel", "error", "-show_entries", "format=duration", "-of", "default=nokey=1:noprint_wrappers=1", file],
    { cwd: root },
  );
  return Number(stdout.trim());
}

export function concatFileBody(files: string[]) {
  return files.map((file) => `file '${file.replaceAll("'", "'\\''")}'`).join("\n") + "\n";
}

export async function ensureParent(file: string) {
  await fs.mkdir(path.dirname(path.isAbsolute(file) ? file : path.join(root, file)), { recursive: true });
}

export async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
