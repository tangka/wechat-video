# Config Schema

`video.config.json` is the source of truth for each generated video project.

## Required Top-Level Fields

```json
{
  "issueDate": "2026-06-28",
  "account": "ClaudeDevs",
  "title": "一周 Claude: Fable、降智和工作流",
  "slug": "claude-weekly-2026-06-28",
  "duration": {
    "targetSeconds": 50,
    "fps": 30,
    "width": 1080,
    "height": 1440
  },
  "outputs": {
    "video": "output/claude-weekly-2026-06-28.mp4",
    "cover": "output/claude-weekly-2026-06-28-cover.png",
    "coverAtSeconds": 5
  },
  "voice": {
    "provider": "edge-tts",
    "voice": "zh-CN-YunxiNeural",
    "rate": "+30%",
    "pitch": "-5Hz",
    "gapSeconds": 0.12
  },
  "bgm": {
    "file": "assets/materials/bgm/mixkit-tech-house-vibes-130.mp3",
    "sourceName": "Mixkit Tech House Vibes 130",
    "volume": 0.035,
    "fadeIn": 0.8,
    "fadeOut": 1
  },
  "audio": {
    "voiceGain": 1.25,
    "targetI": -13,
    "targetLRA": 11,
    "targetTP": -1.5
  },
  "brand": {
    "name": "ClaudeDevs",
    "footer": "ClaudeDevs · video",
    "theme": "warm-editorial",
    "backgroundImage": "assets/cover.png"
  },
  "scenes": []
}
```

## Scene Shape

```json
{
  "eyebrow": "Claude Weekly",
  "chip": "2026.06.28",
  "headline": ["一周 Claude", "不是变强", "是变稳"],
  "note": "Fable、降智争议和 Claude Code 更新,都指向同一个问题:稳定性。",
  "caption": "Fable、降智和工作流放在一起看",
  "speech": "这一周 Claude 的消息很分裂。Fable 有回来的信号,社区又在吵降智,而 Claude Code 还在继续补工作流。",
  "ghost": "Claude",
  "logo": "assets/claude.svg",
  "points": ["状态页和截图开始出现", "用户关心稳定可用", "短暂闪现会放大焦虑"],
  "card": {
    "label": "r/ClaudeCode",
    "title": "Anthropic speaks after 2 weeks",
    "body": "讨论集中在 SOTA 模型限制、Fable 是否放出,以及全球用户是否会转向替代模型。",
    "metaLeft": "Jun 27",
    "metaRight": "source card",
    "image": "assets/source-visual.svg"
  }
}
```

## Defaults

- `duration.width`: `1080`
- `duration.height`: `1440`
- `duration.fps`: `30`
- `duration.targetSeconds`: `50`
- `voice.voice`: `zh-CN-YunxiNeural`
- `voice.rate`: `+30%`
- `voice.pitch`: `-5Hz`
- `voice.gapSeconds`: `0.12`
- `bgm.sourceName`: `Mixkit Tech House Vibes 130`
- `bgm.file`: `assets/materials/bgm/mixkit-tech-house-vibes-130.mp3`
- `bgm.volume`: `0.035`
- `bgm.fadeIn`: `0.8`
- `bgm.fadeOut`: `1`
- `audio.voiceGain`: `1.25`
- `audio.targetI`: `-13` LUFS
- `audio.targetLRA`: `11`
- `audio.targetTP`: `-1.5` dBTP
- `outputs.coverAtSeconds`: `5`

## Audio Defaults

Final audio is normalized after voice/BGM mixing. The template intentionally uses:

- `amix normalize=0` so a low-volume BGM track does not halve the narration loudness.
- `loudnorm` with `audio.targetI = -13` for mobile-friendly playback.
- `audio.voiceGain = 1.25` before normalization so narration remains dominant over BGM.
- `Mixkit Tech House Vibes 130` as the default BGM. It is copied from the skill material center into `assets/materials/bgm/` when a project is created.

Do not generate synthetic BGM with FFmpeg oscillators/noise for normal runs. If the final video still sounds too quiet on a phone, raise `audio.voiceGain` slightly. If it sounds harsh or clipped, lower `audio.targetI` to `-14` or `-15`.

Reusable BGM and voice snippets are copied into generated projects under:

- `assets/materials/bgm-presets.json`
- `assets/materials/voice-presets.json`

Run `npm run voices` inside a generated project to synthesize local audition files under `assets/materials/voice-samples/`.

## Optional Brand Fields

- `brand.backgroundImage`: local image path, such as `assets/cover.png`. Use this for a generated cover background, X screenshot, or account-specific visual. Omit it when no image is needed.
- `brand.logo`: local image path used by the lower-right audio-reactive badge when a scene does not define `logo`. Prefer the official/source-account avatar already captured in the material library. Do not use generated placeholder logos or another account's avatar.
- `brand.theme`: currently documented for humans; change CSS in `index.html` intentionally before relying on new theme names.

## Optional Scene Visual Fields

- `scene.logo`: local image path for the lower-right audio-reactive badge.
- `scene.card.image`: local image path rendered inside the source card. It is not used as the lower-right badge unless also assigned to `scene.logo`.

Logo precedence is `scene.logo` → `brand.logo` → text label from the scene headline.

For company comparison videos, keep source identity strict: OpenAI material should use an `@OpenAI` avatar; Anthropic material should use an `@AnthropicAI` avatar. Community accounts such as `ClaudeDevs` are source cards, not official company logos.

Bundled reusable avatars live in `assets/official-logos/`:

- Codex / OpenAI Developers: `codex-openai-devs-avatar.jpg`
- Claude product: `claudeai-avatar.jpg`
- OpenAI company: `openai-avatar.jpg`
- Anthropic company: `anthropicai-avatar.jpg`

## Writing Rules

- Keep scene `speech` as spoken Chinese, not article prose.
- Keep scene `caption` shorter than 20 Chinese characters when possible.
- Use `headline` as an array of lines; avoid `<br>`.
- Use source cards for X/Reddit/official update evidence, not for decoration.
- If a source card competes with the headline, shorten the card body first.
