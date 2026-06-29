# wechat-weekly-video

把公众号文章、素材目录或短脚本生成视频号可发布的 3:4 解说视频。

标准输出固定为：

- `output/<slug>.mp4`
- `output/<slug>-cover.png`

默认规格：`1080x1440`、`3:4`、`30fps`、约 `45-60s`。

## 适合谁用

- 想把公众号文章复用成视频号短视频的人。
- 想把 X / Reddit / 官方公告素材做成解说视频的人。
- 想把 Codex / Claude Code 的视频生产流程固化成 Skill 的人。

这个仓库不是单个视频模板，而是一套视频生产 Harness：文章规划、素材匹配、口播合成、BGM 混音、HyperFrames 动效渲染、封面导出和 QA 检查都在同一个项目里。

## 安装为 Skill

Codex：

```bash
git clone https://github.com/tangka/wechat-weekly-video.git ~/.codex/skills/wechat-weekly-video
```

Claude Code：

```bash
git clone https://github.com/tangka/wechat-weekly-video.git ~/.claude/skills/wechat-weekly-video
```

如果你希望 Codex 和 Claude Code 共用同一份仓库，可以 clone 到任意目录，再软链：

```bash
ln -s /path/to/wechat-weekly-video ~/.codex/skills/wechat-weekly-video
ln -s /path/to/wechat-weekly-video ~/.claude/skills/wechat-weekly-video
```

更新：

```bash
cd /path/to/wechat-weekly-video
git pull
```

## 最推荐的用法：文章 + 素材目录

如果已经有公众号草稿 Markdown，优先用文章规划脚本：

```bash
npx --yes tsx /path/to/wechat-weekly-video/scripts/plan-from-article.ts \
  --article /path/to/article.md \
  --materials /path/to/material-folder \
  --out /path/to/article/video \
  --force
```

它会生成一个完整视频项目：

```text
/path/to/article/video/
  video.config.json
  video-plan.md
  index.html
  assets/
  scripts/
  package.json
```

然后进入项目构建：

```bash
cd /path/to/article/video
npm run build
```

构建完成后看：

```text
output/<slug>.mp4
output/<slug>-cover.png
output/qa/contact-sheet.jpg
output/qa/hero-frame.png
```

## 没有文章时：创建空项目

```bash
npx --yes tsx /path/to/wechat-weekly-video/scripts/new-project.ts \
  --out /path/to/video-project \
  --force
```

然后手动编辑：

```text
/path/to/video-project/video.config.json
```

## 别人要改哪里

普通使用者主要改生成出来的视频项目，而不是改 Skill 仓库本体。

### 改文案、分镜、素材

改：

```text
/path/to/article/video/video.config.json
/path/to/article/video/assets/
```

常用字段：

| 位置 | 作用 |
|-|-|
| `title` | 视频标题 |
| `slug` | 输出文件名 |
| `duration.targetSeconds` | 目标时长 |
| `outputs.video` | MP4 输出路径 |
| `outputs.cover` | 封面输出路径 |
| `brand.logo` | 全局默认右下角 logo |
| `brand.backgroundImage` | 全局背景图 |
| `scenes[].headline` | 每一屏大标题 |
| `scenes[].note` | 每一屏解释句 |
| `scenes[].speech` | 实际口播稿 |
| `scenes[].caption` | 底部字幕 |
| `scenes[].points` | 要点列表 |
| `scenes[].card.image` | 当前屏展示的素材图 |
| `scenes[].logo` | 当前屏右下角音频响应 logo |

素材图片、X cover、截图、logo、BGM 都放到：

```text
/path/to/article/video/assets/
```

### 改当前视频设计

只改这一条视频的设计：

```text
/path/to/article/video/index.html
```

这里控制版式、字号、背景、卡片、动效、右下角 logo 跳动和线条呼吸。

### 改所有新视频的默认设计

改 Skill 仓库里的模板：

```text
/path/to/wechat-weekly-video/assets/hyperframes-template/index.html
```

以后用 `plan-from-article.ts` 或 `new-project.ts` 生成的新项目都会继承这个设计。

### 改所有新视频的默认配置

改：

```text
/path/to/wechat-weekly-video/assets/hyperframes-template/video.config.json
```

这里适合固化默认声音、默认 BGM、默认尺寸和默认输出规则。

## 自定义背景音乐

在生成项目的 `video.config.json` 里改 `bgm`。

使用本地音乐：

