# Video Config Examples

These examples preserve proven `video.config.json` structures for vault-based videos.

- `codex-daily-2026-06-30.video.config.json`: Codex daily update format.
- `claude-daily-2026-06-30.video.config.json`: Claude daily update format.
- `claude-weekly-template.video.config.json`: Claude weekly recap format.

Notes:

- Copy one example into a generated video project as `video.config.json`.
- Use `template.kind = "daily"` for 今日动态 and `template.kind = "weekly"` for 周刊复盘.
- Asset paths such as `assets/source/...` are intentionally relative to the generated project.
- For X/Twitter card screenshots, use the original card screenshot as the primary scene visual instead of shrinking it into a small thumbnail.
