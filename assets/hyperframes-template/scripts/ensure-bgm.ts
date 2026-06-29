import { ensureConfiguredBgm, readConfig } from "./lib.ts";

async function main() {
  const result = await ensureConfiguredBgm(await readConfig());
  if (result.status === "disabled") {
    console.log("bgm=disabled");
  } else if (result.status === "missing") {
    console.log(`bgm=missing ${result.file}`);
  } else {
    console.log(`bgm=${result.file} status=${result.status}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
