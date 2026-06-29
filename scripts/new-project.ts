import { cp, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function argValue(name: string) {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function exists(target: string) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const out = argValue("--out");
  const force = process.argv.includes("--force");
  if (!out) {
    console.error("Usage: npx tsx scripts/new-project.ts --out <project-dir> [--force]");
    process.exit(2);
  }

  const skillRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const templateDir = path.join(skillRoot, "assets", "hyperframes-template");
  const outDir = path.resolve(out);

  if ((await exists(outDir)) && !force) {
    console.error(`Refusing to overwrite existing directory: ${outDir}`);
    console.error("Pass --force to overwrite.");
    process.exit(1);
  }

  await mkdir(path.dirname(outDir), { recursive: true });
  await cp(templateDir, outDir, { recursive: true, force });
  const sharedOfficialLogos = path.join(skillRoot, "assets", "official-logos");
  if (await exists(sharedOfficialLogos)) {
    await mkdir(path.join(outDir, "assets"), { recursive: true });
    await cp(sharedOfficialLogos, path.join(outDir, "assets", "official-logos"), { recursive: true, force: true });
  }
  console.log(outDir);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
