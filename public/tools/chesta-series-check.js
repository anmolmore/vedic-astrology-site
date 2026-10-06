// Compares this app's Chesta Bala and Ayana Bala with Parashara's Light 9.0's
// over fifteen dates (Chennai 13.0827 N 80.2707 E, 13:20 IST each day).
//
//   node tools/chesta-series-check.js
//
// The dates cover conjunctions, stations, retrogrades and oppositions of the
// five star-planets, so a change to chestaBala() should be judged against
// every row here, not just the Siva chart (16 Jun 1970). See
// docs/open-chesta-bala.md. Ayana Bala is checked for all seven planets.
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

var CHESTA_G = ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
var AYANA_G = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
// [year, month, day], Chesta Bala in the order of CHESTA_G, Ayana Bala in the order of AYANA_G
var REF = [
  [[1970, 3, 16], [22.00, 8.68, 50.52, 12.98, 25.66], [27.55, 0.58, 47.89, 36.00, 12.77, 33.96, 12.22]],
  [[1970, 6, 16], [7.24, 35.14, 48.06, 35.30, 23.45], [59.87, 50.48, 59.61, 56.99, 16.78, 56.11, 7.86]],
  [[1970, 6, 26], [5.70, 17.42, 47.86, 37.64, 28.06], [59.92, 26.69, 58.87, 59.70, 16.81, 52.55, 7.48]],
  [[1970, 7, 16], [2.65, 17.11, 46.06, 42.25, 35.99], [57.54, 59.44, 56.30, 54.88, 16.45, 42.98, 6.86]],
  [[1970, 8, 16], [2.62, 49.38, 38.43, 49.04, 43.77], [48.04, 52.46, 49.83, 35.00, 14.96, 25.61, 6.27]],
  [[1970, 9, 1], [5.71, 54.80, 32.65, 52.26, 45.15], [41.01, 21.18, 45.54, 31.15, 13.87, 17.52, 6.16]],
  [[1970, 9, 11], [7.63, 59.51, 28.55, 54.11, 45.37], [36.15, 58.10, 42.60, 34.68, 13.11, 13.30, 6.17]],
  [[1970, 9, 21], [9.56, 53.60, 24.13, 55.76, 46.27], [31.09, 0.99, 39.51, 38.36, 12.31, 9.89, 6.24]],
  [[1970, 10, 1], [11.48, 47.10, 19.46, 57.12, 47.89], [25.97, 38.15, 36.31, 35.04, 11.48, 7.39, 6.36]],
  [[1970, 10, 16], [14.37, 22.78, 12.08, 58.30, 51.53], [18.50, 9.72, 31.37, 37.64, 10.22, 5.47, 6.64]],
  [[1970, 11, 1], [17.44, 3.34, 3.89, 58.91, 56.57], [11.33, 56.72, 26.06, 49.91, 8.89, 6.19, 7.02]],
  [[1970, 11, 16], [20.33, 23.03, 3.99, 59.41, 58.18], [5.87, 0.01, 21.20, 57.19, 7.70, 9.14, 7.44]],
  [[1970, 12, 16], [26.10, 55.31, 19.55, 57.73, 48.82], [0.17, 5.23, 12.32, 59.19, 5.59, 9.15, 8.19]],
  [[1971, 6, 16], [57.06, 5.74, 53.12, 18.13, 16.20], [59.86, 31.01, 10.03, 59.38, 4.36, 57.17, 4.09]],
  [[1971, 8, 16], [59.86, 55.33, 46.38, 3.39, 41.01], [48.14, 0.01, 8.94, 40.27, 4.74, 49.42, 2.70]]
];
function pad(s, n) { s = String(s); while (s.length < n) s = ' ' + s; return s; }

var rows = REF.map(function (row) {
  var d = row[0], date = new Date(Date.UTC(d[0], d[1] - 1, d[2], 7, 50)); // 13:20 IST
  var chart = E.computeChart({ date: date, latDeg: 13.0827, lonDeg: 80.2707 });
  var sb = S.compute({ date: date, latDeg: 13.0827, lonDeg: 80.2707, tzOffsetHours: 5.5,
    ascLongitude: chart.ascendant.longitude, planets: chart.planets, relationships: chart.relationships });
  return { label: date.toISOString().slice(0, 10), sb: sb, chesta: row[1], ayana: row[2] };
});

function report(title, grahas, refKey, valueOf) {
  console.log(title);
  console.log(pad('', 12) + grahas.map(function (g) { return pad(g.slice(0, 4), 9); }).join(''));
  var sq = {}, worst = {};
  rows.forEach(function (r) {
    console.log(pad(r.label, 12) + grahas.map(function (g, i) {
      var diff = valueOf(r.sb.results[g]) - r[refKey][i];
      sq[g] = (sq[g] || 0) + diff * diff;
      worst[g] = Math.max(worst[g] || 0, Math.abs(diff));
      return pad(diff.toFixed(2), 9);
    }).join(''));
  });
  console.log(pad('RMS', 12) + grahas.map(function (g) { return pad(Math.sqrt(sq[g] / rows.length).toFixed(2), 9); }).join(''));
  console.log(pad('worst', 12) + grahas.map(function (g) { return pad(worst[g].toFixed(2), 9); }).join(''));
}

report('App minus Parashara\'s Light, Chesta Bala (Virupas).', CHESTA_G, 'chesta', function (r) { return r.chesta; });
console.log('');
report('App minus Parashara\'s Light, Ayana Bala (Virupas).', AYANA_G, 'ayana', function (r) { return r.kalaDetail.ayana; });
