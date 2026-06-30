# wechat-video

根据公众号 vault 里的文章、待发布目录和今日动态素材，生成视频号可发布的 3:4 解说视频。

内置两种视频模板：

- `daily`：日常动态，适合把当天 Codex / Claude / AI 产品更新做成 45-70 秒短视频。
- `weekly`：周刊复盘，适合把一周主题、趋势和社区反馈做成结构化复盘视频。

标准输出固定为：

- `output/<slug>.mp4`
- `output/<slug>-cover.png`

默认规格：`1080x1440`、`3:4`、`30fps`、约 `45-60s`。

## 适合谁用

- 想把公众号 vault 里的文章、待发布稿和素材复用成视频号短视频的人。
- 想把 X / Reddit / 官方公告动态做成解说视频的人。
- 想把 Codex / Claude Code 的视频生产流程固化成 Skill 的人。

这个仓库不是单个视频模板，而是一套视频生产 Harness：文章规划、素材匹配、口播合成、BGM 混音、HyperFrames 动效渲染、封面导出和 QA 检查都在同一个项目里。

## 安装为 Skill

Codex：

```bash
git clone https://github.com/tangka/wechat-video.git ~/.codex/skills/wechat-video
```

Claude Code：

```bash
git clone https://github.com/tangka/wechat-video.git ~/.claude/skills/wechat-video
```

如果你希望 Codex 和 Claude Code 共用同一份仓库，可以 clone 到任意目录，再软链：

```bash
ln -s /path/to/wechat-video ~/.codex/skills/wechat-video
ln -s /path/to/wechat-video ~/.claude/skills/wechat-video
```

更新：

```bash
cd /path/to/wechat-video
git pull
```

## 最推荐的用法：从 Vault 生成

典型输入来自公众号 vault：

```text
<vault>/微信公众号/<账号>/待发布/<草稿目录>/<草稿>.md
<vault>/微信公众号/<账号>/素材库/<日期>/<素材目录>/
```

如果已经有公众号草稿 Markdown，优先用文章规划脚本：

```bash
npx --yes tsx /path/to/wechat-video/scripts/plan-from-article.ts \
  --article /path/to/article.md \
  --materials /path/to/vault/微信公众号/<账号>/素材库/<日期> \
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
npx --yes tsx /path/to/wechat-video/scripts/new-project.ts \
  --out /path/to/video-project \
  --force
```

然后手动编辑：

```text
/path/to/video-project/video.config.json
```

可直接从样本开始：

```bash
cp /path/to/wechat-video/examples/video-configs/codex-daily-2026-06-30.video.config.json \
  /path/to/video-project/video.config.json
```

## 模板类型

`video.config.json` 里用 `template.kind` 标明视频类型：

```json
"template": {
  "kind": "daily",
  "source": "vault"
}
```

可选值：

| `template.kind` | 用途 |
|-|-|
| `daily` | 今日动态 / 日常更新 |
| `weekly` | 周刊复盘 / 一周总结 |

样本配置放在：

```text
/path/to/wechat-video/examples/video-configs/
```

## 素材中心

Skill 仓库里有一个专门给别人配置和扩展的素材中心：

```text
/path/to/wechat-video/assets/materials/
```

新建视频项目时，它会被自动复制到：

```text
/path/to/article/video/assets/materials/
```

目录约定：

| 目录 / 文件 | 作用 |
|-|-|
| `bgm/` | 可复用背景音乐 |
| `backgrounds/` | 可复用背景图 / 封面底图 |
| `source-cards/` | 可复用素材卡片 |
| `bgm-presets.json` | BGM 配置片段 |
| `voice-presets.json` | 口播音配置片段 |

一次性素材，比如文章截图、X cover、临时图片，仍然放到生成项目的 `assets/` 根目录。只有希望分享给别人复用的素材，才放到 `assets/materials/`。

## 别人要改哪里

普通使用者主要改生成出来的视频项目，而不是改 Skill 仓库本体。

### 改文案、分镜、素材

改：

```text
/path/to/article/video/video.config.json
/path/to/article/video/assets/
/path/to/article/video/assets/materials/
```

常用字段：

| 位置 | 作用 |
|-|-|
| `title` | 视频标题 |
| `template.kind` | 模板类型：`daily` 或 `weekly` |
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

素材图片、X cover、截图、logo、单条视频专用 BGM 都放到：

```text
/path/to/article/video/assets/
```

可复用 BGM、背景图、配置预设放到：

```text
/path/to/article/video/assets/materials/
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
/path/to/wechat-video/assets/hyperframes-template/index.html
```

以后用 `plan-from-article.ts` 或 `new-project.ts` 生成的新项目都会继承这个设计。

### 改所有新视频的默认配置

改：

```text
/path/to/wechat-video/assets/hyperframes-template/video.config.json
```

这里适合固化默认声音、默认 BGM、默认尺寸和默认输出规则。

改 Skill 自带素材中心：

```text
/path/to/wechat-video/assets/materials/
```

这里适合固化可复用 BGM、背景图、素材卡片和 voice/BGM 预设。

## 自定义背景音乐

在生成项目的 `video.config.json` 里改 `bgm`。

素材中心内置了一个 BGM：

```text
assets/materials/bgm/mixkit-tech-house-vibes-130.mp3
```

默认配置：

```json
"bgm": {
  "file": "assets/materials/bgm/mixkit-tech-house-vibes-130.mp3",
  "sourceName": "Mixkit Tech House Vibes 130",
  "volume": 0.035,
  "fadeIn": 0.8,
  "fadeOut": 1
}
```

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

也可以从这里复制预设：

```text
assets/materials/bgm-presets.json
```

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

也可以从这里复制预设：

```text
assets/materials/voice-presets.json
```

试听所有口播预设：

```bash
cd /path/to/wechat-video
npx --yes tsx scripts/audition-voices.ts
open assets/materials/voice-samples
```

在生成后的视频项目里试听：

```bash
cd /path/to/article/video
npm run voices
open assets/materials/voice-samples
```

只试听某一个预设：

```bash
npm run voices -- --preset tech_male_commentary
```

自定义试听文案：

```bash
npm run voices -- --text "这里是 Codexx 的口播试听。Codex 这个词需要突出。"
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
/path/to/wechat-video/assets/hyperframes-template/scripts/synth-voice.ts
```

## 官方 logo 放哪

内置官方头像在：

```text
/path/to/wechat-video/assets/official-logos/
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
使用 wechat-video，根据公众号 vault 里的草稿和今日动态素材生成视频号 3:4 视频。
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
