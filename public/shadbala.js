// Shadbala — the six-fold strength (Bala) system of Parashari Jyotish.
// All strengths are in Virupas (60 Virupas = 1 Rupa).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('astronomy-engine'));
  } else {
    root.Shadbala = factory(root.Astronomy);
  }
})(typeof self !== 'undefined' ? self : this, function (Astronomy) {
  'use strict';

  var GRAHAS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  // Graha Yuddha (planetary war) applies only to these five — classical texts
  // exclude the Sun and Moon (luminaries, not "grahas" for war purposes) and
  // the nodes (shadowy points, not physical bodies to occupy the same degree).
  var YUDDHA_GRAHAS = ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  var SIGN_LORDS = ['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];

  // Exaltation degrees (sidereal, absolute longitude)
  // Rahu/Ketu: 20°Taurus / 20°Scorpio — the commonly-cited nodal exaltation
  // degree, kept symmetric (Ketu is always exactly 180° from Rahu, so its
  // exaltation point mirrors Rahu's). Debilitation falls out of the existing
  // (exSign+6)%12 formula: Rahu debilitates in Scorpio, Ketu in Taurus.
  var EXALT = { Sun: 10, Moon: 33, Mars: 298, Mercury: 165, Jupiter: 95, Venus: 357, Saturn: 200, Rahu: 50, Ketu: 230 };
  // Naisargika (natural / permanent) bala — fixed classical values
  var NAISARGIKA = { Sun: 60, Moon: 51.43, Venus: 42.85, Jupiter: 34.29, Mercury: 25.70, Mars: 17.14, Saturn: 8.57 };
  // Minimum Shadbala required, in Rupas
  var MIN_REQUIRED = { Sun: 6.5, Moon: 6.0, Mars: 5.0, Mercury: 7.0, Jupiter: 6.5, Venus: 5.5, Saturn: 5.0 };

  var MOOLATRIKONA = {
    Sun:     { sign: 4,  from: 0,  to: 20 },
    Moon:    { sign: 1,  from: 4,  to: 30 },
    Mars:    { sign: 0,  from: 0,  to: 12 },
    Mercury: { sign: 5,  from: 16, to: 20 },
    Jupiter: { sign: 8,  from: 0,  to: 10 },
    Venus:   { sign: 6,  from: 0,  to: 15 },
    Saturn:  { sign: 10, from: 0,  to: 20 },
    // Whole-sign Moolatrikona for the nodes, per the confirmed rule: Rahu in
    // Gemini, Ketu in Sagittarius, both 0°-30° (no partial-degree band, unlike
    // the seven classical grahas above).
    Rahu:    { sign: 2,  from: 0,  to: 30 },
    Ketu:    { sign: 8,  from: 0,  to: 30 }
  };
  var OWN_SIGNS = {
    Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5],
    Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10],
    // Co-lordship: Rahu co-owns Aquarius & Virgo, Ketu co-owns Pisces & Scorpio
    // (alongside their existing single primary lords — see calc-core.js's new
    // SIGN_COLORDS for the co-lord-aware lookup used throughout the app).
    Rahu: [10, 5], Ketu: [11, 7]
  };

  var WEEKDAY_LORDS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  var CHALDEAN = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];

  var AYAN_J2000 = 23.85, AYAN_RATE = 0.013972;

  function norm360(x) { x = x % 360; if (x < 0) x += 360; return x; }
  function arcDist(a, b) { var d = Math.abs(norm360(a) - norm360(b)); return d > 180 ? 360 - d : d; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function ayanamsa(date) {
    var years = Astronomy.MakeTime(date).tt / 365.25;
    return AYAN_J2000 + years * AYAN_RATE;
  }
  function tropEclLon(body, date) {
    var eqj = Astronomy.GeoVector(body, date, true);
    var ect = Astronomy.RotateVector(Astronomy.Rotation_EQJ_ECT(date), eqj);
    return norm360(Astronomy.SphereFromVector(ect).lon);
  }
  // Geocentric ecliptic latitude (apparent, of-date) — same rotation machinery
  // as tropEclLon, just reading .lat off the Spherical result instead of .lon.
  // Used only for Graha Yuddha's winner rule below.
  function eclLatOfDate(body, date) {
    var eqj = Astronomy.GeoVector(body, date, true);
    var ect = Astronomy.RotateVector(Astronomy.Rotation_EQJ_ECT(date), eqj);
    return Astronomy.SphereFromVector(ect).lat;
  }

  // Graha Yuddha (planetary war): two of the five war-eligible grahas are in
  // war when their longitudes are within 1° of each other (necessarily the
  // same sign at that orb). Winner rule used here — the planet with the
  // greater (more northern) ecliptic latitude wins; on a latitude tie
  // (vanishingly rare in practice) the planet with the lesser longitude
  // (further along, i.e. "in front") wins. This orb and this specific
  // latitude-based winner rule are the most commonly cited convention across
  // Parashari sources, but — like Neecha Bhanga's four conditions elsewhere in
  // this file — are not the only ones in circulation; flag it if a chart's
  // Yuddha result is reported to disagree with a different classical source.
  function detectYuddha(date, lons) {
    var pairs = [];
    for (var i = 0; i < YUDDHA_GRAHAS.length; i++) {
      for (var j = i + 1; j < YUDDHA_GRAHAS.length; j++) {
        var a = YUDDHA_GRAHAS[i], b = YUDDHA_GRAHAS[j];
        var orb = arcDist(lons[a], lons[b]);
        if (orb >= 1) continue;
        var latA = eclLatOfDate(Astronomy.Body[a], date);
        var latB = eclLatOfDate(Astronomy.Body[b], date);
        var aWins = latA !== latB ? (latA > latB) : (norm360(lons[a]) <= norm360(lons[b]));
        pairs.push({
          a: a, b: b, orb: orb,
          latA: latA, latB: latB,
          winner: aWins ? a : b,
          loser: aWins ? b : a
        });
      }
    }
    return pairs;
  }

  // ---------------- Divisional charts (varga sign index) ----------------
  function d1(lon) { return Math.floor(norm360(lon) / 30); }
  function degIn(lon) { return norm360(lon) % 30; }
  function isOddSign(s) { return s % 2 === 0; } // Aries(0), Gemini(2)… are "odd" signs

  function d2Hora(lon) {
    var s = d1(lon), d = degIn(lon), firstHalf = d < 15;
    if (isOddSign(s)) return firstHalf ? 4 : 3;   // Leo : Cancer
    return firstHalf ? 3 : 4;                      // Cancer : Leo
  }
  function d3Drekkana(lon) {
    var s = d1(lon), part = Math.min(2, Math.floor(degIn(lon) / 10));
    return (s + part * 4) % 12;
  }
  function d7Saptamsa(lon) {
    var s = d1(lon), part = Math.min(6, Math.floor(degIn(lon) / (30 / 7)));
    var start = isOddSign(s) ? s : (s + 6) % 12;
    return (start + part) % 12;
  }
  function d9Navamsa(lon) {
    var s = d1(lon), part = Math.min(8, Math.floor(degIn(lon) / (30 / 9)));
    return (s * 9 + part) % 12;
  }
  function d12Dwadasamsa(lon) {
    var s = d1(lon), part = Math.min(11, Math.floor(degIn(lon) / 2.5));
    return (s + part) % 12;
  }
  function d30Trimsamsa(lon) {
    var s = d1(lon), d = degIn(lon);
    if (isOddSign(s)) {
      if (d < 5) return 0;    // Mars  → Aries
      if (d < 10) return 10;  // Saturn → Aquarius
      if (d < 18) return 8;   // Jupiter → Sagittarius
      if (d < 25) return 2;   // Mercury → Gemini
      return 6;               // Venus → Libra
    }
    if (d < 5) return 1;      // Venus → Taurus
    if (d < 12) return 5;     // Mercury → Virgo
    if (d < 20) return 11;    // Jupiter → Pisces
    if (d < 25) return 9;     // Saturn → Capricorn
    return 7;                 // Mars → Scorpio
  }

  var VARGAS = [
    { key: 'D1', fn: d1 }, { key: 'D2', fn: d2Hora }, { key: 'D3', fn: d3Drekkana },
    { key: 'D7', fn: d7Saptamsa }, { key: 'D9', fn: d9Navamsa },
    { key: 'D12', fn: d12Dwadasamsa }, { key: 'D30', fn: d30Trimsamsa }
  ];

  var REL_VALUE = {
    'Best Friend': 22.5, 'Friend': 15, 'Neutral': 7.5, 'Enemy': 3.75, 'Worst Enemy': 1.875
  };

  // Moolatrikona is a degree band inside one sign, so it only exists in the
  // Rasi (D1) — in the other six vargas a planet in its Moolatrikona sign is
  // scored like any other sign: own sign (30) if it rules it, otherwise by
  // its relationship to that sign's lord. Likewise in the D1 outside the
  // band. Confirmed against Parashara's Light for Siva's chart, where the
  // old "45 in any varga" rule made Sun/Moon/Mercury read +15/+30/+45 high.
  function dignityValue(planet, vargaSign, isRasi, rasiDeg, relationships) {
    var mt = MOOLATRIKONA[planet];
    if (mt && isRasi && mt.sign === vargaSign && rasiDeg >= mt.from && rasiDeg < mt.to) return 45;
    if (OWN_SIGNS[planet].indexOf(vargaSign) >= 0) return 30;
    var lord = SIGN_LORDS[vargaSign];
    if (lord === planet) return 30;
    var rel = relationships[planet] && relationships[planet][lord];
    var key = rel ? rel.panchadha : 'Neutral';
    return REL_VALUE[key] !== undefined ? REL_VALUE[key] : 7.5;
  }

  // ---------------- 1. Sthana Bala ----------------
  function sthanaBala(planet, lon, ascSign, relationships) {
    // Uchcha (exaltation) bala
    var debil = norm360(EXALT[planet] + 180);
    var uchcha = arcDist(lon, debil) / 3;

    // Saptavargaja bala
    var sapta = 0, vargaDetail = {};
    VARGAS.forEach(function (v) {
      var vs = v.fn(lon);
      var val = dignityValue(planet, vs, v.key === 'D1', degIn(lon), relationships);
      vargaDetail[v.key] = { sign: vs, value: val };
      sapta += val;
    });

    // Ojhayugmarasyamsa bala (odd/even sign & navamsa)
    var evenStrong = (planet === 'Moon' || planet === 'Venus');
    var ojha = 0;
    var rasiOdd = isOddSign(d1(lon)), navOdd = isOddSign(d9Navamsa(lon));
    if (evenStrong ? !rasiOdd : rasiOdd) ojha += 15;
    if (evenStrong ? !navOdd : navOdd) ojha += 15;

    // Kendradi bala
    var house = ((d1(lon) - ascSign + 12) % 12) + 1;
    var kendradi = ([1, 4, 7, 10].indexOf(house) >= 0) ? 60
      : ([2, 5, 8, 11].indexOf(house) >= 0) ? 30 : 15;

    // Drekkana bala — male grahas (Sun/Mars/Jupiter) strong in a sign's 1st
    // decan, female (Moon/Venus) in the 2nd, neuter (Mercury/Saturn) in the
    // 3rd. Female and neuter were previously swapped here — confirmed
    // against a reference implementation's detailed breakdown, checked
    // against actual degrees rather than assumed.
    var part = Math.min(2, Math.floor(degIn(lon) / 10));
    var drekkana = 0;
    if (['Sun', 'Mars', 'Jupiter'].indexOf(planet) >= 0 && part === 0) drekkana = 15;
    else if (['Moon', 'Venus'].indexOf(planet) >= 0 && part === 1) drekkana = 15;
    else if (['Mercury', 'Saturn'].indexOf(planet) >= 0 && part === 2) drekkana = 15;

    return {
      total: uchcha + sapta + ojha + kendradi + drekkana,
      uchcha: uchcha, saptavargaja: sapta, ojhayugma: ojha,
      kendradi: kendradi, drekkana: drekkana, vargas: vargaDetail
    };
  }

  // ---------------- 2. Dig Bala ----------------
  function digBala(planet, lon, ascLon, mcLon) {
    var weak;
    if (planet === 'Sun' || planet === 'Mars') weak = norm360(mcLon + 180);   // weakest at IC
    else if (planet === 'Jupiter' || planet === 'Mercury') weak = norm360(ascLon + 180); // weakest at Desc
    else if (planet === 'Moon' || planet === 'Venus') weak = mcLon;           // weakest at MC
    else weak = ascLon;                                                       // Saturn weakest at Asc
    return arcDist(lon, weak) / 3;
  }

  // ---------------- 3. Kala Bala ----------------
  function solarEvent(dir, observer, fromDate, limitDays) {
    try {
      var t = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, dir, fromDate, limitDays);
      return t ? t.date : null;
    } catch (e) { return null; }
  }
  function prevSolarEvent(dir, observer, date) {
    var last = null;
    var cursor = new Date(date.getTime() - 36 * 3600000);
    for (var i = 0; i < 4; i++) {
      var ev = solarEvent(dir, observer, cursor, 2);
      if (!ev) break;
      if (ev.getTime() <= date.getTime()) { last = ev; cursor = new Date(ev.getTime() + 3600000); }
      else break;
    }
    return last;
  }

  // Ahargana — the day count from the start of the Kali Yuga, used for the
  // year (Abda) and month (Masa) lords. Counted inclusively from Ujjain
  // midnight, so day 1 is the Friday the Kali Yuga began (JD 588465.5 in
  // Ujjain local mean time, 75.77° E). The year lord is the weekday lord of
  // the day the current 360-day year began, the month lord that of the
  // current 30-day month. Matches Parashara's Light for Siva's chart on the
  // year, month and weekday lords together (Jupiter, Moon, Mars) — the old
  // method (weekday of the Sun's sidereal Aries ingress) gave Mars for the
  // year.
  var KALI_EPOCH_JD_UT = 588465.5 - 75.77 / 360;
  function aharganaOf(date) {
    var jdUT = Astronomy.MakeTime(date).ut + 2451545.0;
    return Math.floor(jdUT - KALI_EPOCH_JD_UT) + 1;
  }
  function aharganaDayLord(day) { return WEEKDAY_LORDS[(day + 4) % 7]; } // day 1 = Friday

  function localWeekdayIndex(date, tzOffsetHours) {
    return new Date(date.getTime() + tzOffsetHours * 3600000).getUTCDay();
  }

  function kalaBala(ctx) {
    var planet = ctx.planet, date = ctx.date, observer = ctx.observer;
    var comps = {};

    // -- Nathonnata bala (diurnal / nocturnal), via the Sun's hour angle --
    var ha = Astronomy.HourAngle(Astronomy.Body.Sun, date, observer); // 0 = local apparent noon
    var hoursFromNoon = Math.min(ha, 24 - ha); // 0..12
    var dayStrength = 60 * (1 - hoursFromNoon / 12);
    if (planet === 'Mercury') comps.nathonnata = 60;
    else if (['Moon', 'Mars', 'Saturn'].indexOf(planet) >= 0) comps.nathonnata = 60 - dayStrength;
    else comps.nathonnata = dayStrength;

    // -- Paksha bala --
    // No Moon-specific doubling — confirmed against a reference
    // implementation's detailed breakdown that Moon uses the exact same
    // formula as any other benefic planet here (its own doubled lunar
    // significance shows up elsewhere, in Ishta/Kashta Bala's own Paksha
    // input, not by doubling this Kala Bala component).
    var elong = arcDist(ctx.moonLon, ctx.sunLon); // 0..180
    var isBenefic = ctx.beneficMap[planet];
    var paksha = isBenefic ? (elong / 3) : (60 - elong / 3);
    comps.paksha = paksha;

    // -- Tribhaga bala --
    var trib = 0;
    if (planet === 'Jupiter') trib = 60;
    else if (ctx.sunrise && ctx.sunset && ctx.nextSunrise) {
      var t = date.getTime();
      if (t >= ctx.sunrise.getTime() && t < ctx.sunset.getTime()) {
        var dp = Math.min(2, Math.floor((t - ctx.sunrise.getTime()) / ((ctx.sunset.getTime() - ctx.sunrise.getTime()) / 3)));
        if (['Mercury', 'Sun', 'Saturn'][dp] === planet) trib = 60;
      } else {
        var nStart = t >= ctx.sunset.getTime() ? ctx.sunset.getTime() : ctx.prevSunset.getTime();
        var nEnd = t >= ctx.sunset.getTime() ? ctx.nextSunrise.getTime() : ctx.sunrise.getTime();
        var np = Math.min(2, Math.floor((t - nStart) / ((nEnd - nStart) / 3)));
        if (['Moon', 'Venus', 'Mars'][np] === planet) trib = 60;
      }
    }
    comps.tribhaga = trib;

    // -- Abda (year) / Masa (month) / Vara (day) / Hora bala --
    comps.abda  = (ctx.varshaLord === planet) ? 15 : 0;
    comps.masa  = (ctx.masaLord === planet) ? 30 : 0;
    comps.vara  = (ctx.varaLord === planet) ? 45 : 0;
    comps.hora  = (ctx.horaLord === planet) ? 60 : 0;

    // -- Ayana bala (north or south of the equator) --
    // 30 · (1 ± sin L), L the planet's tropical (sayana) longitude: the
    // classical (24° ± kranti) / 48 with the kranti taken from the longitude
    // alone, as sin L × 24°, so the planet's own latitude plays no part. The
    // Sun, Mars, Jupiter and Venus gain in the north; the Moon and Saturn in
    // the south; Mercury gains on either side. No doubling for the Sun.
    // Matches Parashara's Light 9.0 to the second decimal for all seven
    // planets on fifteen dates (tools/chesta-series-check.js lists them).
    // The earlier form used each planet's true declination, which read the
    // Moon up to 5 Virupas off and a southern Mercury as 0 instead of ~59.
    var sinL = Math.sin(ctx.tropicalLongitude * Math.PI / 180);
    var northing = planet === 'Mercury' ? Math.abs(sinL)
      : (planet === 'Moon' || planet === 'Saturn') ? -sinL : sinL;
    comps.ayana = 30 * (1 + northing);

    var total = 0;
    Object.keys(comps).forEach(function (k) { total += comps[k]; });
    comps.total = total;
    return comps;
  }

  // ---------------- 4. Chesta Bala ----------------
  // Sun and Moon get no motional bala of their own by the ordinary formula
  // below (Sun's apparent motion is too uniform to register as "effort", and
  // Moon has no seeghrochcha to measure against) — classically, each borrows
  // a different Kala Bala figure instead of registering zero: Sun's Chesta
  // Bala equals its own Ayana Bala, Moon's equals its own Paksha Bala.
  // Confirmed directly against a reference implementation's detailed
  // breakdown, not assumed from a general description — see the Influence
  // Framework tab's Shadbala section for the comparison this was found from.
  //
  // The five star-planets: Chesta Kendra ÷ 3, where the kendra was fitted to
  // Parashara's Light 9.0 over fifteen dates (Mar 1970 – Aug 1971, covering
  // conjunctions, stations, retrogrades and oppositions of all five; see
  // tools/chesta-series-check.js and docs/open-chesta-bala.md). The classical
  // "seeghrochcha − ½(mean + true)" formula does not reproduce the reference —
  // the mean longitude it would need does not move uniformly — so these are
  // empirical forms, each planet's typical error in Virupas noted:
  //   Mars            |Sun − heliocentric longitude|                    (1.1)
  //   Jupiter, Saturn the same angle × max(1, 1.18 + 0.58·v/vmax), v the
  //                   geocentric daily motion: ×1.76 at top direct speed,
  //                   ×1.18 at a station, ×1 in deep retrograde      (0.5)
  //   Venus           |(mean − mean Sun) + 0.45·(true − mean Sun)|     (0.5)
  //   Mercury         |(mean − mean Sun) + 1.6·(true − Sun)|; the loosest
  //                   of the five                                      (3.3)
  // Mean longitudes are Meeus's (mean equinox of date), made sidereal.
  var CHESTA_MEAN = { // degrees at J2000, degrees per Julian century
    Mercury: [252.250906, 149474.0722491], Venus: [181.979801, 58519.2130302],
    Earth: [100.466457, 36000.7698278]
  };
  var CHESTA_VMAX = { Jupiter: 0.2415, Saturn: 0.129 }; // top direct speed, °/day
  function signedArc(a, b) { return norm360(a - b + 180) - 180; } // a − b in (−180, 180]
  function helioSidLon(body, date, ayan) {
    var ect = Astronomy.RotateVector(Astronomy.Rotation_EQJ_ECT(date), Astronomy.HelioVector(body, date));
    return norm360(Astronomy.SphereFromVector(ect).lon - ayan);
  }
  function chestaBala(planet, date, geoSidLon, ayan, ayanaBala, pakshaBala) {
    if (planet === 'Sun') return ayanaBala;
    if (planet === 'Moon') return pakshaBala;
    var body = Astronomy.Body[planet];
    var sun = norm360(tropEclLon(Astronomy.Body.Sun, date) - ayan);
    var kendra;
    if (planet === 'Mercury' || planet === 'Venus') {
      var T = Astronomy.MakeTime(date).tt / 36525;
      var mean = norm360(CHESTA_MEAN[planet][0] + CHESTA_MEAN[planet][1] * T - ayan);
      var meanSun = norm360(CHESTA_MEAN.Earth[0] + CHESTA_MEAN.Earth[1] * T + 180 - ayan);
      kendra = planet === 'Venus'
        ? signedArc(mean, meanSun) + 0.45 * signedArc(geoSidLon, meanSun)
        : signedArc(mean, meanSun) + 1.6 * signedArc(geoSidLon, sun);
      kendra = Math.abs(signedArc(kendra, 0));
    } else {
      kendra = arcDist(sun, helioSidLon(body, date, ayan));
      if (CHESTA_VMAX[planet]) {
        var half = 43200000; // 12 hours
        var speed = signedArc(tropEclLon(body, new Date(date.getTime() + half)),
                              tropEclLon(body, new Date(date.getTime() - half)));
        kendra = Math.min(180, kendra * Math.max(1, 1.18 + 0.58 * speed / CHESTA_VMAX[planet]));
      }
    }
    return kendra / 3;
  }

  // ---------------- 6. Drik Bala ----------------
  // Parashara's sphuta drishti, in virupas (0..60). x is the aspected
  // body's longitude minus the aspecting planet's (the aspectual angle).
  // Checked against Parashara's Light 9.0's Drik Bala for Siva's chart —
  // all seven planets match to rounding (see the Influence Framework tab).
  //
  // General curve (every planet):
  function baseDrishti(x) {
    if (x < 30) return 0;
    if (x < 60) return (x - 30) / 2;
    if (x < 90) return (x - 60) + 15;
    if (x < 120) return (120 - x) / 2 + 30;
    if (x < 150) return 150 - x;
    if (x < 180) return 2 * (x - 150);
    if (x < 300) return (300 - x) / 2;
    return 0;
  }
  // Special aspects replace the general curve inside their own angle ranges
  // (never lowering it), peaking at 60 on the exact special aspect. Degree
  // ranges, not whole-sign house counts. Ranges confirmed by the reference
  // check above: Mars 90-120, Jupiter 210-240 and 240-270, Saturn 30-60 and
  // 60-90. The rest follow the same shape (rise to 60 at the exact aspect;
  // for Mars/Jupiter fall as (exact + 60 - x) after it) and are not yet
  // confirmed by a reference chart that exercises them.
  var SPECIAL_DRISHTI = {
    Mars: [
      [60, 90, function (x) { return 45 + (x - 60) / 2; }],   // 4th, rising
      [90, 120, function (x) { return 150 - x; }],            // 4th, falling (confirmed)
      [180, 210, function () { return 60; }],                 // 8th, rising
      [210, 240, function (x) { return 270 - x; }]            // 8th, falling
    ],
    Jupiter: [
      [90, 120, function (x) { return 45 + (x - 90) / 2; }],  // 5th, rising
      [120, 150, function (x) { return 180 - x; }],           // 5th, falling
      [210, 240, function (x) { return 45 + (x - 210) / 2; }],// 9th, rising (confirmed)
      [240, 270, function (x) { return 300 - x; }]            // 9th, falling (confirmed)
    ],
    Saturn: [
      [30, 60, function (x) { return 2 * (x - 30); }],        // 3rd, rising (confirmed)
      [60, 90, function (x) { return 45 + (90 - x) / 2; }],   // 3rd, falling (confirmed)
      [240, 270, function (x) { return x - 210; }],           // 10th, rising
      [270, 300, function (x) { return 2 * (300 - x); }]      // 10th, falling
    ]
  };
  function sphutaDrishti(x, from) {
    x = norm360(x);
    var value = baseDrishti(x);
    (SPECIAL_DRISHTI[from] || []).forEach(function (seg) {
      if (x >= seg[0] && x < seg[1]) value = Math.max(value, seg[2](x));
    });
    return value;
  }
  // Drik Bala weighting: a quarter of each benefic aspect added and of each
  // malefic aspect subtracted — except Jupiter's and Mercury's aspects,
  // which count in full (both confirmed against the reference). `detail`
  // keeps each raw signed drishti; `total` is the weighted net.
  var FULL_DRISHTI = { Jupiter: true, Mercury: true };
  function weightedDrishti(from, value, beneficMap) {
    return (beneficMap[from] ? value : -value) * (FULL_DRISHTI[from] ? 1 : 0.25);
  }

  function drikBala(target, longitudes, beneficMap) {
    var net = 0, detail = [];
    GRAHAS.forEach(function (other) {
      if (other === target) return;
      var value = sphutaDrishti(longitudes[target] - longitudes[other], other);
      if (value <= 0) return;
      var weighted = weightedDrishti(other, value, beneficMap);
      net += weighted;
      detail.push({ from: other, value: beneficMap[other] ? value : -value, weighted: weighted,
        angle: norm360(longitudes[target] - longitudes[other]) });
    });
    return { total: net, detail: detail };
  }

  // ---------------- Avasthas ----------------
  // All three follow Parashara's Light 9.0, whose nine values for the Siva
  // chart they reproduce.
  //
  // Av3, Jagradadi — by the NATURAL relationship to the sign lord, the
  // classical way: own sign, Moolatrikona or exaltation = Jagrat (awake);
  // a natural friend's or neutral's sign = Swapna (dreaming); a natural
  // enemy's sign or debilitation = Sushupti (asleep).
  function jagratAvastha(planet, signIndex, degree, relationships) {
    var exSign = Math.floor(EXALT[planet] / 30);
    var debSign = (exSign + 6) % 12;
    if (signIndex === debSign) return 'Sushupti';
    if (signIndex === exSign) return 'Jagrat';
    if (OWN_SIGNS[planet].indexOf(signIndex) >= 0) return 'Jagrat';
    var mt = MOOLATRIKONA[planet];
    // typeof-guarded: a Simulation-mode chart passes degree as null.
    if (mt && mt.sign === signIndex && typeof degree === 'number' && degree >= mt.from && degree < mt.to) return 'Jagrat';
    var lord = SIGN_LORDS[signIndex];
    var rel = relationships[planet] && relationships[planet][lord];
    return (rel && rel.natural === 'Enemy') ? 'Sushupti' : 'Swapna';
  }

  // Av9, Deeptadi — the sign ladder by the COMPOUND (panchadha) relationship:
  // Dipta exalted, Swastha own sign, Pramudita a best friend's sign, Shanta a
  // friend's, Dina a neutral's, Duhkhita an enemy's, and Khala for both a
  // worst enemy's sign and debilitation. The reference does not apply the
  // Vikala (with a malefic) or Kopa (combust) states: for Siva the Sun, sharing
  // Gemini with Mars, reads Shanta, and the combust Mars reads Dina. Those two
  // conditions are scored on their own in the influence verdict instead.
  // (planets and beneficMap are no longer read; kept for the callers.)
  function deeptadiAvastha(planet, signIndex, planets, relationships, beneficMap) {
    var exSign = Math.floor(EXALT[planet] / 30);
    var debSign = (exSign + 6) % 12;
    if (signIndex === exSign) return 'Dipta';
    if (signIndex === debSign) return 'Khala';
    if (OWN_SIGNS[planet].indexOf(signIndex) >= 0) return 'Swastha';
    var lord = SIGN_LORDS[signIndex];
    var rel = relationships[planet] && relationships[planet][lord];
    var tier = rel ? rel.panchadha : 'Neutral';
    if (tier === 'Best Friend') return 'Pramudita';
    if (tier === 'Friend') return 'Shanta';
    if (tier === 'Neutral') return 'Dina';
    if (tier === 'Worst Enemy') return 'Khala';
    return 'Duhkhita'; // Enemy
  }

  // Av12, Shayanadi (BPHS): (the planet's nakshatra number × its own number ×
  // the navamsa it occupies within its sign, 1-9) + the Moon's nakshatra
  // number + ghatis elapsed since sunrise + the lagna's sign number, taken
  // modulo 12. Planets are numbered Sun 1 … Saturn 7, Rahu 8, Ketu 9;
  // nakshatras from Ashwini = 1. Needs the moment of birth (ctx is the
  // Shadbala context: moonLongitude, ghatis, lagnaSign).
  var SHAYANADI = ['Nidra', 'Shayana', 'Upavesha', 'Netrapani', 'Prakasha', 'Gamana', 'Agamana',
    'Sabha', 'Agama', 'Bhojana', 'Nrityalipsa', 'Kautuka']; // index = remainder
  var PLANET_NUMBER = { Sun: 1, Moon: 2, Mars: 3, Mercury: 4, Jupiter: 5, Venus: 6, Saturn: 7, Rahu: 8, Ketu: 9 };
  function nakshatraNumber(lon) { return Math.floor(norm360(lon) / (360 / 27)) + 1; }
  function shayanadiAvastha(planet, lon, ctx) {
    if (!ctx || typeof ctx.ghatis !== 'number' || typeof lon !== 'number') return null;
    var navamsa = Math.floor(degIn(lon) / (30 / 9)) + 1;
    var n = nakshatraNumber(lon) * PLANET_NUMBER[planet] * navamsa +
      nakshatraNumber(ctx.moonLongitude) + ctx.ghatis + ctx.lagnaSign;
    return SHAYANADI[n % 12];
  }

  // ---------------- Bhava Bala (house strength) ----------------
  // Bhava Bala = Bhavadhipati Bala + Bhava Dig Bala + Bhava Drishti Bala, plus
  // B.V. Raman's two additions (occupation and day/night rising), all in
  // Virupas. Checked against Parashara's Light 9.0's Bhava Bala for Siva's
  // chart — Dig, Drishti, "Planets in" and "Day-Night" all match.
  //   - Bhavadhipati Bala: the full Shadbala total of the planet ruling the
  //     house's sign.
  //   - Cusps: equal houses from the Midheaven (the 10th cusp is the MC, every
  //     other cusp 30° apart), which is what the reference prints. If the MC
  //     does not fall in the 10th sign from the lagna, cusps are equal houses
  //     from the ascendant degree instead. Without opts.mcLon (older callers)
  //     the house's sign midpoint stands in for the cusp.
  //   - Bhava Dig Bala: by the type of sign on the cusp — human (nara) signs
  //     are weakest at the 7th cusp, quadruped at the 4th, insect (keeta:
  //     Cancer, Scorpio) at the 1st, watery at the 10th; arc from that weakest
  //     cusp ÷ 3. Sagittarius and Capricorn change type at 15°.
  //   - Bhava Drishti Bala: Parashara's sphutaDrishti() onto the cusp, with
  //     the same weighting as planetary Drik Bala.
  //   - Occupation: +60 per Jupiter/Mercury in the house's sign, −60 per
  //     Sun/Mars/Saturn; the Moon and Venus count nothing.
  //   - Day/night: +15 for Sirshodaya signs in a day birth, Prishtodaya signs
  //     in a night birth. Pisces (Ubhayodaya) gains only at twilight, which
  //     is not modelled.
  var BHAVA_TYPE_WEAK_HOUSE = { nara: 7, chatushpada: 4, keeta: 1, jala: 10 };
  var SIRSHODAYA = [2, 4, 5, 6, 7, 10], PRISHTODAYA = [0, 1, 3, 8, 9];
  var OCCUPATION = { Jupiter: 60, Mercury: 60, Sun: -60, Mars: -60, Saturn: -60 };
  function bhavaSignType(lon) {
    var s = d1(lon), d = degIn(lon);
    if (s === 8) return d < 15 ? 'nara' : 'chatushpada';
    if (s === 9) return d < 15 ? 'chatushpada' : 'jala';
    if ([2, 5, 6, 10].indexOf(s) >= 0) return 'nara';
    if ([0, 1, 4].indexOf(s) >= 0) return 'chatushpada';
    if (s === 3 || s === 7) return 'keeta';
    return 'jala';
  }
  function bhavaBala(opts) {
    // opts: { ascSign, results (per-planet Shadbala results, for Bhavadhipati),
    //         longitudes (per-planet, for Bhava Drishti), beneficMap,
    //         ascLon, mcLon, isDay (all three optional — see above) }
    var hasCusps = typeof opts.mcLon === 'number';
    var cuspBase = null; // longitude of the 1st cusp
    if (hasCusps) {
      if (d1(opts.mcLon) === (opts.ascSign + 9) % 12) cuspBase = norm360(opts.mcLon - 270);
      else if (typeof opts.ascLon === 'number') cuspBase = norm360(opts.ascLon);
      else hasCusps = false;
    }
    function cuspOf(house) { return norm360(cuspBase + 30 * (house - 1)); }

    var out = {};
    for (var house = 1; house <= 12; house++) {
      var signIdx = (opts.ascSign + house - 1) % 12;
      var lord = SIGN_LORDS[signIdx];
      var adhipati = (opts.results[lord] && opts.results[lord].total) || 0;

      var cusp = hasCusps ? cuspOf(house) : signIdx * 30 + 15;
      var dig, signType = null, weakHouse = null;
      if (hasCusps) {
        signType = bhavaSignType(cusp);
        weakHouse = BHAVA_TYPE_WEAK_HOUSE[signType];
        dig = arcDist(cusp, cuspOf(weakHouse)) / 3;
      } else {
        dig = ([1, 4, 7, 10].indexOf(house) >= 0) ? 60
          : ([2, 5, 8, 11].indexOf(house) >= 0) ? 30 : 15;
      }

      var net = 0, detail = [];
      GRAHAS.forEach(function (g) {
        var value = sphutaDrishti(cusp - opts.longitudes[g], g);
        if (value <= 0) return;
        var weighted = weightedDrishti(g, value, opts.beneficMap);
        net += weighted;
        detail.push({ from: g, value: opts.beneficMap[g] ? value : -value, weighted: weighted,
          angle: norm360(cusp - opts.longitudes[g]) });
      });
      var drishti = net;

      var occupation = 0, occupationDetail = [], dayNight = 0;
      if (hasCusps) {
        GRAHAS.forEach(function (g) {
          if (d1(opts.longitudes[g]) !== signIdx) return;
          occupationDetail.push({ planet: g, value: OCCUPATION[g] || 0 });
          occupation += OCCUPATION[g] || 0;
        });
        if (typeof opts.isDay === 'boolean') {
          if ((opts.isDay ? SIRSHODAYA : PRISHTODAYA).indexOf(signIdx) >= 0) dayNight = 15;
        }
      }

      var total = adhipati + dig + drishti + occupation + dayNight;
      out[house] = {
        house: house, sign: signIdx, lord: lord, cusp: hasCusps ? cusp : null,
        signType: signType, weakHouse: weakHouse,
        weakCusp: hasCusps ? cuspOf(weakHouse) : null,
        adhipati: adhipati, dig: dig, drishti: drishti, drishtiDetail: detail,
        occupation: occupation, occupationDetail: occupationDetail, dayNight: dayNight,
        rising: SIRSHODAYA.indexOf(signIdx) >= 0 ? 'Sirshodaya' : PRISHTODAYA.indexOf(signIdx) >= 0 ? 'Prishtodaya' : 'Ubhayodaya',
        total: total, rupa: total / 60
      };
    }
    return out;
  }

  // ---------------- Ishta/Kashta Bala (BPHS Ch. 30, Ishta and Kashta Balas) ----------------
  // Auspicious / distress strength, 0-60 Virupas each: whether a planet's
  // periods lean pleasant or difficult, as distinct from how much it can
  // deliver (Shadbala). Built from two figures already computed — Uchcha Bala
  // and a Cheshta figure — the way Parashara's Light 9.0 does, which its seven
  // values for the Siva chart pin down:
  //   Ishta Bala  = (Uchcha Bala + Cheshta) / 2
  //   Kashta Bala = 60 - Ishta Bala
  // Cheshta here is the planet's Chesta Bala, except for the Sun, whose
  // figure is its classical Chesta Kendra — its tropical longitude + 90°,
  // folded to 0-180° — divided by 3 (58.24 for Siva, not the 59.87 Ayana Bala
  // that stands in as the Sun's Chesta Bala in the Shadbala total). The Moon's
  // is its Paksha Bala, which is already its Chesta Bala.
  // The textbook geometric-mean form, sqrt(Uchcha x Cheshta) with Kashta =
  // sqrt((60 - Uchcha)(60 - Cheshta)), does not reproduce the reference
  // (Moon 14.3 against 25.28) and is not used.
  function ishtaKashtaBala(planet, uchchaBala, chestaBalaValue, sunTropicalLon) {
    var cheshta = chestaBalaValue, substitute = null;
    if (planet === 'Sun' && typeof sunTropicalLon === 'number') {
      var kendra = norm360(sunTropicalLon + 90);
      cheshta = (kendra > 180 ? 360 - kendra : kendra) / 3;
      substitute = 'The Sun’s Cheshta here is its tropical longitude + 90°, folded, ÷ 3';
    } else if (planet === 'Moon') {
      substitute = 'Paksha Bala stands in for Cheshta Bala (classical convention for the Moon)';
    }
    var ishta = (uchchaBala + cheshta) / 2;
    return { ishta: ishta, kashta: 60 - ishta, uchcha: uchchaBala, cheshta: cheshta, substitute: substitute };
  }

  // ---------------- Main ----------------
  function compute(opts) {
    // opts: { date (UTC Date), latDeg, lonDeg, tzOffsetHours, ascLongitude, planets:{name:{longitude}}, relationships }
    var date = opts.date;
    var observer = new Astronomy.Observer(opts.latDeg, opts.lonDeg, 0);
    var ayan = ayanamsa(date);

    var lons = {};
    GRAHAS.forEach(function (g) { lons[g] = opts.planets[g].longitude; });

    var yuddha = detectYuddha(date, lons);

    var ascLon = opts.ascLongitude;
    var ascSign = d1(ascLon);

    // Midheaven (sidereal)
    var gast = Astronomy.SiderealTime(date);
    var ramc = norm360(gast * 15 + opts.lonDeg) * Math.PI / 180;
    var eps = Astronomy.e_tilt(Astronomy.MakeTime(date)).tobl * Math.PI / 180;
    var mcTrop = norm360(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) * 180 / Math.PI);
    var mcLon = norm360(mcTrop - ayan);

    // benefic / malefic classification
    var elong = norm360(lons.Moon - lons.Sun);
    var moonBenefic = elong > 90 && elong < 270;
    var beneficMap = {
      Sun: false, Mars: false, Saturn: false,
      Jupiter: true, Venus: true, Mercury: true,
      Moon: moonBenefic
    };

    // declinations
    var declinations = {};
    GRAHAS.forEach(function (g) {
      declinations[g] = Astronomy.Equator(Astronomy.Body[g], date, observer, true, true).dec;
    });
    // True obliquity of date — the same true-equator-of-date frame the
    // declinations above are measured in. Both are reported in the context
    // for display; Ayana Bala itself goes by tropical longitude.
    var obliquity = Astronomy.e_tilt(Astronomy.MakeTime(date)).tobl;

    // solar day framework
    var sunrise = prevSolarEvent(+1, observer, date);
    var prevSunset = prevSolarEvent(-1, observer, date);
    var sunset = sunrise ? solarEvent(-1, observer, sunrise, 2) : null;
    var nextSunrise = sunrise ? solarEvent(+1, observer, new Date(sunrise.getTime() + 3600000), 2) : null;

    var tz = opts.tzOffsetHours || 0;
    var varaLord = sunrise ? WEEKDAY_LORDS[localWeekdayIndex(sunrise, tz)] : WEEKDAY_LORDS[localWeekdayIndex(date, tz)];

    var horaLord = varaLord;
    if (sunrise && nextSunrise) {
      var horaLen = (nextSunrise.getTime() - sunrise.getTime()) / 24;
      var hIdx = Math.floor((date.getTime() - sunrise.getTime()) / horaLen);
      hIdx = clamp(hIdx, 0, 23);
      horaLord = CHALDEAN[(CHALDEAN.indexOf(varaLord) + hIdx) % 7];
    }

    var ahargana = aharganaOf(date);
    var varshaLord = aharganaDayLord(360 * Math.floor(ahargana / 360));
    var masaLord = aharganaDayLord(30 * Math.floor(ahargana / 30));

    var results = {};
    GRAHAS.forEach(function (g) {
      var sthana = sthanaBala(g, lons[g], ascSign, opts.relationships);
      var dig = digBala(g, lons[g], ascLon, mcLon);
      var kala = kalaBala({
        planet: g, date: date, observer: observer,
        sunLon: lons.Sun, moonLon: lons.Moon,
        beneficMap: beneficMap, tropicalLongitude: norm360(lons[g] + ayan),
        sunrise: sunrise, sunset: sunset, nextSunrise: nextSunrise, prevSunset: prevSunset,
        varshaLord: varshaLord, masaLord: masaLord, varaLord: varaLord, horaLord: horaLord
      });
      var chesta = chestaBala(g, date, lons[g], ayan, kala.ayana, kala.paksha);
      var naisargika = NAISARGIKA[g];
      var drik = drikBala(g, lons, beneficMap);

      var total = sthana.total + dig + kala.total + chesta + naisargika + drik.total;
      var rupa = total / 60;
      results[g] = {
        sthana: sthana.total, sthanaDetail: sthana,
        dig: dig,
        kala: kala.total, kalaDetail: kala,
        chesta: chesta,
        naisargika: naisargika,
        drik: drik.total, drikDetail: drik.detail,
        total: total,
        rupa: rupa,
        required: MIN_REQUIRED[g],
        percent: (rupa / MIN_REQUIRED[g]) * 100,
        meetsMinimum: rupa >= MIN_REQUIRED[g],
        ishtaKashta: ishtaKashtaBala(g, sthana.uchcha, chesta, norm360(lons.Sun + ayan))
      };
    });

    // Rank by the ratio of each planet's Shadbala to its own required minimum
    // (total Virupas breaking a tie) — Parashara's Light's "Relative Rank".
    // Ranking by raw total would favour the planets with high requirements.
    var ranked = GRAHAS.slice().sort(function (a, b) {
      return (results[b].percent - results[a].percent) || (results[b].total - results[a].total);
    });
    ranked.forEach(function (g, i) { results[g].rank = i + 1; });

    // Yuddha is deliberately NOT folded into the Virupa totals above — the six
    // components (Sthana+Dig+Kala+Chesta+Naisargika+Drik=Total) are a verified
    // classical invariant this app checks programmatically, and Parashari
    // sources themselves treat Yuddha as a caveat layered on top of Shadbala,
    // not a 7th component within it. It's surfaced instead as a flag on each
    // involved planet's result, for the UI and the interpretation layer to use.
    yuddha.forEach(function (y) {
      results[y.winner].yuddha = { role: 'winner', opponent: y.loser, orb: y.orb };
      results[y.loser].yuddha = { role: 'loser', opponent: y.winner, orb: y.orb };
    });

    return {
      grahas: GRAHAS,
      results: results,
      yuddha: yuddha,
      context: {
        varshaLord: varshaLord, masaLord: masaLord, varaLord: varaLord, horaLord: horaLord,
        sunrise: sunrise, sunset: sunset, midheaven: mcLon, beneficMap: beneficMap,
        declinations: declinations, obliquity: obliquity, ayanamsa: ayan, ascLongitude: ascLon,
        // for Shayanadi Avastha: ghatis (24 minutes each) elapsed since the last sunrise
        ghatis: sunrise ? Math.floor((date.getTime() - sunrise.getTime()) / 1440000) : null,
        lagnaSign: ascSign + 1, moonLongitude: lons.Moon,
        isDay: (sunrise && sunset) ? (date.getTime() >= sunrise.getTime() && date.getTime() < sunset.getTime()) : null
      }
    };
  }

  return {
    compute: compute, GRAHAS: GRAHAS, MIN_REQUIRED: MIN_REQUIRED,
    sphutaDrishti: sphutaDrishti, bhavaBala: bhavaBala, NAISARGIKA: NAISARGIKA,
    EXALT: EXALT, MOOLATRIKONA: MOOLATRIKONA, OWN_SIGNS: OWN_SIGNS,
    jagratAvastha: jagratAvastha, deeptadiAvastha: deeptadiAvastha, shayanadiAvastha: shayanadiAvastha,
    ishtaKashtaBala: ishtaKashtaBala
  };
});
