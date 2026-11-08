// Remedies — finds a chart's weak points, scores them, walks each one towards
// the strengths it can draw on, and fits the plan to the dasha period in view.
// Rules only, no page code, so tools/remedies-check.js can run it under Node;
// the wording of every step lives in remedy-data.js.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Remedies = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  var NODES = { Rahu: true, Ketu: true };
  var KENDRA = [1, 4, 7, 10], DUSTHANA = [6, 8, 12];
  var COMPONENTS = [['sthana', 'Sthana'], ['dig', 'Dig'], ['kala', 'Kala'], ['chesta', 'Chesta']];
  var FAR_BELOW = 0.6;       // a component under 60% of its minimum scores double
  var KASHTA_GAP = 20;       // Kashta this far above Ishta scores double
  var HARD_SEVERITY = 6;     // a lord at or above this can make a tense period Hard
  var FAVOURABLE_PAIR = 2, HARD_PAIR = -2;
  var VERDICT_SEVERITY = { red: 4, amber: 2, green: 0 }; // the nodes have no Shadbala
  var DIG_HOUSE = { Mercury: 1, Jupiter: 1, Moon: 4, Venus: 4, Saturn: 7, Sun: 10, Mars: 10 };
  var REL_SCORE = { 'Best Friend': 2, Friend: 1, Neutral: 0, Enemy: -1, 'Worst Enemy': -2 };
  var TIERS = {
    Favourable: { aim: 'Build', tone: 'good' },
    Neutral: { aim: 'Deliver', tone: 'plain' },
    Hard: { aim: 'Protect', tone: 'hurt' }
  };
  // Each planet's gemstone, named only to say when it is not suggested.
  var GEMSTONE = { Sun: 'Ruby', Moon: 'Pearl', Mars: 'Red coral', Mercury: 'Emerald', Jupiter: 'Yellow sapphire',
    Venus: 'Diamond', Saturn: 'Blue sapphire', Rahu: 'Hessonite', Ketu: "Cat's eye" };

  function pct(v, min) { return Math.round(v / min * 100); }
  function beneficMapOf(ctx) {
    return (ctx.sb && ctx.sb.context && ctx.sb.context.beneficMap) || ctx.Interpret.DEFAULT_BENEFIC;
  }

  // ---- 1 and 2. Detect and score ----
  function scorePlanet(name, ctx) {
    var p = ctx.result.planets[name], r = ctx.sb && ctx.sb.results[name];
    var reasons = [], score = 0, lowestRatio = Infinity;
    function add(text, points) { reasons.push({ text: text, points: points }); score += points; }

    if (NODES[name]) {
      var verdict = ctx.verdictOf ? ctx.verdictOf(name) : null;
      var pts = verdict ? (VERDICT_SEVERITY[verdict.color] || 0) : 0;
      if (pts) add('Verdict: ' + verdict.word, pts);
      return { name: name, score: score, reasons: reasons, lowestRatio: lowestRatio };
    }
    var MIN = ctx.Interpret.SB_MIN;
    if (r) {
      if (r.total < r.required * 60) add('Shadbala below minimum', 4);
      COMPONENTS.forEach(function (c) {
        var v = r[c[0]], min = MIN[c[0]][name], ratio = v / min;
        lowestRatio = Math.min(lowestRatio, ratio);
        if (ratio < 1) add(c[1] + ' ' + pct(v, min) + '%', ratio < FAR_BELOW ? 2 : 1);
      });
      var ik = r.ishtaKashta;
      if (ik && ik.ishta < ik.kashta) {
        var gap = ik.kashta - ik.ishta;
        add('Ishta below Kashta by ' + gap.toFixed(1), gap >= KASHTA_GAP ? 2 : 1);
      }
    }
    var keys = ctx.H.dignityOf(name, p).map(function (d) { return d.k; });
    if (keys.indexOf('deb') >= 0) add('Debilitated', 3);
    if (p.combustion && p.combustion.combust) add('Combust', 2);
    if (p.baladiAvastha === 'Mrita') add('Baladi Mrita', 1);
    if (DUSTHANA.indexOf(p.house) >= 0) add('In the ' + p.house + 'th', 1);
    if (keys.indexOf('deb') >= 0 && ctx.Interpret.neechaBhangaFor(name, ctx.result, ctx.H)) add('Neecha Bhanga', -1);
    return { name: name, score: score, reasons: reasons, lowestRatio: lowestRatio };
  }

  // ---- 3. Path: the strengths this weakness can move towards ----
  function neechaSource(name, ctx) {
    var E = ctx.H.engine, S = ctx.H.Shadbala, p = ctx.result.planets[name];
    if (!ctx.Interpret.neechaBhangaFor(name, ctx.result, ctx.H)) return null;
    var moonSign = ctx.result.planets.Moon.signIndex, found = null;
    Object.keys(S.EXALT).forEach(function (g) {
      if (NODES[g] || g === name || Math.floor(S.EXALT[g] / 30) !== p.signIndex) return;
      var o = ctx.result.planets[g], fromMoon = ((o.signIndex - moonSign + 12) % 12) + 1;
      if (KENDRA.indexOf(o.house) >= 0 || KENDRA.indexOf(fromMoon) >= 0) found = g;
    });
    return found;
  }
  function pathFor(name, ctx) {
    var E = ctx.H.engine, result = ctx.result, p = result.planets[name];
    var map = beneficMapOf(ctx), links = [];
    function benefic(n) { return !NODES[n] && ctx.Interpret.isNaturalBenefic(n, map); }
    function push(target, kind) {
      if (links.length >= 2 || !target || target === name) return;
      if (links.some(function (l) { return l.target === target; })) return;
      if (ctx.verdictOf) {
        var v = ctx.verdictOf(target);
        if (v && v.color === 'red') return;
      }
      links.push({ target: target, kind: kind });
    }
    PLANETS.forEach(function (o) {
      if (o !== name && benefic(o) && result.planets[o].signIndex === p.signIndex) push(o, 'Conjunct benefic');
    });
    var lord = E.SIGN_LORDS[p.signIndex];
    if (lord !== name) {
      var exchange = E.SIGN_LORDS[result.planets[lord].signIndex] === name;
      push(lord, exchange ? 'Dispositor and exchange' : 'Dispositor');
    }
    push(neechaSource(name, ctx), 'Neecha Bhanga source');
    ctx.H.aspectsOntoSign(p.signIndex, result).forEach(function (a) {
      if (benefic(a.planet)) push(a.planet, 'Aspecting benefic');
    });
    // Dig Bala far short: add the house where the planet is at its strongest.
    var r = ctx.sb && ctx.sb.results[name];
    var digHouse = null;
    if (r && DIG_HOUSE[name] && r.dig / ctx.Interpret.SB_MIN.dig[name] < FAR_BELOW) digHouse = DIG_HOUSE[name];
    return { links: links, digHouse: digHouse };
  }

  // ---- 4. Prescribe: the ordered steps, from the remedy library ----
  function entriesFor(data, planet, stage) {
    return data.filter(function (e) { return e.planet === planet && e.stage === stage; });
  }
  function stepsFor(name, path, ctx) {
    var data = ctx.data, steps = [];
    function take(entry, label) {
      if (entry) steps.push({ id: entry.id, label: label, text: entry.text, type: entry.type, source: entry.source });
    }
    take(entriesFor(data, name, 'at-weakness')[0], 'At ' + name);
    path.links.forEach(function (l) {
      var specific = data.filter(function (e) { return e.stage === 'toward' && e.from === name && e.target === l.target; })[0];
      var general = data.filter(function (e) { return e.stage === 'toward' && !e.from && e.target === l.target; })[0];
      take(specific || general, 'To ' + l.target);
    });
    if (path.digHouse) {
      take(data.filter(function (e) { return e.stage === 'direction' && e.house === path.digHouse; })[0], 'To H' + path.digHouse);
    }
    entriesFor(data, name, 'optional').forEach(function (e) { take(e, e.type === 'service' ? 'Service' : 'Devotion'); });
    return steps;
  }
  // Gemstones are never suggested; this says so where a stone would do harm.
  function gemstoneGuard(name, ctx) {
    var r = ctx.sb && ctx.sb.results[name], why = [];
    var keys = ctx.H.dignityOf(name, ctx.result.planets[name]).map(function (d) { return d.k; });
    if (keys.indexOf('deb') >= 0) why.push('debilitated');
    var ownsDusthana = ctx.H.housesOwnedBy(name, ctx.result.ascendant.signIndex)
      .some(function (o) { return DUSTHANA.indexOf(o.house) >= 0; });
    if (ownsDusthana) why.push('Dusthana lord');
    if (r && r.ishtaKashta && r.ishtaKashta.ishta < r.ishtaKashta.kashta) why.push('Kashta above Ishta');
    return why.length ? GEMSTONE[name] + ' is not suggested: ' + why.join(', ') + '.' : '';
  }

  function natal(ctx) {
    var ranked = PLANETS.map(function (n) { return scorePlanet(n, ctx); })
      .sort(function (a, b) { return b.score - a.score || a.lowestRatio - b.lowestRatio; });
    var severity = {};
    ranked.forEach(function (x) { severity[x.name] = x.score; });
    var weak = ranked.filter(function (x) { return x.score > 0; }).map(function (x, i) {
      var path = pathFor(x.name, ctx);
      return { rank: i + 1, name: x.name, score: x.score, reasons: x.reasons, path: path,
        steps: stepsFor(x.name, path, ctx), guard: gemstoneGuard(x.name, ctx) };
    });
    return { weak: weak, severity: severity };
  }

  // Bottom three by Bhava Bala, or Bhava Dig of 10 or less. A house whose lord
  // is already on the list points there instead of repeating its steps.
  function weakHouses(ctx, weak) {
    var E = ctx.H.engine, bhava = ctx.bhava, ascSign = ctx.result.ascendant.signIndex;
    if (!bhava) return [];
    var order = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].sort(function (a, b) { return bhava[b].total - bhava[a].total; });
    var out = [];
    order.forEach(function (house, i) {
      var rank = i + 1, b = bhava[house];
      if (rank < 10 && b.dig > 10) return;
      var signIdx = (ascSign + house - 1) % 12, lord = E.SIGN_LORDS[signIdx];
      var listed = weak.filter(function (w) { return w.name === lord; })[0];
      out.push({ house: house, sign: E.SIGNS[signIdx], rank: rank, dig: b.dig, lord: lord, path: listed ? listed.rank : null });
    });
    return out;
  }

  // ---- 5. Period: the tier of each lord against the one above it ----
  function pairScore(a, b, ctx) {
    var rel = ctx.result.relationships;
    var ab = rel[a] && rel[a][b], ba = rel[b] && rel[b][a];
    return (ab ? REL_SCORE[ab.panchadha] || 0 : 0) + (ba ? REL_SCORE[ba.panchadha] || 0 : 0);
  }
  function tierOf(score, severity) {
    if (score >= FAVOURABLE_PAIR && severity < HARD_SEVERITY) return 'Favourable';
    if (score <= HARD_PAIR && severity >= HARD_SEVERITY) return 'Hard';
    return 'Neutral';
  }
  function pairTier(upper, lower, severityMap, ctx) {
    var score = upper === lower ? 0 : pairScore(upper, lower, ctx);
    var tier = tierOf(score, severityMap[lower] || 0);
    return { upper: upper, lower: lower, score: score, severity: severityMap[lower] || 0,
      tier: tier, aim: TIERS[tier].aim, tone: TIERS[tier].tone };
  }
  function periodPlan(lords, plan, ctx) {
    if (!lords || !lords.length) return null;
    var pairs = [];
    for (var i = 0; i + 1 < lords.length; i++) pairs.push(pairTier(lords[i].lord, lords[i + 1].lord, plan.severity, ctx));
    // The Antardasha sets the period's tier, when one is selected.
    var main = pairs[0] || { upper: null, lower: lords[0].lord, score: 0, severity: plan.severity[lords[0].lord] || 0,
      tier: 'Neutral', aim: TIERS.Neutral.aim, tone: TIERS.Neutral.tone };
    var lord = main.lower, steps = [];
    function take(entry) { if (entry) steps.push({ id: entry.id, text: entry.text }); }
    take(ctx.data.filter(function (e) { return e.stage === 'tier' && e.tier === main.tier; })[0]);
    take(entriesFor(ctx.data, lord, 'period')[0]);
    var listed = plan.weak.filter(function (w) { return w.name === lord; })[0];
    return { main: main, pairs: pairs, steps: steps, path: listed ? listed.rank : null };
  }
  // Every Antardasha of a Mahadasha, tiered, so the hard ones show ahead of time.
  function antardashaTiers(maha, plan, ctx) {
    return (ctx.result.antardashas || []).filter(function (a) { return a.maha === maha; }).map(function (a) {
      var t = pairTier(a.maha, a.antar, plan.severity, ctx);
      t.start = a.start; t.end = a.end;
      return t;
    });
  }

  function evaluate(ctx) {
    var plan = natal(ctx);
    plan.houses = weakHouses(ctx, plan.weak);
    return plan;
  }

  // ---- Calendar: dated transit flags ----
  // A daily walk over the slow planets, from `from` for `days`. Slow enough to
  // be run once per chart, when the tab is first opened.
  var HOUSE_ADVICE = {
    4: 'Set limits between home and work.', 10: 'Set limits between home and work.',
    5: 'Avoid speculation.', 6: 'Watch workload and health.',
    11: 'Maintain the network actively.'
  };
  function transitFlags(opts) {
    var E = opts.engine, result = opts.result, moon = result.planets.Moon.signIndex;
    var asc = result.ascendant.signIndex, natalSaturn = result.planets.Saturn.signIndex;
    var watch = { 4: 1, 10: 1, 11: 1 };
    (opts.weakHouses || []).forEach(function (h) { watch[h.house] = 1; });
    var house = function (s) { return ((s - asc + 12) % 12) + 1; };
    var seventh = (asc + 6) % 12;
    var aspectsSeventh = function (s) { return [5, 7, 9].indexOf(((seventh - s + 12) % 12) + 1) >= 0; };
    var out = [], prev = null;
    for (var i = 0; i <= opts.days; i++) {
      var date = new Date(opts.from.getTime() + i * 86400000);
      var c = E.computeChart({ date: date, latDeg: opts.latDeg, lonDeg: opts.lonDeg, nodeType: opts.nodeType });
      var now = {
        Saturn: c.planets.Saturn.signIndex, Jupiter: c.planets.Jupiter.signIndex,
        Rahu: c.planets.Rahu.signIndex, Ketu: c.planets.Ketu.signIndex
      };
      if (prev) {
        if (now.Saturn !== prev.Saturn) {
          if (now.Saturn === natalSaturn) out.push({ date: date, event: 'Saturn to ' + E.SIGNS[now.Saturn] + ', its natal sign', advice: 'Have work, finances and check-ups in order.', tone: 'hurt' });
          else if (prev.Saturn === natalSaturn) out.push({ date: date, event: 'Saturn leaves ' + E.SIGNS[prev.Saturn], advice: 'Use the pause to consolidate.', tone: 'plain' });
        }
        if (now.Jupiter !== prev.Jupiter && aspectsSeventh(now.Jupiter) && !aspectsSeventh(prev.Jupiter)) {
          out.push({ date: date, event: 'Jupiter to ' + E.SIGNS[now.Jupiter], advice: 'Its aspect on H7 returns: a supportive time for the partnership.', tone: 'good' });
        }
        if (now.Rahu !== prev.Rahu) {
          var rh = house(now.Rahu), kh = house(now.Ketu);
          if (watch[rh] || watch[kh]) {
            var advice = [];
            [rh, kh].forEach(function (h) {
              if (HOUSE_ADVICE[h] && advice.indexOf(HOUSE_ADVICE[h]) < 0) advice.push(HOUSE_ADVICE[h]);
            });
            out.push({ date: date, event: 'Rahu to ' + E.SIGNS[now.Rahu] + ' (H' + rh + '), Ketu to ' + E.SIGNS[now.Ketu] + ' (H' + kh + ')',
              advice: advice.join(' ') || 'Note the change of house.', tone: 'plain' });
          }
        }
      }
      prev = now;
    }
    return out;
  }

  return {
    evaluate: evaluate, periodPlan: periodPlan, antardashaTiers: antardashaTiers,
    transitFlags: transitFlags, TIERS: TIERS
  };
});
