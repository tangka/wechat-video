import { createHash } from "node:crypto";
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Args = {
  article: string;
  out: string;
  materials: string[];
  account?: string;
  duration?: number;
  force: boolean;
};

type Section = {
  heading: string;
  text: string;
};

type ImageCandidate = {
  file: string;
  text: string;
  source: string;
};

const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif"]);
const skipDirNames = new Set([".git", "node_modules", "output", "dist", ".next", ".cache"]);
const skipHeading = /^(封面|目录|发布|发布物|视频|视频号标题|qa|素材|参考|附录|数据|产物|输出|操作记录|校验|评论)$/i;

function argValues(name: string) {
  const values: string[] = [];
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === name && process.argv[index + 1]) values.push(process.argv[index + 1]);
  }
  return values;
}

function parseArgs(): Args {
  const article = argValues("--article")[0];
  if (!article) {
    console.error("Usage: npx tsx scripts/plan-from-article.ts --article <draft.md> [--out <project-dir>] [--materials <dir>] [--account <name>] [--duration <seconds>] [--force]");
    process.exit(2);
  }
  const out = argValues("--out")[0] || path.join(path.dirname(path.resolve(article)), "video");
  const materialValues = [...argValues("--materials"), ...argValues("--material")];
  const materials = materialValues.flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean);
  const durationRaw = argValues("--duration")[0];
  return {
    article: path.resolve(article),
    out: path.resolve(out),
    materials: materials.map((item) => path.resolve(item)),
    account: argValues("--account")[0],
    duration: durationRaw ? Number(durationRaw) : undefined,
    force: process.argv.includes("--force"),
  };
}

async function exists(target: string) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function createProject(outDir: string, force: boolean) {
  const skillRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const templateDir = path.join(skillRoot, "assets", "hyperframes-template");
  if ((await exists(outDir)) && !force) {
    throw new Error(`Refusing to overwrite existing directory: ${outDir}. Pass --force to update it.`);
  }
  await mkdir(path.dirname(outDir), { recursive: true });
  await cp(templateDir, outDir, { recursive: true, force });
  const sharedMaterials = path.join(skillRoot, "assets", "materials");
  if (await exists(sharedMaterials)) {
    await mkdir(path.join(outDir, "assets"), { recursive: true });
    await cp(sharedMaterials, path.join(outDir, "assets", "materials"), { recursive: true, force: true });
    await rm(path.join(outDir, "assets", "materials", "voice-samples"), { recursive: true, force: true });
  }
  const sharedOfficialLogos = path.join(skillRoot, "assets", "official-logos");
  if (await exists(sharedOfficialLogos)) {
    await mkdir(path.join(outDir, "assets"), { recursive: true });
    await cp(sharedOfficialLogos, path.join(outDir, "assets", "official-logos"), { recursive: true, force: true });
  }
}

