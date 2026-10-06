# Chesta Bala for Mars, Mercury, Jupiter, Venus and Saturn

Status: **fitted, not derived**. `chestaBala()` in `shadbala.js` now uses
empirical formulas fitted to Parashara's Light 9.0. Four planets agree with the
reference to about 1 Virupa; Mercury is still loose. The rule Parashara's Light
actually applies is unknown.

The Sun and Moon are not part of this: their Chesta Bala is their Ayana and
Paksha Bala respectively, and both match the reference.

## The reference

Parashara's Light 9.0 "Detailed Shad Bala", Chennai (13.0827 N, 80.2707 E),
13:20 IST, on fifteen dates chosen to cover conjunctions, stations,
retrogrades and oppositions of all five planets. Chesta Bala in Virupas:

| Date        | Mars  | Mercury | Jupiter | Venus | Saturn |
|-------------|-------|---------|---------|-------|--------|
| 16 Mar 1970 | 22.00 | 8.68    | 50.52   | 12.98 | 25.66  |
| 16 Jun 1970 | 7.24  | 35.14   | 48.06   | 35.30 | 23.45  |
| 26 Jun 1970 | 5.70  | 17.42   | 47.86   | 37.64 | 28.06  |
| 16 Jul 1970 | 2.65  | 17.11   | 46.06   | 42.25 | 35.99  |
| 16 Aug 1970 | 2.62  | 49.38   | 38.43   | 49.04 | 43.77  |
| 1 Sep 1970  | 5.71  | 54.80   | 32.65   | 52.26 | 45.15  |
| 11 Sep 1970 | 7.63  | 59.51   | 28.55   | 54.11 | 45.37  |
| 21 Sep 1970 | 9.56  | 53.60   | 24.13   | 55.76 | 46.27  |
| 1 Oct 1970  | 11.48 | 47.10   | 19.46   | 57.12 | 47.89  |
| 16 Oct 1970 | 14.37 | 22.78   | 12.08   | 58.30 | 51.53  |
| 1 Nov 1970  | 17.44 | 3.34    | 3.89    | 58.91 | 56.57  |
| 16 Nov 1970 | 20.33 | 23.03   | 3.99    | 59.41 | 58.18  |
| 16 Dec 1970 | 26.10 | 55.31   | 19.55   | 57.73 | 48.82  |
| 16 Jun 1971 | 57.06 | 5.74    | 53.12   | 18.13 | 16.20  |
| 16 Aug 1971 | 59.86 | 55.33   | 46.38   | 3.39  | 41.01  |

16 Jun 1970 is the Siva chart. Uchcha Bala agreed with the app to 0.01 on
every date, which confirms the dates and the planetary positions.

## What the app does now

Chesta Bala = Chesta Kendra ÷ 3, with the kendra (0–180°) computed as:

| Planet          | Chesta Kendra                                                                 | RMS error | Worst |
|-----------------|-------------------------------------------------------------------------------|-----------|-------|
| Mars            | angle between the Sun and Mars's heliocentric longitude                       | 1.16      | 3.31  |
| Jupiter, Saturn | the same angle × max(1, 1.18 + 0.58·v/vmax), capped at 180°                   | 0.62, 0.57 | 1.35, 1.19 |
| Venus           | \|(mean − mean Sun) + 0.45·(true − mean Sun)\|                                | 0.52      | 1.23  |
| Mercury         | \|(mean − mean Sun) + 1.6·(true − Sun)\|                                      | 3.48      | 6.64  |

`v` is the geocentric daily motion and `vmax` the top direct speed (0.2415°
a day for Jupiter, 0.129° for Saturn), so the factor is about 1.76 near
conjunction, 1.18 at a station and 1 in deep retrograde. Mean longitudes are
Meeus's, made sidereal with the app's ayanamsa. Errors are in Virupas over the
fifteen dates.

For comparison, the formula this replaced (the arc between the planet and its
seeghrochcha ÷ 3) had RMS errors of roughly 6 (Mars), 14 (Mercury), 11
(Jupiter), 17 (Venus) and 11 (Saturn) on the first seven dates.

## How much to trust it

- **Mars, Venus.** Simple forms. Mars's largest miss (3.3) is on 16 Jun 1971,
  a few weeks before it turned retrograde; its one retrograde date fits to 0.5.
- **Jupiter, Saturn.** The speed factor was fitted on the first seven dates
  and then held on the eight added later (RMS 0.6 and 0.5 before any
  re-tuning), which is decent evidence of real structure. It is still a curve
  fit with two constants, not a known rule.
- **Mercury.** The weakest. Its orbit is eccentric, so its mean and true
  heliocentric longitudes differ by up to 23°, and no combination of the two
  with the elongation fits better than about 3 Virupas RMS.

## Ruled out as the reference's method

Each was tested against the reference values.

1. **Classical Chesta Kendra**, seeghrochcha − (mean + true) / 2, with modern
   mean elements (Meeus), with B.V. Raman's mean-position tables (*Graha and
   Bhava Balas*, epoch 1 Jan 1900), and with Surya Siddhanta mean longitudes.
   Solving for the mean longitude the reference would need under this formula
   gives values that do not move uniformly from date to date, so no table of
   mean elements can rescue it.
2. **The arc between the planet and its seeghrochcha** (the app's earlier
   formula).
3. **A pure function of speed**, including the eight classical motion states
   (Vakra 60, Anuvakra 30, Vikala 15, Manda 30, Mandatara 15, Sama 7.5, Chara
   45, Atichara 30), even interpolated. Mars takes values from 2.6 to 26 at
   almost the same speed.
4. **Any single linear combination** of mean Sun, true longitude, heliocentric
   longitude, Meeus mean and Surya Siddhanta mean longitudes for Jupiter and
   Saturn. Their excess over the Sun-to-heliocentric angle is a hump that
   vanishes in retrograde, which no linear form produces.
5. **Distance from Earth, the phase angle, and sine or cosine forms** of the
   elongation.

## What would improve it

- **More Mercury dates**, closely spaced (every five days through one
  116-day cycle), to find what its formula depends on.
- **Parashara's Light's intermediate figures**, if it shows mean longitudes,
  a seeghrochcha or a Chesta Kendra anywhere.
- **Dates for another decade**, to confirm the Jupiter and Saturn constants
  hold at a different part of their orbits.

## How to check a change

```
node tools/chesta-series-check.js
node tools/shadbala-reference-check.js
```

The first prints app-minus-reference Chesta Bala for all fifteen dates with
the RMS and worst error per planet. The second diffs every Shadbala component
for the Siva chart. Judge any change to `chestaBala()` against the whole
series, not the Siva date alone.
