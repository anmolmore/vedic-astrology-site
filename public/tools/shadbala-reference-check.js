// Compares this app's Shadbala for the Siva test chart (16 Jun 1970, 13:20
// IST, Chennai 13.0827 N 80.2707 E) against Parashara's Light 9.0's
// "Detailed Shad Bala" for the same chart, component by component.
//
//   node tools/shadbala-reference-check.js
//
// Loads calc-core.js and shadbala.js directly (no build needed), feeding
// them the bundled astronomy-engine.min.js.
var fs = require('fs'), path = require('path');
var ROOT = path.join(__dirname, '..');
var Astronomy = require(path.join(ROOT, 'astronomy-engine.min.js'));
function load(file) {
  var mod = { exports: {} };
  var req = function (id) { return id === 'astronomy-engine' ? Astronomy : require(id); };
  new Function('module', 'exports', 'require', fs.readFileSync(path.join(ROOT, file), 'utf8'))(mod, mod.exports, req);
  return mod.exports;
}
var E = load('calc-core.js'), S = load('shadbala.js');

var date = new Date(Date.UTC(1970, 5, 16, 7, 50)); // 13:20 IST
var chart = E.computeChart({ date: date, latDeg: 13.0827, lonDeg: 80.2707 });
var sb = S.compute({ date: date, latDeg: 13.0827, lonDeg: 80.2707, tzOffsetHours: 5.5,
  ascLongitude: chart.ascendant.longitude, planets: chart.planets, relationships: chart.relationships });

var G = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
// Parashara's Light 9.0, Siva — order as G above
var REF = {
  saptavargaja: [105.00, 78.75, 67.50, 144.38, 52.50, 97.50, 95.63],
  sthana:       [252.90, 143.21, 171.57, 192.93, 158.27, 169.48, 157.00],
  dig:          [54.73, 40.83, 59.56, 17.55, 55.10, 6.32, 47.96],
  ayana:        [59.87, 50.48, 59.61, 56.99, 16.78, 56.11, 7.86],
  kala:         [188.21, 132.15, 184.08, 163.09, 192.31, 156.64, 27.33],
  chesta:       [59.87, 46.10, 7.24, 35.14, 48.06, 35.30, 23.45],
  naisargika:   [60.00, 51.42, 17.16, 25.74, 34.26, 42.84, 8.58],
  drik:         [65.50, 5.23, 46.60, 61.35, -3.84, 17.36, 65.22],
  total:        [681.21, 418.94, 486.21, 495.80, 484.16, 427.93, 329.53]
};
var GET = {
  saptavargaja: function (r) { return r.sthanaDetail.saptavargaja; },
  ayana: function (r) { return r.kalaDetail.ayana; }
};
function pad(s, n) { s = String(s); while (s.length < n) s = ' ' + s; return s; }

console.log('Year/month/day/hour lords: app ' + [sb.context.varshaLord, sb.context.masaLord,
  sb.context.varaLord, sb.context.horaLord].join('/') + ', reference Jupiter/Moon/Mars/Mars');
console.log('App minus reference (Virupas); |diff| < 0.2 is rounding.');
console.log(pad('', 14) + G.map(function (g) { return pad(g.slice(0, 4), 9); }).join(''));
Object.keys(REF).forEach(function (k) {
  console.log(pad(k, 14) + G.map(function (g, i) {
    var r = sb.results[g];
    var v = GET[k] ? GET[k](r) : r[k];
    return pad((v - REF[k][i]).toFixed(2), 9);
  }).join(''));
});
