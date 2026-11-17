# Epsilon Audio: Eurorack

Source for [eurorack.epsilonrecords.com](https://eurorack.epsilonrecords.com), the home of Epsilon Audio's Eurorack modules, published by Epsilon Records. The plugins live at [plugins.epsilonrecords.com](https://plugins.epsilonrecords.com).

The site is static and served by Netlify from `site/`. Agents working here: read [AGENTS.md](AGENTS.md).

## Local preview and checks

Use Node.js 24 or newer. The deployed site needs no build, Node server or JavaScript.

```sh
npm ci
npx playwright install chromium
npm run serve
```

Open `http://127.0.0.1:4173`. Missing paths serve the site's 404 page with a 404 status.

`npm test` validates all HTML, checks internal assets and fragments plus external navigation links, then runs Chromium/axe on every HTML page at 375 px and 1440 px. It also checks keyboard navigation, sticky-header clearance, overflow, the dark theme under a light OS preference, and the 404 return link. Playwright writes screenshots to `test-results/` and a report to `playwright-report/`; CI uploads both.

## Content and design

- `site/` is published as-is. `netlify.toml` requires an explicit `-preview` branch suffix for deploy previews. Netlify site setup and DNS belong to the Oracle.
- `site/modules/_template.html` contains placeholders only. Keep it unlinked, marked `noindex`, and outside the sitemap. Do not fill it with module information until the Oracle confirms publication readiness.
- `site/tokens.css` is a verbatim mirror of the shared design canon at knowledge commit `d7cffb32735dda3611de7fc538b623733d89811e`. Set `data-product="eurorack"` and `data-theme="dark"`; do not add local colour/type tokens.
- Plex font files, their OFL licence and `fonts.css` come from epsilon-plugins commit `204be941987abbb8f6486070d022398b3b4eed0b`. Fonts are self-hosted.
- Hardware placeholders use the existing canonical Table and Card components. No new hardware component or token is introduced. The signal illustration is decorative, static and describes no module.
- There are no analytics, signup forms, third-party scripts, prices or sales controls.
- The Open Graph PNG is a 1200 × 630 browser capture of the home page. Refresh it when the hero changes; screenshots for review live in `docs/screenshots/`.
