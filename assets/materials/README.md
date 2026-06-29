# Materials

This is the reusable material center for the skill.

Everything in this directory is copied into each generated video project at:

```text
assets/materials/
```

Put reusable, shareable assets here when they should travel with the skill:

- `bgm/` for background music files.
- `backgrounds/` for reusable cover/background images.
- `source-cards/` for reusable source-card images.
- `bgm-presets.json` for BGM snippets that can be copied into `video.config.json`.
- `voice-presets.json` for narration voice snippets that can be copied into `video.config.json`.
- `voice-samples/` for generated local audition files. This directory is ignored by git.

Per-video one-off screenshots and article materials should still go into the generated project `assets/` directory. Only reusable defaults belong here.

## Built-In BGM

- `bgm/mixkit-tech-house-vibes-130.mp3`
  - Source name: `Mixkit Tech House Vibes 130`
  - Duration: about `102s`
  - Suggested `bgm.volume`: `0.035`

The track is loud enough to sit under narration, so start conservative and raise only after listening on a phone.

## Voice Audition

From the skill repository:

```bash
npx --yes tsx scripts/audition-voices.ts
```

From a generated video project:

```bash
npm run voices
```

Samples are written to:

```text
assets/materials/voice-samples/
```
