# Visual QA

Run these checks before handoff.

## Required Commands

Inside the generated video project:

```bash
npm run validate
npm run qa
```

`npm run build` already runs `qa`, but run it again after manual edits.

## Required Artifacts

- `output/<slug>.mp4`
- `output/<slug>-cover.png`
- `output/qa/contact-sheet.jpg`
- `output/qa/hero-frame.png`

## Pass Criteria

- MP4 is native `1080x1440` unless config says otherwise.
- Display aspect ratio is `3:4` for WeChat Channels.
- Cover dimensions match video dimensions.
- No obvious card/text overlap in `contact-sheet.jpg`.
- Captions do not cover source cards or essential headline text.
- No long blank middle area unless the scene intentionally needs a quiet hold.

## Common Fixes

- Text/card collision: narrow the note or move source card lower/right.
- Fake 3:4 padding: change root `data-height` and CSS root height before rendering.
- BGM too loud: lower `bgm.volume` to `0.035-0.05`.
- Voice too slow: increase `voice.rate`; prefer re-synthesis over `atempo`.
- Decorative text fails QA: use CSS pseudo-content on an empty element plus `data-layout-ignore`.
