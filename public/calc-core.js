// Core Vedic astrology calculation engine.
// Works in Node (module.exports) and in the browser (window.VedicEngine)
// when astronomy-engine is available as `Astronomy`.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('astronomy-engine'));
  } else {
    root.VedicEngine = factory(root.Astronomy);
  }
})(typeof self !== 'undefined' ? self : this, function (Astronomy) {
  'use strict';

  var SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  var SIGNS_SKT = ['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrischika','Dhanu','Makara','Kumbha','Meena'];
  var SIGN_LORDS = ['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
  // Co-lord-aware sign lordship: each entry is an array of every lord for that
  // sign, primary lord first. For ten signs this is just [SIGN_LORDS[i]]; Virgo
  // (5) and Aquarius (10) additionally carry Rahu, and Scorpio (7) and Pisces
  // (11) additionally carry Ketu, per the classical shadow-planet co-ownership
  // rule. SIGN_LORDS itself is left untouched so existing single-lord call
  // sites keep working unchanged; new/updated call sites that need to see both
  // co-lords should read SIGN_COLORDS instead.
  var SIGN_COLORDS = SIGN_LORDS.map(function (lord) { return [lord]; });
  SIGN_COLORDS[5] = ['Mercury', 'Rahu'];   // Virgo
  SIGN_COLORDS[7] = ['Mars', 'Ketu'];      // Scorpio
  SIGN_COLORDS[10] = ['Saturn', 'Rahu'];   // Aquarius
  SIGN_COLORDS[11] = ['Jupiter', 'Ketu'];  // Pisces

  var NAKSHATRAS = [
    ['Ashwini','Ketu'], ['Bharani','Venus'], ['Krittika','Sun'], ['Rohini','Moon'],
    ['Mrigashira','Mars'], ['Ardra','Rahu'], ['Punarvasu','Jupiter'], ['Pushya','Saturn'],
    ['Ashlesha','Mercury'], ['Magha','Ketu'], ['Purva Phalguni','Venus'], ['Uttara Phalguni','Sun'],
    ['Hasta','Moon'], ['Chitra','Mars'], ['Swati','Rahu'], ['Vishakha','Jupiter'],
    ['Anuradha','Saturn'], ['Jyeshtha','Mercury'], ['Mula','Ketu'], ['Purva Ashadha','Venus'],
    ['Uttara Ashadha','Sun'], ['Shravana','Moon'], ['Dhanishta','Mars'], ['Shatabhisha','Rahu'],
    ['Purva Bhadrapada','Jupiter'], ['Uttara Bhadrapada','Saturn'], ['Revati','Mercury']
  ];

  var DASHA_YEARS = { Ketu:7, Venus:20, Sun:6, Moon:10, Mars:7, Rahu:18, Jupiter:16, Saturn:19, Mercury:17 };
  var DASHA_SEQUENCE = ['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'];

  var NATURAL_REL = {
    Sun:     { friends:['Moon','Mars','Jupiter'], neutral:['Mercury'], enemies:['Venus','Saturn'] },
    Moon:    { friends:['Sun','Mercury'], neutral:['Mars','Jupiter','Venus','Saturn'], enemies:[] },
    Mars:    { friends:['Sun','Moon','Jupiter'], neutral:['Venus','Saturn'], enemies:['Mercury'] },
    Mercury: { friends:['Sun','Venus'], neutral:['Mars','Jupiter','Saturn'], enemies:['Moon'] },
    Jupiter: { friends:['Sun','Moon','Mars'], neutral:['Saturn'], enemies:['Mercury','Venus'] },
    Venus:   { friends:['Mercury','Saturn'], neutral:['Mars','Jupiter'], enemies:['Sun','Moon'] },
    Saturn:  { friends:['Mercury','Venus'], neutral:['Jupiter'], enemies:['Sun','Moon','Mars'] }
  };
  var CLASSICAL_GRAHAS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
  // The nodes, added on to the seven classical grahas specifically for the
  // relationship (Naisargika/Panchadha Maitri) tables — see naturalRel below
  // for how their friendships are derived.
  var RELATIONSHIP_GRAHAS = CLASSICAL_GRAHAS.concat(['Rahu', 'Ketu']);
  // Convention used here for the nodes' natural relationships, which classical
  // Parashari maitri tables don't define directly: Rahu is treated as sharing
  // Saturn's temperament, Ketu as sharing Mars's — a commonly cited practical
  // convention, not the only one in circulation (see naturalRel).
  var NODE_ANALOG = { Rahu: 'Saturn', Ketu: 'Mars' };

  var AYAN_J2000 = 23.85;
  var AYAN_RATE = 0.013972; // deg/year, Lahiri (Chitrapaksha) precession-rate approximation

  function norm360(x) { x = x % 360; if (x < 0) x += 360; return x; }
  function arcDist(a, b) { var d = Math.abs(norm360(a) - norm360(b)); return d > 180 ? 360 - d : d; }

  function ayanamsa(date) {
    var jd = Astronomy.MakeTime(date).tt;
    var years = jd / 365.25;
    return AYAN_J2000 + years * AYAN_RATE;
  }

  function geoEclLonOfDate(body, date) {
    var eqj = Astronomy.GeoVector(body, date, true);
    var rot = Astronomy.Rotation_EQJ_ECT(date);
    var ect = Astronomy.RotateVector(rot, eqj);
    return norm360(Astronomy.SphereFromVector(ect).lon);
  }

  function meanLunarNodeTropical(date) {
    var T = Astronomy.MakeTime(date).tt / 36525;
    var omega = 125.0445222 - 1934.1362608 * T + 0.0020708 * T * T + (T * T * T) / 450000;
    return norm360(omega);
  }

  // True Node: the actual instantaneous crossing of the Moon's current
  // osculating orbital plane through the ecliptic — as opposed to the mean
  // node above, which is a smoothed long-term average with no short-period
  // wobble in it. Computed directly from the Moon's real position+velocity
  // (no precomputed series needed, unlike a Swiss-Ephemeris-style true node):
  // rotate the geocentric state vector into the ecliptic-of-date frame, take
  // the orbital angular momentum h = r × v, and the ascending node is where
  // that orbital plane crosses the ecliptic, at longitude atan2(hx, -hy).
  // This is the standard orbital-mechanics definition of an ascending node,
  // not an invented shortcut — it typically differs from the mean node above
  // by up to roughly ±1.5°, oscillating on the Moon's ~173-day draconic cycle.
  function trueLunarNodeTropical(date) {
    var state = Astronomy.GeoMoonState(date);
    var s = Astronomy.RotateState(Astronomy.Rotation_EQJ_ECT(date), state);
    var hx = s.y * s.vz - s.z * s.vy;
    var hy = s.z * s.vx - s.x * s.vz;
    return norm360(Math.atan2(hx, -hy) * 180 / Math.PI);
  }

  function ascendantSidereal(date, latDeg, lonDeg) {
    var gastHours = Astronomy.SiderealTime(date);
    var ramc = norm360(gastHours * 15 + lonDeg);
    var tilt = Astronomy.e_tilt(Astronomy.MakeTime(date));
    var eps = tilt.tobl * Math.PI / 180;
    var phi = latDeg * Math.PI / 180;
    var theta = ramc * Math.PI / 180;
    var y = -Math.cos(theta);
    var x = Math.sin(eps) * Math.tan(phi) + Math.cos(eps) * Math.sin(theta);
    var ascTrop = norm360(Math.atan2(y, x) * 180 / Math.PI + 180);
    return norm360(ascTrop - ayanamsa(date));
  }

  function isRetrograde(body, date) {
    var dtDays = 0.5;
    var d1 = new Date(date.getTime() - dtDays * 86400000);
    var d2 = new Date(date.getTime() + dtDays * 86400000);
    var l1 = geoEclLonOfDate(body, d1), l2 = geoEclLonOfDate(body, d2);
    var diff = l2 - l1;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return diff < 0;
  }

  function signOf(lon) { return Math.floor(norm360(lon) / 30); }
  function degInSign(lon) { return norm360(lon) % 30; }

  function nakshatraOf(lon) {
    var span = 360 / 27;
    var idx = Math.floor(norm360(lon) / span);
    if (idx > 26) idx = 26;
    var within = norm360(lon) - idx * span;
    var pada = Math.floor(within / (span / 4)) + 1;
    return { index: idx, name: NAKSHATRAS[idx][0], lord: NAKSHATRAS[idx][1], pada: pada };
  }

  function navamsaSignIndex(lon) {
    var s = signOf(lon);
    var d = degInSign(lon);
    var part = Math.floor(d / (30 / 9));
    if (part > 8) part = 8;
    return (s * 9 + part) % 12;
  }

  // ---- Influence Engine: raw, chart-structural facts (calc-core.js's own
  // layer — no Shadbala tables needed here, matching this file's existing
  // "only astronomy, nothing looked up from a static dignity table" rule).
  // See the "Influence Engine" project note for the full research this
  // implements: combustion, Baladi Avastha, and the Vargottama flag. ----

  // Combustion (Astangata) — angular separation from the Sun against a fixed
  // orb per planet, with a tighter orb while retrograde for Mercury/Venus
  // (the only two whose classical orb actually splits that way). Not defined
  // for the Sun itself or the lunar nodes — callers get null for those and
  // should treat that as "not applicable", not "not combust".
  var COMBUSTION_ORB = {
    Moon:    { direct: 12, retro: 12 },
    Mars:    { direct: 17, retro: 17 },
    Mercury: { direct: 14, retro: 12 },
    Jupiter: { direct: 11, retro: 11 },
    Venus:   { direct: 10, retro: 8 },
    Saturn:  { direct: 15, retro: 15 }
  };
  function combustionOf(name, lon, sunLon, retrograde) {
    var orbTable = COMBUSTION_ORB[name];
    if (!orbTable) return null;
    var orb = retrograde ? orbTable.retro : orbTable.direct;
    var separation = arcDist(lon, sunLon);
    return { combust: separation <= orb, separation: separation, orb: orb };
  }

  // Baladi Avastha (Bala/Kumara/Yuva/Vriddha/Mrita) — degree-in-sign divided
  // into five 6° bands. Odd-ordinal signs (1st/3rd/5th/…, i.e. signIndex
  // 0,2,4… — Aries, Gemini, Leo…) run the five stages forward from 0°; the
  // even-ordinal signs run the same five stages in reverse. This is a modern
  // extension when applied to Rahu/Ketu (classical Baladi is defined for the
  // seven grahas only) — callers should flag that explicitly for the nodes
  // rather than presenting it as equally classical.
  var BALADI_STAGES = ['Bala', 'Kumara', 'Yuva', 'Vriddha', 'Mrita'];
  function baladiAvastha(signIndex, degree) {
    var band = Math.min(4, Math.floor(degree / 6));
    var forward = signIndex % 2 === 0; // same odd/even-sign convention as shadbala.js's isOddSign
    var idx = forward ? band : (4 - band);
    return BALADI_STAGES[idx];
  }

  function formatDeg(lon) {
    var d = degInSign(lon);
    var deg = Math.floor(d);
    var minFloat = (d - deg) * 60;
    var min = Math.floor(minFloat);
    var sec = Math.round((minFloat - min) * 60);
    if (sec === 60) { sec = 0; min++; }
    if (min === 60) { min = 0; deg++; }
    return deg + '°' + String(min).padStart(2, '0') + "'" + String(sec).padStart(2, '0') + '"';
  }

  // ---- Vimshottari Dasha ----
  function vimshottariDasha(moonSidLon, birthDate, rows) {
    rows = rows || 9;
    var span = 360 / 27;
    var nak = nakshatraOf(moonSidLon);
    var within = norm360(moonSidLon) - nak.index * span;
    var fractionElapsed = within / span;
    var startLord = nak.lord;
    var startIdx = DASHA_SEQUENCE.indexOf(startLord);

    var out = [];
    var cursor = new Date(birthDate.getTime());
    var balanceYears = (1 - fractionElapsed) * DASHA_YEARS[startLord];
    var yearMs = 365.25 * 86400000;

    var end0 = new Date(cursor.getTime() + balanceYears * yearMs);
    out.push({ lord: startLord, start: new Date(cursor), end: end0, years: balanceYears, isBirthPeriod: true });
    cursor = end0;

    for (var i = 1; i < rows; i++) {
      var lord = DASHA_SEQUENCE[(startIdx + i) % 9];
      var yrs = DASHA_YEARS[lord];
      var end = new Date(cursor.getTime() + yrs * yearMs);
      out.push({ lord: lord, start: new Date(cursor), end: end, years: yrs, isBirthPeriod: false });
      cursor = end;
    }
    return out;
  }

  // Full Mahadasha → Antardasha (Bhukti) breakdown.
  // The first Mahadasha is only partly unexpired at birth, so it is generated
  // from its *virtual* start (before birth) and the sub-periods that had already
  // elapsed are dropped; the one running at birth is clamped to the birth moment.
  function vimshottariAntardashas(moonSidLon, birthDate, mahaCount) {
    mahaCount = mahaCount || 9;
    var span = 360 / 27;
    var yearMs = 365.25 * 86400000;
    var nak = nakshatraOf(moonSidLon);
    var fractionElapsed = (norm360(moonSidLon) - nak.index * span) / span;
    var startIdx = DASHA_SEQUENCE.indexOf(nak.lord);

    var out = [];
    var cursor = new Date(birthDate.getTime() - fractionElapsed * DASHA_YEARS[nak.lord] * yearMs);

    for (var m = 0; m < mahaCount; m++) {
      var mahaLord = DASHA_SEQUENCE[(startIdx + m) % 9];
      var mahaYears = DASHA_YEARS[mahaLord];
      var mahaStart = new Date(cursor.getTime());
      var mahaEnd = new Date(cursor.getTime() + mahaYears * yearMs);
      var mIdx = DASHA_SEQUENCE.indexOf(mahaLord);
      var aCursor = new Date(mahaStart.getTime());

      for (var a = 0; a < 9; a++) {
        var antarLord = DASHA_SEQUENCE[(mIdx + a) % 9];
        // an antardasha takes the same share of its mahadasha as its own
        // vimshottari years take of the 120-year cycle
        var antarYears = mahaYears * DASHA_YEARS[antarLord] / 120;
        var aStart = new Date(aCursor.getTime());
        var aEnd = new Date(aCursor.getTime() + antarYears * yearMs);
        if (aEnd.getTime() > birthDate.getTime()) {
          var clipped = aStart.getTime() < birthDate.getTime();
          out.push({
            maha: mahaLord,
            antar: antarLord,
            start: clipped ? new Date(birthDate.getTime()) : aStart,
            end: aEnd,
            years: antarYears,
            partialAtBirth: clipped,
            rawStart: aStart,          // true start, needed to divide sub-periods
            mahaStart: mahaStart,
            mahaEnd: mahaEnd
          });
        }
        aCursor = aEnd;
      }
      cursor = mahaEnd;
    }
    return out;
  }

  // Pratyantardasha: the nine sub-sub-periods inside one Antardasha, running in
  // Vimshottari order from the Antardasha lord. Each takes the same share of its
  // Antardasha as its own vimshottari years take of the 120-year cycle.
  function pratyantardashas(antar, birthDate) {
    var yearMs = 365.25 * 86400000;
    var startIdx = DASHA_SEQUENCE.indexOf(antar.antar);
    var out = [];
    var cursor = new Date((antar.rawStart || antar.start).getTime());
    for (var i = 0; i < 9; i++) {
      var lord = DASHA_SEQUENCE[(startIdx + i) % 9];
      var yrs = antar.years * DASHA_YEARS[lord] / 120;
      var s = new Date(cursor.getTime());
      var e = new Date(cursor.getTime() + yrs * yearMs);
      if (e.getTime() > birthDate.getTime()) {
        var clipped = s.getTime() < birthDate.getTime();
        out.push({
          maha: antar.maha, antar: antar.antar, prat: lord,
          start: clipped ? new Date(birthDate.getTime()) : s,
          end: e, years: yrs, partialAtBirth: clipped
        });
      }
      cursor = e;
    }
    return out;
  }

  // ---- Relationships ----
  function naturalRel(a, b) {
    if (a === b) return 'Self';
    // Rahu/Ketu borrow Saturn's/Mars's temperament for this lookup (see
    // NODE_ANALOG above) — both as the planet doing the regarding and as the
    // one being regarded, so e.g. Sun→Rahu reads the same as Sun→Saturn.
    // The nodes and the luminaries are mutual enemies, whatever Saturn's or
    // Mars's own relationship to them (the common convention, and the one
    // Parashara's Light's avasthas for Ketu in Leo require).
    var lum = { Sun: 1, Moon: 1 };
    if ((NODE_ANALOG[a] && lum[b]) || (NODE_ANALOG[b] && lum[a])) return 'Enemy';
    var aKey = NODE_ANALOG[a] || a;
    var bKey = NODE_ANALOG[b] || b;
    var r = NATURAL_REL[aKey];
    if (!r) return '-';
    if (r.friends.indexOf(bKey) >= 0) return 'Friend';
    if (r.enemies.indexOf(bKey) >= 0) return 'Enemy';
    return 'Neutral';
  }

  function temporaryRel(signA, signB) {
    var dist = ((signB - signA + 12) % 12) + 1; // 1..12
    var friendSet = [2,3,4,10,11,12];
    return friendSet.indexOf(dist) >= 0 ? 'Friend' : 'Enemy';
  }

  function panchadhaRel(natural, temporary) {
    if (natural === 'Self') return 'Self';
    if (natural === 'Friend' && temporary === 'Friend') return 'Best Friend';
    if (natural === 'Friend' && temporary === 'Enemy') return 'Neutral';
    if (natural === 'Neutral' && temporary === 'Friend') return 'Friend';
    if (natural === 'Neutral' && temporary === 'Enemy') return 'Enemy';
    if (natural === 'Enemy' && temporary === 'Friend') return 'Neutral';
    if (natural === 'Enemy' && temporary === 'Enemy') return 'Worst Enemy';
    return '-';
  }

  // ---- Tithi (bonus panchang info) ----
  var TITHI_NAMES = ['Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami','Shashthi','Saptami',
    'Ashtami','Navami','Dashami','Ekadashi','Dwadashi','Trayodashi','Chaturdashi'];

  function tithiInfo(moonLon, sunLon) {
    var diff = norm360(moonLon - sunLon);
    var tithiNum = Math.floor(diff / 12) + 1; // 1..30
    var paksha = tithiNum <= 15 ? 'Shukla (Waxing)' : 'Krishna (Waning)';
    var idxInPaksha = tithiNum <= 15 ? tithiNum : tithiNum - 15;
    var name = idxInPaksha === 15 ? (tithiNum === 15 ? 'Purnima' : 'Amavasya') : TITHI_NAMES[idxInPaksha - 1];
    return { number: tithiNum, paksha: paksha, name: name };
  }

  // ---- Main computation ----
  var PLANET_BODY = {
    Sun: 'Sun', Moon: 'Moon', Mercury: 'Mercury', Venus: 'Venus',
    Mars: 'Mars', Jupiter: 'Jupiter', Saturn: 'Saturn'
  };

  function computeChart(opts) {
    // opts: { date (UTC JS Date), latDeg, lonDeg }
    var date = opts.date, lat = opts.latDeg, lon = opts.lonDeg;
    var ayan = ayanamsa(date);

    var planets = {};
    Object.keys(PLANET_BODY).forEach(function (name) {
      var body = Astronomy.Body[PLANET_BODY[name]];
      var trop = geoEclLonOfDate(body, date);
      var sid = norm360(trop - ayan);
      var retro = (name === 'Sun' || name === 'Moon') ? false : isRetrograde(body, date);
      planets[name] = { longitude: sid, retrograde: retro };
    });

    var nodeType = opts.nodeType === 'true' ? 'true' : 'mean';
    var rahuTrop = nodeType === 'true' ? trueLunarNodeTropical(date) : meanLunarNodeTropical(date);
    var rahuSid = norm360(rahuTrop - ayan);
    var ketuSid = norm360(rahuSid + 180);
    planets.Rahu = { longitude: rahuSid, retrograde: true };
    planets.Ketu = { longitude: ketuSid, retrograde: true };

    var ascSid = ascendantSidereal(date, lat, lon);
    var ascSignIdx = signOf(ascSid);

    var planetDetails = {};
    Object.keys(planets).forEach(function (name) {
      var lon_ = planets[name].longitude;
      var sIdx = signOf(lon_);
      var nak = nakshatraOf(lon_);
      var houseNum = ((sIdx - ascSignIdx + 12) % 12) + 1;
      planetDetails[name] = {
        longitude: lon_,
        sign: SIGNS[sIdx],
        signIndex: sIdx,
        degree: degInSign(lon_),
        degreeFormatted: formatDeg(lon_),
        nakshatra: nak.name,
        pada: nak.pada,
        nakshatraLord: nak.lord,
        house: houseNum,
        retrograde: planets[name].retrograde,
        navamsaSignIndex: navamsaSignIndex(lon_),
        navamsaSign: SIGNS[navamsaSignIndex(lon_)],
        // Influence Engine raw facts (see calc-core.js's own section above):
        // vargottama needs both D-1 and D-9 sign, both already computed on
        // this same object; combustion needs the Sun's own longitude, which
        // is why this whole block runs after the plain planets{} loop above
        // rather than inline in it. Sun/Rahu/Ketu correctly get combustion:null.
        vargottama: sIdx === navamsaSignIndex(lon_),
        baladiAvastha: baladiAvastha(sIdx, degInSign(lon_)),
        combustion: combustionOf(name, lon_, planets.Sun.longitude, planets[name].retrograde)
      };
    });

    var ascNavamsaIdx = navamsaSignIndex(ascSid);

    var dasha = vimshottariDasha(planets.Moon.longitude, date, 9);
    var antardashas = vimshottariAntardashas(planets.Moon.longitude, date, 9);

    var relationships = {};
    RELATIONSHIP_GRAHAS.forEach(function (a) {
      relationships[a] = {};
      RELATIONSHIP_GRAHAS.forEach(function (b) {
        var nat = naturalRel(a, b);
        var temp = a === b ? 'Self' : temporaryRel(planetDetails[a].signIndex, planetDetails[b].signIndex);
        relationships[a][b] = { natural: nat, temporary: a === b ? 'Self' : temp, panchadha: a === b ? 'Self' : panchadhaRel(nat, temp) };
      });
    });

    var tithi = tithiInfo(planets.Moon.longitude, planets.Sun.longitude);

    return {
      ayanamsa: ayan,
      nodeType: nodeType,
      ascendant: {
        longitude: ascSid,
        sign: SIGNS[ascSignIdx],
        signIndex: ascSignIdx,
        degree: degInSign(ascSid),
        degreeFormatted: formatDeg(ascSid),
        nakshatra: nakshatraOf(ascSid),
        navamsaSignIndex: ascNavamsaIdx,
        navamsaSign: SIGNS[ascNavamsaIdx]
      },
      planets: planetDetails,
      dasha: dasha,
      antardashas: antardashas,
      relationships: relationships,
      tithi: tithi,
      moonSign: planetDetails.Moon.sign,
      moonNakshatra: planetDetails.Moon.nakshatra
    };
  }

  return {
    SIGNS: SIGNS, SIGNS_SKT: SIGNS_SKT, SIGN_LORDS: SIGN_LORDS, SIGN_COLORDS: SIGN_COLORDS,
    NAKSHATRAS: NAKSHATRAS, CLASSICAL_GRAHAS: CLASSICAL_GRAHAS, RELATIONSHIP_GRAHAS: RELATIONSHIP_GRAHAS,
    computeChart: computeChart,
    pratyantardashas: pratyantardashas,
    norm360: norm360,
    formatDeg: formatDeg,
    // exported so a hand-built (simulated) chart uses the same maitri rules
    naturalRel: naturalRel,
    temporaryRel: temporaryRel,
    panchadhaRel: panchadhaRel,
    // Influence Engine raw facts — exported individually too (not just baked
    // into computeChart's output) so a caller with just a longitude, such as
    // a re-derived divisional chart, can ask the same questions directly.
    combustionOf: combustionOf,
    baladiAvastha: baladiAvastha
  };
});
