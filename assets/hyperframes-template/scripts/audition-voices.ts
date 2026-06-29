import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type VoicePreset = {
  provider: "edge-tts";
  voice: string;
  rate: string;
  pitch: string;
  gapSeconds?: number;
};

function argValues(name: string) {
  const values: string[] = [];
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === name && process.argv[index + 1]) values.push(process.argv[index + 1]);
  }
  return values;
}

function slug(input: string) {
  return input.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "") || "voice";
}

async function synthesize(text: string, file: string, preset: VoicePreset) {
  if (preset.provider !== "edge-tts") {
    throw new Error(`Unsupported voice provider: ${preset.provider}`);
  }

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
    preset.voice,
    "--lang",
    "zh-CN",
    "--rate",
    preset.rate,
    "--pitch",
    preset.pitch,
    "--volume",
    "+0%",
    "--timeout",
    "60000",
  ];

  let lastError: unknown;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      await execFileAsync("npm", args, { maxBuffer: 1024 * 1024 * 4 });
      return;
    } catch (error) {
      lastError = error;
      await fs.rm(file, { force: true });
      if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
    }
  }
  throw lastError;
}

async function main() {
  const root = process.cwd();
  const presetsFile = path.join(root, "assets", "materials", "voice-presets.json");
  const outputDir = path.resolve(argValues("--out")[0] || path.join(root, "assets", "materials", "voice-samples"));
  const text =
    argValues("--text")[0] ||
    "这里是 Codexx 的口播试听。Codex 这个词需要突出，语速比正常快一点，但不要赶，整体像科技评论。";
  const requested = new Set(argValues("--preset"));

  const presets = JSON.parse(await fs.readFile(presetsFile, "utf8")) as Record<string, VoicePreset>;
  const entries = Object.entries(presets).filter(([name]) => requested.size === 0 || requested.has(name));
  if (!entries.length) {
    throw new Error(`No voice preset matched. Available presets: ${Object.keys(presets).join(", ")}`);
  }

  await fs.mkdir(outputDir, { recursive: true });
  const indexLines = [
    "# Voice Samples",
    "",
    `Text: ${text}`,
    "",
    "| Preset | Voice | Rate | Pitch | File |",
    "|-|-|-|-|-|",
  ];

  for (const [name, preset] of entries) {
    const file = path.join(outputDir, `${slug(name)}.mp3`);
    await synthesize(text, file, preset);
    indexLines.push(`| ${name} | ${preset.voice} | ${preset.rate} | ${preset.pitch} | ${path.basename(file)} |`);
    console.log(`${name}=${file}`);
  }

  await fs.writeFile(path.join(outputDir, "index.md"), `${indexLines.join("\n")}\n`, "utf8");
  console.log(`index=${path.join(outputDir, "index.md")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
