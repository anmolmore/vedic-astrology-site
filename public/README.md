# Vedic Astrology Chart App

## Structure
- `shell_head.html` — HTML markup + CSS + opening tags
- `shell_tail.html` — closing `</body></html>`
- `astronomy-engine.min.js` — third-party ephemeris library (unmodified)
- `calc-core.js` — ephemeris, ayanamsa, chart computation
- `shadbala.js` — Shadbala (six-fold strength), Ishta/Kashta Bala, Avasthas
- `interpret.js` — Influence Engine, yoga scanners, dasha timing
- `app.js` — all UI: charts, network overlay, dasha, tabs, Influence Engine panels

## Build
```
./build.sh
```
Concatenates the pieces above, in order, into `index.html`. That's the only
build step — no bundler, no npm dependencies for the app itself.

## Verifying a change
No formal test suite. The working pattern this project has used throughout:
1. `node --check app.js interpret.js shadbala.js calc-core.js` after any edit
2. Run the relevant computation against the standing test chart ("Siva":
   16 June 1970, 13:20 IST, Chennai 13.0827°N 80.2707°E) and sanity-check
   the output against known-correct values before trusting a change
3. `./build.sh`, then a tag-balance check on the built `index.html` (div/
   section/li/table/etc. open vs close counts) before calling it done
   For Shadbala, `node tools/shadbala-reference-check.js` diffs every
   component against Parashara's Light's figures for that chart.

## Open items
- [Chesta Bala](docs/open-chesta-bala.md) — fitted to the reference over
  fifteen dates, not derived; Mercury is still loose. Check changes with
  `node tools/chesta-series-check.js`.
