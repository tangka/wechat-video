---
name: wechat-weekly-video
description: Create short narrated WeChat public account weekly videos from draft articles, account material, or social-post summaries. Use when asked to turn a Codex/ClaudeDevs/公众号 weekly article or material folder into a 3:4 WeChat Channels-ready MP4 plus cover image, including article-to-scene planning, local asset matching, TypeScript scripts, HyperFrames rendering, TTS narration, fixed BGM mixing, and QA checks.
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
- Treat audio loudness as part of QA. Final videos should not be quiet on a phone; the template normalizes to about `-13 LUFS`, and `npm run qa` reports `audio_mean`.
- Use the fixed BGM mode unless the user explicitly asks for a different track: `Mixkit Uplifting Bass 726` from `https://assets.mixkit.co/music/726/726.mp3`, written to `assets/bgm.mp3`, with `bgm.volume=0.04`, `fadeIn=0.8`, and `fadeOut=1`. Do not synthesize BGM with FFmpeg oscillators/noise for normal runs.
- Do not leave scenes static after the entrance animation. Every scene should have obvious continuous motion during its hold: visible sweep lines, moving dots/rings, background parallax, and card/point movement. Subtle drift alone is not enough.
- Use official/source-account avatars for brand logos. Do not invent a brand logo, redraw another company's logo, or substitute a fan/community account avatar for an official company account.

## Workflow

1. Locate the article draft and source materials.
2. Prefer article-first planning when a draft Markdown exists:

```bash
npx --yes tsx /path/to/wechat-weekly-video/scripts/plan-from-article.ts \
  --article /path/to/draft.md \
  --out /path/to/article/video \
  --materials /path/to/material-folder \
  --force
```

This creates the video project, writes `video.config.json`, copies matched images into `assets/`, sets official/source logos, and writes `video-plan.md` for review.

3. If no article exists, create an empty project from the bundled template:

```bash
npx --yes tsx /path/to/wechat-weekly-video/scripts/new-project.ts --out /path/to/article/video
```

4. Review and edit `/path/to/article/video/video.config.json`.
5. Put extra local assets under `/path/to/article/video/assets/` if needed. The template downloads the fixed BGM to `assets/bgm.mp3` through `npm run bgm` or automatically during `npm run build`.
   - Reuse bundled official avatars from `assets/official-logos/` when a video needs Codex, Claude, OpenAI, or Anthropic source identity.
6. Run:

```bash
npm run build
```

7. Inspect `output/qa/contact-sheet.jpg` and important frames. Fix layout in `index.html` or scene text, then rebuild if needed.
8. Open the final MP4 for review.

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
- `logo` (right-bottom audio-reactive badge override; default is `brand.logo`)

Use 5-6 scenes for a 50s weekly video. Keep `speech` short enough for the configured target duration.

## What Users Can Customize

For one video, edit the generated project rather than this skill repository:

- `/path/to/article/video/video.config.json` for title, script, scenes, voice, BGM, output names, dimensions, logos, and source cards.
- `/path/to/article/video/assets/` for screenshots, X covers, source images, logos, local BGM, and background images.
- `/path/to/article/video/index.html` for one-off layout, typography, card, background, or animation changes.

For future videos, edit the bundled template:

- `assets/hyperframes-template/video.config.json` for default voice, BGM, audio loudness, dimensions, and output conventions.
- `assets/hyperframes-template/index.html` for default visual design and motion behavior.
- `assets/official-logos/` for reusable official/source avatars.

Custom BGM is controlled by `bgm.file`, `bgm.sourceUrl`, `bgm.volume`, `bgm.fadeIn`, and `bgm.fadeOut`. Use a local file under `assets/` or provide `sourceUrl` so `npm run bgm` can download it.

Custom narration is controlled by `voice.voice`, `voice.rate`, `voice.pitch`, and `voice.gapSeconds`. Final loudness is controlled by `audio.voiceGain`, `audio.targetI`, `audio.targetLRA`, and `audio.targetTP`.

## Visual Constraints

Read [references/visual-qa.md](references/visual-qa.md) before final render.

Key constraints:

- Keep all real text inside safe margins.
- Mark purely decorative pseudo-text with `data-layout-ignore` or render it through CSS pseudo-elements so contrast/layout checks do not treat it as body copy.
- If an element intentionally overflows for background texture, mark it with `data-layout-allow-overflow`.
- Make Reddit/X/source cards legible but secondary to the episode claim.
- Avoid still frames. If a scene visually holds for more than about one second, add obvious ambient movement rather than leaving every layer fixed.
- Keep signal lines visibly breathing/growing and the lower-right logo badge pulsing during spoken sections.
- Use the actual source account avatar for the lower-right logo badge, such as `@OpenAI` for OpenAI material and `@AnthropicAI` for Anthropic material.

## Dependencies

The generated project expects:

- Node.js with `npx`
- `ffmpeg` and `ffprobe`
- Network access for `node-edge-tts` when using the default Edge TTS provider
- HyperFrames CLI available through `npx --yes hyperframes@0.7.17`
- No browser network is required for animation runtime: GSAP is bundled under `assets/vendor/gsap.min.js`.

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
- `npm run qa` reports an acceptable `audio_mean`; if it fails as too quiet, raise `audio.targetI` or `audio.voiceGain`
- QA images exist under `output/qa/`
