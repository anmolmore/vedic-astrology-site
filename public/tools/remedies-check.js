// Checks the Remedies rules against the Siva test chart (16 Jun 1970, 13:20
// IST, Chennai 13.0827 N 80.2707 E): severity order, strength paths, period
// tiers, and that no gemstone is ever prescribed.
//
//   node tools/remedies-check.js
//
// Verdicts are left out here (no link is blocked), since they need the full
// page helpers; every planet in this chart passes that rule anyway.
var fs = require('fs'), path = require('path'), assert = require('assert');
var ROOT = path.join(__dirname, '..');
var Astronomy = require(path.join(ROOT, 'astronomy-engine.min.js'));
function load(file) {
  var mod = { exports: {} };
  var req = function (id) { return id === 'astronomy-engine' ? Astronomy : require(id); };
  new Function('module', 'exports', 'require', fs.readFileSync(path.join(ROOT, file), 'utf8'))(mod, mod.exports, req);
  return mod.exports;
}
var E = load('calc-core.js'), S = load('shadbala.js'), I = load('interpret.js');
var R = load('remedies.js'), DATA = load('remedy-data.js');

var date = new Date(Date.UTC(1970, 5, 16, 7, 50));
var lat = 13.0827, lon = 80.2707;
var result = E.computeChart({ date: date, latDeg: lat, lonDeg: lon });
var sb = S.compute({ date: date, latDeg: lat, lonDeg: lon, tzOffsetHours: 5.5,
  ascLongitude: result.ascendant.longitude, planets: result.planets, relationships: result.relationships });
var lons = {};
sb.grahas.forEach(function (g) { lons[g] = result.planets[g].longitude; });
var bhava = S.bhavaBala({ ascSign: result.ascendant.signIndex, results: sb.results, longitudes: lons,
  beneficMap: sb.context.beneficMap, ascLon: result.ascendant.longitude, mcLon: sb.context.midheaven, isDay: sb.context.isDay });

var ASPECTS = { Mars: [4, 7, 8], Jupiter: [5, 7, 9], Saturn: [3, 7, 10] };
var H = {
  engine: E, Shadbala: S,
  PLANET_ORDER: ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'],
  dignityOf: function (name, p) {
    var out = [], ex = Math.floor(S.EXALT[name] / 30);
    if (p.signIndex === ex) out.push({ k: 'ex' });
    if (p.signIndex === (ex + 6) % 12) out.push({ k: 'deb' });
    return out;
  },
  housesOwnedBy: function (planet, ascSign) {
    var out = [];
    for (var s = 0; s < 12; s++) {
      if (E.SIGN_COLORDS[s].indexOf(planet) >= 0) out.push({ house: ((s - ascSign + 12) % 12) + 1 });
    }
    return out;
  },
  aspectsOntoSign: function (signIdx, res) {
    var out = [];
    Object.keys(res.planets).forEach(function (n) {
      var d = ((signIdx - res.planets[n].signIndex + 12) % 12) + 1;
      if ((ASPECTS[n] || [7]).indexOf(d) >= 0) out.push({ planet: n, aspect: d });
    });
    return out.sort(function (a, b) { return a.aspect - b.aspect; });
  }
};
var ctx = { result: result, sb: sb, bhava: bhava, H: H, Interpret: I, data: DATA };
var plan = R.evaluate(ctx);

assert.deepStrictEqual(plan.weak.map(function (w) { return w.name + ' ' + w.score; }),
  ['Saturn 10', 'Mars 6', 'Mercury 4', 'Venus 2', 'Moon 2', 'Jupiter 2']);

function pathOf(name) {
  var p = plan.weak.filter(function (w) { return w.name === name; })[0].path;
  return p.links.map(function (l) { return l.target; }).concat(p.digHouse ? ['H' + p.digHouse] : []);
}
assert.deepStrictEqual(pathOf('Saturn'), ['Mars', 'Sun']);
assert.deepStrictEqual(pathOf('Mars'), ['Mercury', 'Jupiter']);
assert.deepStrictEqual(pathOf('Mercury'), ['Venus', 'H1']);
assert.deepStrictEqual(pathOf('Venus'), ['Moon', 'H4']);
assert.deepStrictEqual(pathOf('Moon'), ['Jupiter', 'Venus']);
assert.deepStrictEqual(pathOf('Jupiter'), ['Moon', 'Venus']);

assert.deepStrictEqual(plan.houses.map(function (h) { return h.house + ':' + h.lord; }).sort(),
  ['11:Moon', '4:Jupiter', '5:Saturn', '6:Saturn']);

function tier(lower) {
  return R.periodPlan([{ lord: 'Ketu', role: 'MD' }, { lord: lower, role: 'AD' }], plan, ctx).main;
}
assert.strictEqual(tier('Jupiter').tier, 'Favourable');
assert.strictEqual(tier('Jupiter').score, 4);
assert.strictEqual(tier('Saturn').tier, 'Hard');
assert.strictEqual(tier('Saturn').score, -3);
assert.strictEqual(tier('Mercury').tier, 'Neutral');
assert.strictEqual(tier('Mercury').score, 1);

var text = JSON.stringify(plan.weak.map(function (w) { return w.steps; }));
assert.ok(!/sapphire|coral|pearl|emerald|ruby|diamond|hessonite|cat's eye/i.test(text), 'a gemstone was prescribed');
assert.ok(/Blue sapphire is not suggested/.test(plan.weak[0].guard));

// A hand-placed chart has no Shadbala, Bhava Bala or dasha: placement rules only.
var simPlan = R.evaluate({ result: result, sb: null, bhava: null, H: H, Interpret: I, data: DATA });
assert.strictEqual(simPlan.weak[0].name, 'Saturn');
assert.strictEqual(simPlan.houses.length, 0);
assert.strictEqual(R.periodPlan(null, simPlan, ctx), null);

var t0 = Date.now();
var flags = R.transitFlags({ engine: E, result: result, weakHouses: plan.houses, from: new Date(Date.UTC(2026, 9, 31, 6)),
  days: 1200, latDeg: lat, lonDeg: lon, nodeType: 'mean' });
console.log('Transit scan: ' + (Date.now() - t0) + ' ms, ' + flags.length + ' flags');
flags.forEach(function (f) { console.log('  ' + f.date.toISOString().slice(0, 10) + '  ' + f.event + ' | ' + f.advice); });
assert.ok(flags.some(function (f) { return /Saturn to Aries/.test(f.event); }));
console.log('All Remedies checks passed.');
