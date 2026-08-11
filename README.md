# Vedic astrology site

Janma Kundali birth chart tool: an interactive birth-chart trainer with real user
accounts, per-user course assignment, progress tracking, and file uploads, deployed as a
Cloudflare Pages site with a serverless API, D1 database, and R2 object storage backing it.

## Architecture

```
Browser (public/app.js)
   │  fetch, credentials: 'same-origin'
   ▼
Cloudflare Pages Functions (functions/api/**)   — serverless, deployed alongside the static site
   │  D1 binding: env.DB          │  R2 binding: env.UPLOADS
   ▼                              ▼
Cloudflare D1 (SQLite)         Cloudflare R2 (object storage)
"vedic-astrology-db"           "vedic-astrology-uploads"
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
- **File storage**: [Cloudflare R2](https://developers.cloudflare.com/r2/), S3-compatible
  object storage, bound as `env.UPLOADS`. Holds raw file bytes for Workbook-answer and My
  Chart attachments; D1 holds the metadata (owner, file name, size, which answer/tab it
  belongs to). R2 is a separate product from Pages/D1 and needs enabling once per Cloudflare
  account (dashboard → R2) before `wrangler r2 bucket create` will work.
- **Auth**: custom — no third-party auth provider. Passwords are hashed with PBKDF2-SHA256
  (Web Crypto, since D1/Workers has no native bcrypt/scrypt binding) and sessions are
  HttpOnly cookies backed by hashed tokens stored in D1.

This Cloudflare Pages project has **GitHub integration enabled** (confirmed via `wrangler
pages project list` → `Git Provider: Yes`, and via GitHub check-runs posted by the
`cloudflare-workers-and-pages` App on every push) — pushing to `main` triggers an automatic
build/deploy on its own. `npm run deploy` (see "Deploy" below) is a *second*, independent
path: a direct `wrangler pages deploy` from a local machine straight to Cloudflare's API,
same as before Git integration was added. Both can fire for the same commit (a manual
`npm run deploy` followed by a `git push`, or vice versa) and each produces its own
deployment — harmless as long as both pick up the same `wrangler.toml` bindings (D1, R2),
worth spot-checking in the dashboard if you're relying on the Git-triggered build rather
than the CLI one.

## Structure

```
vedic-astrology-site/
  public/
    index.html              entry point — sign-in screen, panels, charts
    styles.css
    app.js                  all client-side logic (chart rendering, panels, API calls)
    _headers                Cloudflare Pages caching/security headers
  functions/
    _lib/
      auth.js                password hashing, sessions, cookie parsing, requireUser/requireAdmin
      uploads.js              upload constants (size/type limits) + cascade-delete helpers
    api/
      login.js               POST   — verify credentials, create session
      logout.js               POST   — destroy session
      me.js                    GET    — current session's user (used for auto-login on reload)
      courses.js               GET    — this user's course list, server-filtered by enrolled programs
      progress.js              GET/DELETE — this user's course progress / clear all of it
      progress/[courseId].js   PUT    — upsert progress for one course
      uploads/
        index.js                GET (list mine) / POST (multipart upload) / DELETE (clear mine)
        [id].js                  GET (download, owner-or-admin) / DELETE (owner-or-admin)
      workbook/
        documents.js             GET (my custom workbooks) / POST (create one)
        documents/[id].js        DELETE — cascades to its answers + attachments
        answers.js               GET (all my answers) / PUT (upsert one)
      mychart/
        tabs.js                  GET (my tabs) / POST (create one)
        tabs/[id].js              PUT (partial update) / DELETE — cascades to its attachment
      admin/
        users/
          index.js               GET (list) / POST (create user)
          [username].js          PATCH (programs/panels/active) / DELETE
          [username]/
            reset-password.js     POST — admin sets a user's password
            progress.js            DELETE — admin clears a user's course progress
            uploads.js              DELETE — admin clears a user's uploaded files
        programs/
          index.js               GET (list) / POST (add a program row)
          [id].js                 PATCH / DELETE a program_courses row
        uploads/
          index.js                GET — every upload across every user, joined to username
          [id].js                  DELETE — admin removes any single upload
  migrations/
    0001_init.sql            users, sessions, program_courses, user_programs
    0002_course_progress.sql course_progress
    0003_uploads_and_documents.sql  uploads, workbook_documents, workbook_answers, mychart_tabs
  scripts/
    create-admin.mjs         interactive CLI to seed the admin account (see "First-time setup")
  wrangler.toml               Pages + D1 + R2 binding config
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
- **`uploads`** — file metadata: `user_id`, `context` (`'workbook-answer'` or `'mychart-tab'`),
  `context_ref` (which answer/tab it's attached to), `file_name`, `mime_type`, `size_bytes`,
  `r2_key`. `UNIQUE(user_id, context, context_ref)` — one attachment per slot; uploading
  again to the same slot replaces it (old R2 object deleted first). Raw bytes live in R2
  under `u/<userId>/<uploadId>`.
- **`workbook_documents`** — custom "+ Add Document" workbooks only (the 3 built-in ones stay
  hardcoded in `app.js`, like `COURSE_CONTENT`): `title`, `type`, `blocks` (JSON, same shape
  the client always used).
- **`workbook_answers`** — `(user_id, workbook_id, question_index)` → `answer_text`,
  `edited_by`, `edited_at` (a display-ready string formatted client-side, not an epoch —
  the server stores/returns it as-is).
- **`mychart_tabs`** — `id`, `user_id`, `sort_order`, and `data` (JSON blob). A tab's shape
  varies a lot — a manually-added section is just `label`/`dot`/`question`/`answer`/
  `editedBy`/`editedAt`, while a "Generate Interpretation" section adds `generated`/
  `planetName`/`sign`/`house`/`sentenceStarter`/`responses` (10 sub-fields) — so it's stored
  as one blob rather than rigid columns, same reasoning as `workbook_documents.blocks`.
  `sort_order` is pulled into its own column purely so drag-reorder can be queried without
  parsing every blob.

Every table above that references file attachments cascades correctly: deleting a workbook
document deletes its answers and any attached uploads (R2 objects included); deleting a My
Chart tab deletes its attachment the same way. See `functions/_lib/uploads.js`.

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
- Clear a user's uploaded files.
- Delete a user (blocked for your own currently-logged-in account).
- Manage the course catalog itself: add/edit/delete `program_courses` rows (program name,
  lesson name, file name).
- Browse and delete any file, from any user, in the "All uploads" grid.

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

## File uploads (Workbook + My Chart)

Both the Workbook panel (one optional attachment per fill-in answer) and the My Chart panel
(one optional attachment per section/tab) let a user attach a file — previously stored as a
base64 `dataUrl` directly in `localStorage`, capped at 2MB with no server copy at all. Files
now go to R2 (raw bytes) with metadata in D1 (`uploads` table), with a 10MB size cap and an
extension allowlist (pdf, docx, doc, png, jpg, jpeg, gif, webp, txt, xlsx, csv).

Downloads (`GET /api/uploads/:id`) are always served with `Content-Disposition: attachment`
regardless of MIME type — the one meaningful risk here (an uploaded HTML/SVG file rendering
or executing script when opened) is fully neutralized by forcing a download instead of
letting the browser render it. Access is strictly owner-or-admin: any other signed-in user
gets a 403.

Both the Workbook document library (custom "+ Add Document" uploads) and My Chart's tabs
(including "Generate Interpretation" sections) are now fully server-backed too — see the
`workbook_documents`/`workbook_answers`/`mychart_tabs` tables above — so a whole document
(typed content and its attachment together) is durable across devices, not just the file
half of it. A user can clear all their own uploads from a link in the Workbook panel; an
admin can do the same for any user, or browse/delete individual files across every account,
from the Manage Access screen's "All uploads" grid.

## First-time setup

```bash
npm install
npx wrangler login                    # first time only, opens browser to authenticate

# Enable R2 for this Cloudflare account once, from the dashboard (R2 → Enable) — wrangler
# can't do this step; it's a one-time opt-in per account, separate from Pages/D1.

# Create the D1 database and R2 bucket (only needed once per Cloudflare account/project)
npx wrangler d1 create vedic-astrology-db
# → paste the returned database_id into wrangler.toml's [[d1_databases]] block
npx wrangler r2 bucket create vedic-astrology-uploads
# → wrangler.toml's [[r2_buckets]] block already points at this bucket name/binding

# Apply the schema, both locally (for `npm run dev`) and remotely (for production)
npx wrangler d1 execute vedic-astrology-db --local  --file=migrations/0001_init.sql
npx wrangler d1 execute vedic-astrology-db --remote --file=migrations/0001_init.sql
npx wrangler d1 execute vedic-astrology-db --local  --file=migrations/0002_course_progress.sql
npx wrangler d1 execute vedic-astrology-db --remote --file=migrations/0002_course_progress.sql
npx wrangler d1 execute vedic-astrology-db --local  --file=migrations/0003_uploads_and_documents.sql
npx wrangler d1 execute vedic-astrology-db --remote --file=migrations/0003_uploads_and_documents.sql

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
`*.pages.dev` URL is live within seconds. This is independent of the project's GitHub
integration (see "Architecture" above) — pushing to `main` *also* triggers a deploy on its
own, so you don't strictly need to run this manually after a push, but it's useful for
testing local changes before committing them. If you change schema (a new migration file),
re-run the `wrangler d1 execute` commands above (both `--local` and `--remote`) before
deploying code that depends on it — that step isn't automated by either deploy path.

Attach a custom domain from the Cloudflare dashboard → Workers & Pages → your project →
Custom domains.

For local preview before deploying (uses the `--local` D1 database, a separate SQLite file
under `.wrangler/`, not production data):
```bash
npm run dev
```

## Known limitations

**Drag-and-drop planet placements and the ascendant position are still `localStorage`-only.**
(`PLANET_PLACEMENTS_STORAGE_KEY`, `ASC_POSITION_STORAGE_KEY` in `app.js`.) Everything else a
user creates — accounts, course progress, Workbook documents/answers/attachments, and My
Chart tabs/attachments — is server-side now; these two are what's left, and would follow the
same pattern (a small table + a couple of routes) if they're ever worth persisting too.

**Video/PDF links for lessons are placeholders.** Real content only exists for the 3 seeded
lessons (`zodiac-intro`, `dignities-pdf`, `aspects-slides` in `migrations/0001_init.sql`);
anything else added through the Manage Courses grid gets a simulated preview built from its
file name. This is separate from the Workbook/My Chart *attachments*, which are real R2-backed
uploads today — it's specifically the lesson media library that's still a placeholder. Swap
in real hosted video/PDF URLs and wire them into `COURSE_CONTENT` in `app.js` when ready.

**No rate limiting or lockout on login attempts.** Fine for a small cohort of known
learners; add if this ever faces the open internet at scale.

## Next steps

- Point a custom domain at the Pages project.
- Replace placeholder lesson video/PDF URLs with real hosted media.
- Consider moving planet-placement/ascendant data server-side too, for full cross-device
  consistency (the last piece of client-only state).
