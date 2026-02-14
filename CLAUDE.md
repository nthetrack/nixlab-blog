# NixLab Blog

## Overview

Hugo static blog owned by Nik Palmer, hosted on Cloudflare Workers via the `nixlab-blog` worker.
Live at **https://blog.nixlab.online** (custom domain) and `https://nixlab-blog.theofficeinbox.workers.dev`.

## Stack

- **Static site generator:** Hugo with `hugo-theme-terminal` theme (git submodule at `themes/hugo-theme-terminal`)
- **Hosting:** Cloudflare Workers (static assets)
- **Build & deploy:** Cloudflare auto-builds on push to `master` branch
- **Repo:** `github.com/nthetrack/nixlab-blog` (Nik's personal GitHub account)

## Key Files

| File | Purpose |
|------|---------|
| `hugo.toml` | Hugo config — site title, theme, language, menu items, footer |
| `wrangler.jsonc` | Cloudflare Workers config — deploys `./public` as static assets |
| `layouts/partials/extended_head.html` | Injects custom CSS into the theme |
| `static/css/custom.css` | NixLab brand overrides (cyan accent, dark background) |
| `Dockerfile` | For local dev/testing only — multi-stage Hugo build + nginx |
| `docker-compose.yml` | For local dev/testing only — serves on port 8082 |
| `nginx.conf` | For local dev/testing only — static file serving config |

## How to Create a New Blog Post

1. Create a new markdown file at `content/posts/<slug>.md`
2. Include frontmatter:

```markdown
---
title: "Post Title Here"
date: 2026-02-14
draft: false
tags: ["tag1", "tag2"]
---

Post content in markdown.
```

3. Commit and push to `master`:

```bash
cd D:/nixlab/blog
git add content/posts/<slug>.md
git commit -m "Add post: <title>"
git push
```

4. Cloudflare auto-builds and deploys within ~30 seconds.

### Frontmatter Fields

- `title` (required) — post title
- `date` (required) — publication date in `YYYY-MM-DD` format
- `draft` — set to `true` to hide from production, `false` to publish
- `tags` — array of tag strings for categorisation
- `cover` — path to a cover image (place images in `static/images/`)

### Adding Images

Place images in `static/images/` and reference them in posts as `/images/filename.png`.

## Theme

The theme is `panr/hugo-theme-terminal` — a dark, minimal, developer-focused theme. It is included as a git submodule. To update it:

```bash
cd themes/hugo-theme-terminal
git pull origin master
cd ../..
git add themes/hugo-theme-terminal
git commit -m "Update terminal theme"
git push
```

## Brand Customisation

Custom styles are in `static/css/custom.css`, injected via `layouts/partials/extended_head.html`. Key brand values:

- Accent colour: `#00c6ff` (cyan)
- Background: `#0f0f0f`
- Theme colour setting in `hugo.toml`: `blue`

## Menu Items

Configured in `hugo.toml` under `[languages.en.menu.main]`:

- **About** → `/about` (create `content/about.md` with `type: page` if needed)
- **Portfolio** → `https://nixlab.online` (external link)

## Local Development

Hugo is not installed on the host. Use Docker for local preview:

```bash
cd D:/nixlab/blog
docker compose up --build
# Visit http://localhost:8082
```

## Git Credentials

The repo is on Nik's personal GitHub (`nthetrack`). His work account is `npalmerwiot` — do not push to that account. If git pushes fail with permission errors, the system credential manager may be using the wrong account. Use `gh auth login` to authenticate as `nthetrack` or embed the token in the remote URL temporarily.
