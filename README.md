# Vedic astrology site

Janma Kundali birth chart tool, split out of a single HTML file into a deployable
static project.

## Structure

```
vedic-astrology-site/
  public/
    index.html      entry point
    styles.css       (was inline <style>)
    app.js           (was inline <script>)
    _headers         Cloudflare Pages caching/security headers
  wrangler.toml
  package.json
```

Behavior is unchanged from the original file — CSS and JS were extracted
line-for-line, same load order, nothing rewritten.

## Deploy

```bash
npm install
npx wrangler login        # first time only, opens browser to authenticate
npm run deploy
```

That deploys `public/` to a `*.pages.dev` URL. Attach a custom domain afterward
from the Cloudflare dashboard → Workers & Pages → your project → Custom domains.

For local preview before deploying:
```bash
npm run dev
```

## Known limitations (carried over from the original file, not introduced by this split)

**The sign-in password is not real security.** It's a hardcoded check
(`password === 'ATV'`) in `app.js`, visible to anyone who views source. Fine
for an internal demo; replace with real auth (e.g. NextAuth, Clerk) before
using this to gate anything that matters.

**Access grid and user data live in `localStorage`, not a server.** The admin
"manage access" panel, workbook entries, and progress tracking are all
per-browser. Granting a user access on your machine does not reach their
browser. Fine for solo testing; will need a real backend + database once you
have multiple learners on different devices.

**Video/PDF links are placeholders.** `app.js` currently points at
`archive.org` and `vedicastrologer.org` URLs for sample content. Swap in your
own R2/Bunny Stream URLs once your media is uploaded (search `videoSrc` and
`sourceUrl` in `app.js`).

## Next steps

- Replace placeholder video/PDF URLs with your own hosted media
- Decide whether to keep this page's login system or replace it with the
  real backend auth from the main platform
- Point a custom domain at the Pages project
