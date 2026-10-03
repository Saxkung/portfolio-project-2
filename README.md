# Sax Music

React/Vite portfolio at https://saxmusic.site, hosted by the Cloudflare Pages
project `saxmusic` and backed by a separate Cloudflare Worker.

## Development

```sh
bun install --frozen-lockfile
bun run dev
```

Keep `bun.lock` and `package-lock.json` synchronized when changing dependencies.
The dev server forwards the public `/api/v1/portfolio` request to production.
R2 currently allows `http://localhost:5173` for media CORS, so use that origin
instead of an arbitrary preview port when testing real media in development.
`vite preview` serves the built frontend; it does not run Pages Functions.

## Checks

```sh
npm test
bun run lint
bun run build
bun audit
```

The regression tests use Node's native TypeScript stripping (verified on Node.js 25).
They cover the Pages proxy's public cache, admin authentication/uploads, error
redaction, CORS, HEAD requests, and media/waveform validation.

## Cloudflare deployment

The production configuration was checked in the actual Cloudflare dashboard on
2026-10-03:

| Setting | Value |
| --- | --- |
| Pages project | `saxmusic` |
| Git repository / production branch | `Saxkung/portfolio-project-2` / `main` |
| Build command / output directory | `bun run build` / `dist` |
| Pages service binding | `SAX_MUSIC_API` -> `sax-music-api` |
| Pages compatibility date | `2025-11-08` |
| API Worker D1 binding | `DB` -> `sax-music-db` |
| API Worker R2 binding | `BUCKET` -> `sax-music` |
| Published media origin | `https://hls.saxmusic.site` |

The deployed API Worker includes authenticated admin CRUD and upload routes.
Keep the `/api/*` Pages Function route and service binding: forwarding only the
portfolio endpoint would break these clients. This repository does not contain
the current deployed API Worker, and an older local backend checkout is not its
source of truth.

Only successful public portfolio JSON is cached for 60 seconds. Admin requests
retain their original method, body, and authentication and use `no-store`.
Upstream 5xx responses and binding exceptions return a generic public error.

`public/_headers` defines the static security policy and immutable caching for
Vite's hashed JS/CSS assets. API response headers are set by the Function itself.
The CSP permits inline scripts for Cloudflare's existing injected challenge
script, so it is not a complete inline-script XSS defense. No admin credential
belongs in frontend code or a `VITE_*` variable; credentials must remain in the
authenticated backend's secret configuration.

Some existing R2 waveform cache entries returned no CORS header even though a
fresh URL returned the configured production origin. Recheck the unchanged
production URLs when deploying; a targeted cache refresh may be needed. This
source change does not modify Cloudflare credentials, R2 CORS, or zone settings.

## Performance and animation

The portfolio request no longer blocks the hero or contact information. Player
clock updates do not rerender all cards, waveform requests are cancelled when
tracks change, and the waveform cache is bounded. HLS media uses native support
where available, and the background video pauses while offscreen or in a hidden
tab.

Production builds remove unused CSS while safelisting dynamic Swiper, Bootstrap
collapse, and animation classes. Original scroll fades, card transitions,
playing bars, mobile menu collapse, and the player slide-in/slide-out remain.
Keep those classes when updating the CSS extraction configuration.

In the checked builds, the main stylesheet decreased from 249.88 kB to 32.07 kB
(gzip 35.10 kB to 7.28 kB). Updated dependency code makes the main JS bundle
larger; this is not a claim that every bundle or measured page-load time shrank.
Both package audits reported zero known advisories after the dependency update.
