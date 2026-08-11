# Vedic astrology site

Janma Kundali birth chart tool: an interactive birth-chart trainer with real user
accounts, per-user course assignment, and progress tracking, deployed as a Cloudflare
Pages site with a serverless API and D1 database backing it.

## Architecture

```
Browser (public/app.js)
   │  fetch, credentials: 'same-origin'
   ▼
Cloudflare Pages Functions (functions/api/**)   — serverless, deployed alongside the static site
   │  D1 binding: env.DB
   ▼
Cloudflare D1 (SQLite)  "vedic-astrology-db"
```

- **Frontend**: a single static page (`public/index.html` + `public/app.js` + `public/styles.css`).
  No build step, no framework — plain DOM manipulation, extracted from an original
  single-file version. Deployed as static assets by Cloudflare Pages.
- **Backend**: [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
  — file-based routing under `functions/`, same convention as Next.js API routes.
  Each route is a small serverless function running on Cloudflare's edge (Workers runtime),
  deployed as part of the same `wrangler pages deploy` as the static site.
- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/), a hosted SQLite
  database, bound to the Functions as `env.DB` via `wrangler.toml`.
- **Auth**: custom — no third-party auth provider. Passwords are hashed with PBKDF2-SHA256
  (Web Crypto, since D1/Workers has no native bcrypt/scrypt binding) and sessions are
  HttpOnly cookies backed by hashed tokens stored in D1.

There is no CI/CD and no GitHub integration — deploys are a direct `wrangler pages deploy`
from a local machine straight to Cloudflare's API (see "Deploy" below). Pushing to GitHub
does **not** trigger a deploy; keep git and the live site in sync manually.

## Structure

```
vedic-astrology-site/
  public/
    index.html              entry point — sign-in screen, panels, charts
    styles.css
    app.js                  all client-side logic (chart rendering, panels, API calls)
    _headers                Cloudflare Pages caching/security headers
  functions/
    _lib/auth.js            password hashing, sessions, cookie parsing, requireUser/requireAdmin
    api/
      login.js               POST   — verify credentials, create session
      logout.js               POST   — destroy session
      me.js                    GET    — current session's user (used for auto-login on reload)
      courses.js               GET    — this user's course list, server-filtered by enrolled programs
      progress.js              GET/DELETE — this user's course progress / clear all of it
      progress/[courseId].js   PUT    — upsert progress for one course
      admin/
        users/
          index.js               GET (list) / POST (create user)
          [username].js          PATCH (programs/panels/active) / DELETE
          [username]/
            reset-password.js     POST — admin sets a user's password
            progress.js            DELETE — admin clears a user's course progress
        programs/
          index.js               GET (list) / POST (add a program row)
          [id].js                 PATCH / DELETE a program_courses row
  migrations/
    0001_init.sql            users, sessions, program_courses, user_programs
    0002_course_progress.sql course_progress
  scripts/
    create-admin.mjs         interactive CLI to seed the admin account (see "First-time setup")
  wrangler.toml               Pages + D1 binding config
  package.json
```

## Data model (D1)

- **`users`** — `username`, `password_hash` (PBKDF2), `is_admin`, `active`, and one column
  per UI panel (`courses`, `cosmic`, `chart_selector`, `flashcards`, `workbook`, `mychart`,
  `journey`) controlling which panels that user sees.
- **`sessions`** — `token_hash` (SHA-256 of the session cookie value, not the raw token) →
  `user_id`, `expires_at` (30-day epoch-ms expiry).
- **`user_programs`** — many-to-many: a user can be enrolled in multiple programs at once.
- **`program_courses`** — the lesson catalog: `id`, `program`, `course_name`, `file_name`.
  A user's Courses panel is the subset of rows whose `program` is one they're enrolled in
  (or, if they're enrolled in none, every row — same "no filter" fallback the original
  localStorage version used).
- **`course_progress`** — per user, per course: `media_done`, `flashcards_flipped` (JSON
  array), `completed`. A row's mere existence means that lesson has been opened at least
  once ("viewed").

## Auth & accounts

- **No public sign-up.** Only an admin can create accounts, from the "Manage panel access"
  screen (shown automatically after an admin signs in).
- **No email/OTP password reset.** If a user forgets their password, an admin resets it for
  them from the same screen — there's a "⟳ reset password" button per row.
- **Sessions persist across visits.** On page load, the client calls `GET /api/me`; a valid
  session cookie skips straight past the sign-in screen.
