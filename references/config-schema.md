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
    "file": "assets/bgm.mp3",
    "volume": 0.045,
    "fadeIn": 1,
    "fadeOut": 1.4
  },
  "brand": {
    "name": "ClaudeDevs",
    "footer": "ClaudeDevs · weekly video",
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
  "points": ["状态页和截图开始出现", "用户关心稳定可用", "短暂闪现会放大焦虑"],
  "card": {
    "label": "r/ClaudeCode",
    "title": "Anthropic speaks after 2 weeks",
    "body": "讨论集中在 SOTA 模型限制、Fable 是否放出,以及全球用户是否会转向替代模型。",
    "metaLeft": "Jun 27",
    "metaRight": "source card"
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
- `bgm.volume`: `0.045`
- `outputs.coverAtSeconds`: `5`

## Optional Brand Fields

- `brand.backgroundImage`: local image path, such as `assets/cover.png`. Use this for a generated cover background, X screenshot, or account-specific visual. Omit it when no image is needed.
- `brand.theme`: currently documented for humans; change CSS in `index.html` intentionally before relying on new theme names.

## Writing Rules

- Keep scene `speech` as spoken Chinese, not article prose.
- Keep scene `caption` shorter than 20 Chinese characters when possible.
- Use `headline` as an array of lines; avoid `<br>`.
- Use source cards for X/Reddit/official update evidence, not for decoration.
- If a source card competes with the headline, shorten the card body first.
