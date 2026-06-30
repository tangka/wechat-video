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
- If an X/Twitter card screenshot exists, it should be shown directly as a large readable card, not reduced to a small image inside another card.
- No long blank middle area unless the scene intentionally needs a quiet hold.
- No static holds: after the entrance animation, each scene still needs obvious ongoing motion in at least three layers, such as sweep lines, breathing/growing signal lines, moving dots/rings, background parallax, audio-reactive logo badge, and card/point movement.

## Common Fixes

- Text/card collision: narrow the note or move source card lower/right.
- Static-looking scene: add or tune `animateSceneHold` so visible sweep lines, breathing signal lines, audio-reactive logo badge, moving dots/rings, background parallax, cards, or points keep moving during the hold. Subtle drift alone is not enough.
- Fake 3:4 padding: change root `data-height` and CSS root height before rendering.
- BGM too loud: lower `bgm.volume` to `0.035-0.05`.
- Whole video too quiet: keep `amix normalize=0`, then raise `audio.voiceGain` slightly. If it clips or sounds harsh, lower `audio.targetI` from `-13` to `-14` or `-15`.
- Voice too slow: increase `voice.rate`; prefer re-synthesis over `atempo`.
- Decorative text fails QA: use CSS pseudo-content on an empty element plus `data-layout-ignore`.
