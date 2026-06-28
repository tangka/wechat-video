---
name: wechat-weekly-video
description: Create short narrated WeChat public account weekly videos from draft articles, account material, or social-post summaries. Use when asked to turn a Codex/ClaudeDevs/公众号 weekly article or materials into a 3:4 WeChat Channels-ready MP4 plus cover image, especially when the output must be reproducible across Codex and Claude Code with TypeScript scripts, HyperFrames rendering, TTS narration, BGM mixing, and QA checks.
---

# WeChat Weekly Video

Create a reproducible weekly-video project that outputs exactly two publishable artifacts:

- `output/<slug>.mp4`
- `output/<slug>-cover.png`

Default target: `1080x1440`, `3:4`, `30fps`, about `45-60s`.

## Hard Rules

- Use TypeScript scripts for project automation. Do not add Python scripts to the generated video project.
- Use HyperFrames for authored motion graphics. Produce native `1080x1440`; do not fake `3:4` by padding a shorter composition after render.
- Treat `video.config.json` as the source of truth for account, title, dimensions, voice, BGM, scenes, output names, and cover timestamp.
- Generate or re-synthesize narration for the target duration. Do not stretch old audio unless the user explicitly asks.
- Deliver video plus cover. The cover must match the configured output dimensions.
- Run QA before handoff: `ffprobe` dimensions/duration, HyperFrames `validate`/`inspect`, contact sheet, and at least one hero-frame extraction.

## Workflow

1. Locate the article draft and source materials.
2. Create a project from the bundled template:

```bash
npx --yes tsx /path/to/wechat-weekly-video/scripts/new-project.ts --out /path/to/article/video
```

3. Edit `/path/to/article/video/video.config.json`.
4. Put local assets under `/path/to/article/video/assets/`. Use `assets/bgm.mp3` only when a usable BGM file exists; otherwise omit BGM.
5. Run:

```bash
npm run build
```

6. Inspect `output/qa/contact-sheet.jpg` and important frames. Fix layout in `index.html` or scene text, then rebuild if needed.
7. Open the final MP4 for review.

## Config

Read [references/config-schema.md](references/config-schema.md) before writing `video.config.json`.

Required scene fields:

- `eyebrow`
- `chip`
- `headline`
- `note`
- `caption`
- `speech`

Optional scene fields:

- `ghost`
- `points`
- `card`

Use 5-6 scenes for a 50s weekly video. Keep `speech` short enough for the configured target duration.

## Visual Constraints

Read [references/visual-qa.md](references/visual-qa.md) before final render.

Key constraints:

- Keep all real text inside safe margins.
- Mark purely decorative pseudo-text with `data-layout-ignore` or render it through CSS pseudo-elements so contrast/layout checks do not treat it as body copy.
- If an element intentionally overflows for background texture, mark it with `data-layout-allow-overflow`.
- Make Reddit/X/source cards legible but secondary to the episode claim.

## Dependencies

The generated project expects:

- Node.js with `npx`
- `ffmpeg` and `ffprobe`
- Network access for `node-edge-tts` when using the default Edge TTS provider
- HyperFrames CLI available through `npx --yes hyperframes@0.7.17`

## Sharing And Installation

This skill is intentionally self-contained so the same git repository can be used by Codex and Claude Code.

Install by cloning the repository, then link the same directory into each agent runtime:

```bash
ln -s /path/to/wechat-weekly-video ~/.codex/skills/wechat-weekly-video
ln -s /path/to/wechat-weekly-video ~/.claude/skills/wechat-weekly-video
```

Codex reads `SKILL.md` and `agents/openai.yaml`. Claude Code reads `SKILL.md`; it can ignore `agents/openai.yaml`.

## Output Contract

Before final response, confirm:

- MP4 exists at `outputs.video`
- cover exists at `outputs.cover`
- MP4 width/height equals `duration.width`/`duration.height`
- MP4 display aspect ratio is `3:4` for the default preset
- cover dimensions equal the video dimensions
- QA images exist under `output/qa/`