function normalizeText(input: string) {
  return input
    .replace(/\r/g, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^\s*\|.*\|\s*$/gm, " ")
    .replace(/^\s*[-*_]{3,}\s*$/gm, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripFrontmatter(markdown: string) {
  return markdown.replace(/^---\n[\s\S]*?\n---\n/, "");
}

function titleFromMarkdown(markdown: string, file: string) {
  const match = markdown.match(/^#\s+(.+)$/m);
  if (match) return cleanInline(match[1]);
  return path.basename(file, path.extname(file)).replace(/^\d{4}-\d{2}-\d{2}-?/, "");
}

function cleanInline(input: string) {
  return normalizeText(input).replace(/^#+\s*/, "").replace(/\s+/g, " ").trim();
}

function inferIssueDate(articleFile: string, markdown: string) {
  const fromPath = articleFile.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  if (fromPath) return fromPath;
  const fromBody = markdown.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  if (fromBody) return fromBody;
  return new Date().toISOString().slice(0, 10);
}

function inferAccount(articleFile: string, explicit?: string) {
  if (explicit) return explicit;
  const parts = articleFile.split(path.sep);
  const marker = parts.lastIndexOf("微信公众号");
  if (marker >= 0 && parts[marker + 1]) return parts[marker + 1];
  if (/claude/i.test(articleFile)) return "ClaudeDevs";
  return "Codexx";
}

function slugFor(account: string, issueDate: string, title: string) {
  const prefix = account.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "wechat";
  const hash = createHash("sha1").update(`${issueDate}:${title}`).digest("hex").slice(0, 8);
  return `${prefix}-video-${issueDate}-${hash}`;
}

function parseSections(markdown: string, title: string): Section[] {
  const body = stripFrontmatter(markdown);
  const lines = body.split("\n");
  const sections: Section[] = [];
  let current: Section | undefined;

  for (const line of lines) {
    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      if (current && current.text.trim()) sections.push({ heading: current.heading, text: normalizeText(current.text) });
      current = { heading: cleanInline(heading[2]), text: "" };
      continue;
    }
    if (current) current.text += `${line}\n`;
  }
  if (current && current.text.trim()) sections.push({ heading: current.heading, text: normalizeText(current.text) });

  const filtered = sections
    .filter((section) => section.text.length > 30 && !skipHeading.test(section.heading.trim()))
    .flatMap(expandScriptSection);
  if (filtered.length) return filtered.slice(0, 8);

  const clean = normalizeText(body.replace(/^#\s+.+$/m, ""));
  const paragraphs = clean.split(/\n{2,}/).map((item) => item.trim()).filter((item) => item.length > 40);
  return paragraphs.slice(0, 6).map((text, index) => ({
    heading: index === 0 ? title : `要点 ${index + 1}`,
    text,
  }));
}

function expandScriptSection(section: Section): Section[] {
  if (!/(口播稿|正文|文案|脚本)/.test(section.heading)) return [section];
  const parts = chunkSentences(sentences(section.text), 95, 150);
  return parts.map((text, index) => ({
    heading: headingFromText(text, `口播 ${index + 1}`),
    text,
  }));
}

function sentences(text: string) {
  return normalizeText(text)
    .split(/(?<=[。！？!?；;])\s*|\n+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 8);
}

function chunkSentences(items: string[], min = 90, max = 150) {
  const chunks: string[] = [];
  let current = "";
  for (const item of items) {
    const next = current ? `${current}${item}` : item;
    if (current && next.length > max) {
      chunks.push(current);
      current = item;
    } else {
      current = next;
    }
    if (current.length >= min) {
      chunks.push(current);
      current = "";
    }
  }
  if (current) chunks.push(current);
  return chunks.filter((item) => item.length >= 12);
}

function headingFromText(text: string, fallback: string) {
  const first = sentences(text)[0] || text;
  return captionFor(
    first
      .replace(/^(先给结论|这里先|也就是说|所以|但|第一|第二|第三)[：:，,。；;\s]*/, "")
      .split(/[。！？!?；;，,]/)[0] || fallback,
  );
}

function truncate(text: string, max: number) {
  const clean = cleanInline(text);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

function headlineLines(text: string) {
  const clean = cleanInline(text).replace(/[：:]/g, "：");
  const parts = clean.split(/[，,。；;、｜|]/).map((item) => item.trim()).filter(Boolean);
  if (parts.length >= 2) return parts.slice(0, 3).map((item) => truncate(item, 13));
  const tokens = clean.match(/[A-Za-z0-9.+-]+|[\u4e00-\u9fa5]|[^\s]/g) || [...clean];
  if (tokens.join("").length <= 13) return [clean];
  const lines: string[] = [];
  let current = "";
  for (const token of tokens) {
    if (current && (current + token).length > 11 && lines.length < 2) {
      lines.push(current);
      current = token;
    } else {
      current += token;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function captionFor(text: string) {
  return truncate(text.replace(/^[一二三四五六七八九十0-9]+[.、]\s*/, ""), 18);
}

function pointsFor(section: Section) {
  const items = sentences(section.text).slice(0, 3).map((item) => truncate(item, 19));
  while (items.length < 3 && section.heading) items.push(captionFor(section.heading));
  return [...new Set(items)].slice(0, 3);
}

function ghostFor(text: string, fallback: string) {
  const latin = text.match(/[A-Za-z][A-Za-z0-9.-]{2,}/g)?.[0];
  if (latin) return latin.slice(0, 12);
  return fallback.slice(0, 8);
}

function officialLogo(text: string, account: string) {
  const haystack = `${text} ${account}`;
  if (/anthropic/i.test(haystack)) return "assets/official-logos/anthropicai-avatar.jpg";
  if (/claude/i.test(haystack)) return "assets/official-logos/claudeai-avatar.jpg";
  if (/openai/i.test(haystack)) return "assets/official-logos/openai-avatar.jpg";
  if (/codex/i.test(haystack)) return "assets/official-logos/codex-openai-devs-avatar.jpg";
  if (/ClaudeDevs/i.test(account)) return "assets/official-logos/claudeai-avatar.jpg";
  return "assets/official-logos/codex-openai-devs-avatar.jpg";
}

async function markdownImageCandidates(markdown: string, articleDir: string): Promise<ImageCandidate[]> {
  const results: ImageCandidate[] = [];
  const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  for (const match of markdown.matchAll(regex)) {
    const alt = cleanInline(match[1] || "");
    const raw = match[2].trim().replace(/^<|>$/g, "");
    if (/^(https?:|data:)/i.test(raw)) continue;
    const withoutTitle = raw.split(/\s+["']/)[0];
    const file = path.resolve(articleDir, decodeURI(withoutTitle));
    if (imageExtensions.has(path.extname(file).toLowerCase()) && (await exists(file))) {
      results.push({ file, text: `${alt} ${file}`, source: "markdown" });
    }
  }
  return results;
}

async function siblingText(file: string) {
  const parent = path.dirname(file);
  const names = ["content.md", "summary.md", "README.md"];
  const chunks: string[] = [];
  for (const name of names) {
    const candidate = path.join(parent, name);
    if (!(await exists(candidate))) continue;
    const info = await stat(candidate);
    if (info.size > 80_000) continue;
    chunks.push((await readFile(candidate, "utf8")).slice(0, 4000));
  }
  return chunks.join("\n");
}

async function walkImages(rootDir: string, maxDepth = 4, limit = 180): Promise<ImageCandidate[]> {
  const results: ImageCandidate[] = [];
  async function visit(dir: string, depth: number) {
    if (results.length >= limit || depth < 0) return;
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (results.length >= limit) return;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!skipDirNames.has(entry.name)) await visit(full, depth - 1);
        continue;
      }
      if (!entry.isFile() || !imageExtensions.has(path.extname(entry.name).toLowerCase())) continue;
      const nearby = await siblingText(full);
      results.push({
        file: full,
        text: normalizeText(`${full}\n${nearby}`).slice(0, 5000),
        source: rootDir,
      });
    }
  }
  if (await exists(rootDir)) await visit(rootDir, maxDepth);
  return results;
}

function defaultMaterialRoots(articleFile: string, issueDate: string) {
  const articleDir = path.dirname(articleFile);
  const roots = [path.join(articleDir, "media"), path.join(articleDir, "assets")];
  const parts = articleDir.split(path.sep);
  const marker = parts.lastIndexOf("微信公众号");
  if (marker >= 0 && parts[marker + 1]) {
    const accountRoot = path.join(path.sep, ...parts.slice(1, marker + 2));
    roots.push(path.join(accountRoot, "素材库", issueDate));
  }
  return roots;
}

async function collectImages(markdown: string, articleFile: string, issueDate: string, materials: string[]) {
  const articleDir = path.dirname(articleFile);
  const roots = [...defaultMaterialRoots(articleFile, issueDate), ...materials];
  const all = [...(await markdownImageCandidates(markdown, articleDir))];
  for (const root of [...new Set(roots)]) all.push(...(await walkImages(root)));
  const seen = new Set<string>();
  return all.filter((item) => {
    const key = path.resolve(item.file);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function scoreImage(query: string, candidate: ImageCandidate) {
  const haystack = candidate.text.toLowerCase();
  const lower = query.toLowerCase();
  const latin = lower.match(/[a-z0-9][a-z0-9.-]{2,}/g) || [];
  const chinese = [...lower.replace(/[^\u4e00-\u9fa5]/g, "")].map((_, index, chars) => chars.slice(index, index + 2).join("")).filter((term) => term.length === 2);
  const terms = [...new Set([...latin, ...chinese])].slice(0, 40);
  let score = 0;
  for (const term of terms) {
    if (haystack.includes(term)) score += term.length > 3 ? 4 : 2;
  }
  if (/cover|xcover|封面|海报|card|截图|screenshot/i.test(candidate.file)) score += 6;
  if (/content\.md|素材库/.test(candidate.text)) score += 2;
  return score;
}

function chooseImage(query: string, candidates: ImageCandidate[], used: Set<string>) {
  const ranked = candidates
    .filter((candidate) => !used.has(candidate.file))
    .map((candidate) => ({ candidate, score: scoreImage(query, candidate) }))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best || best.score <= 0) return undefined;
  used.add(best.candidate.file);
  return best.candidate;
}

async function copyImage(projectDir: string, candidate: ImageCandidate, index: number) {
  const ext = path.extname(candidate.file).toLowerCase() || ".png";
  const assetName = `source-${String(index).padStart(2, "0")}${ext}`;
  const target = path.join(projectDir, "assets", assetName);
  await mkdir(path.dirname(target), { recursive: true });
  await cp(candidate.file, target, { force: true });
  return `assets/${assetName}`;
}

function buildOpening(title: string, first: Section, issueDate: string, account: string) {
  const firstSentence = sentences(first.text)[0] || first.text;
  return {
    eyebrow: `${account} Video`,
    chip: issueDate,
    headline: headlineLines(title),
    note: truncate(firstSentence, 44),
    caption: captionFor(title),
    speech: truncate(`${title}。这条视频先讲清楚一个判断：${firstSentence}`, 92),
    ghost: ghostFor(title, account),
    logo: officialLogo(title, account),
  };
}

function buildBodyScene(section: Section, index: number, issueDate: string, account: string, image?: string) {
  const firstSentence = sentences(section.text)[0] || section.text;
  const scene: Record<string, unknown> = {
    eyebrow: `Point ${String(index).padStart(2, "0")}`,
    chip: captionFor(section.heading),
    headline: headlineLines(section.heading),
    note: truncate(firstSentence, 46),
    caption: captionFor(section.heading),
    speech: truncate(`${section.heading}。${firstSentence}`, 96),
    ghost: ghostFor(section.heading, account),
    points: pointsFor(section),
    logo: officialLogo(`${section.heading} ${section.text}`, account),
  };
  if (image) {
    scene.card = {
      label: "source material",
      title: truncate(section.heading, 30),
      body: truncate(firstSentence, 58),
      metaLeft: issueDate,
      metaRight: "article asset",
      image,
    };
  }
  return scene;
}

function buildClosing(title: string, sections: Section[], issueDate: string, account: string) {
  const labels = sections.slice(0, 3).map((section) => captionFor(section.heading));
  return {
    eyebrow: "Takeaway",
    chip: "publish draft",
    headline: ["最后判断", ...headlineLines(title).slice(0, 2)].slice(0, 3),
    note: labels.length ? `这条视频重点是：${labels.join("、")}。` : "这条视频已从文章自动拆成可渲染分镜。",
    caption: "把事情讲清楚",
    speech: truncate(`最后收一下。${labels.length ? `这条内容重点是${labels.join("、")}。` : ""}发布前再看一遍事实和素材是否对应。`, 90),
    ghost: "Takeaway",
    logo: officialLogo(title, account),
    points: labels.length ? labels : ["核对事实", "核对素材", "核对封面"],
    card: {
      label: "video plan",
      title: "article to scenes",
      body: "脚本已根据文章结构生成分镜，发布前重点核对事实、素材和口播节奏。",
      metaLeft: issueDate,
      metaRight: "review",
    },
  };
}

async function writePlan(projectDir: string, article: string, scenes: Array<Record<string, unknown>>, copiedAssets: string[]) {
  const lines = [
    "# Video Plan",
    "",
    `- article: ${article}`,
    `- scenes: ${scenes.length}`,
    `- copied assets: ${copiedAssets.length}`,
    "",
    "## Scenes",
    "",
    ...scenes.flatMap((scene, index) => [
      `### ${index + 1}. ${(scene.headline as string[] | undefined)?.join(" / ") || scene.eyebrow}`,
      "",
      `- caption: ${scene.caption || ""}`,
      `- speech: ${scene.speech || ""}`,
      "",
    ]),
    "## Assets",
    "",
    ...copiedAssets.map((asset) => `- ${asset}`),
    "",
  ];
  await writeFile(path.join(projectDir, "video-plan.md"), lines.join("\n"), "utf8");
}

async function main() {
  const args = parseArgs();
  const markdown = await readFile(args.article, "utf8");
  const title = titleFromMarkdown(markdown, args.article);
  const issueDate = inferIssueDate(args.article, markdown);
  const account = inferAccount(args.article, args.account);
  const sections = parseSections(markdown, title);
  if (!sections.length) throw new Error("Unable to derive scenes from article. Add headings or paragraphs to the draft first.");

  await createProject(args.out, args.force);

  const images = await collectImages(markdown, args.article, issueDate, args.materials);
  const usedImages = new Set<string>();
  const copiedAssets: string[] = [];
  let assetIndex = 1;

  const coverCandidate =
    images.find((image) => /cover|xcover|封面|海报/i.test(image.file)) ||
    chooseImage(title, images, usedImages);
  let backgroundImage: string | undefined;
  if (coverCandidate) {
    usedImages.add(coverCandidate.file);
    backgroundImage = await copyImage(args.out, coverCandidate, assetIndex);
    copiedAssets.push(backgroundImage);
    assetIndex += 1;
  }

  const bodySections = (sections.length > 4 ? sections.slice(1, 5) : sections.slice(0, 4));
  const scenes: Array<Record<string, unknown>> = [buildOpening(title, sections[0], issueDate, account)];
  for (const [index, section] of bodySections.entries()) {
    const candidate = chooseImage(`${section.heading}\n${section.text}`, images, usedImages);
    let copied: string | undefined;
    if (candidate) {
      copied = await copyImage(args.out, candidate, assetIndex);
      copiedAssets.push(copied);
      assetIndex += 1;
    }
    scenes.push(buildBodyScene(section, index + 1, issueDate, account, copied));
  }
  scenes.push(buildClosing(title, bodySections, issueDate, account));

  const slug = slugFor(account, issueDate, title);
  const targetSeconds = args.duration || Math.min(90, Math.max(50, scenes.length * 12));
  const configFile = path.join(args.out, "video.config.json");
  const config = JSON.parse(await readFile(configFile, "utf8"));
  config.issueDate = issueDate;
  config.account = account;
  config.title = title;
  config.slug = slug;
  config.duration.targetSeconds = targetSeconds;
  config.outputs.video = `output/${slug}.mp4`;
  config.outputs.cover = `output/${slug}-cover.png`;
  config.outputs.coverAtSeconds = Math.min(5, Math.max(2, Math.floor(targetSeconds / scenes.length)));
  config.brand.name = account;
  config.brand.footer = `${account} · article video draft`;
  config.brand.logo = officialLogo(title, account);
  if (backgroundImage) config.brand.backgroundImage = backgroundImage;
  config.scenes = scenes;

  await writeFile(configFile, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  await writePlan(args.out, args.article, scenes, copiedAssets);

  console.log(`project=${args.out}`);
  console.log(`config=${configFile}`);
  console.log(`scenes=${scenes.length}`);
  console.log(`assets=${copiedAssets.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