```json
"bgm": {
  "file": "assets/my-bgm.mp3",
  "sourceName": "my tech bgm",
  "volume": 0.04,
  "fadeIn": 0.8,
  "fadeOut": 1
}
```

然后把音乐文件放到：

```text
/path/to/article/video/assets/my-bgm.mp3
```

使用网络音乐：

```json
"bgm": {
  "file": "assets/bgm.mp3",
  "sourceName": "Mixkit Uplifting Bass 726",
  "sourceUrl": "https://assets.mixkit.co/music/726/726.mp3",
  "volume": 0.04,
  "fadeIn": 0.8,
  "fadeOut": 1
}
```

构建时会自动下载到 `bgm.file`。

音量建议：

| `bgm.volume` | 效果 |
|-|-|
| `0.03-0.05` | 低存在感背景 |
| `0.06-0.10` | 明显能听到 |
| `0.12+` | 容易抢口播 |

## 自定义口播音

当前默认使用 Edge TTS，在 `video.config.json` 里改 `voice`：

```json
"voice": {
  "provider": "edge-tts",
  "voice": "zh-CN-YunxiNeural",
  "rate": "+30%",
  "pitch": "-5Hz",
  "gapSeconds": 0.12
}
```

常用字段：

| 字段 | 作用 |
|-|-|
| `voice.voice` | 声音 ID |
| `voice.rate` | 语速，例如 `+20%`、`+30%`、`+40%` |
| `voice.pitch` | 音高，例如 `-5Hz`、`+5Hz` |
| `voice.gapSeconds` | 分镜之间的停顿 |

人声音量在 `audio` 里调：

```json
"audio": {
  "voiceGain": 1.25,
  "targetI": -13,
  "targetLRA": 11,
  "targetTP": -1.5
}
```

常用调法：

| 问题 | 调整 |
|-|-|
| 人声小 | `voiceGain` 从 `1.25` 提到 `1.35-1.45` |
| 整体小 | `targetI` 从 `-13` 提到 `-12` |
| 刺耳或压缩感重 | `targetI` 降到 `-14` 或 `-15` |
| 语速慢 | 提高 `voice.rate`，重新合成，不要硬拉伸旧音频 |

如果要接入 OpenAI TTS、火山、MiniMax、ElevenLabs 等新服务，需要扩展：

```text
/path/to/article/video/scripts/synth-voice.ts
```

或者改模板里的：

```text
/path/to/wechat-weekly-video/assets/hyperframes-template/scripts/synth-voice.ts
```

## 官方 logo 放哪

内置官方头像在：

```text
/path/to/wechat-weekly-video/assets/official-logos/
```

当前包含：

- `codex-openai-devs-avatar.jpg`
- `openai-avatar.jpg`
- `claudeai-avatar.jpg`
- `anthropicai-avatar.jpg`

使用原则：

- Codex 素材用 Codex / OpenAI Developers 头像。
- OpenAI 公司素材用 OpenAI 头像。
- Claude 产品素材用 Claude 头像。
- Anthropic 公司素材用 Anthropic 头像。
- 不要把社区号头像当官方公司 logo。

## QA 检查

构建后至少检查：

```bash
npm run validate
npm run qa
```

重点看：

- MP4 是否是 `1080x1440`。
- 显示比例是否是 `3:4`。
- 封面是否也是 `1080x1440`。
- `output/qa/contact-sheet.jpg` 是否有文字重叠、画面空洞、素材看不清。
- 视频中段不能静止，要有明显持续运动。
- `audio_mean` 不要过低；手机上听不到就提高 `audio.voiceGain` 或调高 `audio.targetI`。

## 给 Agent 的一句话提示

```text
使用 wechat-weekly-video，把这篇公众号文章和素材目录生成视频号 3:4 视频。
先用 plan-from-article.ts 生成 video.config.json 和 video-plan.md。
我会审稿；通过后再 npm run build。
标准输出是 output/<slug>.mp4 和 output/<slug>-cover.png。
```

## 设计原则

- `video.config.json` 是主要输入，不要把内容散落在脚本里。
- 每条视频应该能从文章和素材复现，不靠手工记忆。
- 输出必须是原生 `3:4`，不要渲染后再补边。
- 画面不能长时间静止，至少要有背景、线条、卡片、logo 多层运动。
- 先确认口播声音，再做完整视频。
- 最终交付前必须有视频、封面和 QA 图。