- **Passwords** are never stored or logged in plaintext, including by tooling — see
  "First-time setup" below for how the admin account is seeded without the password ever
  appearing in a shell history, script argument, or (if you're pairing with an AI
  assistant) a chat transcript.

### Admin capabilities (Manage Access screen)

- Create users, assign a temporary password.
- Check/uncheck which program(s) each user is enrolled in (multi-select — checkbox per
  known program, sourced from whatever program names exist in the course-management grid).
- Toggle which of the 7 UI panels each user can see, and whether their account is active.
- Reset a user's password.
- Clear a user's course progress (re-locks their course list back to the first lesson).
- Delete a user (blocked for your own currently-logged-in account).
- Manage the course catalog itself: add/edit/delete `program_courses` rows (program name,
  lesson name, file name).

## Course progress

Each lesson tracks two things: whether its media was consumed (video watched / last
page-or-slide reached) and whether every one of its flashcard questions has been flipped at
least once. A lesson counts as "completed" once both are true, which unlocks the next lesson
in the list (completed lessons stay open for review; only the first not-yet-completed lesson
plus everything already completed is clickable).

This all lives server-side in `course_progress` now — it survives logout/login and follows
a user across devices/browsers, instead of resetting every session like the pre-auth version
did. A "Clear my progress" link at the bottom of the Courses panel lets a user reset it
themselves; admins can do the same for any user from the Manage Access grid.

## First-time setup

```bash
npm install
npx wrangler login                    # first time only, opens browser to authenticate

# Create the D1 database (only needed once per Cloudflare account/project)
npx wrangler d1 create vedic-astrology-db
# → paste the returned database_id into wrangler.toml's [[d1_databases]] block

# Apply the schema, both locally (for `npm run dev`) and remotely (for production)
npx wrangler d1 execute vedic-astrology-db --local  --file=migrations/0001_init.sql
npx wrangler d1 execute vedic-astrology-db --remote --file=migrations/0001_init.sql
npx wrangler d1 execute vedic-astrology-db --local  --file=migrations/0002_course_progress.sql
npx wrangler d1 execute vedic-astrology-db --remote --file=migrations/0002_course_progress.sql

# Seed the admin account — prompts for username/password interactively, hashes locally
# with Node's crypto (matching functions/_lib/auth.js's format), and applies via wrangler.
# The password never touches a CLI arg, a file, or (if scripted by an assistant) its context.
npm run create-admin
```

## Deploy

```bash
npm run deploy
```

Runs `wrangler pages deploy public --project-name=vedic-astrology-site`, which bundles
`public/` (static assets) together with the sibling `functions/` directory (the API) and
uploads both directly to Cloudflare via your authenticated Wrangler CLI session — a new
`*.pages.dev` URL is live within seconds. **This does not go through GitHub**: there's no
build hook, no Pages-GitHub integration configured for this project, and pushing to the
repo has no effect on what's live. If you change schema (a new migration file), re-run the
`wrangler d1 execute` commands above (both `--local` and `--remote`) before deploying code
that depends on it.

Attach a custom domain from the Cloudflare dashboard → Workers & Pages → your project →
Custom domains.

For local preview before deploying (uses the `--local` D1 database, a separate SQLite file
under `.wrangler/`, not production data):
```bash
npm run dev
```

## Known limitations

**Some per-browser data is still `localStorage`-only, not server-side.** Workbook answers/
uploads, My Chart tabs, drag-and-drop planet placements, and the ascendant position are all
still per-browser (see `WORKBOOK_STORAGE_KEY`, `MYCHART_STORAGE_KEY`,
`PLANET_PLACEMENTS_STORAGE_KEY`, `ASC_POSITION_STORAGE_KEY` in `app.js`) — unlike accounts
and course progress, these don't yet follow a user across devices. Migrating them to D1
would follow the same pattern as `course_progress`.

**Video/PDF links are placeholders.** Real content only exists for the 3 seeded lessons
(`zodiac-intro`, `dignities-pdf`, `aspects-slides` in `migrations/0001_init.sql`); anything
else added through the Manage Courses grid gets a simulated preview built from its file
name. Swap in real R2/Bunny Stream URLs and wire them into `COURSE_CONTENT` in `app.js`
when ready.

**No rate limiting or lockout on login attempts.** Fine for a small cohort of known
learners; add if this ever faces the open internet at scale.

## Next steps

- Point a custom domain at the Pages project.
- Replace placeholder video/PDF URLs with real hosted media.
- Consider moving workbook/My Chart/planet-placement data server-side too, for full
  cross-device consistency.
