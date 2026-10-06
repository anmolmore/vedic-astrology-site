(function () {
  'use strict';
  var E = window.VedicEngine;
  var SIGNS = E.SIGNS, SIGNS_SKT = E.SIGNS_SKT;
  var SIGN_SYMBOL = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
  var PLANET_SYMBOL = { Sun:'☉', Moon:'☽', Mars:'♂', Mercury:'☿', Jupiter:'♃', Venus:'♀', Saturn:'♄', Rahu:'☊', Ketu:'☋' };
  var PLANET_ORDER = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];

  // ---- South Indian chart's optional dispositor/aspect/exchange network overlay ----
  var networkEnabled = false;
  // A set of independently-toggled signs, not a single active one: clicking a
  // sign adds it (showing its connections alongside whatever else is already
  // selected) and clicking that same sign again is the only way to remove it.
  // Clicking a *different* sign is therefore additive, never an implicit
  // deselect of what came before — that was the whole point of a user report
  // ("clicking a different sign does not mean deselect the previous"). Keyed
  // by sign index (0-11) as a string, value always `true`; membership only,
  // never iterated in insertion order (see networkSelectedList for that).
  var networkSelectedSigns = {};
  // Network overlay direction filters: In = influences coming into the
  // selected sign(s), Out = influences going out. Both on whenever the
  // overlay is turned on; both off (and disabled) while it's off.
  var networkShowIn = true, networkShowOut = true;
  var NETWORK_VIEW_KEY = 'vedicChartNetworkOn.v1';

  // ---- South Indian chart's optional Dasha-activation overlay ----
  // Mirrors whatever MD/AD/PD node is currently selected in the Dasha tab's
  // tree (set from showDetail() as the user browses it, and by the tree's own
  // initial auto-selection on chart generation) rather than an independent
  // picker on the chart itself. { lords: [{lord, role}], start: Date, end: Date }
  var dashaActivationEnabled = false;
  var lastDashaSelection = null;
  var DASHA_ACTIVATION_VIEW_KEY = 'vedicChartDashaActivationOn.v1';

  // Arrowhead markers, one per *nature* rather than per edge type (a later
  // request: the line still conveys type via its own stroke color/style —
  // see the .net-edge-<type> CSS rules and the comment above .net-label-bg —
  // but the arrowhead alone is recolored to show whether the planet driving
  // that specific influence (dispositor lord, aspect caster, exchange
  // partner, secondary ruler) is a natural benefic or malefic, per the
  // Influence Engine's own benefic/malefic map. One marker per nature, color
  // baked straight into its own fill, rather than a single shared marker
  // with fill="currentColor" — a <marker> is rendered as its own detached
  // tree, so currentColor inside it resolves against the marker element's
  // own fixed computed color, not the color of whichever path references it.
  var NET_NATURE_MARKER_IDS = [
    { id: 'netArrowBenefic', color: 'var(--net-benefic)' },
    { id: 'netArrowMalefic', color: 'var(--net-malefic)' },
    { id: 'netArrowMixed', color: 'var(--gold)' },
    { id: 'netArrowNeutral', color: 'var(--muted)' }
  ];
  function netNatureMarkerId(nature) {
    return nature === 'benefic' ? 'netArrowBenefic' : nature === 'malefic' ? 'netArrowMalefic'
      : nature === 'mixed' ? 'netArrowMixed' : 'netArrowNeutral';
  }
  // Benefic ('benefic') / malefic ('malefic') for one planet — the exact
  // same classification the Influence Engine's Tripod scanner and unified
  // verdict already use (window.Interpret.DEFAULT_BENEFIC, or the chart's own
  // computed sb.context.beneficMap when a real chart's Shadbala ran), not a
  // second benefic/malefic table invented for this overlay. Rahu/Ketu are
  // always natural malefics (Interpret.isNaturalBenefic) — the conditions
  // under which their own results turn favourable don't change how their
  // influence lands on others.
  function natureOfPlanet(name, sb) {
    if (name === 'Rahu' || name === 'Ketu') return 'malefic';
    var beneficMap = (sb && sb.context && sb.context.beneficMap) || (window.Interpret && window.Interpret.DEFAULT_BENEFIC) || {};
    return beneficMap[name] ? 'benefic' : 'malefic';
  }
  // Widened influence tone (Influence Framework §3 / item 24 — "aspect as a
  // net vector", generalized here to every edge type this overlay draws, not
  // only aspects, since dispositor and exchange edges read the same
  // natureOfPlanet() call and share the identical shallow-nature-only
  // problem). Reads natural tone (as before) plus two more signals per the
  // research's own recommendation: functional lordship tone (Trikona
  // lordship pulls toward benefic, Dusthana lordship pulls toward malefic —
  // this is the concrete fix for why Mars's aspects in a chart like Siva's
  // all render the same red today, even though two of the three land on
  // structurally different points) and same-conjunction taint (a co-tenant's
  // own nature pulls this planet's read the same direction). A planet
  // holding a genuinely split signal (e.g. both a Trikona and a Dusthana
  // lordship at once, or conjunct planets of both natures) reads 'mixed'
  // rather than forced to either side. Falls back to plain natureOfPlanet()
  // when result/H aren't available, so existing callers
  // that only have (name, sb) keep working unchanged.
  //
  // With real Shadbala on hand the arrowhead takes the planet's verdict from
  // the Influence Engine tab's Bala framework instead — green, amber or red
  // (Interpret.balaFramework: the Shadbala number crossed with the factors
  // the number leaves out). The votes below remain the fallback for a
  // hand-placed chart, which has no Shadbala to grade.
  // The MD/AD/PD chain selected on the Dashas tab (lastDashaSelection), in the
  // shape Interpret.balaFramework() takes. Yogas score only for its lords, so
  // the verdicts — and these arrowheads — follow the period in view.
  function bfDashaOpts() {
    var sel = lastDashaSelection;
    if (!sel || !sel.lords || !sel.lords.length) return { activeLords: [], periodLabel: '' };
    return {
      activeLords: sel.lords,
      periodLabel: sel.lords.map(function (l) { return l.lord + ' ' + l.role; }).join(' › ')
    };
  }
  var netVerdictCache = new WeakMap();
  function netPlanetVerdict(name, result, sb, H) {
    if (!result || !H || !sb || !sb.results || !window.Interpret || !window.Interpret.balaFramework) return null;
    var cached = netVerdictCache.get(result);
    var dashaOpts = bfDashaOpts();
    if (!cached || cached.sb !== sb || cached.period !== dashaOpts.periodLabel) {
      cached = { sb: sb, period: dashaOpts.periodLabel, verdicts: {} };
      netVerdictCache.set(result, cached);
    }
    if (!(name in cached.verdicts)) {
      var fw = window.Interpret.balaFramework({ kind: 'planet', key: name, house: result.planets[name].house }, result, sb, H, dashaOpts);
      var block = fw && fw.blocks.filter(function (b) { return b.kind === 'narrative' && b.subject === 'planet'; })[0];
      cached.verdicts[name] = block ? block.verdict : null;
    }
    return cached.verdicts[name];
  }
  var NET_VERDICT_TONE = { green: 'benefic', amber: 'mixed', red: 'malefic' };
  function netInfluenceTone(name, result, sb, H) {
    var verdict = netPlanetVerdict(name, result, sb, H);
    if (verdict) return NET_VERDICT_TONE[verdict.color];
    var natural = natureOfPlanet(name, sb);
    if (!natural || !result || !H || !window.Interpret) return natural;
    var role = window.Interpret.functionalRoleOf(name, result, H);
    var tags = (role.dual ? role.appConvention : role.classical).tags;
    var isTri = tags.indexOf('Trikona') >= 0;
    var isDus = tags.indexOf('Dusthana') >= 0;
    var functional = (isTri && isDus) ? 'mixed' : isTri ? 'benefic' : isDus ? 'malefic' : null;

    var taint = null;
    var mySign = result.planets[name].signIndex;
    H.PLANET_ORDER.forEach(function (other) {
      if (other === name || H.isNodePair(name, other)) return;
      if (result.planets[other].signIndex !== mySign) return;
      var otherNat = natureOfPlanet(other, sb);
      if (!otherNat) return;
      taint = taint === null ? otherNat : (taint === otherNat ? taint : 'mixed');
    });

    var votes = [natural];
    if (functional) votes.push(functional);
    if (taint) votes.push(taint);
    if (votes.indexOf('mixed') >= 0) return 'mixed';
    var hasB = votes.indexOf('benefic') >= 0, hasM = votes.indexOf('malefic') >= 0;
    if (hasB && hasM) return 'mixed';
    return hasB ? 'benefic' : 'malefic';
  }
  // A plain-language hover title for one edge, naming the planet whose
  // nature colored its arrowhead — so the coloring is self-explanatory
  // rather than a colored tip with no stated reason.
  function netNatureWord(name, sb, result, H) {
    var verdict = netPlanetVerdict(name, result, sb, H);
    if (verdict) return ' (' + verdict.word + ')';
    var n = result && H ? netInfluenceTone(name, result, sb, H) : natureOfPlanet(name, sb);
    return ' (' + n + ')';
  }
  function netEdgeTitle(e, sb, result, H) {
    if (e.type === 'dispositor') {
      return e.planet + netNatureWord(e.planet, sb, result, H) + ' rules ' + SIGNS[e.to] + ', standing in ' + SIGNS[e.from] + '.';
    }
    if (e.type === 'aspect') {
      return e.planet + netNatureWord(e.planet, sb, result, H) + ' casts a ' + (e.label || '') + ' aspect from ' + SIGNS[e.from] + ' onto ' + SIGNS[e.to] + '.';
    }
    if (e.type === 'exchange') {
      return e.planet + netNatureWord(e.planet, sb, result, H) + ' and ' + e.planetReverse + netNatureWord(e.planetReverse, sb, result, H) +
        ' exchange signs (Parivartana): ' + SIGNS[e.from] + ' ↔ ' + SIGNS[e.to] + '.';
    }
    if (e.type === 'secondary') {
      return e.planet + netNatureWord(e.planet, sb, result, H) + ' also rules ' + SIGNS[e.from] + ', placed in ' + SIGNS[e.to] + '.';
    }
    return '';
  }

  // Sorted array of currently-selected sign indices (numbers). The single
  // source of truth for "how many/which signs are selected" everywhere below.
  function networkSelectedList() {
    return Object.keys(networkSelectedSigns).map(Number).sort(function (a, b) { return a - b; });
  }

  // ---- South Indian fixed sign->cell layout (4x4 grid, row,col) ----
  var SOUTH_LAYOUT = {
    11: [0,0], 0: [0,1], 1: [0,2], 2: [0,3],
    10: [1,0],                    3: [1,3],
    9:  [2,0],                    4: [2,3],
    8:  [3,0], 7: [3,1], 6: [3,2], 5: [3,3]
  };

  // ---- North Indian fixed house polygons on a 300x300 viewbox ----
  // Houses run ANTI-CLOCKWISE from the top-centre diamond (house 1 = Lagna):
  //   1 top-centre, 2 top-left, 3 left-upper, 4 left-centre, 5 left-lower,
  //   6 bottom-left, 7 bottom-centre, 8 bottom-right, 9 right-lower,
  //   10 right-centre, 11 right-upper, 12 top-right.
  function northHousePolygons() {
    var TL=[0,0], TR=[300,0], BR=[300,300], BL=[0,300];
    var topMid=[150,0], rightMid=[300,150], botMid=[150,300], leftMid=[0,150];
    var C=[150,150];
    var pTLBR75=[75,75], pTLBR225=[225,225], pTRBL75=[225,75], pTRBL225=[75,225];
    return {
      1: [topMid, pTRBL75, C, pTLBR75],        // top-centre diamond
      2: [TL, topMid, pTLBR75],                // top-left triangle (top edge)
      3: [TL, pTLBR75, leftMid],               // top-left triangle (left edge)
      4: [leftMid, pTLBR75, C, pTRBL225],      // left-centre diamond
      5: [leftMid, pTRBL225, BL],              // bottom-left triangle (left edge)
      6: [BL, pTRBL225, botMid],               // bottom-left triangle (bottom edge)
      7: [botMid, pTRBL225, C, pTLBR225],      // bottom-centre diamond
      8: [botMid, pTLBR225, BR],               // bottom-right triangle (bottom edge)
      9: [BR, pTLBR225, rightMid],             // bottom-right triangle (right edge)
      10:[rightMid, pTLBR225, C, pTRBL75],     // right-centre diamond
      11:[rightMid, pTRBL75, TR],              // top-right triangle (right edge)
      12:[TR, topMid, pTRBL75]                 // top-right triangle (top edge)
    };
  }
  // label anchor points (centroid-ish, pulled slightly toward the outer edge for readability)
  var NORTH_LABEL_POS = {
    1: [150,45],  2: [95,35],   3: [45,85],   4: [75,150],  5: [45,215],  6: [95,265],
    7: [150,255], 8: [205,265], 9: [255,215], 10:[225,150], 11:[255,85],  12:[205,35]
  };
  // small house-number anchors, tucked against the outer edge of each house region
  var NORTH_HOUSENUM_POS = {
    1: [150,13],  2: [48,17],   3: [15,53],   4: [15,151],  5: [15,249],  6: [48,289],
    7: [150,293], 8: [252,289], 9: [285,249], 10:[285,151], 11:[285,53],  12:[252,17]
  };

  function svgEl(tag, attrs) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function svgText(x, y, str, cls, size) {
    var t = svgEl('text', { x: x, y: y, class: cls || '', 'font-size': size || 11, 'text-anchor': 'middle' });
    t.textContent = str;
    return t;
  }

  // A planet's chart label, with its dignity (Own sign / Moolatrikona /
  // Exalted / Debilitated) appended as short colored codes — reusing
  // dignityOf(), the same lookup the Planet table's `.dg` chips already use,
  // rather than a second dignity check. A planet can hold more than one at
  // once (e.g. Mercury in Virgo is exalted, in its own sign, and in
  // Moolatrikona all together — see dignityOf's own comment), so each flag
  // gets its own colored tspan, slash-joined, plus a combined <title> for
  // the full wording on hover.
  function svgPlanetLabel(x, y, pname, p, cls, size) {
    var t = svgEl('text', { x: x, y: y, class: cls || '', 'font-size': size || 11, 'text-anchor': 'middle' });
    t.appendChild(document.createTextNode(PLANET_SYMBOL[pname] + ' ' + pname.slice(0, 3)));
    // Retrograde: the same bold red "R" the Planets tab puts after the name.
    if (p.retrograde) {
      var r = svgEl('tspan', { class: 'planet-retro', dx: 1 });
      r.textContent = 'R';
      t.appendChild(r);
    }
    var flags = dignityOf(pname, p);
    if (flags.length) {
      t.appendChild(document.createTextNode(' '));
      flags.forEach(function (f, i) {
        if (i > 0) t.appendChild(document.createTextNode('/'));
        var tspan = svgEl('tspan', { class: 'planet-dg-flag planet-dg-' + f.k });
        tspan.textContent = f.t;
        t.appendChild(tspan);
      });
    }
    var tips = (p.retrograde ? ['Retrograde'] : []).concat(flags.map(function (f) { return f.full; }));
    if (tips.length) {
      var title = svgEl('title', {});
      title.textContent = tips.join('; ');
      t.appendChild(title);
    }
    return t;
  }

  // What a chart label should judge dignity against: the D1 planet as-is, or
  // for the Navamsa chart its D9 sign. Moolatrikona is a D1 degree band, so
  // the D9 view carries no degree and never matches it.
  function chartPlanet(p, useNavamsa) {
    if (!useNavamsa) return p;
    return { signIndex: p.navamsaSignIndex, sign: E.SIGNS[p.navamsaSignIndex], degree: NaN,
             retrograde: p.retrograde };
  }

  function planetsBySign(result, useNavamsa) {
    var map = {};
    for (var i = 0; i < 12; i++) map[i] = [];
    PLANET_ORDER.forEach(function (name) {
      var p = result.planets[name];
      var idx = useNavamsa ? p.navamsaSignIndex : p.signIndex;
      map[idx].push(name);
    });
    return map;
  }

  function renderNorthChart(svgId, result, useNavamsa, sb) {
    var svg = document.getElementById(svgId);
    hideChartTooltip();
    svg.innerHTML = '';
    svg.setAttribute('viewBox', '0 0 300 300');
    var polys = northHousePolygons();
    var ascSignIdx = useNavamsa ? result.ascendant.navamsaSignIndex : result.ascendant.signIndex;
    var bySign = planetsBySign(result, useNavamsa);
    var hoverable = !useNavamsa; // narrative rungs read D1 placements only

    // outer square
    svg.appendChild(svgEl('rect', { x: 1, y: 1, width: 298, height: 298, fill: 'none', stroke: 'var(--line)', 'stroke-width': 2 }));

    for (var h = 1; h <= 12; h++) {
      var pts = polys[h].map(function (p) { return p[0] + ',' + p[1]; }).join(' ');
      var signIdxH = (ascSignIdx + (h - 1)) % 12;
      var poly = svgEl('polygon', {
        points: pts, fill: h === 1 ? 'var(--house1-fill)' : 'none', stroke: 'var(--line)', 'stroke-width': 1.2,
        'pointer-events': 'all', class: 'house-hit'
      });
      if (hoverable) wireHouseHover(poly, h, signIdxH, bySign[signIdxH] || [], result, sb);
      svg.appendChild(poly);
    }
    for (var h2 = 1; h2 <= 12; h2++) {
      var signIdx = (ascSignIdx + (h2 - 1)) % 12;
      var pos = NORTH_LABEL_POS[h2];
      var planets = bySign[signIdx] || [];
      var g = svgEl('g', { 'pointer-events': 'none' }); // labels never steal the house's hover hit-area
      // fixed house number, tucked against the outer edge (houses run anti-clockwise)
      var hn = NORTH_HOUSENUM_POS[h2];
      var hnText = svgText(hn[0], hn[1], 'H' + h2, 'house-num', 8);
      var hnTitle = svgEl('title', {});
      hnTitle.textContent = 'House ' + h2 + ' — ' + E.SIGNS[signIdx];
      hnText.appendChild(hnTitle);
      g.appendChild(hnText);
      // rashi glyph
      var signText = svgText(pos[0], pos[1] - (planets.length ? 6 : 0), SIGN_SYMBOL[signIdx], 'sign-label', 12);
      var signTitle = svgEl('title', {});
      signTitle.textContent = E.SIGNS[signIdx] + ' (rashi ' + (signIdx + 1) + ') in house ' + h2;
      signText.appendChild(signTitle);
      g.appendChild(signText);
      planets.forEach(function (pname, i) {
        g.appendChild(svgPlanetLabel(pos[0], pos[1] + 8 + i * 12, pname, chartPlanet(result.planets[pname], useNavamsa), 'planet-label', 10));
      });
      svg.appendChild(g);
    }
  }

  function renderSouthChart(svgId, result, useNavamsa, sb) {
    var svg = document.getElementById(svgId);
    hideChartTooltip();
    svg.innerHTML = '';
    var size = 320, cell = size / 4;
    // The Dasha-activation overlay's per-house MD/AD/PD labels now print
    // INSIDE that house's own cell (against its bottom edge) rather than
    // outside the grid, so the viewBox no longer needs to grow a margin to
    // fit them — it stays the plain grid square in every state, which also
    // keeps the chart's own top border flush with the svg's top edge
    // (and so with the toggle checkboxes beside it) whether or not the
    // overlay is active.
    var dashaOverlayActive = !useNavamsa && dashaActivationEnabled && !!lastDashaSelection;
    svg.setAttribute('viewBox', '0 0 ' + size + ' ' + size);
    var ascSignIdx = useNavamsa ? result.ascendant.navamsaSignIndex : result.ascendant.signIndex;
    var bySign = planetsBySign(result, useNavamsa);
    var hoverable = !useNavamsa; // narrative rungs read D1 placements only

    svg.appendChild(svgEl('rect', { x: 1, y: 1, width: size-2, height: size-2, fill: 'none', stroke: 'var(--line)', 'stroke-width': 2 }));

    var cellRects = {};
    var clickable = !useNavamsa; // the network overlay only applies to the D1 chart
    for (var s = 0; s < 12; s++) {
      var rc = SOUTH_LAYOUT[s];
      var row = rc[0], col = rc[1];
      var x = col * cell, y = row * cell;
      var isAsc = s === ascSignIdx;
      var houseNum = ((s - ascSignIdx + 12) % 12) + 1;
      var planets = bySign[s] || [];
      var cellRect = svgEl('rect', {
        x: x, y: y, width: cell, height: cell, fill: isAsc ? 'var(--house1-fill)' : 'none', stroke: 'var(--line)', 'stroke-width': 1,
        'pointer-events': 'all', class: 'house-hit'
      });
      if (hoverable) wireHouseHover(cellRect, houseNum, s, planets, result, sb);
      if (clickable) {
        cellRect.addEventListener('click', (function (sIdx) {
          return function () {
            if (!networkEnabled) return;
            // Toggle only this sign's own membership — selecting a different
            // sign never clears one already selected; only an explicit
            // second click on that same sign removes it.
            if (networkSelectedSigns[sIdx]) delete networkSelectedSigns[sIdx];
            else networkSelectedSigns[sIdx] = true;
            renderSouthChart(svgId, result, useNavamsa, sb);
          };
        })(s));
      }
      svg.appendChild(cellRect);
      cellRects[s] = cellRect;
      var g = svgEl('g', { 'pointer-events': 'none' }); // labels never steal the house's hover hit-area
      g.appendChild(svgText(x + cell/2, y + 16, SIGN_SYMBOL[s] + ' H' + houseNum, 'sign-label', 10));
      planets.forEach(function (pname, i) {
        g.appendChild(svgPlanetLabel(x + cell/2, y + 32 + i * 12, pname, chartPlanet(result.planets[pname], useNavamsa), 'planet-label', 10));
      });
      svg.appendChild(g);
    }
    // mark center 2x2 as unused — a touch warmer when the Dasha-activation
    // overlay is about to print its period readout there, so the text sits
    // on a block that reads as "occupied" rather than the plain blank tint.
    svg.appendChild(svgEl('rect', {
      x: cell, y: cell, width: cell*2, height: cell*2,
      fill: dashaOverlayActive ? 'rgba(179,130,47,0.07)' : 'var(--center-fill)',
      stroke: 'var(--line)', 'stroke-width': 1
    }));

    // The overlays below (and the shared status/readout elements they
    // update) belong to the D1 chart only — the D9 chart stops here so
    // drawing it never clears or redraws D1's overlay state.
    if (useNavamsa) return;

    var statusEl = document.getElementById('networkStatus');
    var centerOverlayEl = document.getElementById('chartCenterOverlay');
    var networkActive = !useNavamsa && networkEnabled;
    // Birth details / Dasha readout text goes grey while the network
    // overlay is showing — its dispositor/aspect/exchange lines already add
    // a lot of color to the chart, and the center block sitting right in
    // the middle of them was competing for attention rather than receding
    // behind them the way blank center space used to.
    if (centerOverlayEl) centerOverlayEl.classList.toggle('network-muted', networkActive);
    if (networkActive) {
      drawNetworkOverlay(svg, result, cell, cellRects, svgId, useNavamsa, sb);
    } else if (statusEl) {
      statusEl.classList.add('hidden');
      statusEl.innerHTML = '';
    }

    var dashaStatusEl = document.getElementById('dashaActivationStatus');
    var dashaCenterEl = document.getElementById('dashaCenterReadout');
    if (dashaOverlayActive) {
      drawDashaActivationOverlay(svg, result, cell, size, cellRects);
    } else {
      if (dashaStatusEl) { dashaStatusEl.classList.add('hidden'); dashaStatusEl.innerHTML = ''; }
      if (dashaCenterEl) { dashaCenterEl.classList.add('hidden'); dashaCenterEl.innerHTML = ''; }
    }
  }

  // ---- South Indian chart overlay: houses activated by the Dasha tab's
  // currently-selected MD/AD/PD chain (lastDashaSelection, kept in sync from
  // showDetail()). Reuses buildActivation() — the exact same per-house
  // {house, roles, tier} rows the "Houses Activated" table renders — so the
  // chart and the table never disagree about which houses are activated or
  // by which levels. Three things drawn: each activated house's cell gets a
  // tier-graded gold highlight (cellRects, already built by renderSouthChart);
  // a "MD · Lord" / "AD · Lord" / "PD · Lord" line per active level is
  // printed INSIDE that house's own cell, stacked up from its bottom edge
  // (see the dedicated comment below); and the blank center 2x2 gets the
  // chosen period's lord chain plus the same %-complete/days-left figures
  // the Dasha tab's own stat chips show (dashaTimingStats, one source for
  // both).
  function drawDashaActivationOverlay(svg, result, cell, size, cellRects) {
    var sel = lastDashaSelection;
    var statusEl = document.getElementById('dashaActivationStatus');
    if (!sel) return;

    var ascSignIdx = result.ascendant.signIndex;
    var rows = buildActivation(result, sel.lords);
    var byHouse = {};
    rows.forEach(function (r) { byHouse[r.house] = r; });
    var roleToLord = {};
    sel.lords.forEach(function (l) { roleToLord[l.role] = l.lord; });

    // Tier-graded highlight on each activated house's own cell — same tier
    // number (1-3) the activation table uses for its row-t2/row-t3 emphasis.
    for (var h = 1; h <= 12; h++) {
      var signIdx = (ascSignIdx + h - 1) % 12;
      var rect = cellRects[signIdx];
      if (!rect) continue;
      var r = byHouse[h];
      if (r) rect.classList.add('dasha-t' + Math.min(3, r.tier));
    }

    // Per-house "MD · Lord" lines, printed INSIDE that house's own cell,
    // hugging its bottom edge — stacked upward when a house is activated at
    // more than one level, with the first-listed role (MD, when present)
    // sitting closest to the bottom border and any further roles (AD, PD)
    // stacking above it. A small translucent backing rect (dasha-label-bg)
    // sits behind the stack so it stays legible over the sign glyph/planet
    // labels already occupying the upper part of the same cell.
    var layer = svgEl('g', { class: 'dasha-activation-layer', 'pointer-events': 'none' });
    var lineH = 8;
    rows.forEach(function (r) {
      var signIdx = (ascSignIdx + r.house - 1) % 12;
      var rc = SOUTH_LAYOUT[signIdx];
      var row = rc[0], col = rc[1];
      var x = col * cell, y = row * cell;
      var baseline = y + cell - 4;
      var stackTop = baseline - (r.roles.length - 1) * lineH;
      layer.appendChild(svgEl('rect', {
        x: x + 2, y: stackTop - 7, width: cell - 4, height: (baseline - stackTop) + 10,
        class: 'dasha-label-bg'
      }));
      r.roles.forEach(function (role, i) {
        var label = role + ' · ' + roleToLord[role];
        var ly = baseline - i * lineH;
        var t = svgEl('text', {
          x: x + cell / 2, y: ly, 'text-anchor': 'middle',
          class: 'dasha-label-' + role.toLowerCase()
        });
        t.textContent = label;
        layer.appendChild(t);
      });
    });
    svg.appendChild(layer);

    // Center readout: the chosen period's role/lord chain plus the same
    // %-complete and days-left figures the Dasha tab's own stat chips show.
    // Rendered as HTML now (a sibling overlay positioned over the SVG's
    // blank center 2x2, not SVG-native text) — it sits below the birth-
    // details summary in that same overlay, per a later request to move
    // birth details into the chart's center; HTML flows naturally under
    // whatever height birth details actually take, where fixed SVG y-
    // coordinates would have needed to shift to match instead.
    var timing = dashaTimingStats(sel.start, sel.end);
    var dashaCenterEl = document.getElementById('dashaCenterReadout');
    if (dashaCenterEl) {
      dashaCenterEl.classList.remove('hidden');
      var chainHtml = sel.lords.map(function (l) {
        return '<span class="dcr-' + l.role.toLowerCase() + '">' + l.role + ' ' + l.lord + '</span>';
      }).join(' ');
      dashaCenterEl.innerHTML =
        '<div class="dcr-title">Dasha Period</div>' +
        '<div class="dcr-chain">' + chainHtml + '</div>' +
        '<div class="dcr-pct">' + timing.pct + '% complete, ' + timing.daysSub + '</div>';
    }

    if (statusEl) {
      statusEl.classList.remove('hidden');
      statusEl.innerHTML = 'Showing ' + rows.length + ' of 12 houses activated by <strong>' +
        sel.lords.map(function (l) { return l.role + ' ' + l.lord; }).join(' → ') + '</strong>.';
    }
  }

  // ---- Chart hover tooltip: Planet narrative(s) occupying the house, then
  // the House narrative itself — both reusing the exact Compounded-paragraph
  // text already generated by the interpretation chains. ----
  var chartTooltipEl = null;
  function getChartTooltip() {
    if (!chartTooltipEl) {
      chartTooltipEl = document.createElement('div');
      chartTooltipEl.className = 'chart-tooltip hidden';
      document.body.appendChild(chartTooltipEl);
    }
    return chartTooltipEl;
  }

  // Highlightable vocabulary for the chart hover narrative: named yogas,
  // dignity states, and the axis/house-number references that tie two houses
  // together (an exchange, or the ordinal house a clause is pointing at).
  var NARRATIVE_HL_RE = /([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*){0,3}\s+Yoga(?:\s*\([^)]*\))?)|(\bexalted\b|\bdebilitated\b|\bretrograde\b|\bvargottama\b|\bMoolatrikona\b|rules the very sign)|(\d+(?:st|nd|rd|th)\b|\bexchange\b)/g;

  function highlightNarrativeSentence(el, str) {
    var last = 0, m;
    NARRATIVE_HL_RE.lastIndex = 0;
    while ((m = NARRATIVE_HL_RE.exec(str))) {
      if (m.index > last) el.appendChild(document.createTextNode(str.slice(last, m.index)));
      var mark = document.createElement('mark');
      mark.className = m[1] ? 'hl-yoga' : m[2] ? 'hl-dignity' : 'hl-axis';
      mark.textContent = m[0];
      el.appendChild(mark);
      last = m.index + m[0].length;
    }
    if (last < str.length) el.appendChild(document.createTextNode(str.slice(last)));
  }

  // Splits a narrative paragraph into its sentences and lists them as bullet
  // points, highlighting yogas / dignities / axis references within each.
  function richNarrativeList(el, str) {
    var parts = String(str).split(/\.\s+/)
      .map(function (s) { return s.replace(/\.\s*$/, '').trim(); })
      .filter(Boolean);
    var ul = document.createElement('ul');
    ul.className = 'narrative-list';
    parts.forEach(function (s) {
      var li = document.createElement('li');
      highlightNarrativeSentence(li, s);
      ul.appendChild(li);
    });
    el.appendChild(ul);
  }

  // A single "LABEL — text" line used for the trait triplet (Planet, Sign,
  // House) that opens every card in the tooltip below.
  function ctTraitLine(label, text) {
    var d = document.createElement('div');
    d.className = 'ct-line';
    var b = document.createElement('b');
    b.textContent = label + ' — ';
    d.appendChild(b);
    d.appendChild(document.createTextNode(text || '—'));
    return d;
  }

  // The Influence Engine tab's verdict pill for a planet or house narrative,
  // or nothing when the framework has no entries (a hand-placed chart).
  function ctVerdictPill(narrative) {
    if (!narrative) return null;
    var d = document.createElement('div');
    d.className = 'ct-verdict';
    d.appendChild(spanText(narrative.verdict.word, 'bf-badge bf-badge-' + narrative.verdict.color));
    return d;
  }

  function ctStatLine(text) {
    var d = document.createElement('div');
    d.className = 'ct-stat';
    d.textContent = text;
    return d;
  }

  // Chart hover tooltip: one self-contained reference card per occupant
  // planet, plus a House-level card that's always present (the only card
  // shown for an empty house). Each card opens with its trait lines (Planet,
  // Sign, House, then Kalapurusha body parts for the planet and for the
  // house — five direct table lookups for a planet card, three for the
  // House-level card), then, for a planet card, its compound relationship to
  // any co-tenant(s) in bold, its Shadbala standing, and — only when
  // relevant — a named yoga formed with that co-tenant. Deliberately
  // structured data (label — table lookup, stat — computed number), not the
  // narrative-chain prose the tooltip used before, so it reads as a quick
  // reference rather than a paragraph to parse.
  function chartTooltipContent(houseNum, signIdx, planets, result, sb) {
    var IP = window.Interpret;
    var signName = E.SIGNS[signIdx];
    var frag = document.createDocumentFragment();
    var body = document.createElement('div');
    body.className = 'ct-body';

    planets.forEach(function (pname) {
      var section = document.createElement('div');
      section.className = 'ct-section';

      var sub = document.createElement('div');
      sub.className = 'ct-sub';
      sub.textContent = (PLANET_SYMBOL[pname] || '') + ' ' + pname + '-' + signName + '-House(' + houseNum + ')';
      // The verdict pill and the Shadbala standing sit inside the title
      // block, above its underline.
      var pPill = ctVerdictPill(bfPlanetNarrative(pname));
      if (pPill) sub.appendChild(pPill);
      if (!sb) {
        sub.appendChild(ctStatLine('Shadbala — needs an exact birth time (unavailable in Simulation mode)'));
      } else if (!sb.results[pname]) {
        sub.appendChild(ctStatLine('Shadbala — not computed for the lunar nodes'));
      } else {
        var r = sb.results[pname];
        sub.appendChild(ctStatLine('Shadbala ' + Math.round(r.percent) + '% — Rank ' + r.rank + ' of 7'));
      }
      section.appendChild(sub);

      section.appendChild(ctTraitLine(pname, IP.KARAKA[pname]));
      section.appendChild(ctTraitLine(signName, IP.SIGN_TRAITS[signName]));
      section.appendChild(ctTraitLine('House ' + houseNum, IP.HOUSE_TEXT[houseNum]));
      // Kalapurusha body parts — the planet's own naisargika body-part
      // karakatva (Rahu/Ketu have none classically agreed on, so this reads
      // "—" for them, same empty-state convention as every other trait line
      // here) plus the body part governed by the house it's sitting in.
      section.appendChild(ctTraitLine('Kala Purusha (' + pname + ')',
        IP.KALA_PURUSHA_PLANET[pname] || 'not classically assigned to either node'));
      section.appendChild(ctTraitLine('Kala Purusha (House ' + houseNum + ')', IP.KALA_PURUSHA_HOUSE[houseNum]));

      var coTenants = planets.filter(function (o) { return o !== pname; });

      // Compound (panchadha) relationship to each co-tenant, tier in bold —
      // reuses REL_TIER's tier→css-code map (Planet table's Dignity column)
      // so the color coding matches the rest of the app, not a new palette.
      coTenants.forEach(function (other) {
        var rel = result.relationships && result.relationships[pname] && result.relationships[pname][other];
        var relLine = document.createElement('div');
        relLine.className = 'ct-rel';
        relLine.appendChild(document.createTextNode(pname + ' - ' + other + ': '));
        var b = document.createElement('b');
        var tier = rel && REL_TIER[rel.panchadha];
        if (tier) b.className = 'reldig-' + tier.k;
        b.textContent = rel ? rel.panchadha : 'unknown';
        relLine.appendChild(b);
        section.appendChild(relLine);
      });

      // Any named yoga formed purely by this co-tenancy (Gajakesari,
      // Budhaditya, Chandra-Mangala — see COTENANT_YOGAS in interpret.js),
      // with its reasoning.
      coTenants.forEach(function (other) {
        IP.cotenantYogas(pname, other).forEach(function (y) {
          var yLine = document.createElement('div');
          yLine.className = 'ct-yoga';
          var yb = document.createElement('b');
          yb.textContent = y.name + ' ';
          yLine.appendChild(yb);
          yLine.appendChild(document.createTextNode('(with ' + other + ') — ' + y.reason));
          section.appendChild(yLine);
        });
      });

      // Lordship-based yogas (Raja/Dhana Yoga shapes, Parivartana) — these
      // don't depend on co-tenancy at all, so a planet sitting completely
      // alone can still carry one. IP.planetYogas re-derives the same
      // conditions grahaChain's own rung 5/5b already compute for the
      // narrative tabs (see interpret.js) rather than a fresh reimplementation.
      IP.planetYogas(pname, result, interpHelpers()).forEach(function (y) {
        var yLine = document.createElement('div');
        yLine.className = 'ct-yoga';
        var yb = document.createElement('b');
        yb.textContent = y.name + ' ';
        yLine.appendChild(yb);
        yLine.appendChild(document.createTextNode('— ' + y.reason));
        section.appendChild(yLine);
      });

      body.appendChild(section);
    });

    // ---- House-level card, always present ----
    var hSection = document.createElement('div');
    hSection.className = 'ct-section';

    var hSub = document.createElement('div');
    hSub.className = 'ct-sub';
    hSub.textContent = signName + '-House(' + houseNum + ')';
    var hPill = ctVerdictPill(bfHouseNarrative(houseNum));
    if (hPill) hSub.appendChild(hPill);
    var myBala = null, myBalaRank = null;
    try {
      var hchain = IP.bhavaChain(houseNum, result, sb, interpHelpers());
      myBala = hchain.myBala; myBalaRank = hchain.myBalaRank;
    } catch (err) { /* leave myBala null — falls to the unavailable message below */ }
    hSub.appendChild(ctStatLine(myBala && myBalaRank
      ? 'Bhava Bala ' + myBala.rupa.toFixed(2) + ' Rūpa — Rank ' + myBalaRank + ' of 12'
      : 'Bhava Bala — needs an exact birth time (unavailable in Simulation mode)'));
    hSection.appendChild(hSub);

    hSection.appendChild(ctTraitLine(signName, IP.SIGN_TRAITS[signName]));
    hSection.appendChild(ctTraitLine('House ' + houseNum, IP.HOUSE_TEXT[houseNum]));
    hSection.appendChild(ctTraitLine('Kala Purusha (House ' + houseNum + ')', IP.KALA_PURUSHA_HOUSE[houseNum]));


    body.appendChild(hSection);

    frag.appendChild(body);
    return frag;
  }

  function positionChartTooltip(ev) {
    var el = chartTooltipEl;
    if (!el || el.classList.contains('hidden')) return;
    var pad = 16;
    var vw = window.innerWidth, vh = window.innerHeight;
    var r = el.getBoundingClientRect();
    var x = ev.clientX + pad, y = ev.clientY + pad;
    if (x + r.width > vw - 8) x = ev.clientX - r.width - pad;
    if (x < 8) x = 8;
    if (y + r.height > vh - 8) y = vh - r.height - 8;
    if (y < 8) y = 8;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
  }

  function hideChartTooltip() {
    if (chartTooltipEl) chartTooltipEl.classList.add('hidden');
  }

  function wireHouseHover(el, houseNum, signIdx, planets, result, sb) {
    el.addEventListener('mouseenter', function (ev) {
      var tip = getChartTooltip();
      tip.innerHTML = '';
      tip.appendChild(chartTooltipContent(houseNum, signIdx, planets, result, sb));
      tip.classList.remove('hidden');
      positionChartTooltip(ev);
    });
    el.addEventListener('mousemove', positionChartTooltip);
    el.addEventListener('mouseleave', hideChartTooltip);
  }

  function td(text, cls) { var d = document.createElement('td'); if (cls) d.className = cls; d.textContent = text; return d; }
  function th(text) { var d = document.createElement('th'); d.textContent = text; return d; }
  function spanText(text, cls) { var s = document.createElement('span'); if (cls) s.className = cls; s.textContent = text; return s; }

  // Formats a signed declination (degrees from the celestial equator) as
  // deg°min'sec" plus a N/S hemisphere marker, mirroring formatDeg's style.
  function formatDeclination(dec) {
    var hemi = dec >= 0 ? 'N' : 'S';
    var d = Math.abs(dec);
    var deg = Math.floor(d);
    var minFloat = (d - deg) * 60;
    var min = Math.floor(minFloat);
    var sec = Math.round((minFloat - min) * 60);
    if (sec === 60) { sec = 0; min++; }
    if (min === 60) { min = 0; deg++; }
    return deg + '°' + String(min).padStart(2, '0') + "'" + String(sec).padStart(2, '0') + '" ' + hemi;
  }

  // Graha drishti (Vedic aspects) by whole-sign house distance.
  // Every planet aspects the 7th; Mars adds 4/8, Jupiter 5/9, Saturn 3/10.
  // Rahu and Ketu aspect the 7th only, and never each other.
  var ASPECT_HOUSES = {
    Sun: [7], Moon: [7], Mercury: [7], Venus: [7],
    Mars: [4, 7, 8], Jupiter: [5, 7, 9], Saturn: [3, 7, 10],
    // Rahu and Ketu aspect the 7th only. That always lands on the other
    // node's sign, so in practice a node aspects the planets sharing the
    // opposite node's sign (never the opposite node itself — see below) and
    // the house there.
    Rahu: [7], Ketu: [7]
  };

  // Rahu and Ketu sit exactly 180° apart, so each is permanently in the other's
  // 7th. That mutual aspect is not counted — the nodes do not aspect each other.
  function isNodePair(a, b) {
    return (a === 'Rahu' && b === 'Ketu') || (a === 'Ketu' && b === 'Rahu');
  }

  function aspectsCastBy(name, result) {
    var from = result.planets[name].signIndex;
    var houses = ASPECT_HOUSES[name] || [7];
    var out = [];
    PLANET_ORDER.forEach(function (other) {
      if (other === name || isNodePair(name, other)) return;
      var dist = ((result.planets[other].signIndex - from + 12) % 12) + 1;
      if (houses.indexOf(dist) >= 0) out.push({ planet: other, aspect: dist });
    });
    out.sort(function (a, b) { return a.aspect - b.aspect; });
    return out;
  }

  function ordinalWord(n) {
    var s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  // ---- Sign-level relationship network for the South Indian chart's optional
  // overlay: dispositor, graha drishti (aspect), and Parivartana (exchange)
  // edges, all derived from data the app already computes elsewhere (SIGN_LORDS,
  // ASPECT_HOUSES / aspectsCastBy) rather than a second source of truth. ----
  function computeNetworkEdges(result) {
    var edges = [];

    // Dispositor: from the sign the ruling planet itself occupies, to every
    // one of the 12 signs that planet rules — occupied or empty alike, so
    // the unfiltered "Show all" view matches what a click on any individual
    // (even empty) sign already reveals via connectionsForSign. A planet
    // sitting in its own sign has nothing to draw — it is already "home".
    // Co-lord-aware: Virgo/Aquarius (Rahu) and Scorpio/Pisces (Ketu) each draw
    // one dispositor edge per co-lord, not just the primary lord.
    var seenDisp = {};
    for (var sIdx = 0; sIdx < 12; sIdx++) {
      E.SIGN_COLORDS[sIdx].forEach(function (lord) {
        var lordSign = result.planets[lord].signIndex;
        if (lordSign === sIdx) return;
        var k = lordSign + '>' + sIdx;
        if (seenDisp[k]) return;
        seenDisp[k] = true;
        edges.push({ from: lordSign, to: sIdx, type: 'dispositor', planet: lord });
      });
    }

    // Aspect: whole-sign distance from each planet's own sign to EVERY one of
    // the 12 signs (occupied, empty, or the Ascendant's alike) — not just the
    // signs happening to hold another planet. A prior version derived this
    // purely from aspectsCastBy(name, result), which only ever checks the
    // nine grahas as possible targets (it was written for the Planets tab's
    // planet-to-planet "Planets Aspected" column), plus a bolted-on
    // Ascendant-only special case. That meant an aspect landing on a sign
    // with no occupant and no Lagna was structurally invisible here — a user
    // report against Siva's chart caught this: aspects into a genuinely
    // empty sign never appeared, in the default "Show all" view or via a
    // click on that empty sign, even though the aspect is just as real as
    // one landing on an occupied sign. Fixed by iterating target sign index
    // 0-11 directly and testing the same ASPECT_HOUSES distance rule
    // aspectsCastBy uses internally, rather than only checking signs a
    // planet or the Lagna happens to occupy.
    var seenAsp = {};
    PLANET_ORDER.forEach(function (name) {
      var fromSign = result.planets[name].signIndex;
      var houses = ASPECT_HOUSES[name] || [7];
      for (var toSign = 0; toSign < 12; toSign++) {
        if (toSign === fromSign) continue;
        var dist = ((toSign - fromSign + 12) % 12) + 1;
        if (houses.indexOf(dist) < 0) continue;
        // Rahu/Ketu never aspect each other (aspectsCastBy's own isNodePair
        // check). A node's only aspect, the 7th, always lands on the other
        // node's sign — so draw it only when some other planet sits there
        // to receive it, not as a line that would just join the two nodes.
        if (name === 'Rahu' || name === 'Ketu') {
          var otherNode = name === 'Rahu' ? 'Ketu' : 'Rahu';
          if (toSign === result.planets[otherNode].signIndex &&
              !PLANET_ORDER.some(function (p) { return p !== otherNode && p !== name && result.planets[p].signIndex === toSign; })) continue;
        }
        var k = fromSign + '>' + toSign + '@' + dist;
        if (seenAsp[k]) continue;
        seenAsp[k] = true;
        edges.push({ from: fromSign, to: toSign, type: 'aspect', label: ordinalWord(dist), planet: name });
      }
    });

    // Exchange (Parivartana): the two signs are mutual dispositors of one
    // another via the planets sitting in them.
    // Co-lord-aware: p1 (in sign s1) is in Parivartana with p2 whenever p2 is
    // ANY co-lord of s1 and p1 is in turn ANY co-lord of p2's sign — covers
    // exchanges that only exist because of Rahu/Ketu's co-ownership.
    var seenExch = {};
    PLANET_ORDER.forEach(function (p1) {
      var s1 = result.planets[p1].signIndex;
      E.SIGN_COLORDS[s1].forEach(function (p2) {
        if (p2 === p1) return;
        var s2 = result.planets[p2].signIndex;
        if (s1 === s2 || E.SIGN_COLORDS[s2].indexOf(p1) < 0) return;
        var k = [s1, s2].sort(function (a, b) { return a - b; }).join('|');
        if (seenExch[k]) return;
        seenExch[k] = true;
        // planet (p1) stands at "from" (s1) and rules "to" (s2) — the
        // forward direction's dispositor half, whose nature colors the
        // marker-end arrowhead at s2. planetReverse (p2) stands at "to" (s2)
        // and rules "from" (s1) — the mirrored half, whose nature colors the
        // marker-start arrowhead at s1 (see drawNetworkOverlay).
        edges.push({ from: s1, to: s2, type: 'exchange', label: 'Exchange', planet: p1, planetReverse: p2 });
      });
    });

    // An exchange pair's two signs also each produce their own ordinary
    // dispositor edge (both directions — the dispositor loop above runs over
    // every sign, so it draws into each side of the pair regardless of
    // occupancy) — the exact same lordship relationship the exchange edge
    // above already states more precisely as one bidirectional line. A
    // previous revision dropped both here; a later request asked for every
    // dispositor arrow to show in the default "Show all" view, exchange
    // pairs included, which removed this drop entirely — but that produced
    // three lines (two dispositor + one exchange) for what is genuinely one
    // relationship, which was then reported back as unwanted duplication.
    // Restored: an exchange pair renders as exactly the one bidirectional
    // "Exchange" line, full stop, in every view (default and click-filtered
    // alike, since connectionsForSign's own primary/occupant-secondary logic
    // reads from this same `edges` array). This does not affect any other
    // sign's dispositor edges — only the specific pair(s) already covered by
    // an exchange line lose their redundant plain-dispositor duplicates.
    var exchangePairs = {};
    edges.forEach(function (e) { if (e.type === 'exchange') exchangePairs[networkPairKey(e.from, e.to)] = true; });
    edges = edges.filter(function (e) { return e.type !== 'dispositor' || !exchangePairs[networkPairKey(e.from, e.to)]; });

    return edges;
  }

  function networkSignCenter(sIdx, cell) {
    var rc = SOUTH_LAYOUT[sIdx];
    return { x: rc[1] * cell + cell / 2, y: rc[0] * cell + cell / 2, row: rc[0], col: rc[1] };
  }

  function networkPairKey(a, b) { return [a, b].sort(function (x, y) { return x - y; }).join('|'); }

  // The South Indian layout is a ring of 12 signs around a blank 2x2 center.
  // A straight line between two signs sharing the top/bottom row or the
  // left/right column of that ring, but not next to each other, would cut
  // straight through a third sign sitting between them — bow those through
  // the blank center instead of through the intervening sign.
  function networkNeedsBow(a, b) {
    if (a.row === b.row && (a.row === 0 || a.row === 3) && Math.abs(a.col - b.col) >= 2) {
      return { axis: 'row', side: a.row === 0 ? 'down' : 'up' };
    }
    if (a.col === b.col && (a.col === 0 || a.col === 3) && Math.abs(a.row - b.row) >= 2) {
      return { axis: 'col', side: a.col === 0 ? 'right' : 'left' };
    }
    return null;
  }

  // Everything one *individual* selected sign contributes to the overlay —
  // both directions now, not just what converges into it. Inbound: its
  // primary influence (dispositor placement, or the shared Exchange edge
  // when that placement is a mutual exchange) and the aspect edges
  // converging on it. Outbound: dispositor edges for whatever its own
  // occupant(s) rule elsewhere, and the aspect edges its occupant(s) cast
  // onto other signs. Plus the sign's own ruler's secondary influence (the
  // dispositor's *other* ruled sign, see below). Factored out of
  // drawNetworkOverlay so multiple signs can each be selected independently
  // and have their contributions merged, rather than only ever describing
  // one active sign at a time.
  function connectionsForSign(sign, allEdges, result) {
    // Co-lord-aware: Virgo/Aquarius/Scorpio/Pisces each carry two lords
    // (their classical primary plus Rahu or Ketu). `lords` holds all of
    // them, primary first; `selLord`/`selLordSign` keep naming the primary
    // one so single-lord signs (the other eight) read exactly as before.
    var lords = E.SIGN_COLORDS[sign];
    var selLord = lords[0];
    var selLordSign = result.planets[selLord].signIndex;

    // Primary influence (INBOUND): each lord's placement, connected into the
    // selected sign. `computeNetworkEdges`'s own dispositor pass only builds
    // this for "occupied" signs (has a planet, or is the Lagna), since that
    // pass also has to power the unfiltered "Show all" view — but once a
    // sign is actually selected, the relationship holds regardless of
    // occupancy (an empty sign's dispositor still "influences" it just the
    // same). So it's recomputed directly here — same formula as
    // computeNetworkEdges's dispositor pass, just not gated on occupancy —
    // rather than reused from the filtered `allEdges`. If a lord's placement
    // and the selected sign turn out to be a mutual exchange (Parivartana)
    // pair, the one bidirectional "Exchange" edge `computeNetworkEdges`
    // already built for that pair is used as primary instead of a fresh
    // one-directional dispositor edge — an exchange *is* the primary
    // relationship there, not something layered on top of it. Aspect edges
    // into the selected sign are taken from `allEdges` as before; those
    // already work regardless of the selected sign's own occupancy, since
    // `computeNetworkEdges`'s own aspect pass now targets every one of the
    // 12 signs directly rather than only signs holding a planet or the Lagna.
    var primaryEdges = [];
    lords.forEach(function (lord) {
      var lordSign = result.planets[lord].signIndex;
      var pairKey = networkPairKey(sign, lordSign);
      var exchangeEdge = allEdges.filter(function (e) {
        return e.type === 'exchange' && networkPairKey(e.from, e.to) === pairKey;
      })[0] || null;
      if (exchangeEdge) primaryEdges.push(exchangeEdge);
      else if (lordSign !== sign) primaryEdges.push({ from: lordSign, to: sign, type: 'dispositor', planet: lord });
    });
    primaryEdges = dedupeEdges(primaryEdges);
    var nonDispositorIn = allEdges.filter(function (e) {
      return e.to === sign && e.type !== 'dispositor' && e.type !== 'exchange';
    });

    // Outbound: what the selected sign itself projects elsewhere. Every
    // planet actually STANDING in the selected sign may rule OTHER signs
    // entirely (unrelated to the selected sign's own lordship) and may cast
    // aspects onto other signs — this is the direct mirror of the inbound
    // primary/aspect edges above, just read from the "what does this sign's
    // occupant do" direction instead of "what rules this sign". A prior
    // version only showed this relationship as a reverse-pointing "secondary"
    // line (oos -> sign, i.e. "if you clicked oos, its dispositor arrow
    // would land here") — reported back as confusing next to a later request
    // to show what actually goes OUT of the clicked sign. Replaced with a
    // proper outbound dispositor edge (sign -> oos, the same forward
    // convention every inbound dispositor edge already uses), so the same
    // fact reads the same way regardless of which endpoint is selected.
    // Skips a target sign already tied to `sign` by an Exchange edge — that
    // relationship is already the one bidirectional Exchange line (and,
    // since Parivartana is symmetric, `primaryEdges` above is guaranteed to
    // have already found it via the partner lord), so drawing a second,
    // one-directional dispositor edge for the same pair would duplicate it.
    var outboundEdges = [];
    var seenOut = {};
    PLANET_ORDER.forEach(function (occ) {
      // An occupant who is ALSO one of `sign`'s own lords is necessarily an
      // own-sign lord (standing in the very sign it rules) — its "other
      // rulership" is already drawn by the lord-based secondary loop below
      // (lordSign === sign in that case, so the secondary edge already
      // lands here: e.g. Rahu owning and standing in Virgo, also ruling
      // Aquarius, already produces Aquarius→Virgo). Reprocessing it here
      // would draw the same fact a second time, forward instead of reverse.
      if (result.planets[occ].signIndex !== sign || lords.indexOf(occ) >= 0) return;
      for (var os = 0; os < 12; os++) {
        if (os === sign || E.SIGN_COLORDS[os].indexOf(occ) < 0) continue;
        var opk = networkPairKey(sign, os);
        var isExch = allEdges.some(function (e) { return e.type === 'exchange' && networkPairKey(e.from, e.to) === opk; });
        if (isExch) continue;
        var k = sign + '>' + os; // guards the rare case of two co-lords of `os` (e.g. Saturn+Rahu) both standing together in `sign`
        if (seenOut[k]) continue;
        seenOut[k] = true;
        outboundEdges.push({ from: sign, to: os, type: 'dispositor', planet: occ });
      }
    });
    var nonDispositorOut = allEdges.filter(function (e) {
      return e.from === sign && e.type !== 'dispositor' && e.type !== 'exchange';
    });

    // Secondary influence — additive to primary, not a replacement for it.
    // Most planets (every one but the Sun and Moon) rule *two* signs (Rahu
    // and Ketu rule two apiece too). Secondary influence is about the
    // *other* one: a sign the selected sign's lord also rules, carried
    // forward to that same lord's actual placement — e.g. selecting Virgo
    // (ruled by Mercury) shows the primary Taurus→Virgo line above, and
    // secondary influence adds Gemini→Taurus, since Mercury also rules
    // Gemini. Empty for the Sun/Moon's one-sign rulerships (nothing "other"
    // to draw from), and skipped when that other sign already IS the lord's
    // placement (own-sign — nothing secondary to show there either). This is
    // about the sign's OWN RULER's other rulership, a different relationship
    // from outboundEdges above (which is about the sign's OCCUPANT's other
    // rulership) — the two don't overlap, since the lord-secondary loop
    // never lets `os` equal `sign` itself. `secondaryNotes` keeps one entry
    // per lord that has any, so the status line can attribute each "also
    // rules..." clause to the right lord when a sign has two.
    //
    // Also skips a target pair already tied together by an Exchange edge —
    // outboundEdges just above already does this, but this loop never did,
    // a real gap only surfaced while verifying that consolidating "Show all"
    // from individual per-sign clicks (see drawNetworkOverlay) reproduced
    // the old chart-wide computation exactly: it didn't, by exactly one
    // edge, and this was it. Concretely, in Siva's chart: Venus rules both
    // Taurus and Libra and stands in Cancer, while Moon (standing in Libra)
    // rules Cancer — a genuine mutual exchange — so clicking Taurus alone
    // was drawing a redundant Libra→Cancer secondary line right alongside
    // the one bidirectional Exchange line that already represents that
    // exact relationship. This was a real, pre-existing duplicate-line bug
    // in the click-to-isolate path itself, not something this refactor
    // introduced — it just took a systematic cross-check to surface it.
    var secondaryEdges = [];
    var secondaryNotes = [];
    lords.forEach(function (lord) {
      var lordSign = result.planets[lord].signIndex;
      var others = [];
      for (var os2 = 0; os2 < 12; os2++) {
        if (os2 === sign || E.SIGN_COLORDS[os2].indexOf(lord) < 0 || os2 === lordSign) continue;
        var spk = networkPairKey(os2, lordSign);
        var isSecExch = allEdges.some(function (e) { return e.type === 'exchange' && networkPairKey(e.from, e.to) === spk; });
        if (isSecExch) continue;
        others.push(os2);
        secondaryEdges.push({ from: os2, to: lordSign, type: 'secondary', planet: lord });
      }
      if (others.length) secondaryNotes.push({ lord: lord, others: others, lordSign: lordSign });
    });
    // The same "also rules" line for a tenant that is not one of `sign`'s
    // lords (the Sun in Virgo, ruling Leo), so it reads like a lord standing
    // in its own sign (Mercury there, ruling Gemini). Its outbound dispositor
    // line already shows an In head when the ruled sign has tenants of its
    // own, so the light-blue line is only added when that sign is empty.
    PLANET_ORDER.forEach(function (occ) {
      if (result.planets[occ].signIndex !== sign || lords.indexOf(occ) >= 0) return;
      var others = [];
      for (var os3 = 0; os3 < 12; os3++) {
        if (os3 === sign || E.SIGN_COLORDS[os3].indexOf(occ) < 0 || signTenants(os3, result).length) continue;
        var tpk = networkPairKey(sign, os3);
        if (allEdges.some(function (e) { return e.type === 'exchange' && networkPairKey(e.from, e.to) === tpk; })) continue;
        others.push(os3);
        secondaryEdges.push({ from: os3, to: sign, type: 'secondary', planet: occ });
      }
      if (others.length) secondaryNotes.push({ lord: occ, others: others, lordSign: sign });
    });

    return {
      selLord: selLord, selLordSign: selLordSign, lords: lords,
      primaryEdges: primaryEdges, nonDispositorIn: nonDispositorIn,
      outboundEdges: outboundEdges, nonDispositorOut: nonDispositorOut,
      secondaryEdges: secondaryEdges, secondaryNotes: secondaryNotes
    };
  }

  // Drops duplicate edges by their exact (from, to, type) identity — not by
  // unordered sign-pair like networkPairKey, since direction and type both
  // matter for rendering. Needed once multiple signs can be selected at
  // once: two mutually-exchanged signs each independently selected would
  // otherwise both contribute the very same shared Exchange edge.
  function dedupeEdges(list) {
    var seen = {};
    return list.filter(function (e) {
      var k = e.from + '>' + e.to + '@' + e.type;
      if (seen[k]) return false;
      seen[k] = true;
      return true;
    });
  }

  // Split one sign's connections by the In / Out filters, with arrowheads.
  // A dispositor line (lord's sign → tenant's sign) carries influence both
  // ways on the same line: the lord's CONDITION down to the tenant (head at
  // the tenant's end, colored by the lord) and the tenants' CONTENT up to the
  // lord, which carries them as part of the house it rules (head at the
  // lord's end, colored by the tenants — only when that sign is occupied).
  // For a selected sign, In shows the heads pointing into it and Out the
  // heads pointing away; a line with no visible head isn't drawn. Aspects
  // keep their single head at the target; an exchange runs both ways, so it
  // shows under either filter. The light-blue "also rules" lines (a lord's
  // or a tenant's other signs) belong to the incoming story and show under In.
  function signTenants(sign, result) {
    return PLANET_ORDER.filter(function (n) { return result.planets[n].signIndex === sign; });
  }
  function networkDirEdges(info, sign, result) {
    var inEdges = [], outEdges = [], secondary = [];
    var cntIn = 0, cntOut = 0;
    function disp(e, headEnd, headStart) {
      var tenants = signTenants(e.to, result);
      var d = { from: e.from, to: e.to, type: e.type, planet: e.planet,
        _headEnd: headEnd, _headStart: headStart && tenants.length > 0, _tenants: tenants };
      return d;
    }
    // Lord → this sign (this sign is the tenant end).
    info.primaryEdges.forEach(function (e) {
      if (e.type === 'exchange') {
        if (networkShowIn || networkShowOut) { inEdges.push(e); cntIn++; cntOut++; }
        return;
      }
      var d = disp(e, networkShowIn, networkShowOut);   // In: condition arrives here; Out: this sign's tenants feed the lord
      if (d._headEnd) cntIn++;
      if (d._headStart) cntOut++;
      if (d._headEnd || d._headStart) inEdges.push(d);
    });
    // This sign's tenants rule other signs (this sign is the lord end).
    info.outboundEdges.forEach(function (e) {
      var d = disp(e, networkShowOut, networkShowIn);   // Out: condition leaves for the ruled sign; In: its tenants feed back here
      if (d._headEnd) cntOut++;
      if (d._headStart) cntIn++;
      if (d._headEnd || d._headStart) outEdges.push(d);
    });
    if (networkShowIn) {
      inEdges = inEdges.concat(info.nonDispositorIn);
      cntIn += info.nonDispositorIn.length;
      secondary = info.secondaryEdges;
    }
    if (networkShowOut) {
      outEdges = outEdges.concat(info.nonDispositorOut);
      cntOut += info.nonDispositorOut.length;
    }
    return { inEdges: inEdges, outEdges: outEdges, secondary: secondary, cntIn: cntIn, cntOut: cntOut };
  }
  // Merge duplicate edges (the same line reached from two selected signs),
  // keeping any arrowhead either one turned on.
  function mergeEdges(list) {
    var byKey = {}, out = [];
    list.forEach(function (e) {
      var k = e.from + '>' + e.to + '@' + e.type;
      var have = byKey[k];
      if (!have) { byKey[k] = e; out.push(e); return; }
      if (e._headEnd) have._headEnd = true;
      if (e._headStart) { have._headStart = true; have._tenants = e._tenants; }
    });
    return out;
  }

  function drawNetworkOverlay(svg, result, cell, cellRects, svgId, useNavamsa, sb) {
    // Every edge's endpoint sits on a fixed, invisible circle around its
    // sign's own center — NET_ANCHOR_R, half of the sign box's own radius
    // (the box spans cell/2 in each direction from center, so this circle
    // sits at cell/4) — rather than at a variable pullback distance along
    // the line. A fixed radius is what actually guarantees "never leaves
    // the sign's own box," for any number of edges converging on it: no
    // matter how a cluster gets spread out below, every point stays exactly
    // NET_ANCHOR_R from the center, which is well inside the box regardless
    // of cluster size. The two earlier attempts here both varied a
    // DISTANCE instead (a straight pullback, then a staggered pullback) and
    // both could grow unboundedly with cluster size — this can't, by
    // construction. Shared between fanOffsets (which computes each
    // clustered edge's own point ON this circle) and the render loop below
    // (which places start/end there).
    var NET_ANCHOR_R = cell / 4;
    var H = interpHelpers();
    var allEdges = computeNetworkEdges(result);
    var selectedList = networkSelectedList();

    // Each contributing sign's own primary/aspect/secondary edges,
    // independently (see connectionsForSign) — selecting a second sign is
    // additive, never a replacement for the first. When nothing is
    // explicitly selected ("Show all"), this now runs across all 12 signs
    // and merges the result, rather than a separately-computed chart-wide
    // dump that could (and did) show more than clicking every sign one at a
    // time and combining the results would — reported directly against
    // Siva's chart: Saturn's sign showed 5 converging arrows in "Show all"
    // but only 3 when clicked on its own, with the extra 2 being secondary
    // lines that actually belonged to two OTHER signs' own rulership
    // stories (Capricorn's and Aquarius's — both ruled by Saturn, which
    // happens to stand in Saturn's sign), not to the clicked sign itself.
    // Consolidating through the exact same per-sign function used for
    // multi-select removes that gap by construction — the "Show all" view
    // can never disagree with what clicking every sign and combining the
    // results would produce, because that's now literally what it is. Every
    // secondary (blue) line this produces still represents a genuine
    // classical relationship — some *other* sign's ruler also serving
    // elsewhere — so none of it is dropped; it just can no longer inflate a
    // single sign's own count beyond what that sign's own click shows.
    // `perSign` only needs the explicitly-selected signs' own breakdowns
    // (for the status line below), not all 12, even when this ran across
    // all 12 to build the edge set.
    var consolidated = !selectedList.length;
    var scanList = consolidated ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] : selectedList;
    var visibleEdges = [], secondaryEdges = [], perSign = {};
    scanList.forEach(function (sign) {
      var info = connectionsForSign(sign, allEdges, result);
      if (!consolidated) perSign[sign] = info;
      var dir = networkDirEdges(info, sign, result);
      if (!consolidated) { info.cntIn = dir.cntIn; info.cntOut = dir.cntOut; }
      visibleEdges = visibleEdges.concat(dir.inEdges, dir.outEdges);
      secondaryEdges = secondaryEdges.concat(dir.secondary);
    });
    visibleEdges = mergeEdges(visibleEdges);
    secondaryEdges = dedupeEdges(secondaryEdges);
    var renderEdges = visibleEdges.concat(secondaryEdges);

    // Spread edges that arrive at (or leave) the same sign from close to the
    // same angle — even from different origin signs, not just edges sharing
    // the exact same sign pair — around the fixed NET_ANCHOR_R circle,
    // rather than pushing any of them further from center. This grid lays
    // signs out in fixed rows/columns, so several different "from" signs can
    // sit exactly in line with one "to" sign and share the identical
    // approach angle (e.g. three signs in a row all pointing straight along
    // that row into a fourth); left alone, they'd all land on the exact same
    // point of the circle.
    //
    // Two earlier approaches both varied a DISTANCE — a straight pullback,
    // then a staggered pullback — and both eventually let an edge's endpoint
    // travel far enough to cross out of its own sign's box (reported
    // directly by a user: clicking Gemini in Siva's chart, Mars's "also
    // rules Aries" edge was landing inside Taurus's box). Rotating a
    // cluster member's ANGLE instead, while holding its radius fixed at
    // NET_ANCHOR_R, can't reproduce that failure — every point this produces
    // is, by construction, exactly NET_ANCHOR_R from its own sign's center,
    // regardless of how many edges are in the cluster or how far apart they
    // get spread.
    //
    // A sideways nudge was also tried and reverted for a *different* reason
    // than the box-overshoot above: it displaced a point by an unbounded
    // amount relative to its own line, and since "sideways" is relative to
    // each edge's own direction, a nudge sized for one cluster could
    // coincidentally walk an edge toward a completely unrelated edge
    // elsewhere on the chart — observed directly on Siva's chart, where
    // nudging a 2-edge Aries→Capricorn cluster pushed one of them to within
    // 5px of an unrelated Cancer→Capricorn aspect edge it was never trying
    // to avoid. The spread here can't do that either: every cluster's spread
    // is capped to fit inside the actual angular gap to its neighboring
    // clusters at the SAME sign (computed below, with margin), so it can
    // only ever separate this cluster's own members from each other, never
    // reach into a neighboring cluster's — let alone a different sign's —
    // territory.
    function fanOffsets(edges, sideKey, cell) {
      var otherKey = sideKey === 'to' ? 'from' : 'to';
      var CLUSTER_DEG = 16;
      var thresh = CLUSTER_DEG * Math.PI / 180;
      var LONE_CLUSTER_CAP_DEG = 30; // generous but not absurd when there's no neighbor to avoid
      var bySign = {};
      edges.forEach(function (e) {
        e['_ang' + sideKey] = 0;
        (bySign[e[sideKey]] = bySign[e[sideKey]] || []).push(e);
      });
      Object.keys(bySign).forEach(function (signKey) {
        var list = bySign[signKey];
        if (list.length < 2) return;
        var center = networkSignCenter(Number(signKey), cell);
        var withAngle = list.map(function (e) {
          var p = networkSignCenter(e[otherKey], cell);
          return { e: e, ang: Math.atan2(p.y - center.y, p.x - center.x) };
        });
        withAngle.sort(function (x, y) { return x.ang - y.ang; });
        var clusters = [[withAngle[0]]];
        for (var i = 1; i < withAngle.length; i++) {
          var gap = withAngle[i].ang - withAngle[i - 1].ang;
          if (gap < thresh) clusters[clusters.length - 1].push(withAngle[i]);
          else clusters.push([withAngle[i]]);
        }
        // The angle range wraps at ±π — merge the first and last clusters
        // if they're actually adjacent across that seam.
        if (clusters.length > 1) {
          var firstAng = clusters[0][0].ang;
          var lastCluster = clusters[clusters.length - 1];
          var lastAng = lastCluster[lastCluster.length - 1].ang;
          if ((firstAng + 2 * Math.PI) - lastAng < thresh) {
            clusters[0] = lastCluster.concat(clusters[0]);
            clusters.pop();
          }
        }
        // Target pixel gap we want between adjacent cluster members (and
        // between a cluster's outermost member and its neighbor) once
        // they're placed on the NET_ANCHOR_R circle. Convert that chord
        // length to the angle it needs at this radius (chord = 2*R*sin(a/2)) —
        // this one angle is used as BOTH the sibling step and the
        // neighbor-clearance margin, so a member is never closer to a
        // neighboring cluster than it is to its own siblings.
        var TARGET_PX = 6;
        var ratio = TARGET_PX / (2 * NET_ANCHOR_R);
        if (ratio > 1) ratio = 1;
        var minStepRad = 2 * Math.asin(ratio);
        clusters.forEach(function (cluster, ci) {
          if (cluster.length < 2) return;
          var n = cluster.length;
          var lo = cluster[0].ang, hi = cluster[cluster.length - 1].ang;
          var meanAng = (lo + hi) / 2;
          var totalSpan = minStepRad * (n - 1);

          var lowAllowed, highAllowed;
          if (clusters.length < 2) {
            var loneCapRad = LONE_CLUSTER_CAP_DEG * Math.PI / 180;
            lowAllowed = meanAng - loneCapRad;
            highAllowed = meanAng + loneCapRad;
          } else {
            // By construction, any two adjacent clusters (after the wrap
            // merge above) are already at least CLUSTER_DEG apart — that's
            // the very test used to split them. lowAllowed/highAllowed mark
            // how far this cluster could push in each direction while still
            // keeping minStepRad of clear air from its neighbor.
            var prev = clusters[(ci - 1 + clusters.length) % clusters.length];
            var next = clusters[(ci + 1) % clusters.length];
            var gapBefore = lo - prev[prev.length - 1].ang;
            if (gapBefore <= 0) gapBefore += 2 * Math.PI;
            var gapAfter = next[0].ang - hi;
            if (gapAfter <= 0) gapAfter += 2 * Math.PI;
            lowAllowed = lo - (gapBefore - minStepRad);
            highAllowed = hi + (gapAfter - minStepRad);
          }

          // Start from the cluster's natural, evenly-spaced window (full
          // sibling spacing, centered on its true mean angle), then SHIFT —
          // never stretch — it to fit inside the allowed window. Shifting
          // (rather than each side independently claiming only "its own"
          // half) is what lets a cluster with lots of room on one side and
          // almost none on the other still get full target spacing: it
          // simply slides toward the open side instead of shrinking.
          var desiredLow = meanAng - totalSpan / 2;
          var desiredHigh = meanAng + totalSpan / 2;
          if (desiredLow < lowAllowed) {
            var shiftUp = lowAllowed - desiredLow;
            desiredLow += shiftUp; desiredHigh += shiftUp;
          }
          if (desiredHigh > highAllowed) {
            var shiftDown = desiredHigh - highAllowed;
            desiredLow -= shiftDown; desiredHigh -= shiftDown;
          }
          // If the allowed window is itself narrower than full target
          // spacing needs (extreme crowding), fall back to filling exactly
          // that window — still bounded, just tighter than ideal.
          if (desiredLow < lowAllowed) desiredLow = lowAllowed;
          if (desiredHigh > highAllowed) desiredHigh = highAllowed;
          if (desiredHigh < desiredLow) desiredHigh = desiredLow;

          var step = n > 1 ? (desiredHigh - desiredLow) / (n - 1) : 0;
          cluster.forEach(function (item, i) {
            var targetAng = desiredLow + i * step;
            item.e['_ang' + sideKey] = targetAng - item.ang;
          });
        });
      });
    }
    fanOffsets(renderEdges, 'to', cell);
    fanOffsets(renderEdges, 'from', cell);

    var groups = {};
    renderEdges.forEach(function (e) {
      var k = networkPairKey(e.from, e.to);
      if (!groups[k]) groups[k] = [];
      groups[k].push(e);
    });

    var defs = svgEl('defs', {});
    defs.innerHTML =
      NET_NATURE_MARKER_IDS.map(function (m) {
        return '<marker id="' + m.id + '" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
          '<path d="M0,0 L10,5 L0,10 z" fill="' + m.color + '"/></marker>';
      }).join('');
    svg.appendChild(defs);

    var layer = svgEl('g', { id: 'networkLayer' });

    Object.keys(groups).forEach(function (k) {
      var list = groups[k];
      // Canonical perpendicular for this sign-*pair*, independent of any
      // individual edge's own from/to order. Two edges connecting the same
      // pair but running opposite ways — e.g. Jupiter's 5th-house aspect
      // Libra→Aquarius and Rahu's 9th-house aspect Aquarius→Libra, reported
      // directly against Siva's chart — each used to compute their OWN
      // perpendicular from their OWN direction, which is exactly the
      // negation of the other's (reversing from/to negates dx,dy, which
      // negates px,py in turn). That perpendicular was then multiplied by
      // this edge's offsetIdx (its plain position in the list, e.g. -0.5 vs
      // +0.5 for a pair of edges) to spread same-pair edges apart — but a
      // negated perpendicular paired with a plain list-position offset
      // cancels out exactly when direction flips, so instead of spreading
      // apart, the two edges' midpoints landed on the identical point and
      // the two curves drew on top of each other. Anchoring the
      // perpendicular to the pair's sorted sign order — computed once per
      // group, shared by every edge in it regardless of which way any
      // individual edge happens to run — removes the direction-dependence
      // that caused the cancellation; offsetIdx alone (always evenly spaced,
      // never itself sign-flipped by direction) is what actually spreads
      // them, exactly as it already correctly does for several same-
      // direction edges sharing a pair.
      var pairIdx = k.split('|').map(Number);
      var cA = networkSignCenter(pairIdx[0], cell), cB = networkSignCenter(pairIdx[1], cell);
      var cdx = cB.x - cA.x, cdy = cB.y - cA.y;
      var clen = Math.sqrt(cdx * cdx + cdy * cdy) || 1;
      var groupPx = -(cdy / clen), groupPy = cdx / clen;
      list.forEach(function (e, idx) {
        var a = networkSignCenter(e.from, cell), b = networkSignCenter(e.to, cell);
        var dx = b.x - a.x, dy = b.y - a.y;

        var count = list.length;
        var offsetIdx = idx - (count - 1) / 2; // this edge's position within its same-sign-pair group, centered on 0

        // Every edge starts and ends on its own sign's NET_ANCHOR_R circle —
        // never further out, regardless of how crowded that sign gets. A
        // lone edge (or one whose cluster-mates are already far enough away
        // in angle) sits exactly on its own natural line — angFrom/angTo
        // equal the plain direction toward/away from the other sign, since
        // fanOffsets leaves _angfrom/_angto at 0 for it. An edge sharing a
        // close approach angle with others gets a small rotation around
        // that same circle instead (see fanOffsets above), which is what
        // actually separates the arrowheads: two points at the same radius
        // but different angles are visibly apart, and neither can ever end
        // up outside the circle they're both pinned to.
        var baseAngleFrom = Math.atan2(dy, dx);
        var baseAngleTo = baseAngleFrom + Math.PI;
        var angFrom = baseAngleFrom + (e._angfrom || 0);
        var angTo = baseAngleTo + (e._angto || 0);
        var start = { x: a.x + NET_ANCHOR_R * Math.cos(angFrom), y: a.y + NET_ANCHOR_R * Math.sin(angFrom) };
        var end = { x: b.x + NET_ANCHOR_R * Math.cos(angTo), y: b.y + NET_ANCHOR_R * Math.sin(angTo) };

        var bow = networkNeedsBow(a, b);
        var midx, midy;
        if (bow) {
          var depth = 20 + idx * 16;
          if (bow.axis === 'row') {
            midx = (start.x + end.x) / 2;
            midy = bow.side === 'down' ? (cell * 1 + depth) : (cell * 3 - depth);
          } else {
            midy = (start.y + end.y) / 2;
            midx = bow.side === 'right' ? (cell * 1 + depth) : (cell * 3 - depth);
          }
        } else {
          var offStep = 10;
          midx = (start.x + end.x) / 2 + groupPx * offsetIdx * offStep;
          midy = (start.y + end.y) / 2 + groupPy * offsetIdx * offStep;
        }

        // The arrowhead at the "to" end reflects the nature of `e.planet` —
        // the planet actually driving this specific influence (the
        // dispositor lord, the aspect caster, the secondary ruler, or —
        // for an exchange — the half of the mutual relationship running
        // forward from "from" to "to"). Line color/style still conveys type
        // (see the .net-edge-<type> CSS rules); this is a second, independent
        // signal, not a restatement of the same one.
        var pathAttrs = {
          d: 'M ' + start.x + ' ' + start.y + ' Q ' + midx + ' ' + midy + ' ' + end.x + ' ' + end.y,
          class: 'net-edge net-edge-' + e.type,
          // Sign indices as plain data attributes — a second test hook
          // (alongside the <title> below) so a regression check can verify
          // an edge's rendered endpoint actually lands inside its `to`
          // sign's own box, and its start inside `from`'s, without having
          // to reparse the hover-title prose per edge type.
          'data-from': e.from, 'data-to': e.to
        };
        // An exchange is mutual — the same two signs are each other's
        // dispositor — so it gets an arrowhead at each end, one per
        // direction's own planet: marker-end (at "to") is e.planet's nature,
        // already set above; marker-start (at "from") is e.planetReverse's
        // nature — the *other* planet, whose dispositor relationship runs
        // the opposite way (each marker's own auto-start-reverse orientation
        // flips correctly for marker-start with no second marker definition
        // needed).
        if (e._headEnd !== false) {
          pathAttrs['marker-end'] = 'url(#' + netNatureMarkerId(netInfluenceTone(e.planet, result, sb, H)) + ')';
        }
        if (e.type === 'exchange') {
          pathAttrs['marker-start'] = 'url(#' + netNatureMarkerId(netInfluenceTone(e.planetReverse, result, sb, H)) + ')';
        } else if (e._headStart) {
          // Tenants' content flowing up to the lord: colored by the tenants
          // (gold when several tenants of different tone share the sign).
          var tones = e._tenants.map(function (t) { return netInfluenceTone(t, result, sb, H); });
          var tTone = tones.every(function (t) { return t === tones[0]; }) ? tones[0] : 'mixed';
          pathAttrs['marker-start'] = 'url(#' + netNatureMarkerId(tTone) + ')';
        }
        var edgePath = svgEl('path', pathAttrs);
        // A hover title naming the planet behind this specific arrow and its
        // nature — makes the new arrowhead coloring self-explanatory (why is
        // *this* one red?) rather than a colored line with no stated reason.
        var titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        titleEl.textContent = netEdgeTitle(e, sb, result, H) +
          (e._headStart ? ' ' + e._tenants.join(', ') + ' in ' + SIGNS[e.to] + ' feed' + (e._tenants.length === 1 ? 's' : '') +
            ' back into ' + e.planet + ', which carries ' + (e._tenants.length === 1 ? 'it' : 'them') + ' as lord of ' + SIGNS[e.to] + '.' : '');
        edgePath.appendChild(titleEl);
        layer.appendChild(edgePath);

        // Only label aspect edges (with their degree) and the exchange edge;
        // dispositor and secondary-influence edges are conveyed by line
        // style/color alone (see legend).
        if (e.type !== 'dispositor' && e.type !== 'secondary') {
          var t = 0.5;
          var lx = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * midx + t * t * end.x;
          var ly = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * midy + t * t * end.y;
          var label = e.label || 'Exchange';
          var tw = label.length * 3.9 + 4;
          layer.appendChild(svgEl('rect', { x: lx - tw / 2, y: ly - 5, width: tw, height: 8, class: 'net-label-bg', rx: 1.5 }));
          layer.appendChild(svgText(lx, ly + 2, label, 'net-label-text', 6.6));
        }
      });
    });

    svg.appendChild(layer);

    // Highlight every selected sign and dim signs uninvolved in the current
    // filter.
    var involved = {};
    if (selectedList.length) {
      selectedList.forEach(function (sign) { involved[sign] = true; });
      // Both ends of every edge get marked, not just `from` — an exchange
      // edge's stored direction is arbitrary (whichever sign its detecting
      // loop reached first in computeNetworkEdges) and isn't guaranteed to
      // put the selected sign on the `to` side, so relying on `from` alone
      // could leave the exchange partner incorrectly dimmed.
      visibleEdges.forEach(function (e) { involved[e.from] = true; involved[e.to] = true; });
      // Neither end of a secondary edge is necessarily a selected sign
      // itself (`from` is the dispositor's *other* owned sign, `to` is its
      // placement), so both need marking explicitly too.
      secondaryEdges.forEach(function (e) { involved[e.from] = true; involved[e.to] = true; });
    }
    Object.keys(cellRects).forEach(function (key) {
      var sIdx = Number(key);
      var rect = cellRects[sIdx];
      rect.classList.toggle('net-selected', !!networkSelectedSigns[sIdx]);
      rect.classList.toggle('net-dimmed', selectedList.length > 0 && !involved[sIdx]);
    });

    var statusEl = document.getElementById('networkStatus');
    if (statusEl) {
      statusEl.classList.remove('hidden');
      if (selectedList.length === 1) {
        // Now rendered as a list — one point per line — since this sits in
        // the narrow column beside the chart rather than as a paragraph
        // below it. First point is the connection count (in + out), then one
        // further point per secondary-influence note (there can be more
        // than one lord contributing a secondary line into the same sign).
        var sign = selectedList[0];
        var info = perSign[sign];
        var nIn = info.cntIn, nOut = info.cntOut;
        var signName = SIGNS[sign];
        var points = [];
        if (!networkShowIn && !networkShowOut) {
          points.push('Tick <strong>In</strong> or <strong>Out</strong> to show connections for <strong>' + signName + '</strong>.');
        } else if (networkShowIn && networkShowOut) {
          if (nIn || nOut) {
            points.push('Showing ' + nIn + ' connection' + (nIn === 1 ? '' : 's') + ' into, and ' + nOut +
              ' out of, <strong>' + signName + '</strong>.');
          } else {
            points.push('Nothing converges into or out of <strong>' + signName + '</strong>.');
          }
        } else if (networkShowIn) {
          points.push(nIn ? 'Showing ' + nIn + ' connection' + (nIn === 1 ? '' : 's') + ' into <strong>' + signName + '</strong>.'
            : 'Nothing comes into <strong>' + signName + '</strong>.');
        } else {
          points.push(nOut ? 'Showing ' + nOut + ' connection' + (nOut === 1 ? '' : 's') + ' out of <strong>' + signName + '</strong>.'
            : 'Nothing goes out of <strong>' + signName + '</strong>.');
        }
        if (networkShowIn) info.secondaryNotes.forEach(function (sn) {
          points.push('<span class="net-secondary-swatch">Light blue</span>: ' + sn.lord +
            ' also rules ' + sn.others.map(function (o) { return SIGNS[o]; }).join(', ') +
            ', placed in ' + SIGNS[sn.lordSign] + '.');
        });
        statusEl.innerHTML = '<ul class="net-notes-list">' +
          points.map(function (pt) { return '<li>' + pt + '</li>'; }).join('') +
          '</ul>' +
          '<a href="#" id="networkShowAll">Show all</a>';
      } else if (selectedList.length > 1) {
        // Multiple independently-selected signs: one list point per sign for
        // its own connection count (in + out), plus one further point per
        // secondary-influence note on that sign (prefixed with the sign name
        // so it's clear which sign each point belongs to once flattened
        // into a single list).
        var points2 = [];
        selectedList.forEach(function (sign) {
          var info2 = perSign[sign];
          var cntIn = info2.cntIn, cntOut = info2.cntOut;
          var cnt = [];
          if (networkShowIn) cnt.push(cntIn + ' in');
          if (networkShowOut) cnt.push(cntOut + ' out');
          points2.push('<strong>' + SIGNS[sign] + '</strong>: ' + (cnt.length ? cnt.join(', ') : 'tick In or Out') + '.');
          if (networkShowIn) info2.secondaryNotes.forEach(function (sn) {
            points2.push('<span class="net-secondary-swatch">Light blue</span> (' + SIGNS[sign] + '): ' +
              sn.lord + ' also rules ' + sn.others.map(function (o) { return SIGNS[o]; }).join(', ') +
              ', placed in ' + SIGNS[sn.lordSign] + '.');
          });
        });
        statusEl.innerHTML = '<ul class="net-notes-list">' +
          points2.map(function (pt) { return '<li>' + pt + '</li>'; }).join('') +
          '</ul>' +
          '<a href="#" id="networkShowAll">Show all</a>';
      } else {
        statusEl.innerHTML = 'Click a sign to isolate the connections converging into it, and going out ' +
          'of it — every dispositor, aspect, and exchange edge that touches it either way. ' +
          '<span class="net-secondary-swatch">Light blue</span> lines show secondary influence — ' +
          'every two-sign ruler’s other owned sign, connected to where that ruler itself stands. ' +
          (sb && sb.results
            ? 'Arrowheads are colored by the driving planet’s verdict on the Influence Engine tab — its ' +
              'Shadbala number crossed with the factors the number leaves out, with yogas counted only ' +
              'for the lords of the dasha period selected on the Dashas tab' +
              (bfDashaOpts().periodLabel ? ' (now ' + bfDashaOpts().periodLabel + ')' : '') + ': ' +
              '<span class="net-benefic-swatch">green</span> for Strong or supported, ' +
              '<span class="net-mixed-swatch">gold</span> for Adequate, Mixed or strong but afflicted, ' +
              '<span class="net-malefic-swatch">red</span> for Weak or Afflicted'
            : 'Arrowheads are colored by the driving planet’s overall influence tone — natural benefic/' +
              'malefic, widened by its own functional lordship (Trikona/Dusthana) and any co-tenant taint: ' +
              '<span class="net-benefic-swatch">green</span> leans benefic, ' +
              '<span class="net-malefic-swatch">red</span> leans malefic, ' +
              '<span class="net-mixed-swatch">gold</span> for a genuinely split read (e.g. a planet that is ' +
              'both a Trikona and a Dusthana lord at once)') +
          ' — independent of the line color, which still shows the relationship type.';
      }
      var showAllLink = document.getElementById('networkShowAll');
      if (showAllLink) {
        showAllLink.addEventListener('click', function (ev) {
          ev.preventDefault();
          networkSelectedSigns = {};
          renderSouthChart(svgId, result, useNavamsa, sb);
        });
      }
    }
  }

  // Ownership / dignity: Moolatrikona, own sign, exaltation, debilitation.
  // A planet can hold more than one at once (Mercury in Virgo is exalted, in its
  // own sign, and in Moolatrikona between 16° and 20°), so all that apply show.
  function dignityOf(name, p) {
    var S = window.Shadbala;
    // Rahu/Ketu now have real EXALT/MOOLATRIKONA/OWN_SIGNS entries (Taurus/
    // Scorpio exaltation, Gemini/Sagittarius Moolatrikona, Virgo+Aquarius /
    // Scorpio+Pisces co-ownership), so this guard only fires when Shadbala
    // itself hasn't loaded — not to exclude the nodes anymore.
    if (!S || !S.EXALT[name]) return [];
    var out = [];
    var exSign = Math.floor(S.EXALT[name] / 30);
    var debSign = (exSign + 6) % 12;
    if (p.signIndex === exSign) out.push({ k: 'ex', t: 'Ex', full: 'Exalted in ' + p.sign });
    if (p.signIndex === debSign) out.push({ k: 'deb', t: 'Deb', full: 'Debilitated in ' + p.sign });
    var mt = S.MOOLATRIKONA[name];
    if (mt && mt.sign === p.signIndex && p.degree >= mt.from && p.degree < mt.to) {
      out.push({ k: 'mt', t: 'MT', full: 'Moolatrikona (' + p.sign + ' ' + mt.from + '°–' + mt.to + '°)' });
    }
    if (S.OWN_SIGNS[name].indexOf(p.signIndex) >= 0) {
      out.push({ k: 'lord', t: 'Lord', full: 'Lord of ' + p.sign });
    }
    return out;
  }

  // Panchadha maitri tier of the planet toward its own dispositor, which is the
  // classical ladder that sits between "own sign" and exaltation:
  // Best Friend > Friend > Neutral > Enemy > Worst Enemy.
  var REL_TIER = {
    'Best Friend': { k: 'bf', t: 'Best Friend’s sign' },
    'Friend':      { k: 'f',  t: 'Friend’s sign' },
    'Neutral':     { k: 'n',  t: 'Neutral’s sign' },
    'Enemy':       { k: 'e',  t: 'Enemy’s sign' },
    'Worst Enemy': { k: 'we', t: 'Worst Enemy’s sign' }
  };

  // Panchadha-maitri tier of a planet toward its own dispositor — "own sign"
  // if it rules its own placement, else the compound (naisargika+tatkalika)
  // friend/enemy tier from result.relationships, or null if neither resolves
  // (no relationship data for this pair). Factored out of relDignityCell.
  function relDignityTier(name, p, result) {
    var lord = E.SIGN_LORDS[p.signIndex];
    if (lord === name) return { k: 'own', t: 'Own sign', lord: lord, rel: null };
    var rel = result.relationships[name] && result.relationships[name][lord];
    if (!rel) return null;
    var tier = REL_TIER[rel.panchadha];
    if (!tier) return null;
    return { k: tier.k, t: tier.t, lord: lord, rel: rel };
  }

  function relDignityCell(name, p, result) {
    var tier = relDignityTier(name, p, result);
    if (!tier) return td('—', 'dim');
    if (tier.k === 'own') {
      var own = td('Own sign', 'reldig reldig-self');
      own.title = name + ' rules ' + p.sign + ', so there is no separate dispositor to be judged against.';
      return own;
    }
    var cell = td('', 'reldig reldig-' + tier.k);
    var main = document.createElement('span');
    main.textContent = tier.t;
    var who = document.createElement('span');
    who.className = 'rd-lord';
    who.textContent = tier.lord;
    cell.appendChild(main); cell.appendChild(who);
    cell.title = name + ' sits in ' + p.sign + ', ruled by ' + tier.lord + '. Naisargika ' +
      tier.rel.natural.toLowerCase() + ' + tatkalika ' + tier.rel.temporary.toLowerCase() +
      ' = panchadha ' + tier.rel.panchadha + '.';
    return cell;
  }

  function renderPlanetTable(result, sb) {
    var tbody = document.querySelector('#planetTable tbody');
    tbody.innerHTML = '';
    PLANET_ORDER.forEach(function (name) {
      var p = result.planets[name];
      var tr = document.createElement('tr');

      // Planet (with a retrograde marker, since the Motion column was removed) —
      // an Exalted/Debilitated flag is now concatenated onto the name itself,
      // reusing dignityOf's 'ex'/'deb' entries (whole-sign, so this reads
      // correctly in Simulation mode too, unlike Moolatrikona which needs an
      // exact degree and stays out of this cell).
      var nameCell = td(PLANET_SYMBOL[name] + ' ' + name);
      if (p.retrograde) {
        var flag = document.createElement('span');
        flag.className = 'retro-flag';
        flag.textContent = 'R';
        flag.title = 'Retrograde';
        nameCell.appendChild(flag);
      }
      var dig = dignityOf(name, p);
      var exDeb = dig.filter(function (x) { return x.k === 'ex' || x.k === 'deb'; });
      exDeb.forEach(function (x) {
        var dflag = document.createElement('span');
        dflag.className = 'dg dg-' + x.k + ' name-dg-flag';
        dflag.textContent = x.t;
        dflag.title = x.full;
        nameCell.appendChild(dflag);
      });
      // Combustion and Vargottama — Influence Engine research items A1/A3,
      // riding on the name cell as flags rather than two more columns, the
      // same pattern already used for Retrograde and Exalted/Debilitated
      // just above (both binary per-planet facts, not worth a column each).
      var ieFlagTitles = [];
      if (p.combustion && p.combustion.combust) {
        var cFlag = document.createElement('span');
        cFlag.className = 'dg dg-deb name-dg-flag';
        cFlag.textContent = 'C';
        cFlag.title = 'Combust — ' + p.combustion.separation.toFixed(1) + '° from the Sun (orb ' + p.combustion.orb + '°)';
        nameCell.appendChild(cFlag);
        ieFlagTitles.push(cFlag.title);
      }
      if (p.vargottama) {
        var vFlag = document.createElement('span');
        vFlag.className = 'dg dg-ex name-dg-flag';
        vFlag.textContent = 'V';
        vFlag.title = 'Vargottama — same sign (' + p.sign + ') in both the D-1 and the D-9';
        nameCell.appendChild(vFlag);
        ieFlagTitles.push(vFlag.title);
      }
      var where = document.createElement('span');
      where.className = 'gr-where';
      where.textContent = '(' + p.sign + ', ' + p.house + ')';
      nameCell.appendChild(where);
      nameCell.title = name + ' at ' + p.degreeFormatted + ' ' + p.sign +
        ', house ' + p.house +
        (exDeb.length ? ' — ' + exDeb.map(function (x) { return x.full; }).join(', ') : '') +
        (ieFlagTitles.length ? ' — ' + ieFlagTitles.join('; ') : '') +
        ' — ' + p.nakshatra + ' pada ' + p.pada;
      tr.appendChild(nameCell);

      // Ownership — which sign(s), and the house they currently occupy in this
      // chart, this planet rules by classical (Parashari) sign lordship. This
      // is general lordship (Shadbala.OWN_SIGNS), not tied to where the planet
      // itself is standing right now — that placement is already shown in the
      // Planet cell above. Whole-sign, so this needs only the Ascendant's sign
      // and works in Simulation mode too.
      var S = window.Shadbala;
      var ascSignIdx = result.ascendant.signIndex;
      // Rahu/Ketu now carry real entries here too (co-lords of Virgo/Aquarius
      // and Scorpio/Pisces respectively), so the "no ownership" branch below
      // is effectively dead for the nodes — kept as a generic empty-state
      // fallback in case a future table entry is ever genuinely empty.
      var ownedSigns = (S && S.OWN_SIGNS[name]) || [];
      var oCell = td('', ownedSigns.length ? '' : 'dim');
      if (!ownedSigns.length) {
        oCell.textContent = '—';
        oCell.title = name + ' holds no sign ownership in Parashari.';
      } else {
        var ownParts = ownedSigns.map(function (sIdx) {
          var houseNum = ((sIdx - ascSignIdx + 12) % 12) + 1;
          return E.SIGNS[sIdx] + ' (' + houseNum + ')';
        });
        oCell.textContent = ownParts.join(', ');
        oCell.title = name + ' rules ' + ownParts.join(' and ') + '.';
      }
      tr.appendChild(oCell);

      // Dignity by relationship: how the planet regards the lord of the sign it
      // sits in (panchadha maitri). This is the tier that applies when there is
      // no ownership to claim, so it carries information on almost every row.
      // The nodes have no maitri entries, and a planet in its own sign has no
      // separate dispositor to be judged against.
      tr.appendChild(relDignityCell(name, p, result));

      // Sign, combined with its Duality (Yin/Yang), Modality, and Element —
      // what used to be four separate columns (Sign, Yin/Yang, Modality,
      // Element) now rides along as one: "Gemini (Yang, Mutable, Air)". The
      // former standalone Sign Lord column was dropped from this table
      // entirely (E.SIGN_LORDS is still used internally — e.g. relDignityCell
      // just above — just no longer shown as its own column here).
      var isYang = p.signIndex % 2 === 0;
      var mIdx = p.signIndex % 3;
      var eIdx = p.signIndex % 4;

      var signCell = document.createElement('td');
      signCell.className = 'sign-combo';
      var signName = document.createElement('span');
      signName.textContent = p.sign;
      signCell.appendChild(signName);
      signCell.appendChild(document.createTextNode(' ('));

      var yangSpan = document.createElement('span');
      yangSpan.className = isYang ? 'yang' : 'yin';
      yangSpan.textContent = isYang ? 'Yang' : 'Yin';
      yangSpan.title = p.sign + ' is the ' + (p.signIndex + 1) + suffix(p.signIndex + 1) +
        ' sign — ' + (isYang ? 'odd / masculine / active (Yang)' : 'even / feminine / receptive (Yin)');
      signCell.appendChild(yangSpan);
      signCell.appendChild(spanText(', ', 'sign-combo-sep'));

      var modSpan = document.createElement('span');
      modSpan.className = 'mod-' + MODALITY[mIdx].key;
      modSpan.textContent = MODALITY[mIdx].name;
      modSpan.title = p.sign + ' is a ' + MODALITY[mIdx].name.toLowerCase() + ' sign — ' +
        MODALITY[mIdx].skt + ' (' + MODALITY[mIdx].gloss + ')';
      signCell.appendChild(modSpan);
      signCell.appendChild(spanText(', ', 'sign-combo-sep'));

      var elemSpan = document.createElement('span');
      elemSpan.className = 'elem-' + ELEMENT[eIdx].key;
      elemSpan.textContent = ELEMENT[eIdx].name;
      elemSpan.title = p.sign + ' is a ' + ELEMENT[eIdx].name.toLowerCase() + ' sign — ' +
        ELEMENT[eIdx].skt + ' (' + ELEMENT[eIdx].gloss + ')';
      signCell.appendChild(elemSpan);

      signCell.appendChild(document.createTextNode(')'));
      signCell.title = p.sign + ' — ' + (isYang ? 'Yang' : 'Yin') + ', ' + MODALITY[mIdx].name +
        ', ' + ELEMENT[eIdx].name + ' (ruled by ' + E.SIGN_COLORDS[p.signIndex].join(' & ') + ')';
      tr.appendChild(signCell);

      // Avastha (Jagrat/Swapna/Sushupti + Baladi + Deeptadi) — one combo
      // cell showing all three (Av3, Av5, Av9), comma-separated, the same
      // "merge several facts into one cell" pattern the Sign column above
      // already uses. Av3 (Jagrat/Swapna/Sushupti) and Av9 (Deeptadi) only
      // need dignity + Panchadha Maitri (both available in Simulation mode
      // too, though Av9's malefic-conjunction/combustion checks need real
      // positions); Av5 (Baladi) needs an exact degree and so shows '—'
      // there, exactly like the Degrees/Declination columns further right
      // already do.
      var avCell = document.createElement('td');
      avCell.className = 'avastha-combo';
      if (window.Shadbala) {
        var jss = window.Shadbala.jagratAvastha(name, p.signIndex, p.degree, result.relationships);
        var av9 = window.Shadbala.deeptadiAvastha(name, p.signIndex, result.planets, result.relationships, sb && sb.context && sb.context.beneficMap);
        var jssSpan = document.createElement('span');
        jssSpan.className = 'av-jss av-jss-' + jss.toLowerCase();
        jssSpan.textContent = jss;
        avCell.appendChild(jssSpan);
        avCell.appendChild(spanText(', ', 'sign-combo-sep'));
        var isNode = (name === 'Rahu' || name === 'Ketu');
        if (p.baladiAvastha) {
          var baladiSpan = document.createElement('span');
          baladiSpan.className = 'av-baladi';
          baladiSpan.textContent = p.baladiAvastha;
          avCell.appendChild(baladiSpan);
        } else {
          avCell.appendChild(spanText('—', 'av-baladi'));
        }
        avCell.appendChild(spanText(', ', 'sign-combo-sep'));
        var av9Span = document.createElement('span');
        av9Span.className = 'av-deeptadi';
        av9Span.textContent = av9 || '—';
        avCell.appendChild(av9Span);
        // Av12 (Shayanadi) needs the moment of birth, so only with Shadbala.
        var av12 = sb && sb.context ? window.Shadbala.shayanadiAvastha(name, p.longitude, sb.context) : null;
        avCell.appendChild(spanText(', ', 'sign-combo-sep'));
        avCell.appendChild(spanText(av12 || '—', 'av-shayanadi'));
        avCell.title = name + ' — ' + jss + ' Avastha (own sign or exaltation, else the natural relationship to its dispositor). ' +
          'Baladi: ' + (p.baladiAvastha || 'needs an exact degree, unavailable in Simulation mode') +
          (p.baladiAvastha && p.degreeFormatted !== '—' ? ', ' + p.degreeFormatted + ' into ' + p.sign : '') +
          (isNode && p.baladiAvastha ? ' — applying Baladi to the lunar nodes is a modern extension, not universal classical practice.' : '.') +
          ' Deeptadi (by the compound relationship; debilitation is Khala): ' + (av9 || '—') + '.' +
          ' Shayanadi: ' + (av12 || 'needs the moment of birth') + '.';
      } else {
        avCell.textContent = '—';
        avCell.className += ' dim';
      }
      tr.appendChild(avCell);

      // Shadbala % (of the classical minimum) — only defined for the seven planets
      var sbCell;
      if (sb && sb.results[name]) {
        var r = sb.results[name];
        sbCell = td(Math.round(r.percent) + '%', r.meetsMinimum ? 'pct-strong' : 'pct-weak');
        sbCell.title = r.total.toFixed(2) + ' Virupas = ' + r.rupa.toFixed(2) + ' Rūpa, against the ' +
          r.required + ' Rūpa minimum (rank ' + r.rank + ' of 7)';
      } else {
        sbCell = td('—', 'dim');
        sbCell.title = 'Shadbala is defined only for the seven classical planets, not the lunar nodes.';
      }
      tr.appendChild(sbCell);

      // Degrees — the planet's precise position within its sign, already
      // computed for every real chart; Simulation mode leaves this as '—'
      // since only whole-sign placements are known there.
      var degCell = td(p.degreeFormatted || '—', p.degreeFormatted ? '' : 'dim');
      degCell.title = p.degreeFormatted
        ? name + ' stands at ' + p.degreeFormatted + ' of ' + p.sign
        : 'Exact degree is unknown in Simulation mode — only the sign is set.';
      tr.appendChild(degCell);

      // Declination — angular distance north/south of the celestial equator,
      // the same value used internally for Ayana Bala. Only computed for the
      // seven classical planets (Shadbala's GRAHAS); the nodes have none, and
      // nothing is available at all in Simulation mode (no ephemeris run).
      var declCell;
      var declVal = sb && sb.context && sb.context.declinations ? sb.context.declinations[name] : undefined;
      if (typeof declVal === 'number') {
        declCell = td(formatDeclination(declVal));
        declCell.title = name + ' declination: ' + declVal.toFixed(4) + '° ' +
          (declVal >= 0 ? '(north of the celestial equator)' : '(south of the celestial equator)') +
          ' — used in Ayana Bala.';
      } else {
        declCell = td('—', 'dim');
        declCell.title = (name === 'Rahu' || name === 'Ketu')
          ? 'Declination is not tracked for the lunar nodes.'
          : 'Declination is unavailable in Simulation mode — no ephemeris is run.';
      }
      tr.appendChild(declCell);

      // Conjunctions: every other planet sharing this row's sign, with the
      // pairwise relationship — natural (naisargika) and compound (panchadha) —
      // from THIS row's own point of view, i.e. relationships[name][other],
      // "how name regards other". Replaces the former "Planets Aspected"
      // column (user request). E.g. in Siva's chart Sun and Mars share a sign:
      // the Sun row shows Sun→Mars, the Mars row shows Mars→Sun — same pair,
      // opposite (and generally different) naisargika readings, exactly
      // mirroring the co-tenant columns already on the Houses tab (housePairs/
      // relLinesCell just below), just scoped to one planet's row instead of
      // every ordered pair in the house at once.
      var conjPairs = conjunctPairs(name, result);
      tr.appendChild(relLinesCell(conjPairs, 'natural'));
      tr.appendChild(relLinesCell(conjPairs, 'compound'));

      tbody.appendChild(tr);
    });
  }

  // Which planets aspect a given sign, and by which house-aspect
  function aspectsOntoSign(signIdx, result) {
    var out = [];
    PLANET_ORDER.forEach(function (name) {
      var from = result.planets[name].signIndex;
      var dist = ((signIdx - from + 12) % 12) + 1;
      if ((ASPECT_HOUSES[name] || [7]).indexOf(dist) >= 0) {
        out.push({ planet: name, aspect: dist, fromHouse: result.planets[name].house });
      }
    });
    out.sort(function (a, b) { return a.aspect - b.aspect; });
    return out;
  }

  var SHORT = { Sun:'Sun', Moon:'Moon', Mars:'Mars', Mercury:'Merc', Jupiter:'Jup',
                Venus:'Ven', Saturn:'Sat', Rahu:'Rahu', Ketu:'Ketu' };

  // Temporary (tatkalika) relationship: planets in the 2nd, 3rd, 4th, 10th, 11th
  // and 12th from each other are temporary friends; all other distances — which
  // includes the 1st, i.e. sharing a sign — are temporary enemies (BPHS).
  function temporaryRel(signA, signB) {
    var dist = ((signB - signA + 12) % 12) + 1;
    return [2, 3, 4, 10, 11, 12].indexOf(dist) >= 0 ? 'Friend' : 'Enemy';
  }

  function relClass(rel) {
    if (rel === 'Best Friend') return 'r-bf';
    if (rel === 'Friend') return 'r-friend';
    if (rel === 'Neutral') return 'r-neutral';
    if (rel === 'Enemy') return 'r-enemy';
    if (rel === 'Worst Enemy') return 'r-we';
    return 'r-none';
  }

  // Every ORDERED pair of planets sharing a house. The value is looked up from
  // the classical maitri table with the FIRST planet as the row and the SECOND
  // as the column — relationships[row][column] is "how row regards column".
  // Naisargika maitri is not symmetric, so A→B and B→A are separate lines.
  function housePairs(occupants, result) {
    // Rahu/Ketu now resolve through result.relationships (naturalRel treats
    // them as Saturn's/Mars's analogs — see calc-core.js), so co-tenant pairs
    // involving a node get a real value here too, same as any other pair.
    var rated = occupants;
    var pairs = [];
    for (var i = 0; i < rated.length; i++) {
      for (var j = 0; j < rated.length; j++) {
        if (i === j) continue;
        var a = rated[i], b = rated[j];   // a = row, b = column
        var natRec = result.relationships[a] && result.relationships[a][b];
        pairs.push({
          a: a, b: b,
          key: SHORT[a] + '→' + SHORT[b],
          natural: natRec ? natRec.natural : null,
          temporary: temporaryRel(result.planets[a].signIndex, result.planets[b].signIndex),
          // compound = panchadha maitri, naisargika folded together with tatkalika
          compound: natRec ? natRec.panchadha : null
        });
      }
    }
    return pairs;
  }

  // Every other planet sharing a given planet's sign (a conjunction), scoped
  // to that ONE planet's own point of view — unlike housePairs() above, which
  // returns every ordered pair among a house's occupants. Used by the Planets
  // tab: each row asks only "how does THIS planet regard its conjunct
  // partners", so name is always the row (a) and every conjunct planet is b.
  function conjunctPairs(name, result) {
    var signIdx = result.planets[name].signIndex;
    var others = PLANET_ORDER.filter(function (n) {
      return n !== name && result.planets[n].signIndex === signIdx;
    });
    var pairs = [];
    others.forEach(function (b) {
      var natRec = result.relationships[name] && result.relationships[name][b];
      pairs.push({
        a: name, b: b,
        key: SHORT[name] + '→' + SHORT[b],
        natural: natRec ? natRec.natural : null,
        temporary: temporaryRel(signIdx, result.planets[b].signIndex),
        compound: natRec ? natRec.panchadha : null
      });
    });
    return pairs;
  }

  function relLinesCell(pairs, kind) {
    var cell = document.createElement('td');
    cell.className = 'col-left rel-lines';
    if (!pairs.length) { cell.textContent = '—'; cell.classList.add('dim'); return cell; }
    pairs.forEach(function (p) {
      var line = document.createElement('div');
      if (kind === 'natural') {
        var k = document.createElement('span');
        k.className = 'pair-key';
        k.textContent = p.key + ': ';
        line.appendChild(k);
      }
      var v = document.createElement('span');
      var val = p[kind];
      v.className = relClass(val);
      v.textContent = val || '—';
      line.title = p.a + ' (row) regards ' + p.b + ' (column): ' +
        (val
          ? (kind === 'compound'
              ? 'naisargika ' + (p.natural || '?').toLowerCase() + ' + tatkalika ' +
                p.temporary.toLowerCase() + ' = panchadha ' + val
              : val)
          : 'not defined');
      line.appendChild(v);
      cell.appendChild(line);
    });
    return cell;
  }

  function renderHouseTable(result) {
    var tbody = document.querySelector('#houseTable tbody');
    tbody.innerHTML = '';
    var ascSign = result.ascendant.signIndex;

    for (var h = 1; h <= 12; h++) {
      var signIdx = (ascSign + (h - 1)) % 12;
      var tr = document.createElement('tr');
      if (h === 1) tr.classList.add('current-dasha'); // highlight the Lagna row

      // House number with the planets occupying it
      var occupants = PLANET_ORDER.filter(function (n) {
        return result.planets[n].signIndex === signIdx;
      });
      // Under whole-sign houses every occupant shares the house's sign, so the
      // sign is printed once at the end rather than repeated for each planet.
      var hCell = td('', 'col-left' + (occupants.length ? '' : ' dim'));
      var hNum = document.createElement('span');
      hNum.textContent = String(h) + ' (';
      hCell.appendChild(hNum);
      var body = document.createElement('span');
      body.textContent = occupants.length
        ? occupants.map(function (n) { return PLANET_SYMBOL[n] + ' ' + n; }).join(', ')
        : 'empty';
      if (!occupants.length) body.className = 'hs-empty';
      hCell.appendChild(body);
      var hSign = document.createElement('span');
      hSign.className = 'hs-sign';
      hSign.textContent = '· ' + E.SIGNS[signIdx];
      hCell.appendChild(hSign);
      hCell.appendChild(document.createTextNode(')'));
      hCell.title = 'House ' + h + ' — ' + E.SIGNS[signIdx] +
        (h === 1 ? ' (Lagna / Ascendant)' : '') +
        ', lord ' + E.SIGN_COLORDS[signIdx].join(' & ');
      tr.appendChild(hCell);

      // House class (Kendra/Trikona/Dusthana/Upachaya/Maraka) — Influence
      // Engine research §7.2: this app had no per-house classification column
      // anywhere before this. A house can carry more than one tag (the 1st is
      // both Kendra and Trikona), so all that apply show, styled the same as
      // the Dignity chips elsewhere rather than a new color scheme.
      var hcClasses = (window.Interpret && window.Interpret.houseClassesOf) ? window.Interpret.houseClassesOf(h) : [];
      var HC_LABEL = { kendra: 'Kendra', trikona: 'Trikona', dusthana: 'Dusthana', upachaya: 'Upachaya', 'maraka sthana': 'Maraka' };
      var HC_KEY = { kendra: 'lord', trikona: 'ex', dusthana: 'deb', upachaya: 'mt', 'maraka sthana': 'deb' };
      var hcCell = td('', 'col-left' + (hcClasses.length ? '' : ' dim'));
      if (hcClasses.length) {
        hcClasses.forEach(function (c) {
          var chip = document.createElement('span');
          chip.className = 'dg dg-' + HC_KEY[c];
          chip.textContent = HC_LABEL[c] || c;
          hcCell.appendChild(chip);
          hcCell.appendChild(document.createTextNode(' '));
        });
      } else {
        hcCell.textContent = '—';
      }
      hcCell.title = 'House ' + h + ' classification' + (hcClasses.length ? ': ' + hcClasses.map(function (c) { return HC_LABEL[c] || c; }).join(', ') : ' — none of the classical categories apply.');
      tr.appendChild(hcCell);

      // Karakas: this house's classical natural significators (naisargika
      // karaka), same KARAKA_OF_HOUSE table bhavaChain already reads for its
      // own rungs — reused here rather than duplicated, so the two never drift.
      var karakas = (window.Interpret && window.Interpret.KARAKA_OF_HOUSE && window.Interpret.KARAKA_OF_HOUSE[h]) || [];
      var kCell = td(
        karakas.length ? karakas.map(function (p) { return PLANET_SYMBOL[p] + ' ' + p; }).join(', ') : '—',
        'col-left' + (karakas.length ? '' : ' dim')
      );
      kCell.title = 'Karaka' + (karakas.length > 1 ? 's' : '') + ' (natural significator' +
        (karakas.length > 1 ? 's' : '') + ') of house ' + h;
      tr.appendChild(kCell);

      // Pairwise relationships among co-tenants, aligned line-for-line
      var pairs = housePairs(occupants, result);
      tr.appendChild(relLinesCell(pairs, 'natural'));
      tr.appendChild(relLinesCell(pairs, 'compound'));

      // Aspects received — each aspecting planet with the sign and house it sits
      // in, and the aspect number, which is what tells a 3rd aspect from a 7th.
      var asp = aspectsOntoSign(signIdx, result);
      var aCell = td('', 'col-left aspects' + (asp.length ? '' : ' dim'));
      if (asp.length) {
        asp.forEach(function (a) {
          var src = result.planets[a.planet];
          var wrap = document.createElement('span');
          wrap.className = 'asp-item';
          var head = document.createElement('span');
          head.textContent = PLANET_SYMBOL[a.planet] + ' ' + a.planet;
          var where = document.createElement('span');
          where.className = 'asp-where';
          where.textContent = '(' + src.sign + ', ' + src.house + ')';
          var no = document.createElement('span');
          no.className = 'asp-no';
          no.textContent = a.aspect + suffix(a.aspect);
          wrap.appendChild(head); wrap.appendChild(where); wrap.appendChild(no);
          aCell.appendChild(wrap);
        });
        aCell.title = asp.map(function (a) {
          return a.planet + ' in house ' + a.fromHouse + ' casts its ' +
            a.aspect + suffix(a.aspect) + ' aspect here';
        }).join('\n');
      } else {
        aCell.textContent = '—';
        aCell.title = 'No planet aspects this house.';
      }
      tr.appendChild(aCell);

      tbody.appendChild(tr);
    }
  }

  function renderNakshatraTable(result) {
    var tbody = document.querySelector('#nakshatraTable tbody');
    tbody.innerHTML = '';
    var rows = PLANET_ORDER.map(function (name) { return { name: name, p: result.planets[name] }; });
    rows.unshift({ name: 'Ascendant', p: result.ascendant });
    rows.forEach(function (r) {
      var tr = document.createElement('tr');
      tr.appendChild(td(r.name === 'Ascendant' ? r.name : PLANET_SYMBOL[r.name] + ' ' + r.name));
      var nakName = r.name === 'Ascendant' ? r.p.nakshatra.name : r.p.nakshatra;
      var pada = r.name === 'Ascendant' ? r.p.nakshatra.pada : r.p.pada;
      var lord = r.name === 'Ascendant' ? r.p.nakshatra.lord : r.p.nakshatraLord;
      tr.appendChild(td(nakName));
      tr.appendChild(td(String(pada)));
      tr.appendChild(td(lord));
      tbody.appendChild(tr);
    });
  }

  function relCode(rel) {
    if (rel === 'Self') return { c: '—', cls: 'rel-self' };
    if (rel === 'Best Friend') return { c: 'BF', cls: 'rel-bf' };
    if (rel === 'Friend') return { c: 'F', cls: 'rel-f' };
    if (rel === 'Neutral') return { c: 'N', cls: 'rel-n' };
    if (rel === 'Enemy') return { c: 'E', cls: 'rel-e' };
    if (rel === 'Worst Enemy') return { c: 'WE', cls: 'rel-we' };
    return { c: '-', cls: '' };
  }

  function renderRelationshipTables(result) {
    // Includes Rahu/Ketu (E.RELATIONSHIP_GRAHAS = the 7 classical grahas plus
    // the nodes) — naturalRel() in calc-core.js gives them real values by
    // treating Rahu as Saturn's analog and Ketu as Mars's.
    var grahas = E.RELATIONSHIP_GRAHAS;
    var headRow = document.querySelector('#panchadhaTable thead tr');
    headRow.innerHTML = '<th></th>';
    grahas.forEach(function (g) { headRow.appendChild(th(PLANET_SYMBOL[g] + ' ' + g.slice(0,4))); });
    var tbody = document.querySelector('#panchadhaTable tbody');
    tbody.innerHTML = '';
    grahas.forEach(function (a) {
      var tr = document.createElement('tr');
      tr.appendChild(td(PLANET_SYMBOL[a] + ' ' + a));
      grahas.forEach(function (b) {
        var r = result.relationships[a][b];
        var rc = relCode(r.panchadha);
        var cell = td(rc.c, 'rel-cell ' + rc.cls);
        cell.title = a + ' → ' + b + ': ' + r.panchadha + ' (Natural: ' + r.natural + ', Temporary: ' + r.temporary + ')';
        tr.appendChild(cell);
      });
      tbody.appendChild(tr);
    });

    var natBody = document.querySelector('#naturalTable tbody');
    natBody.innerHTML = '';
    grahas.forEach(function (a) {
      var tr = document.createElement('tr');
      tr.appendChild(td(PLANET_SYMBOL[a] + ' ' + a));
      var r = window.VedicEngine;
      var friends = [], neutrals = [], enemies = [];
      grahas.forEach(function (b) {
        if (a === b) return;
        var rel = result.relationships[a][b].natural;
        if (rel === 'Friend') friends.push(b);
        else if (rel === 'Neutral') neutrals.push(b);
        else enemies.push(b);
      });
      tr.appendChild(td(friends.join(', ') || '—'));
      tr.appendChild(td(neutrals.join(', ') || '—'));
      tr.appendChild(td(enemies.join(', ') || '—'));
      natBody.appendChild(tr);
    });
  }

  // Sign qualities. Modality cycles every 3 signs from Aries, element every 4.
  var MODALITY = [
    { key: 'cardinal', name: 'Cardinal', skt: 'Chara', gloss: 'movable, initiating' },
    { key: 'fixed',    name: 'Fixed',    skt: 'Sthira', gloss: 'fixed, sustaining' },
    { key: 'mutable',  name: 'Mutable',  skt: 'Dvisvabhava', gloss: 'dual, adapting' }
  ];
  var ELEMENT = [
    { key: 'fire',  name: 'Fire',  skt: 'Agni',    gloss: 'dharma, drive' },
    { key: 'earth', name: 'Earth', skt: 'Prithvi', gloss: 'artha, substance' },
    { key: 'air',   name: 'Air',   skt: 'Vayu',    gloss: 'kama, exchange' },
    { key: 'water', name: 'Water', skt: 'Jala',    gloss: 'moksha, feeling' }
  ];

  function suffix(n) {
    if (n % 100 >= 11 && n % 100 <= 13) return 'th';
    return ['th', 'st', 'nd', 'rd'][n % 10] || 'th';
  }

  function num(v, dp) { return (Math.round(v * Math.pow(10, dp === undefined ? 2 : dp) ) / Math.pow(10, dp === undefined ? 2 : dp)).toFixed(dp === undefined ? 2 : dp); }

  // Sorts a copy of sb.grahas by descending total on the given results-detail
  // object (sb.results[g].sthanaDetail / .kalaDetail for the breakdown tables) —
  // each table's "Total" column is independent, so each gets its own sort.
  // The main Shadbala table is listed by rank (ratio to requirement) instead.
  function grahasByTotal(sb, pick) {
    return sb.grahas.slice().sort(function (a, b) {
      return pick(sb.results[b]) - pick(sb.results[a]);
    });
  }

  function renderShadbala(sb) {
    var tbody = document.querySelector('#shadbalaTable tbody');
    tbody.innerHTML = '';
    sb.grahas.slice().sort(function (x, y) { return sb.results[x].rank - sb.results[y].rank; }).forEach(function (g) {
      var r = sb.results[g];
      var tr = document.createElement('tr');
      var nameCell = td(PLANET_SYMBOL[g] + ' ' + g);
      if (r.yuddha) {
        var yFlag = document.createElement('span');
        yFlag.className = 'dg ' + (r.yuddha.role === 'winner' ? 'yu-win' : 'yu-lose') + ' name-dg-flag';
        yFlag.textContent = r.yuddha.role === 'winner' ? 'Won war' : 'Lost war';
        yFlag.title = g + ' is within ' + r.yuddha.orb.toFixed(2) + '° of ' + r.yuddha.opponent +
          ' — Graha Yuddha (planetary war). By the convention used here (greater ecliptic ' +
          'latitude wins), ' + g + ' ' + (r.yuddha.role === 'winner' ? 'prevails over' : 'is defeated by') +
          ' ' + r.yuddha.opponent + '. This is a classical caveat layered on top of Shadbala, not a ' +
          'change to the Virupa totals themselves.';
        nameCell.appendChild(yFlag);
      }
      tr.appendChild(nameCell);
      tr.appendChild(td(num(r.total), 'total-cell'));

      var pctCell = td(Math.round(r.percent) + '%', 'pct-cell ' + (r.meetsMinimum ? 'pct-strong' : 'pct-weak'));
      var bar = document.createElement('span');
      bar.className = 'pct-bar';
      var fill = document.createElement('i');
      fill.className = r.meetsMinimum ? 'strong' : 'weak';
      fill.style.width = Math.max(2, Math.min(100, r.percent / 2)) + '%';
      bar.appendChild(fill);
      pctCell.appendChild(bar);
      pctCell.title = g + ': ' + num(r.rupa) + ' Rūpa vs ' + r.required + ' required (rank ' + r.rank + ' of 7)';
      tr.appendChild(pctCell);

      tr.appendChild(td(num(r.sthana)));
      tr.appendChild(td(num(r.dig)));
      tr.appendChild(td(num(r.kala)));
      tr.appendChild(td(num(r.chesta)));
      tr.appendChild(td(num(r.naisargika)));
      tr.appendChild(td(num(r.drik)));
      tr.appendChild(td(num(r.rupa)));
      tr.appendChild(td(r.meetsMinimum ? '✓' : '—', r.meetsMinimum ? 'min-yes' : 'min-no'));
      tbody.appendChild(tr);
    });

    var sBody = document.querySelector('#sthanaTable tbody');
    sBody.innerHTML = '';
    grahasByTotal(sb, function (r) { return r.sthanaDetail.total; }).forEach(function (g) {
      var d = sb.results[g].sthanaDetail;
      var tr = document.createElement('tr');
      tr.appendChild(td(PLANET_SYMBOL[g] + ' ' + g));
      tr.appendChild(td(num(d.total), 'total-cell'));
      tr.appendChild(td(num(d.uchcha)));
      tr.appendChild(td(num(d.saptavargaja)));
      tr.appendChild(td(num(d.ojhayugma)));
      tr.appendChild(td(num(d.kendradi)));
      tr.appendChild(td(num(d.drekkana)));
      sBody.appendChild(tr);
    });

    var kBody = document.querySelector('#kalaTable tbody');
    kBody.innerHTML = '';
    var kKeys = ['nathonnata','paksha','tribhaga','abda','masa','vara','hora','ayana'];
    grahasByTotal(sb, function (r) { return r.kalaDetail.total; }).forEach(function (g) {
      var d = sb.results[g].kalaDetail;
      var tr = document.createElement('tr');
      tr.appendChild(td(PLANET_SYMBOL[g] + ' ' + g));
      tr.appendChild(td(num(d.total), 'total-cell'));
      kKeys.forEach(function (k) {
        tr.appendChild(td(num(d[k]), d[k] === 0 ? 'dim' : ''));
      });
      kBody.appendChild(tr);
    });

    var ctx = sb.context;
    var ctxBox = document.getElementById('kalaContext');
    ctxBox.innerHTML = '';
    [['Year lord (Abda)', ctx.varshaLord], ['Month lord (Masa)', ctx.masaLord],
     ['Weekday lord (Vara)', ctx.varaLord], ['Hora lord', ctx.horaLord]].forEach(function (p) {
      var s = document.createElement('span');
      s.innerHTML = '<strong>' + p[0] + ':</strong> ' + (p[1] || '—');
      ctxBox.appendChild(s);
    });
  }

  // Bhava Bala (house strength) needs the real Shadbala results (for
  // Bhavadhipati) plus every classical planet's longitude (for Bhava
  // Drishti), so it is computed here from the two pieces already on hand
  // rather than inside window.Shadbala.compute() itself — same division of
  // labour as everything else that reads both result and sb together.
  function renderBhavaBala(result, sb) {
    var tbody = document.querySelector('#bhavaBalaTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    var longitudes = {};
    sb.grahas.forEach(function (g) { longitudes[g] = result.planets[g].longitude; });
    var bhava = window.Shadbala.bhavaBala({
      ascSign: result.ascendant.signIndex,
      results: sb.results,
      longitudes: longitudes,
      beneficMap: sb.context.beneficMap,
      ascLon: result.ascendant.longitude, mcLon: sb.context.midheaven, isDay: sb.context.isDay
    });
    var houses = [1,2,3,4,5,6,7,8,9,10,11,12].sort(function (a, b) {
      return bhava[b].total - bhava[a].total;
    });
    houses.forEach(function (house) {
      var b = bhava[house];
      var tr = document.createElement('tr');
      tr.appendChild(td('House ' + house));
      tr.appendChild(td(num(b.total), 'total-cell'));
      tr.appendChild(td(num(b.rupa)));
      tr.appendChild(td(E.SIGNS[b.sign]));
      tr.appendChild(td(b.lord));
      tr.appendChild(td(num(b.adhipati)));
      tr.appendChild(td(num(b.dig)));
      tr.appendChild(td(num(b.drishti)));
      tr.appendChild(td(num(b.occupation, 0)));
      tr.appendChild(td(num(b.dayNight, 0)));
      tbody.appendChild(tr);
    });
  }

  // Viparita Raja Yoga note (Strength tab) — Influence Engine research item
  // A4/§7.2. Uses interpHelpers() the same way the Planet/House Interpretation
  // tabs already do, so this is the one other caller of that same H bundle
  // rather than a second helper-construction path.
  function renderVRYNote(result) {
    var box = document.getElementById('vryPanel');
    if (!box || !window.Interpret) return;
    box.innerHTML = '';
    var hits = window.Interpret.viparitaRajaYogas(result, interpHelpers());
    if (!hits.length) {
      var empty = document.createElement('div');
      empty.className = 'vry-empty';
      empty.textContent = 'None of Harsha, Sarala or Vimala Yoga forms in this chart.';
      box.appendChild(empty);
      return;
    }
    hits.forEach(function (h) {
      var item = document.createElement('div');
      item.className = 'vry-item';
      var nameEl = document.createElement('span');
      nameEl.className = 'vry-name';
      nameEl.textContent = h.name;
      item.appendChild(nameEl);
      item.appendChild(document.createTextNode(h.reason));
      if (!h.isPrimaryLord) {
        var ext = document.createElement('span');
        ext.className = 'vry-extended';
        ext.textContent = '(via ' + h.lord + '’s co-lordship — this app’s own extended convention, not the classical single lord)';
        item.appendChild(ext);
      }
      box.appendChild(item);
    });
  }

  // Lightweight 2-tab switcher for the South Indian chart's own side panel —
  // deliberately NOT the big multi-tab system's initTabs()/.tabwrap (that's
  // built for many tabs with drag-reorder and localStorage-persisted order,
  // none of which a fixed 2-tab widget needs); this is just click-to-switch,
  // styled to match the same folder-tab look via its own scoped CSS classes
  // so it reads as the same visual language without being wired into the
  // big system's state.
  function initSideTabs() {
    var strip = document.getElementById('chartSideTabstrip');
    if (!strip) return;
    var tabs = Array.prototype.slice.call(strip.querySelectorAll('[role="tab"]'));
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          var panel = document.getElementById(t.getAttribute('aria-controls'));
          if (panel) panel.classList.toggle('hidden', !on);
        });
      });
    });
  }

  // The South Indian chart's "Influences" side tab: the Influence Engine tab's
  // own dropdown (same entries, same verdict labels) and, for the chosen entry,
  // only its narratives — the planet's and the house's — followed by that
  // entry's Interpretation notes box. Rebuilt by renderBalaFramework(), so it
  // follows the dasha period in view exactly as the main tab does.
  var side2LastKey = null;
  // Free-text notes for one entry, saved through the same per-person notes
  // store the custom notes tabs use (noteFor/setNote): keyed per entry
  // ("influences:planet:Sun", "influences:house:3"), debounced, and
  // in-memory only when localStorage isn't available.
  function bfInterpretationBox(entry) {
    var interpKey = 'influences:' + entry.kind + ':' + entry.key;
    var savedFor = 'Saved for ' + (notesProfileKey === 'default' ? 'charts with no name' : '“' + notesProfileName + '”');
    var wrap = document.createElement('div');
    wrap.className = 'ie-interp-wrap';
    wrap.appendChild(spanText('Interpretation', 'ie-interp-head'));
    var box = document.createElement('textarea');
    box.className = 'ie-interp-box';
    box.placeholder = 'Notes on ' + (entry.kind === 'planet' ? entry.key : 'House ' + entry.house) + '…';
    box.value = noteFor(interpKey);
    wrap.appendChild(box);
    var saved = spanText(savedFor, 'ie-interp-saved');
    wrap.appendChild(saved);
    var timer = null;
    box.addEventListener('input', function () {
      clearTimeout(timer);
      saved.textContent = 'Saving…';
      timer = setTimeout(function () {
        setNote(interpKey, box.value);
        saved.textContent = savedFor + (STORAGE.kind === 'memory' ? ' — this session only' : '');
      }, 400);
    });
    return wrap;
  }
  function renderChartSide2(entries) {
    var select = document.getElementById('chartSide2Select');
    var note = document.getElementById('chartSide2Note');
    var content = document.getElementById('chartSide2Content');
    if (!select || !content) return;
    select.innerHTML = '';
    content.innerHTML = '';
    var available = !!(entries && entries.length);
    if (note) note.classList.toggle('hidden', available);
    select.disabled = !available;
    if (!available) return;

    function show(entry) {
      content.innerHTML = '';
      content.appendChild(bfNarrativeColumns(entry.fw.blocks));
      content.appendChild(bfInterpretationBox(entry));
    }
    var selectedIdx = 0;
    entries.forEach(function (entry, i) {
      var opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = bfOptionLabel(entry);
      select.appendChild(opt);
      if (entry.kind + ':' + entry.key === side2LastKey) selectedIdx = i;
    });
    select.value = String(selectedIdx);
    select.onchange = function () {
      var entry = entries[Number(select.value)];
      side2LastKey = entry.kind + ':' + entry.key;
      show(entry);
    };
    show(entries[selectedIdx]);
  }

  // ---- Influence Engine tab: Bala framework ----
  // One dropdown entry per planet ("House 10 ↔ Sun", wherever it sits) plus
  // one per house nothing occupies — the same entry list as the chart's
  // Influences side tab. Selecting one renders Interpret.balaFramework()'s
  // blocks as grids: qualitative dimension, actual condition, calculation,
  // Virupas, with the Shadbala / Bhava Bala component in the right column.
  var bfLastKey = null;
  // The entries renderBalaFramework() last computed (null for a hand-placed
  // chart), kept so the Facts tab's picks quote the very same verdicts.
  var bfLastEntries = null;
  function bfNarrative(subject, match) {
    var found = null;
    (bfLastEntries || []).forEach(function (entry) {
      if (found || !match(entry)) return;
      found = entry.fw.blocks.filter(function (b) { return b.kind === 'narrative' && b.subject === subject; })[0] || null;
    });
    return found;
  }
  function bfPlanetNarrative(name) {
    return bfNarrative('planet', function (entry) { return entry.kind === 'planet' && entry.key === name; });
  }
  function bfHouseNarrative(house) {
    return bfNarrative('house', function (entry) { return entry.house === house; });
  }
  function bfTable(headers, rows, cellsOf) {
    var wrap = document.createElement('div');
    wrap.className = 'table-wrap';
    var table = document.createElement('table');
    table.className = 'bf-table';
    var colgroup = document.createElement('colgroup');
    headers.forEach(function (h) { var c = document.createElement('col'); c.style.width = h.width; colgroup.appendChild(c); });
    table.appendChild(colgroup);
    var thead = document.createElement('thead'), hr = document.createElement('tr');
    headers.forEach(function (h) { var cell = th(h.label); if (h.cls) cell.className = h.cls; hr.appendChild(cell); });
    thead.appendChild(hr);
    table.appendChild(thead);
    var tbody = document.createElement('tbody');
    rows.forEach(function (row) {
      var tr = document.createElement('tr');
      cellsOf(row).forEach(function (c) { tr.appendChild(td(c[0], c[1])); });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }
  var BF_BALA_HEADERS = [
    { label: 'Qualitative dimension', width: '19%' }, { label: 'Actual condition', width: '31%' },
    { label: 'Calculation', width: '27%' }, { label: 'Virupas', width: '8%', cls: 'bf-value' },
    { label: 'Component', width: '15%' }
  ];
  var BF_GAP_HEADERS = [
    { label: 'Qualitative dimension', width: '22%' }, { label: 'Actual condition', width: '50%' },
    { label: 'Why it is not scored', width: '28%' }
  ];
  var BF_DOT = { green: '🟢', amber: '🟡', red: '🔴' };
  function bfOptionLabel(entry) {
    var v = {};
    entry.fw.blocks.forEach(function (b) { if (b.kind === 'narrative') v[b.subject] = b.verdict; });
    var label = BF_DOT[v.house.color] + ' House ' + entry.house + ' · ' + v.house.word;
    if (entry.kind === 'planet') label += '  ↔  ' + BF_DOT[v.planet.color] + ' ' + entry.key + ' · ' + v.planet.word;
    else label += '  (empty)';
    return label;
  }
  // The narratives' Shadbala / Bhava Bala tree: the total on top, each
  // component expandable to its parts. Collapsed to the total by default; a
  // percentage only where a minimum (or, for a house, the benchmark) exists,
  // with a bar ticked at 100%.
  function bfShadbalaTree(tree) {
    var wrap = document.createElement('div');
    wrap.className = 'bf-sbtree';
    var tools = document.createElement('div');
    tools.className = 'bf-sbtree-tools';
    var rows = document.createElement('div');
    function setAll(node, open) {
      if (node.c && node.c.length) { node.open = open; node.c.forEach(function (ch) { setAll(ch, open); }); }
    }
    [['Expand all', true], ['Collapse all', false]].forEach(function (pair) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'bf-sbtree-link';
      b.textContent = pair[0];
      b.onclick = function () { setAll(tree, pair[1]); render(); };
      tools.appendChild(b);
    });
    wrap.appendChild(tools);
    var head = document.createElement('div');
    head.className = 'bf-sbtree-row bf-sbtree-head';
    ['Component', 'Virupas', 'Max', tree.pctLabel || '% of minimum'].forEach(function (t, i) {
      head.appendChild(spanText(t, i === 1 ? 'bf-sbtree-num' : i === 2 ? 'bf-sbtree-num bf-sbtree-max' : ''));
    });
    wrap.appendChild(head);
    wrap.appendChild(rows);
    function fmt(x) { return (x < 0 ? '−' : '') + Math.abs(x).toFixed(2); }
    function walk(node, depth) {
      var row = document.createElement('div');
      row.className = 'bf-sbtree-row' + (depth === 0 ? ' bf-sbtree-top' : '');
      var nameCell = document.createElement('div');
      nameCell.className = 'bf-sbtree-name';
      nameCell.style.paddingLeft = (depth * 16) + 'px';
      var kids = node.c && node.c.length;
      var tog = document.createElement(kids ? 'button' : 'span');
      tog.className = 'bf-sbtree-tog';
      if (kids) {
        tog.type = 'button';
        tog.textContent = node.open ? '▾' : '▸';
        tog.setAttribute('aria-label', (node.open ? 'Collapse ' : 'Expand ') + node.n);
        tog.onclick = function () { node.open = !node.open; render(); };
      }
      nameCell.appendChild(tog);
      nameCell.appendChild(spanText(node.n, depth < 2 ? 'bf-sbtree-strong' : ''));
      if (node.note) nameCell.appendChild(spanText(' · ' + node.note, 'bf-sbtree-muted'));
      row.appendChild(nameCell);
      row.appendChild(spanText(fmt(node.v), 'bf-sbtree-num'));
      row.appendChild(spanText(node.max ? String(node.max) : '—', 'bf-sbtree-num bf-sbtree-max bf-sbtree-muted'));
      var pct = document.createElement('div');
      pct.className = 'bf-sbtree-pct';
      if (node.min) {
        var p = Math.round(node.v / node.min * 100);
        pct.appendChild(spanText(p + '%', 'bf-sbtree-num'));
        var track = document.createElement('div');
        track.className = 'bf-sbtree-track';
        var fill = document.createElement('div');
        fill.className = 'bf-sbtree-fill ' + (p >= 100 ? 'bf-sbtree-ok' : 'bf-sbtree-low');
        fill.style.width = Math.max(0, Math.min(p, 200)) / 2 + '%';
        track.appendChild(fill);
        var tick = document.createElement('div');
        tick.className = 'bf-sbtree-tick';
        track.appendChild(tick);
        pct.appendChild(track);
      } else {
        pct.appendChild(spanText(tree.noMinLabel || 'no minimum', 'bf-sbtree-muted'));
      }
      row.appendChild(pct);
      rows.appendChild(row);
      if (kids && node.open) node.c.forEach(function (ch) { walk(ch, depth + 1); });
    }
    function render() { rows.innerHTML = ''; walk(tree, 0); }
    render();
    return wrap;
  }
  function bfBlockBox(block) {
    var box = document.createElement('div');
    box.className = 'bf-block';
    var head = document.createElement('h3');
    head.className = 'bf-block-head';
    head.textContent = block.heading;
    box.appendChild(head);
    if (block.summary) {
      var sum = document.createElement('p');
      sum.className = 'bf-summary';
      sum.textContent = block.summary;
      box.appendChild(sum);
    }
    if (block.kind === 'narrative') {
      box.className = 'bf-block bf-narrative bf-narrative-' + block.verdict.color + (block.subject ? ' bf-narrative-' + block.subject : '');
      head.appendChild(spanText(block.verdict.word, 'bf-badge bf-badge-' + block.verdict.color));
      block.verdict.basis.split(/(?<=\.)\s+(?=[A-Z])/).forEach(function (sentence, i) {
        var basis = document.createElement('p');
        basis.className = 'bf-basis';
        basis.textContent = sentence;
        box.appendChild(basis);
        // Ishta against Kashta sits right under the number, in the yogas' active
        // colour while the planet is a lord of the period in view.
        if (i === 0 && block.ishta) {
          var ik = document.createElement('p');
          ik.className = 'bf-basis bf-ishta' + (block.ishta.active ? ' bf-ishta-active' : '');
          ik.textContent = block.ishta.text;
          ik.title = block.ishta.title;
          box.appendChild(ik);
        }
        if (i === 0 && block.tree) box.appendChild(bfShadbalaTree(block.tree));
      });
      // Each group is a run of short lines — a list is never run together
      // with commas or semicolons, it gets one line per item.
      (block.groups || []).forEach(function (lines) {
        var grp = document.createElement('div');
        grp.className = 'bf-lines';
        lines.forEach(function (text) {
          var para = document.createElement('p');
          para.textContent = text;
          grp.appendChild(para);
        });
        box.appendChild(grp);
      });
      [['Helping, but not counted', block.help, 'bf-help'], ['Hurting, but not counted', block.hurt, 'bf-hurt']].forEach(function (pair) {
        if (!pair[1].length) return;
        var grp = document.createElement('div');
        grp.className = 'bf-lines ' + pair[2];
        grp.appendChild(spanText(pair[0], 'bf-narrative-label'));
        pair[1].forEach(function (f) {
          var item = document.createElement('p');
          item.className = 'bf-item';
          item.textContent = f.t.charAt(0).toUpperCase() + f.t.slice(1) + ' (' + f.w + 'pt)';
          grp.appendChild(item);
        });
        box.appendChild(grp);
      });
      if (block.period) {
        var period = document.createElement('p');
        period.className = 'bf-basis';
        period.textContent = block.period;
        box.insertBefore(period, box.querySelector('.bf-lines'));
      }
      if (block.closing) {
        var closing = document.createElement('p');
        closing.textContent = block.closing;
        box.appendChild(closing);
      }
    } else if (block.kind === 'bala') {
      block.groups.forEach(function (group) {
        var gh = document.createElement('h4');
        gh.className = 'bf-group-head';
        gh.textContent = group.title;
        box.appendChild(gh);
        box.appendChild(bfTable(BF_BALA_HEADERS, group.rows, function (r) {
          return [[r.dim, 'bf-dim'], [r.cond], [r.calc], [r.value, 'bf-value'], [r.comp, 'bf-comp']];
        }));
      });
    } else if (block.kind === 'gap') {
      box.appendChild(bfTable(BF_GAP_HEADERS, block.rows, function (r) {
        return [[r.dim, 'bf-dim'], [r.cond], [r.note, 'bf-note']];
      }));
    } else if (block.kind === 'carries') {
      // Inputs, filters and delivery, each a table with its own columns.
      box.className = 'bf-block bf-carries';
      block.groups.forEach(function (group) {
        var gh = document.createElement('h4');
        gh.className = 'bf-group-head';
        gh.textContent = group.title;
        box.appendChild(gh);
        box.appendChild(bfTable(group.headers, group.rows, function (row) {
          return row.map(function (c, i) { return [c, i === 0 ? 'bf-dim' : '']; });
        }));
      });
    }
    return box;
  }
  // The planet and house narratives side by side (they stack when the space
  // is too narrow for two columns, as in the chart's side panel).
  function bfNarrativeColumns(blocks) {
    var cols = document.createElement('div');
    cols.className = 'bf-narratives';
    blocks.forEach(function (block) { if (block.kind === 'narrative') cols.appendChild(bfBlockBox(block)); });
    return cols;
  }
  function renderBalaFrameworkEntry(entry, result, sb, content) {
    content.innerHTML = '';
    if (!entry.fw) return;
    content.appendChild(bfNarrativeColumns(entry.fw.blocks));
    entry.fw.blocks.forEach(function (block) { if (block.kind !== 'narrative') content.appendChild(bfBlockBox(block)); });
  }
  function renderBalaFramework(result, sb) {
    var select = document.getElementById('bfSelect');
    var content = document.getElementById('bfContent');
    var note = document.getElementById('bfNote');
    if (!select || !content || !window.Interpret) return;
    select.innerHTML = '';
    content.innerHTML = '';
    var available = !!(sb && sb.results);
    if (note) note.classList.toggle('hidden', available);
    select.disabled = !available;
    var periodEl = document.getElementById('bfPeriod');
    if (periodEl) periodEl.textContent = '';
    if (!available) { bfLastEntries = null; renderChartSide2(null); return; }
    var dashaOpts = bfDashaOpts();
    if (periodEl) {
      periodEl.textContent = dashaOpts.periodLabel
        ? 'Period in view: ' + dashaOpts.periodLabel + ' (' + fmtDate(lastDashaSelection.start) + ' – ' + fmtDate(lastDashaSelection.end) +
          '). Yogas are scored only for the lords of this period; pick another period on the Dashas tab and the verdicts here, and the network arrowheads, follow it.'
        : 'No dasha period is in view, so every yoga is scored as dormant.';
    }

    var occupied = {};
    var entries = PLANET_ORDER.map(function (name) {
      occupied[result.planets[name].house] = true;
      return { kind: 'planet', key: name, house: result.planets[name].house };
    });
    for (var house = 1; house <= 12; house++) {
      if (!occupied[house]) entries.push({ kind: 'house', key: String(house), house: house });
    }
    entries.sort(function (a, b) { return a.house - b.house; });

    var helpers = interpHelpers();
    var selectedIdx = 0;
    entries.forEach(function (entry, i) {
      entry.fw = window.Interpret.balaFramework(entry, result, sb, helpers, dashaOpts);
      var opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = bfOptionLabel(entry);
      select.appendChild(opt);
      if (entry.kind + ':' + entry.key === bfLastKey) selectedIdx = i;
    });
    select.value = String(selectedIdx);
    select.onchange = function () {
      var entry = entries[Number(select.value)];
      bfLastKey = entry.kind + ':' + entry.key;
      renderBalaFrameworkEntry(entry, result, sb, content);
    };
    bfLastEntries = entries;
    renderBalaFrameworkEntry(entries[selectedIdx], result, sb, content);
    renderChartSide2(entries);
  }

  // ---- Influence Engine tab ----
  // The chart-wide yoga / tripod / dispositor scan for the chart on screen,
  // kept so a dasha-period change can redraw the Facts picks without redoing it.
  var lastIE = null;
  function renderInfluenceEngineTab(result, sb) {
    if (!window.Interpret) return;
    renderBalaFramework(result, sb);
    var ie = window.Interpret.influenceEngineChart(result, sb, interpHelpers());
    lastIE = { result: result, ie: ie };
    renderIEYogas(ie);
    renderIEYogas(ie, 'ieYogasPanelSide'); // same data, into the South Indian chart's own "Yogas formed" side tab
    renderIETripod(ie);
    renderIEDispositorChains(ie);
    renderFactsPicks(ie, result, sb);
  }

  // Dispositor Chains (Influence Framework §5) — one row per graha, the walk
  // from its occupied sign's lord onward to either self-rule or a loop.
  // Rahu/Ketu are included as starting points only (see dispositorChain's own
  // doc comment — they can never appear mid-chain under classical SIGN_LORDS).
  function renderIEDispositorChains(ie) {
    var box = document.getElementById('ieDispositorPanel');
    if (!box) return;
    box.innerHTML = '';
    PLANET_ORDER.forEach(function (name) {
      var dc = ie.planets[name].dispositorChain;
      var row = document.createElement('div');
      row.className = 'ie-chain-row';
      row.appendChild(spanText(PLANET_SYMBOL[name] + ' ' + name, 'ie-chain-name'));
      var path = document.createElement('span');
      path.className = 'ie-chain-path';
      var parts = dc.chain.map(function (p) { return p; });
      if (dc.terminal === 'loop') {
        path.textContent = parts.join(' → ') + ' → ' + dc.loop[dc.loop.length - 1] + ' (loop)';
      } else if (dc.terminal === 'self-ruled') {
        path.textContent = parts.join(' → ') + (parts.length > 1 ? ' — self-ruled' : ' — already self-ruled');
      } else {
        path.textContent = parts.join(' → ') + ' (unresolved)';
      }
      row.appendChild(path);
      box.appendChild(row);
    });
  }


  function renderIEYogas(ie, boxId) {
    var box = document.getElementById(boxId || 'ieYogasPanel');
    if (!box) return;
    box.innerHTML = '';
    var groups = [
      // Dasha-independent: a whole-chart shape/count pattern, not reducible
      // to one or two specifically named planets (BPHS Ch. 37, Nabhasha
      // Yogas — "results...felt throughout, in all the Dasha periods").
      // All four groups — Ashraya, Dala, Akriti and Sankhya — are scanned
      // (see nabhashaYogas).
      { label: 'Nabhasha Yogas', dashaClass: 'independent', items: (ie.nabhasha || []).map(function (y) {
          return { title: y.group + ' — ' + y.name, text: y.reason,
            timingText: 'Dasha-independent — felt throughout life, in every period (BPHS Ch. 37).' };
        }) },
      // Hybrid: a permanent baseline trait from birth (still a single named
      // planet, so not independent by the same test), with its peak
      // material expression timed to that planet's own Dasha.
      { label: 'Pancha Mahapurusha Yoga', dashaClass: 'hybrid', items: (ie.mahapurusha || []).map(function (y) {
          return { title: y.planet + ' — ' + y.name, text: y.reason, timingText: y.timingText, planets: [y.planet] };
        }) },
      // Dasha-dependent: reduces to one or two specifically named planets,
      // so BPHS Ch. 43/44/46's "during their Dasha periods" default applies.
      { label: 'Neecha Bhanga Yoga — cancelled debilitation', dashaClass: 'dependent', items: (ie.neechaBhanga || []).map(function (y) {
          return { title: y.planet, text: y.reason, timingText: y.timingText, planets: [y.planet] };
        }) },
      { label: 'Gajakesari Yoga', dashaClass: 'dependent', items: (ie.gajakesari || []).map(function (y) {
          return { title: 'Moon + Jupiter', text: y.reason, timingText: y.timingText, planets: ['Moon', 'Jupiter'] };
        }) },
      { label: 'Conjunction yogas', dashaClass: 'dependent', items: (ie.conjunction || []).map(function (y) {
          return { title: y.planets.join(' + ') + ' — ' + y.name, text: y.reason, timingText: y.timingText, planets: y.planets };
        }) },
      { label: 'Parivartana (mutual exchange)', dashaClass: 'dependent', items: (ie.parivartana || []).map(function (y) {
          return { title: y.planets.join(' + ') + ' — ' + y.name, text: y.reason, timingText: y.timingText, planets: y.planets };
        }) },
      { label: 'Viparita Raja Yoga', dashaClass: 'dependent', items: ie.vry.map(function (y) {
          return { title: y.name, text: y.reason + (y.isPrimaryLord ? '' :
            ' (via ' + y.lord + '’s co-lordship — this app’s own extended convention, not the classical single lord)'), timingText: y.timingText, planets: [y.lord] };
        }) },
      { label: 'Raja Yoga — kendra/trikona association', dashaClass: 'dependent', items: ie.raja.map(function (y) {
          return { title: y.planets.join(' + '), text: y.reason, timingText: y.timingText, planets: y.planets };
        }) },
      { label: 'Dhana Yoga — wealth-house association', dashaClass: 'dependent', items: ie.dhana.map(function (y) {
          return { title: y.planets.join(' + '), text: y.reason, timingText: y.timingText, planets: y.planets };
        }) }
    ];

    // A dasha-dependent or hybrid yoga is active while any planet forming it is
    // an MD, AD or PD lord of the period in view (the Dashas tab's selection),
    // and its whole row is then shown in the active colour. Dasha-independent
    // yogas hold in every period, so they are left as they are.
    var dashaOpts = bfDashaOpts();
    var activeRole = {};
    dashaOpts.activeLords.forEach(function (l) { activeRole[l.lord] = activeRole[l.lord] ? activeRole[l.lord] + '/' + l.role : l.role; });
    function activeLordsOf(it) {
      return (it.planets || []).filter(function (p) { return activeRole[p]; })
        .map(function (p) { return p + ' ' + activeRole[p]; });
    }
    if (dashaOpts.periodLabel) {
      var legend = spanText('', 'ie-yoga-category-note');
      legend.appendChild(spanText('Green', 'ie-yoga-active-swatch'));
      legend.appendChild(document.createTextNode(' marks a yoga that is active in the period in view (' + dashaOpts.periodLabel +
        '): one of the planets forming it is a lord of that period. Pick another period on the Dashas tab to see it change.'));
      box.appendChild(legend);
    }

    function renderGroup(g) {
      var h = document.createElement('div');
      h.className = 'ie-yoga-group';
      h.textContent = g.label;
      box.appendChild(h);
      g.items.forEach(function (it) {
        var row = document.createElement('div');
        row.className = 'ie-yoga-item';
        var lords = g.dashaClass === 'independent' ? [] : activeLordsOf(it);
        if (lords.length) {
          row.className += ' ie-yoga-active';
          row.title = 'Active in the period in view: ' + lords.join(', ');
        }
        var t = document.createElement('span');
        t.className = 'ie-yoga-title';
        t.textContent = it.title;
        row.appendChild(t);
        row.appendChild(document.createTextNode(it.text));
        if (it.timingText) row.appendChild(spanText(it.timingText, 'ie-yoga-timing'));
        box.appendChild(row);
      });
    }

    var categories = [
      { key: 'independent', title: 'Dasha-Independent — always active, no trigger needed',
        emptyNote: 'No dasha-independent yogas detected.' },
      { key: 'hybrid', title: 'Hybrid — permanent baseline trait, with a Dasha-timed peak' },
      { key: 'dependent', title: 'Dasha-Dependent — read in the Dasha/Antardasha of the planets that form it' }
    ];
    var any = false;
    categories.forEach(function (cat) {
      var catGroups = groups.filter(function (g) { return g.dashaClass === cat.key; });
      var catHasItems = catGroups.some(function (g) { return g.items.length; });
      if (!catHasItems && !cat.emptyNote) return;
      var catHead = document.createElement('div');
      catHead.className = 'ie-yoga-category';
      catHead.textContent = cat.title;
      box.appendChild(catHead);
      if (catHasItems) {
        any = true;
        catGroups.forEach(function (g) { if (g.items.length) renderGroup(g); });
      } else if (cat.emptyNote) {
        box.appendChild(spanText(cat.emptyNote, 'ie-yoga-category-note'));
      }
    });
    if (!any) box.appendChild(spanText('No dasha-dependent yogas detected in this chart either.', 'vry-empty'));
  }

  // Shared by the Influence Engine's Tripod panel and the Facts tab's copy.
  function tripodHitClass(hit) {
    return hit.stabilizing ? 'ie-good' : 'ie-bad';
  }
  function tripodHitText(hit) {
    return hit.via;
  }

  function renderIETripod(ie) {
    var box = document.getElementById('ieTripodPanel');
    if (!box) return;
    box.innerHTML = '';
    [['Body', 'Ascendant'], ['Soul', 'Sun'], ['Mind', 'Moon']].forEach(function (pair) {
      var key = pair[0];
      var col = document.createElement('div');
      col.className = 'ie-tripod-col';
      var h = document.createElement('div');
      h.className = 'ie-tripod-head';
      h.textContent = key + ' (' + pair[1] + ')';
      col.appendChild(h);
      var hits = ie.tripod[key];
      if (!hits.length) {
        col.appendChild(spanText('No aspects or conjunctions land here.', 'ie-tripod-empty'));
      } else {
        hits.forEach(function (hit) {
          col.appendChild(spanText(tripodHitText(hit), 'ie-tripod-hit ' + tripodHitClass(hit)));
        });
      }
      box.appendChild(col);
    });
  }



  function fmtDate(d) {
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function fmtDuration(ms) {
    var days = ms / 86400000;
    var y = Math.floor(days / 365.25);
    var rem = days - y * 365.25;
    var mo = Math.floor(rem / 30.4375);
    var d = Math.round(rem - mo * 30.4375);
    var parts = [];
    if (y) parts.push(y + (y === 1 ? ' yr' : ' yrs'));
    if (mo) parts.push(mo + ' mo');
    if (!y && d) parts.push(d + ' d');
    return parts.join(' ') || '< 1 d';
  }

  // ---- Which houses a dasha lord activates (Parashari) ----
  // A lord signifies: the house(s) whose signs it OWNS, the house it OCCUPIES,
  // and the houses it ASPECTS. Rahu now co-owns Aquarius & Virgo and Ketu
  // co-owns Pisces & Scorpio (SIGN_COLORDS), so housesOwnedBy already returns
  // real entries for them — on top of which they still act through the other
  // co-lord/dispositor and any planet conjoined with them, for whichever sign
  // they're actually placed in.
  function housesOwnedBy(planet, ascSign) {
    var out = [];
    for (var s = 0; s < 12; s++) {
      if (E.SIGN_COLORDS[s].indexOf(planet) >= 0) {
        out.push({ house: ((s - ascSign + 12) % 12) + 1, sign: E.SIGNS[s] });
      }
    }
    return out;
  }

  function nodeAgentsOf(node, result) {
    var signIdx = result.planets[node].signIndex;
    var agents = [], seen = {};
    // Co-lord-aware: a two-lord sign (Virgo/Aquarius/Scorpio/Pisces) gives the
    // node an agent per co-lord — excluding the node itself, for the case
    // where it's placed in a sign it co-owns (own-sign placement, nothing to
    // carry forward through "itself").
    E.SIGN_COLORDS[signIdx].forEach(function (disp) {
      if (disp === node || seen[disp]) return;
      agents.push({ planet: disp, why: 'dispositor, lord of ' + E.SIGNS[signIdx], kind: 'dispositor' });
      seen[disp] = true;
    });
    PLANET_ORDER.forEach(function (q) {
      if (q === node || q === 'Rahu' || q === 'Ketu' || seen[q]) return;
      if (result.planets[q].signIndex === signIdx) {
        agents.push({ planet: q, why: 'conjoined in ' + E.SIGNS[signIdx], kind: 'conjoined' });
        seen[q] = true;
      }
    });
    return agents;
  }

  // returns { houseNumber: [ {role, roleShort, text} ] }
  function activationsFor(lord, role, result) {
    var ascSign = result.ascendant.signIndex;
    var p = result.planets[lord];
    var acc = {};
    function add(house, text) {
      (acc[house] = acc[house] || []).push({ role: role, text: text });
    }

    housesOwnedBy(lord, ascSign).forEach(function (o) {
      add(o.house, lord + ' owns it (lord of ' + o.sign + ')');
    });

    add(p.house, lord + ' occupies it');

    (ASPECT_HOUSES[lord] || [7]).forEach(function (n) {
      var h = ((p.house - 1 + (n - 1)) % 12) + 1;
      add(h, lord + '’s ' + n + suffix(n) + ' aspect falls here');
    });

    if (lord === 'Rahu' || lord === 'Ketu') {
      nodeAgentsOf(lord, result).forEach(function (ag) {
        var agOwnedHouses = {};
        housesOwnedBy(ag.planet, ascSign).forEach(function (o) {
          agOwnedHouses[o.house] = true;
          add(o.house, lord + ' acts through ' + ag.planet + ' (' + ag.why +
            '), which owns ' + o.sign);
        });
        // A dispositor has no house of its own to signify beyond what it
        // owns/occupies/aspects — but classically, a node with no house
        // of its own also borrows the significations of the sign its
        // dispositor is PLACED in (not just what that dispositor owns).
        // A conjoined agent's placement is trivially the node's own
        // occupied sign, already credited above, so this only applies
        // to dispositor-kind agents. Skip when the dispositor's placement
        // is in a sign it also owns (own-sign placement) — that house was
        // already credited via the "owns" bullet just above, and a second
        // near-identical bullet for the same house would be redundant.
        if (ag.kind === 'dispositor') {
          var agP = result.planets[ag.planet];
          if (!agOwnedHouses[agP.house]) {
            add(agP.house, lord + ' acts through ' + ag.planet + ' (' + ag.why +
              '), which is placed in ' + agP.sign);
          }
        }
      });
    }

    // Parivartana (mutual exchange): if the dasha lord sits in a sign whose
    // ruler, in turn, sits in a sign the dasha lord itself rules, the two
    // are locked together — classically the dasha "intensely activates" the
    // exchange partner's houses too, not just what the lord itself owns,
    // occupies and aspects. Same detection this app already uses for the
    // Compounded-narrative Parivartana yoga (IP.planetYogas) and the South
    // Indian chart's network overlay (computeNetworkEdges) — kept
    // independent here rather than calling either, since this only needs
    // the yes/no exchange fact, not their narrative text or sign-pair edges.
    // Co-lord-aware: checks every co-lord of the placement sign, not just
    // the primary one — Rahu/Ketu now co-own Virgo/Aquarius/Scorpio/Pisces
    // (SIGN_COLORDS), so a dasha lord placed there can be in Parivartana
    // with a node, and a node dasha placed in a sign it co-owns can be in
    // Parivartana with that sign's other co-lord too.
    E.SIGN_COLORDS[p.signIndex].forEach(function (exLord) {
      if (exLord === lord) return;
      var exLordSign = result.planets[exLord].signIndex;
      if (exLordSign === p.signIndex) return;
      if (E.SIGN_COLORDS[exLordSign].indexOf(lord) < 0) return;
      housesOwnedBy(exLord, ascSign).forEach(function (o) {
        add(o.house, lord + ' is in Parivartana (mutual exchange) with ' + exLord + ', which owns ' + o.sign);
      });
    });

    return acc;
  }

  var ROLE_ORDER = ['MD', 'AD', 'PD'];
  var ROLE_NAME = { MD: 'Mahadasha', AD: 'Antardasha', PD: 'Pratyantardasha' };

  // lords: [{lord, role}] for however many levels are selected (1, 2 or 3).
  // A planet holding more than one level (e.g. Jupiter as both MD and AD) is
  // collapsed so its reasons are listed once, tagged with every role it holds.
  function buildActivation(result, lords) {
    var byPlanet = {};
    lords.forEach(function (l) {
      (byPlanet[l.lord] = byPlanet[l.lord] || []).push(l.role);
    });

    var acc = {}, rolesAt = {};
    Object.keys(byPlanet).forEach(function (planet) {
      var roles = byPlanet[planet];
      var tag = roles.join('+');
      var found = activationsFor(planet, tag, result);
      Object.keys(found).forEach(function (h) {
        found[h].forEach(function (x) { (acc[h] = acc[h] || []).push(x); });
        rolesAt[h] = rolesAt[h] || {};
        roles.forEach(function (r) { rolesAt[h][r] = true; });
      });
    });

    var ascSign = result.ascendant.signIndex;
    var rows = [];
    for (var h = 1; h <= 12; h++) {
      if (!acc[h] || !acc[h].length) continue;
      var roles = ROLE_ORDER.filter(function (r) { return rolesAt[h][r]; });
      var signIdx = (ascSign + (h - 1)) % 12;
      rows.push({
        house: h,
        sign: E.SIGNS[signIdx],
        occupants: PLANET_ORDER.filter(function (n) { return result.planets[n].signIndex === signIdx; }),
        roles: roles,
        tier: roles.length,
        reasons: acc[h]
      });
    }
    // houses claimed by the most levels first
    rows.sort(function (a, b) { return b.tier - a.tier || a.house - b.house; });
    return rows;
  }

  function renderActivation(result, lords) {
    var tbody = document.querySelector('#activationTable tbody');
    var note = document.getElementById('activationNote');
    tbody.innerHTML = '';

    var levelCount = lords.length;
    var rows = buildActivation(result, lords);
    rows.forEach(function (r) {
      var tr = document.createElement('tr');
      if (r.tier >= 3) tr.classList.add('row-t3');
      else if (r.tier === 2) tr.classList.add('row-t2');
      tr.appendChild(td(String(r.house)));
      tr.appendChild(td(r.sign));
      tr.appendChild(td(r.occupants.length
        ? r.occupants.map(function (n) { return PLANET_SYMBOL[n] + ' ' + n; }).join(', ')
        : '—', r.occupants.length ? '' : 'dim'));

      var cell = td(r.roles.join(' + '), 'tier-' + Math.min(3, r.tier));
      cell.title = r.roles.map(function (x) { return ROLE_NAME[x]; }).join(' + ') +
        (r.tier === levelCount && levelCount > 1 ? ' — claimed by every selected level' : '');
      tr.appendChild(cell);

      var rc = document.createElement('td');
      rc.className = 'col-left reasons';
      r.reasons.forEach(function (x) {
        var line = document.createElement('div');
        var tag = document.createElement('span');
        var lead = String(x.role).split('+')[0];
        tag.className = lead === 'PD' ? 'r-pd' : (lead === 'AD' ? 'r-ad' : 'r-md');
        tag.textContent = x.role + ' · ';
        var body = document.createElement('span');
        body.className = 'r-detail';
        body.textContent = x.text;
        line.appendChild(tag); line.appendChild(body);
        rc.appendChild(line);
      });
      tr.appendChild(rc);
      tbody.appendChild(tr);
    });

    var byTier = {};
    rows.forEach(function (r) { byTier[r.tier] = (byTier[r.tier] || 0) + 1; });
    var breakdown;
    if (levelCount === 1) {
      breakdown = 'all by ' + lords[0].lord + ' as Mahadasha lord';
    } else {
      var parts = [];
      for (var t = levelCount; t >= 1; t--) {
        if (!byTier[t]) continue;
        parts.push((t === levelCount ? '<strong>' + byTier[t] + '</strong>' : String(byTier[t])) +
          ' by ' + (t === 1 ? 'one level only' : t + ' of the ' + levelCount + ' levels'));
      }
      breakdown = parts.join(', ');
    }
    note.innerHTML = rows.length + ' of 12 houses activated \u2014 ' + breakdown +
      '. Parashari signification is used: a lord activates the house(s) it <em>owns</em>, ' +
      'the house it <em>occupies</em>, and the houses it <em>aspects</em>. Rahu co-owns Aquarius ' +
      'and Virgo, and Ketu co-owns Scorpio and Pisces, alongside that sign\u2019s classical lord; ' +
      'beyond those, the nodes still act through their dispositor(s) (both what the dispositor ' +
      'owns and the house it is itself placed in) and any conjoined planet, and ' +
      'a lord in <em>Parivartana</em> (mutual exchange) also activates its exchange partner\u2019s ' +
      'houses. Houses claimed by the most levels are listed first and are the ones tradition treats ' +
      'as most likely to manifest.';
  }

  function fmtDays(ms) {
    return Math.max(0, Math.round(ms / 86400000)).toLocaleString('en-IN');
  }

  // Timing stats for one selected dasha period (start..end against "now") —
  // factored out of showDetail's own daysVal/daysSub/pct block so the South
  // Indian chart's Dasha-activation overlay can show the exact same figures
  // in the chart's center as the Dasha tab shows in its stat chips, without
  // a second computation drifting from the first.
  function dashaTimingStats(start, end) {
    var t = new Date();
    var total = end - start;
    var isNow = t >= start && t < end;
    var future = t < start;
    var daysVal, daysSub, pct;
    if (isNow) {
      daysVal = fmtDays(end - t) + ' days';
      daysSub = fmtDuration(end - t) + ' left';
      pct = Math.min(100, Math.max(0, Math.round(((t - start) / total) * 100)));
    } else if (future) {
      daysVal = '—';
      daysSub = 'begins in ' + fmtDuration(start - t);
      pct = 0;
    } else {
      daysVal = '0 days';
      daysSub = 'completed ' + fmtDuration(t - end) + ' ago';
      pct = 100;
    }
    return { isNow: isNow, future: future, pct: pct, daysVal: daysVal, daysSub: daysSub };
  }

  // Mahadasha -> Antardasha -> Pratyantardasha as an expandable tree.
  function renderDashaPicker(result, sb) {
    var tree = document.getElementById('dashaTree');
    var stats = document.getElementById('dashaStats');
    var current = document.getElementById('dashaCurrent');
    var list = result.antardashas || [];
    tree.innerHTML = ''; stats.innerHTML = ''; current.innerHTML = '';
    if (!list.length) return;

    var now = new Date();
    var birth = list[0].start;

    // group the flat antardasha list under its mahadasha
    var groups = [];
    list.forEach(function (d) {
      var g = groups[groups.length - 1];
      if (!g || g.maha !== d.maha) {
        var clamped = d.mahaStart < birth;
        g = {
          maha: d.maha, clamped: clamped,
          start: clamped ? birth : d.mahaStart, end: d.mahaEnd, antars: []
        };
        groups.push(g);
      }
      g.antars.push(d);
    });

    function live(s, e) { return now >= s && now < e; }

    var selectedRow = null;

    function select(row, lords, start, end) {
      if (selectedRow) selectedRow.classList.remove('sel');
      selectedRow = row;
      row.classList.add('sel');
      showDetail({ lords: lords, start: start, end: end });
    }

    // one tree row plus its (lazily built) children
    function makeNode(level, opts) {
      var wrap = document.createElement('div');
      wrap.className = 'dt-node lvl-' + level;

      var row = document.createElement('div');
      row.className = 'dt-row';
      row.setAttribute('role', 'treeitem');

      var caret = document.createElement('button');
      caret.type = 'button';
      caret.className = 'dt-caret' + (opts.buildChildren ? '' : ' leaf');
      caret.textContent = opts.buildChildren ? '▸' : '';
      caret.setAttribute('aria-label', 'Expand');

      // Depth tag, then the full lord chain down to this level: an Antardasha
      // row reads "Jupiter - Mercury", a Pratyantardasha "Jupiter - Mercury - Moon".
      var deepest = opts.lords[opts.lords.length - 1].role;
      var lvlTag = document.createElement('span');
      lvlTag.className = 'dt-lvl dt-lvl-' + deepest.toLowerCase();
      lvlTag.textContent = deepest;
      lvlTag.title = ROLE_NAME[deepest] + ' level';

      var title = document.createElement('span');
      title.className = 'dt-title';
      title.textContent = opts.lords.map(function (l) {
        return PLANET_SYMBOL[l.lord] + ' ' + l.lord;
      }).join('  -  ') + (opts.suffix || '');
      title.title = opts.lords.map(function (l) {
        return l.lord + ' (' + ROLE_NAME[l.role] + ')';
      }).join(' › ');

      var dates = document.createElement('span');
      dates.className = 'dt-dates';
      dates.textContent = fmtDate(opts.start) + ' – ' + fmtDate(opts.end);

      var dur = document.createElement('span');
      dur.className = 'dt-dur';
      dur.textContent = fmtDuration(opts.end - opts.start);

      row.appendChild(caret);
      row.appendChild(lvlTag);
      row.appendChild(title);
      if (live(opts.start, opts.end)) {
        var badge = document.createElement('span');
        badge.className = 'dt-now';
        badge.textContent = 'now';
        row.appendChild(badge);
      }
      row.appendChild(dates);
      row.appendChild(dur);

      var kids = document.createElement('div');
      kids.className = 'dt-children hidden';
      var built = false;

      function expand(on) {
        if (!opts.buildChildren) return;
        if (on && !built) { opts.buildChildren(kids, wrap); built = true; }
        kids.classList.toggle('hidden', !on);
        caret.textContent = on ? '▾' : '▸';
      }

      caret.addEventListener('click', function (ev) {
        ev.stopPropagation();
        expand(kids.classList.contains('hidden'));
      });
      row.addEventListener('click', function () {
        select(row, opts.lords, opts.start, opts.end);
        if (opts.buildChildren) expand(true);
      });

      wrap.appendChild(row);
      wrap.appendChild(kids);
      wrap.__expand = expand;
      wrap.__row = row;
      wrap.__kids = [];
      return wrap;
    }

    groups.forEach(function (g) {
      var mdNode = makeNode('md', {
        suffix: g.clamped ? '   (balance at birth)' : '',
        start: g.start, end: g.end,
        lords: [{ lord: g.maha, role: 'MD' }],
        buildChildren: function (box, parent) {
          g.antars.forEach(function (a) {
            var adNode = makeNode('ad', {
              start: a.start, end: a.end,
              lords: [{ lord: g.maha, role: 'MD' }, { lord: a.antar, role: 'AD' }],
              buildChildren: function (pbox, pparent) {
                var prats = E.pratyantardashas(a, birth);
                pparent.__prats = prats;
                prats.forEach(function (pd) {
                  var pdNode = makeNode('pd', {
                    start: pd.start, end: pd.end,
                    lords: [{ lord: g.maha, role: 'MD' },
                            { lord: a.antar, role: 'AD' },
                            { lord: pd.prat, role: 'PD' }]
                  });
                  pparent.__kids.push(pdNode);
                  pbox.appendChild(pdNode);
                });
              }
            });
            parent.__kids.push(adNode);
            box.appendChild(adNode);
          });
        }
      });
      tree.appendChild(mdNode);
      g.__node = mdNode;
    });

    function showDetail(sel) {
      stats.innerHTML = '';
      // Read the clock each time so a page left open still reports accurately.
      var t = new Date();
      var total = sel.end - sel.start;
      var isNow = t >= sel.start && t < sel.end;
      var future = t < sel.start;

      // Depth is shown as MD, MD - AD or MD - AD - PD, matching the selected level
      var levelCode = sel.lords.map(function (l) { return l.role; }).join(' - ');
      var levelFull = sel.lords.map(function (l) { return ROLE_NAME[l.role]; }).join(' › ');
      var chain = sel.lords.map(function (l) { return l.lord; }).join('  -  ');

      current.innerHTML = '';
      var ct = document.createElement('div');
      ct.className = 'dc-title';
      ct.textContent = chain;
      ct.title = sel.lords.map(function (l) {
        return l.lord + ' (' + ROLE_NAME[l.role] + ')';
      }).join(' › ');

      var cs = document.createElement('div');
      cs.className = 'dc-sub';
      var lvl = document.createElement('button');
      lvl.type = 'button';
      lvl.className = 'dc-level';
      lvl.id = 'dashaLevelToggle';
      lvl.setAttribute('aria-controls', 'dashaTree');
      var treeEl = document.getElementById('dashaTree');
      var treeShown = !treeEl || !treeEl.classList.contains('hidden');
      lvl.setAttribute('aria-expanded', treeShown ? 'true' : 'false');
      var lvlText = document.createElement('span');
      lvlText.textContent = levelCode;
      var lvlCaret = document.createElement('span');
      lvlCaret.className = 'dc-level-caret';
      lvlCaret.setAttribute('aria-hidden', 'true');
      lvlCaret.innerHTML = '&#9662;';
      lvl.appendChild(lvlText);
      lvl.appendChild(lvlCaret);
      lvl.title = levelFull + ' — click to show or hide the period tree';
      lvl.addEventListener('click', function () {
        var show = lvl.getAttribute('aria-expanded') !== 'true';
        applyTreeVisible(show);
        prefSet(TREE_KEY, show ? 'show' : 'hide');
      });
      cs.appendChild(lvl);
      cs.appendChild(document.createTextNode('  ·  ' + fmtDate(sel.start) + ' – ' +
        fmtDate(sel.end) + '  ·  ' + fmtDuration(total)));
      current.appendChild(ct); current.appendChild(cs);

      var head = document.getElementById('activationHead');
      if (head) {
        head.innerHTML = 'Houses Activated in This Period ' +
          '<span class="head-level">— ' + levelCode + '</span>';
      }

      // Both figures describe the SELECTED period, never the current one.
      var timing = dashaTimingStats(sel.start, sel.end);
      var daysVal = timing.daysVal, daysSub = timing.daysSub, pct = timing.pct;

      [['Days Left', daysVal, daysSub], ['% Complete', pct + '%', fmtDuration(total) + ' in total']]
        .forEach(function (it) {
          var chip = document.createElement('div');
          chip.className = 'stat-chip' + (isNow ? ' is-now' : '');
          var k = document.createElement('div'); k.className = 'k'; k.textContent = it[0];
          var v = document.createElement('div'); v.className = 'v'; v.textContent = it[1];
          var s = document.createElement('div'); s.className = 's'; s.textContent = it[2];
          chip.appendChild(k); chip.appendChild(v); chip.appendChild(s);
          stats.appendChild(chip);
        });

      renderActivation(result, sel.lords);

      // Keep the South Indian chart's Dasha-activation overlay (if enabled)
      // in sync with whatever's selected here. Uses this closure's own
      // result/sb — not the module-level lastResult/lastSb — because this
      // also fires from the tree's own initial auto-selection during
      // renderDashaPicker(result, sb), which runs before generateChart()
      // updates lastResult/lastSb to the chart just generated; reading the
      // module vars here could momentarily redraw the *previous* chart's
      // South Indian grid under the *new* chart's dasha data.
      lastDashaSelection = { lords: sel.lords, start: sel.start, end: sel.end };
      if (dashaActivationEnabled || networkEnabled) renderSouthChart('southChartD1', result, false, sb);
      // Yogas score only for the lords of the period in view, so the Influence
      // Engine tab's verdicts are recomputed for it too.
      renderBalaFramework(result, sb);
      if (lastIE && lastIE.result === result) {
        renderFactsPicks(lastIE.ie, result, sb);
        renderIEYogas(lastIE.ie);
        renderIEYogas(lastIE.ie, 'ieYogasPanelSide');
      }
    }

    // Open on the deepest period running today
    var gi = -1;
    for (var i = 0; i < groups.length; i++) if (live(groups[i].start, groups[i].end)) { gi = i; break; }
    if (gi < 0) {
      groups[0].__node.__row.click();
      return;
    }
    var mdNode = groups[gi].__node;
    mdNode.__expand(true);
    var ai = -1;
    for (var j = 0; j < groups[gi].antars.length; j++) {
      if (live(groups[gi].antars[j].start, groups[gi].antars[j].end)) { ai = j; break; }
    }
    if (ai < 0) { mdNode.__row.click(); return; }
    var adNode = mdNode.__kids[ai];
    adNode.__expand(true);
    var prats = adNode.__prats || [];
    var pi = -1;
    for (var k = 0; k < prats.length; k++) if (live(prats[k].start, prats[k].end)) { pi = k; break; }
    var target = pi >= 0 ? adNode.__kids[pi] : adNode;
    target.__row.click();
    scrollTreeToSelection();
  }

  // Centre the selected row in the dasha tree's scroll box. offsetTop and
  // clientHeight both read 0 while the panel is hidden, so this is a no-op then
  // and is re-run when the Dashas tab is first shown.
  function scrollTreeToSelection() {
    var tree = document.getElementById('dashaTree');
    if (!tree || !tree.offsetParent) return false;
    var row = tree.querySelector('.dt-row.sel');
    if (!row) return false;
    tree.scrollTop = Math.max(0, row.offsetTop - tree.clientHeight / 2);
    return true;
  }

  // ---- show/hide the period tree ----
  // The selected period, its stats and the activation table all stay visible
  // when the tree is collapsed — only the browsing window goes away.
  var TREE_KEY = 'vedicChartDashaTree.v1';

  function applyTreeVisible(show) {
    var tree = document.getElementById('dashaTree');
    var btn = document.getElementById('dashaLevelToggle');
    var hint = document.getElementById('treeHint');
    if (!tree) return;
    tree.classList.toggle('hidden', !show);
    if (btn) btn.setAttribute('aria-expanded', show ? 'true' : 'false');
    if (hint) hint.textContent = show ? '' : 'Tree hidden — click the period label above to bring it back.';
    // offsetTop reads 0 while hidden, so re-centre only once it is back on screen
    if (show) scrollTreeToSelection();
  }

  // The MD/AD/PD level pill (built fresh in showDetail() on every selection)
  // is itself the show/hide control for the tree below — no separate button.
  function initTreeToggle() {
    applyTreeVisible(prefGet(TREE_KEY) !== 'hide');
  }


  // ---- Facts: polarity / modality / element tallies ----
  // Also read by renderSimSummary() for the Simulation mode summary.
  // Counted across the nine planets, matching the Planetary Positions table.
  function computeFacts(result) {
    var pol = [{ name: 'Yang', count: 0 }, { name: 'Yin', count: 0 }];
    var mod = MODALITY.map(function (m) { return { name: m.name, count: 0, idx: MODALITY.indexOf(m) }; });
    var ele = ELEMENT.map(function (e) { return { name: e.name, count: 0, idx: ELEMENT.indexOf(e) }; });

    PLANET_ORDER.forEach(function (n) {
      var s = result.planets[n].signIndex;
      pol[s % 2 === 0 ? 0 : 1].count++;
      mod[s % 3].count++;
      ele[s % 4].count++;
    });

    function ranked(list) {
      return list.slice().sort(function (a, b) { return b.count - a.count; });
    }
    return {
      polarity: ranked(pol), modality: ranked(mod), element: ranked(ele),
      total: PLANET_ORDER.length
    };
  }

  function renderFacts(result) {
    var grid = document.getElementById('factsGrid');
    if (!grid) return;
    var f = computeFacts(result);
    grid.innerHTML = '';

    // One line per category: label on the left, every value inline, highest first.
    [['Duality', f.polarity], ['Modality', f.modality], ['Element', f.element]].forEach(function (pair) {
      var line = document.createElement('div');
      line.className = 'fact-line';
      var cat = document.createElement('span');
      cat.className = 'fact-cat';
      cat.textContent = pair[0];
      var items = document.createElement('span');
      items.className = 'fact-items';
      pair[1].forEach(function (item, i) {
        var el = document.createElement('span');
        el.className = 'fact-item' + (i === 0 && item.count > 0 ? ' top' : '') +
                       (item.count === 0 ? ' zero' : '');
        el.title = item.name + ': ' + item.count + ' of ' + f.total + ' planets';
        var nm = document.createElement('span');
        nm.className = 'fact-name';
        nm.textContent = item.name;
        var ct = document.createElement('span');
        ct.className = 'fact-count';
        ct.textContent = item.count;
        el.appendChild(nm); el.appendChild(ct);
        items.appendChild(el);
      });
      line.appendChild(cat); line.appendChild(items);
      grid.appendChild(line);
    });
    // The picks below need the Influence Engine's yogas, so they're drawn by
    // renderFactsPicks() from renderInfluenceEngineTab(); clear any stale ones.
    var picks = document.getElementById('factsPicks');
    if (picks) picks.innerHTML = '';
  }

  // ---- Facts: significant planet and house ----
  // A rule-based "where this chart concentrates" pick, built only from what
  // the Influence Engine and Shadbala already compute. Planets get two
  // separate roles rather than one blended score:
  //   Chart ruler:  the Lagna lord — sets the chart's direction.
  //   Focal planet: +1 per yoga it helps form, +1 strongest Shadbala,
  //                 +1 below its Shadbala minimum, +1 in the loop (or
  //                 self-ruled planet) that every dispositor chain ends in.
  //                 Ties go to the planet forming more yogas, then the
  //                 higher Shadbala. Lordship of the Lagna
  //                 is deliberately not scored here — that's the ruler's role.
  //   When one planet holds both roles, they're shown as a single callout.
  //   House: +1 per occupant, +1 per aspecting planet, +1 if a kendra.
  //          Ties go to the higher Bhava Bala, then the lower house number.
  //          Also names the house whose occupants form the most yogas, where
  //          that differs.
  function chartYogaList(ie) {
    var out = [];
    ie.vry.forEach(function (y) { out.push({ label: y.name, planets: [y.lord] }); });
    ie.neechaBhanga.forEach(function (y) { out.push({ label: 'Neecha Bhanga', planets: [y.planet] }); });
    ie.mahapurusha.forEach(function (y) { out.push({ label: y.name, planets: [y.planet] }); });
    ie.gajakesari.forEach(function () { out.push({ label: 'Gajakesari', planets: ['Moon', 'Jupiter'] }); });
    ie.conjunction.forEach(function (y) { out.push({ label: y.name.replace(/ Yoga$/, ''), planets: y.planets }); });
    [['raja', 'Raja Yoga'], ['dhana', 'Dhana Yoga'], ['parivartana', 'Parivartana']].forEach(function (k) {
      ie[k[0]].forEach(function (y) { out.push({ label: k[1], planets: y.planets }); });
    });
    return out;
  }

  function yogaLabelFor(name, y) {
    var others = y.planets.filter(function (p) { return p !== name; });
    return y.label + (others.length ? ' with ' + others.join(', ') : '');
  }

  function renderFactsPicks(ie, result, sb) {
    var box = document.getElementById('factsPicks');
    if (!box) return;
    box.innerHTML = '';
    var yogas = chartYogaList(ie);
    var lagnaLord = E.SIGN_LORDS[result.ascendant.signIndex];
    var sbRes = sb && sb.results;

    // Planets every dispositor chain ends in (only if all chains agree).
    var finals = null;
    PLANET_ORDER.forEach(function (n) {
      var dc = ie.planets[n].dispositorChain;
      var end = dc.terminal === 'self-ruled' ? [dc.planet] : dc.terminal === 'loop' ? dc.loop : [];
      var set = {};
      end.forEach(function (p) { set[p] = true; });
      if (finals === null) finals = set;
      else Object.keys(finals).forEach(function (p) { if (!set[p]) delete finals[p]; });
    });
    finals = finals || {};

    var strongest = null;
    if (sbRes) {
      PLANET_ORDER.forEach(function (n) {
        if (sbRes[n] && sbRes[n].rank === 1) strongest = n;
      });
    }

    var planetRows = PLANET_ORDER.map(function (n) {
      var why = [], score = 0;
      var mine = yogas.filter(function (y) { return y.planets.indexOf(n) >= 0; });
      if (mine.length) {
        score += mine.length;
        why.push('Forms ' + mine.length + ' yoga' + (mine.length > 1 ? 's' : '') + ': ' +
          mine.map(function (y) { return yogaLabelFor(n, y); }).join('; '));
      }
      if (n === strongest) { score += 1; why.push('Strongest Shadbala (' + Math.round(sbRes[n].percent) + '%)'); }
      if (sbRes && sbRes[n] && !sbRes[n].meetsMinimum) {
        score += 1; why.push('Below its Shadbala minimum (' + Math.round(sbRes[n].percent) + '%)');
      }
      if (finals[n]) { score += 1; why.push('Final dispositor — every dispositor chain ends with it'); }
      var owned = housesOwnedBy(n, result.ascendant.signIndex)
        .filter(function (h) { return E.SIGN_LORDS[(result.ascendant.signIndex + h.house - 1) % 12] === n; })
        .sort(function (a, b) { return a.house - b.house; });
      return { name: n, score: score, yogaCount: mine.length, why: why, owned: owned };
    });
    planetRows.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      if (b.yogaCount !== a.yogaCount) return b.yogaCount - a.yogaCount;
      var ta = sbRes && sbRes[a.name] ? sbRes[a.name].total : -1;
      var tb = sbRes && sbRes[b.name] ? sbRes[b.name].total : -1;
      return tb - ta;
    });
    var focal = planetRows[0];
    var ruler = planetRows.filter(function (r) { return r.name === lagnaLord; })[0];
    function rulesLine(row) {
      return row.owned.length
        ? ['Rules the ' + row.owned.map(function (h) { return ordinalWord(h.house); }).join(' and ')]
        : [];
    }

    var rp = result.planets[lagnaLord];
    var rHouseCls = [1, 4, 7, 10].indexOf(rp.house) >= 0 ? ' (a kendra)'
      : [5, 9].indexOf(rp.house) >= 0 ? ' (a trikona)'
      : [6, 8, 12].indexOf(rp.house) >= 0 ? ' (a dusthana)' : '';
    var rulerWhy = ['Lagna lord (' + result.ascendant.sign + ' rising), placed in the ' +
      ordinalWord(rp.house) + rHouseCls];
    dignityOf(lagnaLord, rp).forEach(function (d) { rulerWhy.push(d.full); });
    if (sbRes && sbRes[lagnaLord]) rulerWhy.push('Shadbala ' + Math.round(sbRes[lagnaLord].percent) + '% — Rank ' + sbRes[lagnaLord].rank + ' of 7');
    // Verdicts come from the Influence Engine tab's framework (absent for a
    // hand-placed chart, which has no Shadbala to grade).
    function verdictLine(label, narrative) {
      return narrative ? BF_DOT[narrative.verdict.color] + ' ' + label + ': ' + narrative.verdict.word : null;
    }
    var rulerVerdict = verdictLine('Influence verdict', bfPlanetNarrative(lagnaLord));
    if (rulerVerdict) rulerWhy.push(rulerVerdict);

    var houseRows = [];
    for (var h = 1; h <= 12; h++) {
      var signIdx = (result.ascendant.signIndex + h - 1) % 12;
      var occ = PLANET_ORDER.filter(function (n) { return result.planets[n].house === h; });
      var asp = aspectsOntoSign(signIdx, result).map(function (a) { return a.planet; });
      var kendra = [1, 4, 7, 10].indexOf(h) >= 0;
      var hYogas = yogas.filter(function (y) {
        return y.planets.some(function (p) { return occ.indexOf(p) >= 0; });
      });
      var hn = bfHouseNarrative(h);
      houseRows.push({
        house: h, sign: E.SIGNS[signIdx], occ: occ, asp: asp, kendra: kendra,
        score: occ.length + asp.length + (kendra ? 1 : 0),
        yogaCount: hYogas.length, verdict: verdictLine('House verdict', hn),
        bhava: hn ? hn.total : 0
      });
    }
    var byScore = houseRows.slice().sort(function (a, b) {
      return (b.score - a.score) || (b.bhava - a.bhava) || (a.house - b.house);
    });
    var hPick = byScore[0];
    var hWhy = [];
    if (hPick.occ.length) hWhy.push('Occupied by ' + hPick.occ.join(', '));
    if (hPick.asp.length) hWhy.push('Aspected by ' + hPick.asp.join(', '));
    if (hPick.kendra) hWhy.push('A kendra (angular house)');
    if (hPick.verdict) hWhy.push(hPick.verdict);
    var hub = houseRows.slice().sort(function (a, b) {
      return (b.yogaCount - a.yogaCount) || (b.score - a.score) || (a.house - b.house);
    })[0];
    var hAlso = hub.yogaCount > 0 && hub.house !== hPick.house
      ? 'Most yogas meet in: ' + ordinalWord(hub.house) + ' · ' + hub.sign + ' (' + hub.occ.join(', ') +
        ' — ' + hub.yogaCount + ' yoga' + (hub.yogaCount > 1 ? 's' : '') + ')'
      : null;

    // Chart ruler / Focal planet / House pick sit side by side, in the same
    // three-column grid as the Tripod impact below.
    var pickRow = document.createElement('div');
    pickRow.className = 'facts-cols';
    box.appendChild(pickRow);
    function block(label, title, why, also, wide) {
      var wrap = document.createElement('div');
      wrap.className = 'fact-pick' + (wide ? ' fact-pick-wide' : '');
      var head = document.createElement('div');
      head.className = 'fact-pick-head';
      head.appendChild(spanText(label, 'fact-cat'));
      head.appendChild(spanText(title, 'fact-pick-name'));
      wrap.appendChild(head);
      var ul = document.createElement('ul');
      ul.className = 'fact-pick-why';
      why.forEach(function (w) { var li = document.createElement('li'); li.textContent = w; ul.appendChild(li); });
      wrap.appendChild(ul);
      if (also) wrap.appendChild(spanText(also, 'fact-pick-also'));
      pickRow.appendChild(wrap);
    }
    function planetTitle(n) { return PLANET_SYMBOL[n] + ' ' + n; }
    if (focal.name === lagnaLord || focal.score === 0) {
      // Ruler and focus coincide (or nothing else stands out): one callout.
      var both = focal.name === lagnaLord;
      block(both ? 'Ruler & focal planet' : 'Chart ruler', planetTitle(lagnaLord),
        rulerWhy.concat(both ? focal.why : []).concat(rulesLine(ruler)), null, true);
    } else {
      block('Chart ruler', planetTitle(lagnaLord), rulerWhy.concat(rulesLine(ruler)), null);
      var focalVerdict = verdictLine('Influence verdict', bfPlanetNarrative(focal.name));
      block('Focal planet', planetTitle(focal.name), focal.why.concat(focalVerdict ? [focalVerdict] : []).concat(rulesLine(focal)), null);
    }
    block('House pick', ordinalWord(hPick.house) + ' · ' + hPick.sign, hWhy, hAlso);

    // Tripod impact — the Influence Engine's Body/Mind/Soul read, as three
    // plain columns with the same green/red/grey color code.
    var tri = document.createElement('div');
    tri.className = 'fact-pick';
    var cols = document.createElement('div');
    cols.className = 'facts-cols';
    [['Body', 'Ascendant'], ['Mind', 'Moon'], ['Soul', 'Sun']].forEach(function (pair) {
      var col = document.createElement('div');
      col.appendChild(spanText(pair[0] + ' (' + pair[1] + ')', 'fact-pick-name'));
      var hits = ie.tripod[pair[0]];
      if (!hits.length) col.appendChild(spanText('No aspects or conjunctions land here.', 'facts-tripod-hit ie-neutral'));
      hits.forEach(function (hit) {
        col.appendChild(spanText(tripodHitText(hit), 'facts-tripod-hit ' + tripodHitClass(hit)));
      });
      cols.appendChild(col);
    });
    tri.appendChild(cols);
    box.appendChild(tri);
  }

  // ---- Layered interpretation (planet spine) ----
  // The chain itself lives in interpret.js; this only renders it and hands over
  // the aspect/ownership helpers so those rules exist in exactly one place.
  var lastResult = null, lastSb = null;
  function interpHelpers() {
    return {
      engine: E, Shadbala: window.Shadbala,
      PLANET_ORDER: PLANET_ORDER, ASPECT_HOUSES: ASPECT_HOUSES,
      MODALITY: MODALITY, ELEMENT: ELEMENT,
      dignityOf: dignityOf, housesOwnedBy: housesOwnedBy,
      aspectsOntoSign: aspectsOntoSign, aspectsCastBy: aspectsCastBy,
      isNodePair: isNodePair, fmtDate: fmtDate
    };
  }

  // ==========================================================================
  // Research tab — a question box that answers from THIS chart's own
  // already-computed narratives first (grahaChain / bhavaChain, the same
  // functions the interpretation tabs and the hover tooltip already call),
  // and only falls back to general, non-chart-specific Jyotish reference
  // text when nothing in the chart matches the question. Runs entirely
  // offline — no network call, nothing invented beyond what's already
  // computed elsewhere in the app.
  // ==========================================================================

  var RESEARCH_PLANET_ALIASES = {
    sun: 'Sun', surya: 'Sun',
    moon: 'Moon', chandra: 'Moon', chandramas: 'Moon',
    mars: 'Mars', mangal: 'Mars', mangala: 'Mars', kuja: 'Mars',
    mercury: 'Mercury', budh: 'Mercury', budha: 'Mercury',
    jupiter: 'Jupiter', guru: 'Jupiter', brihaspati: 'Jupiter',
    venus: 'Venus', shukra: 'Venus',
    saturn: 'Saturn', shani: 'Saturn',
    rahu: 'Rahu', ketu: 'Ketu'
  };

  // Everyday synonyms layered on top of the app's own classical vocabulary
  // (HOUSE_TEXT / KARAKA, both exported by interpret.js so there is exactly
  // one copy of each). Every word here still resolves to a real classical
  // signification already used elsewhere in the app — this only gives that
  // existing meaning more everyday phrasings to be found by.
  var RESEARCH_HOUSE_SYNONYMS = {
    1: ['self', 'personality', 'looks', 'my body'],
    2: ['savings', 'bank balance', 'possessions'],
    3: ['sport', 'sports', 'gardening', 'furniture', 'physical work', 'physical activity',
        'exercise', 'stamina', 'hobby', 'hobbies', 'hands-on', 'manual labour', 'manual labor',
        'building', 'diy', 'brother', 'sister'],
    4: ['house', 'car', 'real estate', 'comfort'],
    5: ['pregnancy', 'exam', 'exams', 'studies', 'romance', 'love affair'],
    6: ['illness', 'rival', 'rivals', 'litigation', 'court case', 'loan'],
    7: ['husband', 'wife', 'boyfriend', 'girlfriend', 'business partner', 'divorce'],
    8: ['surgery', 'insurance', 'in-laws', 'occult'],
    9: ['travel abroad', 'religion', 'guru', 'teacher', 'philosophy'],
    10: ['job', 'promotion', 'boss', 'business', 'public image'],
    11: ['friends', 'social circle', 'elder brother', 'elder sister', 'stock market'],
    12: ['expenses', 'debt repayment', 'meditation', 'moving abroad', 'hospital']
  };

  var RESEARCH_PLANET_SYNONYMS = {
    Sun: ['confidence', 'ego', 'government job'],
    Moon: ['emotions', 'mental peace', 'mind'],
    Mars: ['sport', 'sports', 'gardening', 'furniture', 'physical work', 'physical activity',
           'exercise', 'stamina', 'anger'],
    Mercury: ['writing', 'business acumen', 'wit'],
    Jupiter: ['blessings', 'weight gain', 'teaching'],
    Venus: ['romance', 'beauty', 'luxury', 'art'],
    Saturn: ['hard work', 'delay', 'delays', 'patience', 'old age'],
    Rahu: ['obsession', 'foreign country', 'sudden rise'],
    Ketu: ['detachment', 'spirituality', 'past life']
  };

  var RESEARCH_YOGAS = [
    { key: 'gajakesari', label: 'Gaja Kesari Yoga', re: /gaja[\s-]*kesari/i,
      generic: 'Gaja Kesari Yoga forms when the Moon and Jupiter are in a kendra (1st/4th/7th/10th) from each other. It is one of the best-known Chandra yogas, classically read as giving intelligence, reputation and steady good fortune.' },
    { key: 'neechabhanga', label: 'Neecha Bhanga Yoga', re: /neecha[\s-]*bhanga/i,
      generic: 'Neecha Bhanga Yoga is the classical cancellation of a debilitation — it applies when the debilitated planet’s dispositor (or the sign’s exaltation lord) is itself angular from the Lagna or the Moon, among other conditions. Where it applies, the debility reads as redeemed strength rather than weakness.' },
    { key: 'rajayoga', label: 'Raja Yoga', re: /raja[\s-]*yoga/i,
      generic: 'A Raja Yoga forms when a kendra lord (1st/4th/7th/10th) and a trikona lord (1st/5th/9th) are connected — by conjunction, mutual aspect, or exchange. It is classically one of the strongest combinations for status and authority.' },
    { key: 'dhanayoga', label: 'Dhana Yoga', re: /dhana[\s-]*yoga/i,
      generic: 'A Dhana Yoga (wealth combination) forms when the lords of the wealth houses — 2nd, 11th, and often 5th/9th — are connected by conjunction, aspect or exchange. It is classically read for financial gain.' },
    { key: 'parivartana', label: 'Parivartana Yoga (sign exchange)', re: /parivartana|\bexchange\b/i,
      generic: 'A Parivartana Yoga is a mutual exchange: two planets sit in each other’s sign-lordship, tying their two houses together into one continuous loop. Phaladeepika grades it Maha, Dainya or Khala Yoga depending on which houses are involved.' }
  ];

  var RESEARCH_GLOSSARY = [
    { re: /\bshadbala\b|\bsix[\s-]*fold\s*strength\b/i,
      text: 'Shadbala ("six-fold strength") is the classical Parashari system for measuring how much capacity a planet actually has to deliver on its placements — combining positional (Sthana), directional (Dig), temporal (Kala), motional (Chesta), natural (Naisargika) and aspectual (Drik) strength into one Virupa total, checked against a per-planet minimum.' },
    { re: /\bbhava\s*bala\b|\bhouse\s*strength\b/i,
      text: 'Bhava Bala measures a house’s own strength, combining its lord’s Shadbala (Bhavadhipati Bala), the house’s directional angularity (Bhava Dig Bala), and the net aspects landing on it (Bhava Drishti Bala).' },
    { re: /\bdasha\b|\bmahadasha\b|\bantardasha\b/i,
      text: 'Vimshottari Dasha is the classical 120-year timing system that divides a life into planetary periods (Mahadasha) and sub-periods (Antardasha), based on the Moon’s nakshatra at birth. A house or planet tends to come forward in the world during the period of a planet that owns, occupies, or aspects it.' },
    { key: 'yoga', re: /\byoga\b/i,
      text: 'A "yoga" in Jyotish is a specific classical combination of planets, houses or signs that is named and read as a unit rather than as separate facts — Gaja Kesari, Raja Yoga, Dhana Yoga, Neecha Bhanga and Parivartana are examples this app names explicitly when it finds one.' },
    { re: /\bnakshatra\b|\bstar\b|\blunar mansion\b/i,
      text: 'A nakshatra is one of the 27 lunar constellations the zodiac is divided into (13°20’ each), each with its own ruling planet and classical character. The Moon’s nakshatra at birth is the seed of the Vimshottari Dasha sequence.' },
    { re: /\blagna\b|\bascendant\b/i,
      text: 'The Lagna (Ascendant) is the sign rising on the eastern horizon at the moment of birth. It fixes the whole house framework of the chart — every other house is counted from it.' },
    { re: /\bretrograde\b/i,
      text: 'A retrograde planet (vakri) appears to move backward against the zodiac from Earth’s point of view. Classically it is read as intensified, turned-inward, or delayed in how it delivers — not as weak.' },
    { re: /\bexalt|\bdebilitat/i,
      text: 'Exaltation (uchcha) is the one sign where a planet is classically at its most dignified and confident; debilitation (neecha) is the opposite sign, where it is least comfortable — though a debilitation can be cancelled (see Neecha Bhanga Yoga).' },
    { re: /\bgraha\b|\bplanets?\b/i,
      text: 'This app reads the nine classical grahas: the Sun, Moon, Mars, Mercury, Jupiter, Venus and Saturn, plus the lunar nodes Rahu and Ketu.' },
    { re: /\bbhava\b|\bhouses?\b/i,
      text: 'A bhava (house) is one of twelve life-departments counted from the Lagna. This app uses whole-sign houses — house 1 is the Lagna’s whole sign, house 2 the next sign, and so on.' }
  ];

  function researchWordMatches(qLower, word) {
    var esc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    return new RegExp('\\b' + esc + '\\b', 'i').test(qLower);
  }

  var RESEARCH_ORDINAL_WORDS = ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth',
    'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];

  function researchExtractHouses(qLower) {
    var houses = [];
    for (var n = 1; n <= 12; n++) {
      var re = new RegExp('\\b(' + RESEARCH_ORDINAL_WORDS[n] + '|' + n + suffix(n) + ')\\s*house\\b|\\bhouse\\s*' + n + '\\b', 'i');
      if (re.test(qLower) && houses.indexOf(n) < 0) houses.push(n);
    }
    return houses;
  }

  function researchExtractPlanets(qLower) {
    var planets = [];
    Object.keys(RESEARCH_PLANET_ALIASES).forEach(function (key) {
      if (researchWordMatches(qLower, key)) {
        var canon = RESEARCH_PLANET_ALIASES[key];
        if (planets.indexOf(canon) < 0) planets.push(canon);
      }
    });
    return planets;
  }

  function researchTopicHouses(qLower) {
    var houses = [];
    for (var h = 1; h <= 12; h++) {
      var words = (window.Interpret.HOUSE_TEXT[h] || '').split(/,\s*/).concat(RESEARCH_HOUSE_SYNONYMS[h] || []);
      for (var i = 0; i < words.length; i++) {
        if (words[i] && researchWordMatches(qLower, words[i])) { houses.push(h); break; }
      }
    }
    return houses;
  }

  function researchTopicPlanets(qLower) {
    var planets = [];
    PLANET_ORDER.forEach(function (p) {
      var words = (window.Interpret.KARAKA[p] || '').split(/,\s*/).concat(RESEARCH_PLANET_SYNONYMS[p] || []);
      for (var i = 0; i < words.length; i++) {
        if (words[i] && researchWordMatches(qLower, words[i])) { planets.push(p); break; }
      }
    });
    return planets;
  }

  function researchFirstMatchingSentence(str, re) {
    var sentences = String(str).split(/\.\s+/);
    for (var i = 0; i < sentences.length; i++) {
      if (re.test(sentences[i])) return sentences[i].replace(/\.\s*$/, '').trim() + '.';
    }
    return null;
  }

  function researchScanYoga(yoga, result, sb, H) {
    var hits = [];
    PLANET_ORDER.forEach(function (p) {
      try {
        var chain = window.Interpret.grahaChain(p, result, sb, H);
        var s = researchFirstMatchingSentence(chain.summary, yoga.re);
        if (s) hits.push(s);
      } catch (e) { /* one planet's chain failing shouldn't block the scan */ }
    });
    for (var h = 1; h <= 12; h++) {
      try {
        var hchain = window.Interpret.bhavaChain(h, result, sb, H);
        var hs = researchFirstMatchingSentence(hchain.summary, yoga.re);
        if (hs) hits.push(hs);
      } catch (e) { /* likewise for one house */ }
    }
    var seen = [], out = [];
    hits.forEach(function (s) { if (seen.indexOf(s) < 0) { seen.push(s); out.push(s); } });
    return out;
  }

  function researchStrengthBlock(sb) {
    if (!sb || !sb.results) {
      return { heading: null, type: 'para',
        text: 'Shadbala (planetary strength) needs exact degrees and the moment of birth, which a placed Simulation chart does not have, so I can’t rank strength here. Generate a full chart with a birth time to see this.' };
    }
    var ranked = sb.grahas.slice().sort(function (a, b) { return sb.results[a].rank - sb.results[b].rank; });
    var lines = ranked.map(function (g, i) {
      var r = sb.results[g];
      return (i + 1) + '. ' + g + ' — ' + num(r.rupa) + ' Rūpa (' + Math.round(r.percent) + '% of its minimum)' +
        (r.meetsMinimum ? '' : ', short of its own minimum');
    });
    return { heading: 'Planetary strength (Shadbala), strongest to weakest by ratio to each planet’s own minimum', type: 'list', lines: lines };
  }

  function researchTimingBlock(result, planetsOfInterest) {
    if (result.simulated) {
      return { heading: null, type: 'para',
        text: 'Dasha timing needs the Moon’s exact degree and a birth date, which a placed Simulation chart does not have. Generate a full chart with a birth time to see this.' };
    }
    var today = new Date();
    var lines = [];
    var current = result.dasha.filter(function (d) { return d.start <= today && d.end >= today; })[0];
    if (current) lines.push('Currently running Mahadasha: ' + current.lord + ' (' + fmtDate(current.start) + ' – ' + fmtDate(current.end) + ').');
    var currentAd = (result.antardashas || []).filter(function (a) { return a.start <= today && a.end >= today; })[0];
    if (currentAd) lines.push('Current Antardasha: ' + currentAd.maha + '–' + currentAd.antar + ', running to ' + fmtDate(currentAd.end) + '.');
    var next = result.dasha.filter(function (d) { return d.start > today; })[0];
    if (next) lines.push('Next Mahadasha: ' + next.lord + ', starting ' + fmtDate(next.start) + '.');
    (planetsOfInterest || []).forEach(function (p) {
      var period = result.dasha.filter(function (d) { return d.lord === p; })[0];
      if (period) lines.push(p + '’s own Mahadasha runs ' + fmtDate(period.start) + ' – ' + fmtDate(period.end) + '.');
    });
    if (!lines.length) return null;
    return { heading: 'Timing (Vimshottari Dasha)', type: 'list', lines: lines };
  }

  function researchNakshatraBlock(result, planetsOfInterest) {
    if (result.simulated) {
      return { heading: null, type: 'para',
        text: 'Nakshatra and pada need exact degrees, which a placed Simulation chart does not have. Generate a full chart with a birth time to see this.' };
    }
    var lines = [];
    var interested = planetsOfInterest || [];
    lines.push('Lagna nakshatra: ' + result.ascendant.nakshatra.name + ' pada ' + result.ascendant.nakshatra.pada +
      ' (lord ' + result.ascendant.nakshatra.lord + ').');
    // Skip the plain Moon-nakshatra summary line when Moon is already being
    // covered below with its pada — that fuller line supersedes this one.
    if (interested.indexOf('Moon') < 0) lines.push('Moon nakshatra: ' + result.moonNakshatra + '.');
    interested.forEach(function (p) {
      var pl = result.planets[p];
      if (pl && pl.nakshatra) lines.push(p + ' nakshatra: ' + pl.nakshatra + ' pada ' + pl.pada + '.');
    });
    return { heading: 'Nakshatras', type: 'list', lines: lines };
  }

  function researchFallbackBlock() {
    return { heading: null, type: 'para',
      text: 'I couldn’t tie that to a specific part of this chart. Try naming a planet ("What about my Saturn?"), a house or life-area ("What does this chart say about marriage?"), a yoga ("Is there a Raja Yoga?"), timing ("When is my next Jupiter period?"), strength ("Who is my strongest planet?"), or a nakshatra ("What’s my Moon nakshatra?").' };
  }

  // The composer: chart-specific matches always come first (per-planet and
  // per-house blocks reuse the exact narrative text already computed
  // elsewhere in the app), general reference text is appended only when
  // nothing chart-specific matched, or as a short trailing note when the
  // question also names a general term. `grounded` records whether any
  // chart-specific block was found at all.
  function buildResearchAnswer(question, result, sb) {
    var H = interpHelpers();
    var qLower = question.toLowerCase();
    var blocks = [];
    var grounded = false;

    var namedPlanets = researchExtractPlanets(qLower);
    var topicPlanets = researchTopicPlanets(qLower).filter(function (p) { return namedPlanets.indexOf(p) < 0; });
    var namedHouses = researchExtractHouses(qLower);
    var topicHouses = researchTopicHouses(qLower).filter(function (h) { return namedHouses.indexOf(h) < 0; });
    var matchedYogas = RESEARCH_YOGAS.filter(function (y) { return y.re.test(qLower); });
    var wantsStrength = /\b(strongest|weakest|strength|shadbala|bhava\s*bala)\b/i.test(qLower);
    var wantsTiming = /\b(dasha|mahadasha|antardasha|period|timing|when\b|currently\s+running|current\s+period)\b/i.test(qLower);
    var wantsNakshatra = /\b(nakshatra|birth\s*star|constellation)\b/i.test(qLower);

    namedPlanets.concat(topicPlanets).slice(0, 4).forEach(function (p) {
      try {
        var chain = window.Interpret.grahaChain(p, result, sb, H);
        var isTopic = namedPlanets.indexOf(p) < 0;
        var heading = (PLANET_SYMBOL[p] || '') + ' ' + p +
          (isTopic ? ' — karaka for ' + (window.Interpret.KARAKA[p] || '').split(', ').slice(0, 2).join(', ') : '');
        blocks.push({ heading: heading, type: 'narrative', text: chain.summary, source: 'chart' });
        grounded = true;
      } catch (e) { /* one planet failing shouldn't blank the answer */ }
    });

    namedHouses.concat(topicHouses).slice(0, 4).forEach(function (h) {
      try {
        var hchain = window.Interpret.bhavaChain(h, result, sb, H);
        var isTopic = namedHouses.indexOf(h) < 0;
        var heading = 'House ' + h + (isTopic ? ' — ' + (window.Interpret.HOUSE_TEXT[h] || '') : '');
        blocks.push({ heading: heading, type: 'narrative', text: hchain.summary, source: 'chart' });
        grounded = true;
      } catch (e) { /* likewise for one house */ }
    });

    matchedYogas.forEach(function (y) {
      var lines = researchScanYoga(y, result, sb, H);
      blocks.push({
        heading: y.label,
        type: lines.length ? 'list' : 'para',
        lines: lines.length ? lines : undefined,
        text: lines.length ? undefined : 'No ' + y.label + ' is present in this chart.',
        source: 'chart'
      });
      blocks.push({ heading: null, type: 'para', text: y.generic, source: 'generic' });
      grounded = true;
    });

    if (wantsStrength) { blocks.push(researchStrengthBlock(sb)); grounded = true; }
    if (wantsTiming) { var tb = researchTimingBlock(result, namedPlanets); if (tb) { blocks.push(tb); grounded = true; } }
    if (wantsNakshatra) { blocks.push(researchNakshatraBlock(result, namedPlanets)); grounded = true; }

    // Skip the generic "what is a yoga" definition when a specific named
    // yoga already got its own (more useful) generic explanation above.
    var glossaryHit = RESEARCH_GLOSSARY.filter(function (row) {
      return row.re.test(qLower) && !(row.key === 'yoga' && matchedYogas.length);
    })[0];
    if (!blocks.length) {
      blocks.push(glossaryHit
        ? { heading: null, type: 'para', text: glossaryHit.text, source: 'generic' }
        : researchFallbackBlock());
    } else if (glossaryHit && blocks.every(function (b) { return b.text !== glossaryHit.text; })) {
      // Chart data first, then generically: a recognizable general term
      // ("what is Shadbala") still gets its plain definition appended even
      // when a chart-specific block already answered the personalized part.
      blocks.push({ heading: null, type: 'para', text: glossaryHit.text, source: 'generic' });
    }

    return { blocks: blocks, grounded: grounded };
  }

  function researchRenderAnswer(container, answer) {
    container.innerHTML = '';
    if (!answer.grounded) {
      var tag = document.createElement('p');
      tag.className = 'research-generic-tag';
      tag.textContent = 'General Jyotish reference — not specific to this chart.';
      container.appendChild(tag);
    }
    answer.blocks.forEach(function (b) {
      if (!b) return;
      var wrap = document.createElement('div');
      wrap.className = 'research-block' + (b.source === 'generic' ? ' research-generic' : '');
      if (b.heading) {
        var h = document.createElement('div');
        h.className = 'research-block-head';
        h.textContent = b.heading;
        wrap.appendChild(h);
      }
      if (b.type === 'narrative') {
        richNarrativeList(wrap, b.text);
      } else if (b.type === 'list') {
        var ul = document.createElement('ul');
        ul.className = 'narrative-list';
        (b.lines || []).forEach(function (line) {
          var li = document.createElement('li');
          li.textContent = line;
          ul.appendChild(li);
        });
        wrap.appendChild(ul);
      } else {
        var p = document.createElement('p');
        p.textContent = b.text;
        wrap.appendChild(p);
      }
      container.appendChild(wrap);
    });
  }

  // `onDelete`, when given, gets a small ✕ button next to the question so
  // any single question/answer block — latest or history — can be removed
  // on its own without clearing the rest of the conversation.
  function researchBuildQaCard(item, onDelete) {
    var card = document.createElement('div');
    card.className = 'research-qa';
    var row = document.createElement('div');
    row.className = 'research-q-row';
    var qEl = document.createElement('div');
    qEl.className = 'research-q';
    qEl.textContent = item.q;
    row.appendChild(qEl);
    if (onDelete) {
      var delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'research-delete-btn';
      delBtn.setAttribute('aria-label', 'Delete this question and answer');
      delBtn.title = 'Delete this question and answer';
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', onDelete);
      row.appendChild(delBtn);
    }
    card.appendChild(row);
    var aEl = document.createElement('div');
    aEl.className = 'research-a';
    card.appendChild(aEl);
    researchRenderAnswer(aEl, item.answer);
    return card;
  }

  // researchLatestQA / researchHistoryQAs hold the running conversation for
  // the currently generated chart. A new chart invalidates old answers (they
  // were built from a different chart's data), so resetResearch() is called
  // from both the real-chart and Simulation render paths. Each item carries
  // a small sequential id so a delete button can remove exactly that item
  // regardless of how the array has shifted since it was rendered.
  var researchLatestQA = null;
  var researchHistoryQAs = [];
  var researchIdSeq = 0;

  function researchRenderLatest() {
    var latestBox = document.getElementById('researchLatest');
    if (!latestBox) return;
    latestBox.innerHTML = '';
    if (researchLatestQA) {
      latestBox.classList.remove('hidden');
      latestBox.appendChild(researchBuildQaCard(researchLatestQA, researchDeleteLatest));
    } else {
      latestBox.classList.add('hidden');
    }
  }

  function researchRenderHistory() {
    var histBox = document.getElementById('researchHistory');
    if (!histBox) return;
    histBox.innerHTML = '';
    researchHistoryQAs.forEach(function (item) {
      histBox.appendChild(researchBuildQaCard(item, function () { researchDeleteHistoryItem(item.id); }));
    });
  }

  // Deleting the pinned "latest" card promotes the most recent history item
  // (if any) into its place, so the pinned slot never sits empty while older
  // answers still exist below it; otherwise it just clears.
  function researchDeleteLatest() {
    researchLatestQA = researchHistoryQAs.length ? researchHistoryQAs.shift() : null;
    researchRenderLatest();
    researchRenderHistory();
  }

  function researchDeleteHistoryItem(id) {
    researchHistoryQAs = researchHistoryQAs.filter(function (item) { return item.id !== id; });
    researchRenderHistory();
  }

  function resetResearch() {
    researchLatestQA = null;
    researchHistoryQAs = [];
    researchRenderLatest();
    researchRenderHistory();
    var input = document.getElementById('researchInput');
    if (input) input.value = '';
  }

  function initResearchTab() {
    var form = document.getElementById('researchForm');
    var input = document.getElementById('researchInput');
    if (!form || form.__wired) return;
    form.__wired = true;

    function submit() {
      var q = (input.value || '').trim();
      if (!q || !lastResult) return;
      var answer = buildResearchAnswer(q, lastResult, lastSb);

      // The previous "latest" (if any) is pushed into history, newest first,
      // so the prompt + newest answer always stay pinned above the growing
      // history list rather than getting buried inside it.
      if (researchLatestQA) researchHistoryQAs.unshift(researchLatestQA);
      researchLatestQA = { id: ++researchIdSeq, q: q, answer: answer };
      researchRenderHistory();
      researchRenderLatest();

      input.value = '';
      input.focus();
    }

    form.addEventListener('submit', function (ev) { ev.preventDefault(); submit(); });
    input.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); submit(); }
    });
  }

  function renderSummary(result, name, sb) {
    var box = document.getElementById('summaryGrid');
    box.innerHTML = '';
    var items = [
      ['Name', name || '—'],
      ['Ascendant (Lagna)', result.ascendant.sign + ' ' + result.ascendant.degreeFormatted],
      ['Lagna Nakshatra', result.ascendant.nakshatra.name + ' (Pada ' + result.ascendant.nakshatra.pada + ')'],
      ['Moon Sign (Rashi)', result.moonSign],
      ['Moon Nakshatra', result.moonNakshatra],
      ['Sun Sign', result.planets.Sun.sign],
      ['Tithi', result.tithi.number + ' – ' + result.tithi.name],
      ['Paksha', result.tithi.paksha],
      ['Ayanamsa (Lahiri)', result.ayanamsa.toFixed(4) + '°'],
      ['Current/Birth Mahadasha', result.dasha[0].lord]
    ];
    if (sb) {
      var strongest = sb.grahas.slice().sort(function (a, b) { return sb.results[a].rank - sb.results[b].rank; });
      [['Strongest Planet', strongest[0]], ['Weakest Planet', strongest[6]]].forEach(function (pair) {
        var sr = sb.results[pair[1]];
        items.push([pair[0], pair[1] + ' (' + sr.rupa.toFixed(2) + ' Rūpa, ' + Math.round(sr.percent) + '% of its minimum)']);
      });
    }
    items.forEach(function (it) {
      var row = document.createElement('div');
      row.className = 'dl-row';
      var dt = document.createElement('dt');
      dt.textContent = it[0];
      var dd = document.createElement('dd');
      dd.textContent = it[1];
      row.appendChild(dt); row.appendChild(dd);
      box.appendChild(row);
    });
  }

  // ---- Coordinate parsing ----
  // Accepts: "13.0827", "-13.0827", "13.0827 N", "13°04'58\"N", "13 4 58 S", "13:04:58"
  function parseCoord(raw, axis) {
    if (raw === null || raw === undefined) return NaN;
    var s = String(raw).trim();
    if (!s) return NaN;
    s = s.replace(/[°′″’”'"]/g, ' ')   // deg/min/sec marks -> space
         .replace(/[:,]/g, ' ')
         .replace(/\s+/g, ' ')
         .trim();
    var hemi = null;
    var m = s.match(/([NSEW])/i);
    if (m) { hemi = m[1].toUpperCase(); s = s.replace(/[NSEWnsew]/g, ' ').trim(); }
    var parts = s.split(' ').filter(function (p) { return p.length; });
    if (!parts.length) return NaN;
    for (var i = 0; i < parts.length; i++) {
      if (!/^[+-]?\d*\.?\d+$/.test(parts[i])) return NaN;
    }
    var deg = parseFloat(parts[0]);
    if (isNaN(deg)) return NaN;
    var neg = deg < 0 || /^-/.test(parts[0]);
    var val = Math.abs(deg);
    if (parts.length > 1) val += Math.abs(parseFloat(parts[1])) / 60;
    if (parts.length > 2) val += Math.abs(parseFloat(parts[2])) / 3600;
    if (parts.length > 3) return NaN;
    if (neg) val = -val;
    if (hemi === 'S' || hemi === 'W') val = -Math.abs(val);
    if (hemi === 'N' || hemi === 'E') val = Math.abs(val);
    var limit = axis === 'lat' ? 90 : 180;
    if (val < -limit || val > limit) return NaN;
    return val;
  }

  // Detect a pasted "lat, lon" pair in a single box
  function parseCoordPair(raw) {
    var s = String(raw || '').trim();
    if (!s) return null;
    var m = s.match(/^\s*([+-]?\d+(?:\.\d+)?)\s*[,;/]\s*([+-]?\d+(?:\.\d+)?)\s*$/);
    if (!m) return null;
    var la = parseFloat(m[1]), lo = parseFloat(m[2]);
    if (isNaN(la) || isNaN(lo)) return null;
    if (Math.abs(la) > 90 || Math.abs(lo) > 180) return null;
    return { lat: la, lon: lo };
  }

  // ---- Built-in city list (works with no network; Nominatim results merge in on top) ----
  // [name, region, lat, lon, utcOffset]
  var CITIES = [
    ['Chennai','Tamil Nadu, India',13.0827,80.2707,5.5],
    ['Mumbai','Maharashtra, India',19.0760,72.8777,5.5],
    ['Delhi','Delhi, India',28.6139,77.2090,5.5],
    ['New Delhi','Delhi, India',28.6139,77.2090,5.5],
    ['Bengaluru','Karnataka, India',12.9716,77.5946,5.5],
    ['Bangalore','Karnataka, India',12.9716,77.5946,5.5],
    ['Hyderabad','Telangana, India',17.3850,78.4867,5.5],
    ['Kolkata','West Bengal, India',22.5726,88.3639,5.5],
    ['Pune','Maharashtra, India',18.5204,73.8567,5.5],
    ['Ahmedabad','Gujarat, India',23.0225,72.5714,5.5],
    ['Surat','Gujarat, India',21.1702,72.8311,5.5],
    ['Jaipur','Rajasthan, India',26.9124,75.7873,5.5],
    ['Lucknow','Uttar Pradesh, India',26.8467,80.9462,5.5],
    ['Kanpur','Uttar Pradesh, India',26.4499,80.3319,5.5],
    ['Nagpur','Maharashtra, India',21.1458,79.0882,5.5],
    ['Indore','Madhya Pradesh, India',22.7196,75.8577,5.5],
    ['Bhopal','Madhya Pradesh, India',23.2599,77.4126,5.5],
    ['Patna','Bihar, India',25.5941,85.1376,5.5],
    ['Vadodara','Gujarat, India',22.3072,73.1812,5.5],
    ['Ludhiana','Punjab, India',30.9010,75.8573,5.5],
    ['Agra','Uttar Pradesh, India',27.1767,78.0081,5.5],
    ['Nashik','Maharashtra, India',19.9975,73.7898,5.5],
    ['Visakhapatnam','Andhra Pradesh, India',17.6868,83.2185,5.5],
    ['Vijayawada','Andhra Pradesh, India',16.5062,80.6480,5.5],
    ['Coimbatore','Tamil Nadu, India',11.0168,76.9558,5.5],
    ['Madurai','Tamil Nadu, India',9.9252,78.1198,5.5],
    ['Tiruchirappalli','Tamil Nadu, India',10.7905,78.7047,5.5],
    ['Salem','Tamil Nadu, India',11.6643,78.1460,5.5],
    ['Tirunelveli','Tamil Nadu, India',8.7139,77.7567,5.5],
    ['Erode','Tamil Nadu, India',11.3410,77.7172,5.5],
    ['Vellore','Tamil Nadu, India',12.9165,79.1325,5.5],
    ['Thanjavur','Tamil Nadu, India',10.7870,79.1378,5.5],
    ['Kochi','Kerala, India',9.9312,76.2673,5.5],
    ['Thiruvananthapuram','Kerala, India',8.5241,76.9366,5.5],
    ['Kozhikode','Kerala, India',11.2588,75.7804,5.5],
    ['Thrissur','Kerala, India',10.5276,76.2144,5.5],
    ['Mysuru','Karnataka, India',12.2958,76.6394,5.5],
    ['Mangaluru','Karnataka, India',12.9141,74.8560,5.5],
    ['Hubli','Karnataka, India',15.3647,75.1240,5.5],
    ['Belagavi','Karnataka, India',15.8497,74.4977,5.5],
    ['Tirupati','Andhra Pradesh, India',13.6288,79.4192,5.5],
    ['Guntur','Andhra Pradesh, India',16.3067,80.4365,5.5],
    ['Warangal','Telangana, India',17.9689,79.5941,5.5],
    ['Varanasi','Uttar Pradesh, India',25.3176,82.9739,5.5],
    ['Allahabad','Uttar Pradesh, India',25.4358,81.8463,5.5],
    ['Meerut','Uttar Pradesh, India',28.9845,77.7064,5.5],
    ['Ghaziabad','Uttar Pradesh, India',28.6692,77.4538,5.5],
    ['Noida','Uttar Pradesh, India',28.5355,77.3910,5.5],
    ['Gurugram','Haryana, India',28.4595,77.0266,5.5],
    ['Faridabad','Haryana, India',28.4089,77.3178,5.5],
    ['Chandigarh','Chandigarh, India',30.7333,76.7794,5.5],
    ['Amritsar','Punjab, India',31.6340,74.8723,5.5],
    ['Jalandhar','Punjab, India',31.3260,75.5762,5.5],
    ['Jodhpur','Rajasthan, India',26.2389,73.0243,5.5],
    ['Udaipur','Rajasthan, India',24.5854,73.7125,5.5],
    ['Kota','Rajasthan, India',25.2138,75.8648,5.5],
    ['Ajmer','Rajasthan, India',26.4499,74.6399,5.5],
    ['Rajkot','Gujarat, India',22.3039,70.8022,5.5],
    ['Bhavnagar','Gujarat, India',21.7645,72.1519,5.5],
    ['Jamnagar','Gujarat, India',22.4707,70.0577,5.5],
    ['Aurangabad','Maharashtra, India',19.8762,75.3433,5.5],
    ['Solapur','Maharashtra, India',17.6599,75.9064,5.5],
    ['Kolhapur','Maharashtra, India',16.7050,74.2433,5.5],
    ['Thane','Maharashtra, India',19.2183,72.9781,5.5],
    ['Navi Mumbai','Maharashtra, India',19.0330,73.0297,5.5],
    ['Raipur','Chhattisgarh, India',21.2514,81.6296,5.5],
    ['Ranchi','Jharkhand, India',23.3441,85.3096,5.5],
    ['Jamshedpur','Jharkhand, India',22.8046,86.2029,5.5],
    ['Dhanbad','Jharkhand, India',23.7957,86.4304,5.5],
    ['Bhubaneswar','Odisha, India',20.2961,85.8245,5.5],
    ['Cuttack','Odisha, India',20.4625,85.8830,5.5],
    ['Guwahati','Assam, India',26.1445,91.7362,5.5],
    ['Siliguri','West Bengal, India',26.7271,88.3953,5.5],
    ['Asansol','West Bengal, India',23.6739,86.9524,5.5],
    ['Howrah','West Bengal, India',22.5958,88.2636,5.5],
    ['Dehradun','Uttarakhand, India',30.3165,78.0322,5.5],
    ['Haridwar','Uttarakhand, India',29.9457,78.1642,5.5],
    ['Shimla','Himachal Pradesh, India',31.1048,77.1734,5.5],
    ['Srinagar','Jammu & Kashmir, India',34.0837,74.7973,5.5],
    ['Jammu','Jammu & Kashmir, India',32.7266,74.8570,5.5],
    ['Panaji','Goa, India',15.4909,73.8278,5.5],
    ['Puducherry','Puducherry, India',11.9416,79.8083,5.5],
    ['Gwalior','Madhya Pradesh, India',26.2183,78.1828,5.5],
    ['Jabalpur','Madhya Pradesh, India',23.1815,79.9864,5.5],
    ['Ujjain','Madhya Pradesh, India',23.1765,75.7885,5.5],
    ['Bareilly','Uttar Pradesh, India',28.3670,79.4304,5.5],
    ['Aligarh','Uttar Pradesh, India',27.8974,78.0880,5.5],
    ['Gorakhpur','Uttar Pradesh, India',26.7606,83.3732,5.5],
    ['Colombo','Sri Lanka',6.9271,79.8612,5.5],
    ['Kathmandu','Nepal',27.7172,85.3240,5.75],
    ['Dhaka','Bangladesh',23.8103,90.4125,6],
    ['Karachi','Pakistan',24.8607,67.0011,5],
    ['Lahore','Pakistan',31.5204,74.3587,5],
    ['Islamabad','Pakistan',33.6844,73.0479,5],
    ['Kabul','Afghanistan',34.5553,69.2075,4.5],
    ['Dubai','United Arab Emirates',25.2048,55.2708,4],
    ['Abu Dhabi','United Arab Emirates',24.4539,54.3773,4],
    ['Doha','Qatar',25.2854,51.5310,3],
    ['Muscat','Oman',23.5880,58.3829,4],
    ['Riyadh','Saudi Arabia',24.7136,46.6753,3],
    ['Kuwait City','Kuwait',29.3759,47.9774,3],
    ['Manama','Bahrain',26.2285,50.5860,3],
    ['Singapore','Singapore',1.3521,103.8198,8],
    ['Kuala Lumpur','Malaysia',3.1390,101.6869,8],
    ['Bangkok','Thailand',13.7563,100.5018,7],
    ['Jakarta','Indonesia',-6.2088,106.8456,7],
    ['Hong Kong','Hong Kong',22.3193,114.1694,8],
    ['Beijing','China',39.9042,116.4074,8],
    ['Shanghai','China',31.2304,121.4737,8],
    ['Tokyo','Japan',35.6762,139.6503,9],
    ['Seoul','South Korea',37.5665,126.9780,9],
    ['Manila','Philippines',14.5995,120.9842,8],
    ['London','United Kingdom',51.5074,-0.1278,0],
    ['Birmingham','United Kingdom',52.4862,-1.8904,0],
    ['Manchester','United Kingdom',53.4808,-2.2426,0],
    ['Leicester','United Kingdom',52.6369,-1.1398,0],
    ['Dublin','Ireland',53.3498,-6.2603,0],
    ['Paris','France',48.8566,2.3522,1],
    ['Berlin','Germany',52.5200,13.4050,1],
    ['Frankfurt','Germany',50.1109,8.6821,1],
    ['Amsterdam','Netherlands',52.3676,4.9041,1],
    ['Brussels','Belgium',50.8503,4.3517,1],
    ['Zurich','Switzerland',47.3769,8.5417,1],
    ['Madrid','Spain',40.4168,-3.7038,1],
    ['Rome','Italy',41.9028,12.4964,1],
    ['Lisbon','Portugal',38.7223,-9.1393,0],
    ['Stockholm','Sweden',59.3293,18.0686,1],
    ['Oslo','Norway',59.9139,10.7522,1],
    ['Copenhagen','Denmark',55.6761,12.5683,1],
    ['Moscow','Russia',55.7558,37.6173,3],
    ['Istanbul','Turkey',41.0082,28.9784,3],
    ['Athens','Greece',37.9838,23.7275,2],
    ['Cairo','Egypt',30.0444,31.2357,2],
    ['Nairobi','Kenya',-1.2921,36.8219,3],
    ['Lagos','Nigeria',6.5244,3.3792,1],
    ['Johannesburg','South Africa',-26.2041,28.0473,2],
    ['Cape Town','South Africa',-33.9249,18.4241,2],
    ['Durban','South Africa',-29.8587,31.0218,2],
    ['New York','New York, USA',40.7128,-74.0060,-5],
    ['Los Angeles','California, USA',34.0522,-118.2437,-8],
    ['San Francisco','California, USA',37.7749,-122.4194,-8],
    ['San Jose','California, USA',37.3382,-121.8863,-8],
    ['Chicago','Illinois, USA',41.8781,-87.6298,-6],
    ['Houston','Texas, USA',29.7604,-95.3698,-6],
    ['Dallas','Texas, USA',32.7767,-96.7970,-6],
    ['Austin','Texas, USA',30.2672,-97.7431,-6],
    ['Seattle','Washington, USA',47.6062,-122.3321,-8],
    ['Boston','Massachusetts, USA',42.3601,-71.0589,-5],
    ['Atlanta','Georgia, USA',33.7490,-84.3880,-5],
    ['Washington','DC, USA',38.9072,-77.0369,-5],
    ['Philadelphia','Pennsylvania, USA',39.9526,-75.1652,-5],
    ['Phoenix','Arizona, USA',33.4484,-112.0740,-7],
    ['Miami','Florida, USA',25.7617,-80.1918,-5],
    ['Detroit','Michigan, USA',42.3314,-83.0458,-5],
    ['Denver','Colorado, USA',39.7392,-104.9903,-7],
    ['Edison','New Jersey, USA',40.5187,-74.4121,-5],
    ['Toronto','Canada',43.6532,-79.3832,-5],
    ['Vancouver','Canada',49.2827,-123.1207,-8],
    ['Montreal','Canada',45.5017,-73.5673,-5],
    ['Calgary','Canada',51.0447,-114.0719,-7],
    ['Mexico City','Mexico',19.4326,-99.1332,-6],
    ['Sao Paulo','Brazil',-23.5505,-46.6333,-3],
    ['Rio de Janeiro','Brazil',-22.9068,-43.1729,-3],
    ['Buenos Aires','Argentina',-34.6037,-58.3816,-3],
    ['Santiago','Chile',-33.4489,-70.6693,-4],
    ['Lima','Peru',-12.0464,-77.0428,-5],
    ['Bogota','Colombia',4.7110,-74.0721,-5],
    ['Sydney','Australia',-33.8688,151.2093,10],
    ['Melbourne','Australia',-37.8136,144.9631,10],
    ['Brisbane','Australia',-27.4698,153.0251,10],
    ['Perth','Australia',-31.9505,115.8605,8],
    ['Adelaide','Australia',-34.9285,138.6007,9.5],
    ['Auckland','New Zealand',-36.8485,174.7633,12],
    ['Wellington','New Zealand',-41.2865,174.7762,12],
    ['Suva','Fiji',-18.1248,178.4501,12],
    ['Port Louis','Mauritius',-20.1609,57.5012,4]
  ];

  function searchLocalCities(query) {
    var q = query.trim().toLowerCase();
    if (!q) return [];
    var starts = [], contains = [];
    CITIES.forEach(function (c) {
      var name = c[0].toLowerCase();
      var hay = (c[0] + ', ' + c[1]).toLowerCase();
      var entry = {
        lat: c[2], lon: c[3], main: c[0], sub: c[1],
        full: c[0] + ', ' + c[1], tz: c[4], local: true
      };
      if (name.indexOf(q) === 0) starts.push(entry);
      else if (hay.indexOf(q) >= 0) contains.push(entry);
    });
    return starts.concat(contains).slice(0, 7);
  }

  // ---- Geocoding / place autocomplete ----
  function debounce(fn, wait) {
    var t = null;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  function placeSuggestions(query) {
    var url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=7&q=' + encodeURIComponent(query);
    return fetch(url, { headers: { 'Accept': 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('Lookup failed'); return r.json(); })
      .then(function (arr) {
        return (arr || []).map(function (item) {
          var a = item.address || {};
          var main = a.city || a.town || a.village || a.hamlet || a.municipality || a.suburb ||
            item.name || a.county || a.state_district || item.display_name.split(',')[0];
          var subParts = [a.state, a.country].filter(Boolean);
          return {
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            main: main,
            sub: subParts.join(', ') || item.display_name,
            full: item.display_name
          };
        });
      });
  }

  var UTC_OFFSETS = [
    -12,-11,-10,-9.5,-9,-8,-7,-6,-5,-4.5,-4,-3.5,-3,-2,-1,0,
    1,2,3,3.5,4,4.5,5,5.5,5.75,6,6.5,7,8,8.75,9,9.5,10,10.5,11,12,12.75,13,14
  ];
  function offsetLabel(o) {
    var sign = o >= 0 ? '+' : '-';
    var abs = Math.abs(o);
    var h = Math.floor(abs);
    var m = Math.round((abs - h) * 60);
    return 'UTC' + sign + String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0');
  }
  // Short zone abbreviation for the collapsed birth-details summary. A UTC
  // offset alone doesn't uniquely identify a named zone (several zones can
  // share +05:30, say), so this only special-cases the one abbreviation this
  // app already privileges elsewhere (offsetLabel's own "(India Standard
  // Time)" note on the +5.5 dropdown option) and falls back to the plain
  // UTC±HH:MM form for every other offset, rather than guessing a name.
  function tzAbbrev(o) {
    if (o === 5.5) return 'IST';
    return offsetLabel(o);
  }
  // "HH:MM" (24-hour, straight off <input type="time">) -> "H:MMam/pm"
  // (no leading zero, no space before the suffix, lowercase) for the
  // collapsed birth-details summary.
  function formatTime12(t) {
    if (!t) return '12:00pm';
    var parts = t.split(':');
    var h = parseInt(parts[0], 10);
    var m = parts[1] || '00';
    var ampm = h >= 12 ? 'pm' : 'am';
    var h12 = h % 12; if (h12 === 0) h12 = 12;
    return h12 + ':' + m + ampm;
  }
  function populateOffsets() {
    var sel = document.getElementById('offsetInput');
    UTC_OFFSETS.forEach(function (o) {
      var opt = document.createElement('option');
      opt.value = String(o);
      opt.textContent = offsetLabel(o) + (o === 5.5 ? '  (India Standard Time)' : '');
      sel.appendChild(opt);
    });
    sel.value = '5.5';
  }

  // ---- Saved birth profiles ----
  // Persists to localStorage when it is available, and falls back to in-memory
  // storage for the current session when it is not (private browsing, sandboxed
  // frame, or a restrictive file:// policy) so the feature never throws.
  var PROFILE_KEY = 'vedicChartProfiles.v1';
  var memoryProfiles = {};
  // Prefer localStorage (survives closing the browser), fall back to
  // sessionStorage (survives reloads in this tab), then to plain memory.
  // Sandboxed preview frames block both, so memory keeps the feature usable.
  var STORAGE = (function () {
    var names = ['localStorage', 'sessionStorage'];
    for (var i = 0; i < names.length; i++) {
      try {
        var s = window[names[i]];
        var k = '__vc_probe__';
        s.setItem(k, '1'); s.removeItem(k);
        return { store: s, kind: names[i] };
      } catch (e) { /* blocked — try the next one */ }
    }
    return { store: null, kind: 'memory' };
  })();

  function loadProfiles() {
    if (!STORAGE.store) return memoryProfiles;
    try { return JSON.parse(STORAGE.store.getItem(PROFILE_KEY) || '{}') || {}; }
    catch (e) { return memoryProfiles; }
  }
  function persistProfiles(obj) {
    memoryProfiles = obj;
    if (!STORAGE.store) return;
    try { STORAGE.store.setItem(PROFILE_KEY, JSON.stringify(obj)); } catch (e) { /* quota / blocked */ }
  }
  function saveProfile(p) {
    if (!p.name) return;
    var all = loadProfiles();
    all[p.name.trim().toLowerCase()] = p;
    persistProfiles(all);
  }
  function deleteProfile(key) {
    var all = loadProfiles();
    delete all[key];
    persistProfiles(all);
  }
  function findProfiles(q) {
    var all = loadProfiles();
    var list = Object.keys(all).map(function (k) { return all[k]; }).filter(Boolean);
    list.sort(function (a, b) { return (b.savedAt || 0) - (a.savedAt || 0); });
    var s = (q || '').trim().toLowerCase();
    if (!s) return list.slice(0, 8);
    var starts = list.filter(function (p) { return p.name.toLowerCase().indexOf(s) === 0; });
    var rest = list.filter(function (p) { return p.name.toLowerCase().indexOf(s) > 0; });
    return starts.concat(rest).slice(0, 8);
  }

  // ---- Tabbed detail sections ----
  var LAYOUT_KEY = 'vedicChartTabLayout.v1';
  var ORDER_KEY  = 'vedicChartTabOrder.v1';
  var CUSTOM_KEY = 'vedicChartCustomTabs.v1';
  var NOTES_KEY  = 'vedicChartNotes.v1';
  var memoryStore = {};

  function prefGet(key) {
    if (STORAGE.store) { try { return STORAGE.store.getItem(key); } catch (e) {} }
    return memoryStore[key] === undefined ? null : memoryStore[key];
  }
  function prefSet(key, val) {
    memoryStore[key] = val;
    if (STORAGE.store) { try { STORAGE.store.setItem(key, val); } catch (e) {} }
  }
  function jsonGet(key, fallback) {
    try { return JSON.parse(prefGet(key) || '') || fallback; } catch (e) { return fallback; }
  }

  // notes are kept per person, so a chart for someone else does not show their notes
  var notesProfileKey = 'default';
  var notesProfileName = '';
  function allNotes() { return jsonGet(NOTES_KEY, {}); }
  function noteFor(tabId) {
    var n = allNotes()[tabId] || {};
    return n[notesProfileKey] || '';
  }
  function setNote(tabId, text) {
    var all = allNotes();
    all[tabId] = all[tabId] || {};
    all[tabId][notesProfileKey] = text;
    prefSet(NOTES_KEY, JSON.stringify(all));
  }

  var tabApis = [];
  var collapseForm = function () {};

  function initTabs(wrapId) {
    var wrap = document.getElementById(wrapId);
    var K = function (base) { return base + ':' + wrapId; };
    if (!wrap) return;
    var strip = wrap.querySelector('.tabstrip');
    var box = wrap.querySelector('.panelbox');
    if (!strip || !box) return;

    function tabs() { return [].slice.call(strip.querySelectorAll('[role="tab"]')); }
    function panelOf(t) { return document.getElementById(t.getAttribute('aria-controls')); }

    function select(tab, focus) {
      tabs().forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var pn = panelOf(t);
        if (pn) pn.hidden = !on;
      });
      if (focus) tab.focus();
      var p = panelOf(tab);
      if (p && p.querySelector('#dashaTree')) scrollTreeToSelection();
    }

    function saveOrder() {
      prefSet(K(ORDER_KEY), JSON.stringify(tabs().map(function (t) { return t.id; })));
    }

    function move(tab, beforeNode) {
      strip.insertBefore(tab, beforeNode);
      // keep panel order in step with tab order (matters for printing)
      tabs().forEach(function (t) { var p = panelOf(t); if (p) box.appendChild(p); });
      saveOrder();
    }

    // ---- drag to reorder ----
    var dragged = null;
    function clearMarks() {
      tabs().forEach(function (t) { t.classList.remove('drop-before', 'drop-after'); });
    }
    function wireDrag(tab) {
      tab.draggable = true;
      tab.addEventListener('dragstart', function (ev) {
        dragged = tab; tab.classList.add('dragging');
        try { ev.dataTransfer.setData('text/plain', tab.id); ev.dataTransfer.effectAllowed = 'move'; } catch (e) {}
      });
      tab.addEventListener('dragend', function () {
        tab.classList.remove('dragging'); clearMarks(); dragged = null;
      });
      tab.addEventListener('dragover', function (ev) {
        if (!dragged || dragged === tab) return;
        ev.preventDefault();
        try { ev.dataTransfer.dropEffect = 'move'; } catch (e) {}
        var r = tab.getBoundingClientRect();
        var vertical = wrap.classList.contains('rail');
        var after = vertical ? (ev.clientY > r.top + r.height / 2)
                             : (ev.clientX > r.left + r.width / 2);
        clearMarks();
        tab.classList.add(after ? 'drop-after' : 'drop-before');
      });
      tab.addEventListener('dragleave', function () { tab.classList.remove('drop-before', 'drop-after'); });
      tab.addEventListener('drop', function (ev) {
        if (!dragged || dragged === tab) return;
        ev.preventDefault();
        var after = tab.classList.contains('drop-after');
        clearMarks();
        move(dragged, after ? tab.nextSibling : tab);
      });
    }

    function wireTab(tab) {
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (ev) {
        var list = tabs(), i = list.indexOf(tab), n = list.length;
        // Ctrl/Alt + arrow reorders — the keyboard equivalent of dragging
        if ((ev.ctrlKey || ev.altKey || ev.metaKey) &&
            (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight' ||
             ev.key === 'ArrowUp' || ev.key === 'ArrowDown')) {
          ev.preventDefault();
          var back = ev.key === 'ArrowLeft' || ev.key === 'ArrowUp';
          if (back && i > 0) move(tab, list[i - 1]);
          else if (!back && i < n - 1) move(tab, list[i + 1].nextSibling);
          tab.focus();
          return;
        }
        var j = null;
        if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') j = (i + 1) % n;
        else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') j = (i - 1 + n) % n;
        else if (ev.key === 'Home') j = 0;
        else if (ev.key === 'End') j = n - 1;
        if (j !== null) { ev.preventDefault(); select(list[j], true); }
      });
      wireDrag(tab);
    }

    // ---- custom note tabs ----
    function customList() { return jsonGet(K(CUSTOM_KEY), []); }
    function saveCustom(list) { prefSet(K(CUSTOM_KEY), JSON.stringify(list)); }

    function buildCustom(id, label) {
      var tab = document.createElement('button');
      tab.setAttribute('role', 'tab');
      tab.id = 'tab-' + id;
      tab.setAttribute('aria-controls', 'panel-' + id);
      tab.setAttribute('aria-selected', 'false');
      tab.tabIndex = -1;
      tab.dataset.custom = '1';
      tab.textContent = label;
      strip.appendChild(tab);

      var panel = document.createElement('div');
      panel.setAttribute('role', 'tabpanel');
      panel.id = 'panel-' + id;
      panel.setAttribute('aria-labelledby', tab.id);
      panel.hidden = true;
      panel.innerHTML =
        '<section class="block">' +
          '<h2 class="custom-title"></h2>' +
          '<div class="notes-head">' +
            '<label>Tab name<input type="text" class="tab-rename" maxlength="28"></label>' +
            '<span class="notes-scope"></span>' +
            '<button type="button" class="notes-del">Delete tab</button>' +
          '</div>' +
          '<textarea class="notes-area" placeholder="Anything you want to keep with this chart — readings, questions, dates to watch…"></textarea>' +
          '<div class="notes-saved"></div>' +
        '</section>';
      box.appendChild(panel);

      panel.querySelector('.custom-title').textContent = label;
      var nameInput = panel.querySelector('.tab-rename');
      nameInput.value = label;
      nameInput.addEventListener('input', function () {
        var v = nameInput.value.trim() || 'Untitled';
        tab.textContent = v;
        panel.querySelector('.custom-title').textContent = v;
        var list = customList().map(function (c) { return c.id === id ? { id: id, label: v } : c; });
        saveCustom(list);
      });

      var area = panel.querySelector('.notes-area');
      var saved = panel.querySelector('.notes-saved');
      area.value = noteFor(id);
      var timer = null;
      area.addEventListener('input', function () {
        clearTimeout(timer);
        saved.textContent = 'Saving…';
        timer = setTimeout(function () {
          setNote(id, area.value);
          saved.textContent = 'Saved' + (STORAGE.kind === 'memory' ? ' for this session only' : '');
        }, 400);
      });

      panel.querySelector('.notes-del').addEventListener('click', function () {
        var list = customList().filter(function (c) { return c.id !== id; });
        saveCustom(list);
        var all = allNotes(); delete all[id]; prefSet(NOTES_KEY, JSON.stringify(all));
        var nxt = tabs().filter(function (t) { return t !== tab; })[0];
        tab.remove(); panel.remove();
        saveOrder();
        if (nxt) select(nxt, true);
      });

      panel.__scope = function () {
        panel.querySelector('.notes-scope').textContent =
          'Notes kept for ' + (notesProfileKey === 'default' ? 'charts with no name' : '“' + notesProfileName + '”');
        area.value = noteFor(id);
      };
      panel.__scope();

      wireTab(tab);
      return tab;
    }

    // existing tabs
    tabs().forEach(wireTab);

    // restore saved custom tabs, then saved order
    customList().forEach(function (c) { buildCustom(c.id, c.label); });

    // A saved order predates any tab added in a later build, so splice unknown
    // tabs back in beside their markup neighbour rather than letting them drift
    // to the front (which is what a plain append-the-saved-ones pass would do).
    var order = jsonGet(K(ORDER_KEY), null);
    if (order && order.length) {
      var natural = tabs().map(function (t) { return t.id; });
      var final = order.filter(function (id) {
        var t = document.getElementById(id);
        return t && strip.contains(t);
      });
      natural.forEach(function (id, i) {
        if (final.indexOf(id) >= 0) return;
        var at = 0;
        for (var j = i - 1; j >= 0; j--) {
          var k = final.indexOf(natural[j]);
          if (k >= 0) { at = k + 1; break; }
        }
        final.splice(at, 0, id);
      });
      final.forEach(function (id) {
        var t = document.getElementById(id);
        if (t) strip.appendChild(t);
      });
      tabs().forEach(function (t) { var p = panelOf(t); if (p) box.appendChild(p); });
    }

    var addBtn = wrap.querySelector('.tab-add');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        var list = customList();
        var id = 'custom' + Date.now().toString(36);
        var label = 'Notes' + (list.length ? ' ' + (list.length + 1) : '');
        list.push({ id: id, label: label });
        saveCustom(list);
        var tab = buildCustom(id, label);
        saveOrder();
        select(tab, false);
        var input = document.getElementById('panel-' + id).querySelector('.tab-rename');
        input.focus(); input.select();
      });
    }

    // ---- folder vs side rail: one toggle button, label names the action ----
    var layoutBtn = wrap.querySelector('.layout-toggle');
    function applyLayout(kind) {
      wrap.classList.toggle('rail', kind === 'rail');
      if (layoutBtn) {
        layoutBtn.textContent = kind === 'rail' ? 'Folder tabs' : 'Side rail';
        layoutBtn.setAttribute('aria-pressed', kind === 'rail' ? 'true' : 'false');
      }
      scrollTreeToSelection();
    }
    if (layoutBtn) {
      layoutBtn.addEventListener('click', function () {
        var kind = wrap.classList.contains('rail') ? 'folder' : 'rail';
        applyLayout(kind);
        prefSet(K(LAYOUT_KEY), kind);
      });
    }
    applyLayout(prefGet(K(LAYOUT_KEY)) || 'folder');

    select(tabs()[0], false);

    tabApis.push({
      refreshScope: function (key, display) {
        notesProfileKey = key || 'default';
        notesProfileName = display || '';
        [].slice.call(box.querySelectorAll('[role="tabpanel"]')).forEach(function (p) {
          if (p.__scope) p.__scope();
        });
      }
    });
  }


  // ---- Simulation board: place the Lagna and nine planets into signs ----
  // Signs are laid out exactly as in the South Indian chart so the board reads
  // like the chart it will produce. Two ways in: click a token then a sign, or
  // drag the token across. Clicking a placed chip picks it back up.
  var SIM_KEY = 'vedicChartSimPlacements.v1';
  var SIM_TOKENS = ['Asc'].concat(PLANET_ORDER);
  var SIM_SHORT = { Asc: 'Asc', Sun: 'Sun', Moon: 'Moon', Mars: 'Mars', Mercury: 'Merc',
                    Jupiter: 'Jup', Venus: 'Ven', Saturn: 'Sat', Rahu: 'Rahu', Ketu: 'Ketu' };
  var simPlace = {};      // token -> sign index
  var simArmed = null;    // token currently picked up

  function simLoad() { simPlace = jsonGet(SIM_KEY, {}) || {}; }
  function simSave() { prefSet(SIM_KEY, JSON.stringify(simPlace)); }

  function simSet(token, signIdx) {
    simPlace[token] = signIdx;
    // the nodes are always exactly opposite, so one placement fixes both
    if (token === 'Rahu') simPlace.Ketu = (signIdx + 6) % 12;
    if (token === 'Ketu') simPlace.Rahu = (signIdx + 6) % 12;
    simSave();
  }

  function simRemove(token) {
    delete simPlace[token];
    if (token === 'Rahu') delete simPlace.Ketu;
    if (token === 'Ketu') delete simPlace.Rahu;
    simSave();
  }

  // Physical constraints the sky imposes. Mercury never strays more than about
  // 28 degrees from the Sun and Venus no more than 48, which at sign level caps
  // them at one and two signs away. The nodes are always exactly opposite.
  var SIM_LIMITS = { Mercury: 1, Venus: 2 };

  function signGap(a, b) {
    var d = Math.abs(a - b) % 12;
    return Math.min(d, 12 - d);
  }

  // Signs a token may legally occupy, or null when nothing constrains it
  function simAllowed(token) {
    if (token === 'Ketu' && simPlace.Rahu !== undefined) return [(simPlace.Rahu + 6) % 12];
    if (token === 'Rahu' && simPlace.Ketu !== undefined) return [(simPlace.Ketu + 6) % 12];
    var cap = SIM_LIMITS[token];
    if (cap === undefined || simPlace.Sun === undefined) return null;
    var out = [];
    for (var i = 0; i < 12; i++) if (signGap(i, simPlace.Sun) <= cap) out.push(i);
    return out;
  }

  // Anything currently placed that the sky would not allow
  function simConflicts() {
    var out = [];
    Object.keys(SIM_LIMITS).forEach(function (t) {
      if (simPlace[t] === undefined || simPlace.Sun === undefined) return;
      var gap = signGap(simPlace[t], simPlace.Sun);
      if (gap > SIM_LIMITS[t]) {
        out.push(t + ' is ' + gap + ' signs from the Sun — it never goes beyond ' +
          (SIM_LIMITS[t] === 1 ? 'one' : 'two') + ', so this cannot occur in the sky.');
      }
    });
    if (simPlace.Rahu !== undefined && simPlace.Ketu !== undefined &&
        (simPlace.Rahu + 6) % 12 !== simPlace.Ketu) {
      out.push('Rahu and Ketu must sit exactly opposite each other.');
    }
    return out;
  }

  function simArm(token) {
    simArmed = simArmed === token ? null : token;
    renderSimBoard();
  }

  function renderSimBoard() {
    var board = document.getElementById('simBoard');
    var tray = document.getElementById('simTokens');
    var status = document.getElementById('simStatus');
    if (!board || !tray) return;

    // every token stays in the tray, so a planet already on the board can be
    // picked up and moved again without being removed first
    tray.innerHTML = '';
    SIM_TOKENS.forEach(function (t) {
      var at = simPlace[t];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sim-token' + (t === 'Asc' ? ' asc' : '') +
        (simArmed === t ? ' armed' : '') + (at !== undefined ? ' placed' : '');
      btn.setAttribute('data-token', t);
      btn.setAttribute('aria-pressed', simArmed === t ? 'true' : 'false');
      btn.draggable = true;
      if (t !== 'Asc') {
        var sym = document.createElement('span');
        sym.className = 'tok-sym';
        sym.textContent = PLANET_SYMBOL[t];
        btn.appendChild(sym);
      }
      btn.appendChild(document.createTextNode(t === 'Asc' ? 'Lagna (Asc)' : t));
      if (at !== undefined) {
        var wh = document.createElement('span');
        wh.className = 'tok-at';
        wh.textContent = SIGN_SYMBOL[at];
        btn.appendChild(wh);
        btn.title = (t === 'Asc' ? 'Lagna' : t) + ' is in ' + E.SIGNS[at] +
          ' — pick it up to move it to another sign';
      }
      btn.addEventListener('click', function () { simArm(t); });
      btn.addEventListener('dragstart', function (e) {
        simArmed = t;
        btn.classList.add('dragging');
        try { e.dataTransfer.setData('text/plain', t); } catch (err) {}
        e.dataTransfer.effectAllowed = 'move';
      });
      btn.addEventListener('dragend', function () { btn.classList.remove('dragging'); });
      tray.appendChild(btn);
    });

    var ascSign = simPlace.Asc;
    board.innerHTML = '';
    var cells = {};
    for (var sIdx = 0; sIdx < 12; sIdx++) {
      var rc = SOUTH_LAYOUT[sIdx];
      var cell = document.createElement('button');
      cell.type = 'button';
      var legal = simArmed ? simAllowed(simArmed) : null;
      var mirrors = simArmed === 'Rahu' || simArmed === 'Ketu';
      cell.className = 'sim-cell' + (ascSign === sIdx ? ' is-asc' : '') +
        (legal && legal.indexOf(sIdx) < 0 ? ' unlikely' : '') +
        (legal && legal.indexOf(sIdx) >= 0 ? ' allowed' : '');
      cell.style.gridRow = (rc[0] + 1);
      cell.style.gridColumn = (rc[1] + 1);
      cell.setAttribute('data-sign', sIdx);
      var head = document.createElement('span');
      head.className = 'cell-sign';
      head.textContent = SIGN_SYMBOL[sIdx] + ' ' + E.SIGNS[sIdx];
      cell.appendChild(head);
      if (ascSign !== undefined) {
        var h = document.createElement('span');
        h.className = 'cell-house';
        h.textContent = 'House ' + (((sIdx - ascSign + 12) % 12) + 1);
        cell.appendChild(h);
      }
      var items = document.createElement('span');
      items.className = 'cell-items';
      cell.appendChild(items);
      cells[sIdx] = items;
      (function (idx, el) {
        el.addEventListener('click', function (ev) {
          if (ev.target !== el && ev.target.closest('.sim-chip')) return;
          if (!simArmed) return;
          simSet(simArmed, idx);
          simArmed = null;
          renderSimBoard();
        });
        el.addEventListener('dragover', function (ev) { ev.preventDefault(); el.classList.add('over'); });
        el.addEventListener('dragleave', function () { el.classList.remove('over'); });
        el.addEventListener('drop', function (ev) {
          ev.preventDefault();
          el.classList.remove('over');
          var t = simArmed;
          try { t = ev.dataTransfer.getData('text/plain') || simArmed; } catch (err) {}
          if (!t) return;
          simSet(t, idx);
          simArmed = null;
          renderSimBoard();
        });
      })(sIdx, cell);
      board.appendChild(cell);
    }

    var centre = document.createElement('div');
    centre.className = 'sim-centre';
    if (simArmed) {
      var lim = SIM_LIMITS[simArmed];
      centre.textContent = 'Now choose a sign for ' + (simArmed === 'Asc' ? 'the Lagna' : simArmed) +
        (lim !== undefined && simPlace.Sun !== undefined
          ? ' — it stays within ' + (lim === 1 ? 'one sign' : 'two signs') + ' of the Sun'
          : (simArmed === 'Rahu' || simArmed === 'Ketu'
              ? ' — the other node follows opposite' : ''));
    } else {
      centre.textContent = 'Signs are fixed. Pick a token on the left, then a sign.';
    }
    board.appendChild(centre);

    // placed chips, in a stable order
    SIM_TOKENS.forEach(function (t) {
      var idx = simPlace[t];
      if (idx === undefined || !cells[idx]) return;
      var cellSign = idx;
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'sim-chip' + (t === 'Asc' ? ' asc' : '');
      chip.textContent = (t === 'Asc' ? '' : PLANET_SYMBOL[t] + ' ') + SIM_SHORT[t];
      chip.title = 'Click to pick ' + (t === 'Asc' ? 'the Lagna' : t) + ' back up';
      chip.addEventListener('dragover', function (ev) { ev.preventDefault(); });
      chip.addEventListener('drop', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var dropped = simArmed;
        try { dropped = ev.dataTransfer.getData('text/plain') || simArmed; } catch (err) {}
        if (!dropped) return;
        simSet(dropped, cellSign);
        simArmed = null;
        renderSimBoard();
      });
      chip.addEventListener('click', function (ev) {
        ev.stopPropagation();
        // with a token in hand, a click anywhere in the cell drops it there —
        // otherwise a chip sitting under the pointer would swallow the drop
        if (simArmed) {
          simSet(simArmed, cellSign);
          simArmed = null;
        } else {
          simRemove(t);
          simArmed = t;
        }
        renderSimBoard();
      });
      cells[idx].appendChild(chip);
    });

    if (status) {
      var placed = SIM_TOKENS.filter(function (t) { return simPlace[t] !== undefined; }).length;
      var hasAsc = simPlace.Asc !== undefined;
      status.textContent = placed === SIM_TOKENS.length
        ? 'All 10 placed — ready to generate.'
        : placed + ' of 10 placed' + (hasAsc ? '' : ' — the Lagna is still needed to number the houses') + '.';
    }
    var warnBox = document.getElementById('simWarn');
    if (warnBox) {
      var issues = simConflicts();
      warnBox.innerHTML = '';
      warnBox.classList.toggle('hidden', !issues.length);
      if (issues.length) {
        var head = document.createElement('strong');
        head.textContent = issues.length === 1 ? 'This cannot happen in the sky'
                                               : 'These cannot happen in the sky';
        warnBox.appendChild(head);
        var ul = document.createElement('ul');
        issues.forEach(function (t) {
          var li = document.createElement('li'); li.textContent = t; ul.appendChild(li);
        });
        warnBox.appendChild(ul);
      }
    }
  }

  function initSimBoard() {
    var board = document.getElementById('simBoard');
    if (!board || board.__wired) return;
    board.__wired = true;
    simLoad();
    var clear = document.getElementById('simClear');
    if (clear) clear.addEventListener('click', function () {
      simPlace = {}; simArmed = null; simSave(); renderSimBoard();
    });
    renderSimBoard();
  }

  // ---- Build a chart object from hand placements ----
  // Same shape computeChart() returns, so every renderer below works unchanged.
  // Degrees are unknown, so anything degree-derived is left null rather than
  // invented: nakshatra, navamsa, tithi, dasha and Shadbala all stay empty.
  function buildSimResult(place) {
    var ascIdx = place.Asc;
    var planets = {};
    PLANET_ORDER.forEach(function (n) {
      var sIdx = place[n];
      planets[n] = {
        longitude: sIdx * 30,
        sign: E.SIGNS[sIdx],
        signIndex: sIdx,
        degree: null,
        degreeFormatted: '—',
        nakshatra: null,
        pada: null,
        nakshatraLord: null,
        house: ((sIdx - ascIdx + 12) % 12) + 1,
        retrograde: false,
        navamsaSignIndex: null,
        navamsaSign: null
      };
    });

    var relationships = {};
    E.RELATIONSHIP_GRAHAS.forEach(function (a) {
      relationships[a] = {};
      E.RELATIONSHIP_GRAHAS.forEach(function (bb) {
        var nat = E.naturalRel(a, bb);
        var tmp = a === bb ? 'Self' : E.temporaryRel(planets[a].signIndex, planets[bb].signIndex);
        relationships[a][bb] = {
          natural: nat,
          temporary: tmp,
          panchadha: a === bb ? 'Self' : E.panchadhaRel(nat, tmp)
        };
      });
    });

    return {
      simulated: true,
      ayanamsa: null,
      ascendant: {
        longitude: ascIdx * 30,
        sign: E.SIGNS[ascIdx],
        signIndex: ascIdx,
        degree: null,
        degreeFormatted: '—',
        nakshatra: null,
        navamsaSignIndex: null,
        navamsaSign: null
      },
      planets: planets,
      dasha: [],
      antardashas: [],
      relationships: relationships,
      tithi: null,
      moonSign: E.SIGNS[place.Moon],
      moonNakshatra: null
    };
  }

  // Sections a placement simply cannot fill are replaced by a short note
  function setSectionAvailability(simulated) {
    var tab = document.getElementById('tab-summary');
    var head = document.querySelector('#panel-summary h2');
    if (tab) tab.textContent = simulated ? 'Chart Summary' : 'Birth Details';
    if (head) head.textContent = simulated ? 'Chart Summary' : 'Birth Details';
    [['naNak', '#nakshatraTable'], ['naShad', '#shadbalaTable'], ['naBhava', '#bhavaBalaTable']].forEach(function (pair) {
      var note = document.getElementById(pair[0]);
      var tbl = document.querySelector(pair[1]);
      if (!note || !tbl) return;
      note.classList.toggle('hidden', !simulated);
      var wrap = tbl.closest('.table-wrap');
      if (wrap) wrap.classList.toggle('hidden', simulated);
    });
    var extras = document.querySelectorAll('#panel-strength .sub-note, #panel-strength h3');
    [].slice.call(extras).forEach(function (el) { el.classList.toggle('hidden', simulated); });
    // Viparita Raja Yoga needs Shadbala's own dispositor-house data the same
    // way Bhava Bala does, so it hides alongside it in Simulation mode.
    var vryPanel = document.getElementById('vryPanel');
    if (vryPanel) vryPanel.classList.toggle('hidden', simulated);
    // Navamsa needs exact degrees, which a hand-placed chart doesn't have.
    var d9Note = document.getElementById('naD9');
    var d9Charts = document.getElementById('navamsaCharts');
    if (d9Note) d9Note.classList.toggle('hidden', !simulated);
    if (d9Charts) d9Charts.classList.toggle('hidden', simulated);
    // Sthana/Kala breakdown: hide the whole label-row + toggle-button + table
    // together (not just the label text the generic sweep above catches),
    // so no orphaned toggle button is left showing with nothing to toggle.
    ['sthanaHeadRow', 'sthanaBody', 'kalaHeadRow', 'kalaBody'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.toggle('hidden', simulated);
    });
    var naD = document.getElementById('naDasha');
    var picker = document.querySelector('#panel2-dashas .dasha-picker');
    if (naD) naD.classList.toggle('hidden', !simulated);
    if (picker) picker.style.display = simulated ? 'none' : '';
  }

  function renderSimSummary(result) {
    var box = document.getElementById('summaryGrid');
    box.innerHTML = '';
    var f = computeFacts(result);
    var items = [
      ['Source', 'Simulation — planets placed by hand'],
      ['Ascendant (Lagna)', result.ascendant.sign],
      ['Moon Sign (Rashi)', result.moonSign],
      ['Sun Sign', result.planets.Sun.sign],
      ['Dominant duality', f.polarity[0].name + ' (' + f.polarity[0].count + ' of 9)'],
      ['Dominant modality', f.modality[0].name + ' (' + f.modality[0].count + ' of 9)'],
      ['Dominant element', f.element[0].name + ' (' + f.element[0].count + ' of 9)'],
      ['Not available', 'Degrees, nakshatra, navamsa, tithi, dasha and Shadbala — all need a birth time']
    ];
    items.forEach(function (it) {
      var row = document.createElement('div');
      row.className = 'dl-row';
      var dt = document.createElement('dt'); dt.textContent = it[0];
      var dd = document.createElement('dd'); dd.textContent = it[1];
      row.appendChild(dt); row.appendChild(dd);
      box.appendChild(row);
    });
  }

  function renderSimulation() {
    var need = SIM_TOKENS.filter(function (t) { return simPlace[t] === undefined; });
    var err = document.getElementById('formError');
    if (need.length) {
      err.classList.remove('hidden');
      err.innerHTML = '<strong>Still to place:</strong> ' +
        need.map(function (t) { return t === 'Asc' ? 'the Lagna' : t; }).join(', ');
      return;
    }
    err.classList.add('hidden');

    var result = buildSimResult(simPlace);
    lastResult = result; lastSb = null;
    setSectionAvailability(true);

    document.getElementById('results').classList.remove('hidden');
    renderSimSummary(result);
    renderFacts(result);
    renderInfluenceEngineTab(result, null);
    resetResearch();
    renderPlanetTable(result, null);
    renderHouseTable(result);
    renderRelationshipTables(result);

    var style = document.getElementById('chartStyleInput').value;
    var southCard = document.getElementById('southCardD1');
    var northCard = document.getElementById('northCardD1');
    applyChartView(prefGet(CHART_VIEW_KEY) || 'both');
    southCard.style.order = style === 'north' ? '2' : '1';
    northCard.style.order = style === 'north' ? '1' : '2';
    networkSelectedSigns = {};
    renderSouthChart('southChartD1', result, false, null);
    renderNorthChart('northChartD1', result, false, null);

    collapseForm({ simulated: true, asc: result.ascendant.sign });
  }

  // ---- Entry mode: Birth Chart vs Simulation Chart ----
  // Step one is the switch itself; the simulation builder lands behind it next.
  var ENTRY_MODE_KEY = 'vedicChartEntryMode.v1';

  function applyEntryMode(mode) {
    var isSim = mode === 'sim';
    var box = document.querySelector('.entry-switch');
    if (box) {
      [].slice.call(box.querySelectorAll('button')).forEach(function (b) {
        b.classList.toggle('on', (b.getAttribute('data-entry') === 'sim') === isSim);
      });
    }
    var birthFields = document.getElementById('birthFields');
    var simFields = document.getElementById('simFields');
    var foot = document.getElementById('formFoot');
    var hint = document.getElementById('entryHint');
    if (birthFields) birthFields.classList.toggle('hidden', isSim);
    if (simFields) simFields.classList.toggle('hidden', !isSim);
    if (foot) foot.classList.remove('hidden');
    var gen = document.getElementById('generateBtn');
    if (gen) gen.textContent = isSim ? 'Generate Simulated Chart' : 'Generate Chart';
    if (isSim) initSimBoard();
    if (hint) {
      hint.textContent = isSim
        ? 'Place planets by hand — no birth time needed.'
        : 'Enter a date, time and place.';
    }
  }

  function currentEntryMode() {
    return prefGet(ENTRY_MODE_KEY) === 'sim' ? 'sim' : 'birth';
  }

  // ---- Show / hide the whole tabbed section folder below the chart band ----
  var FOLDERS_KEY = 'vedicChartFoldersVisible.v1';

  function applyFoldersVisible(visible) {
    var wrap = document.getElementById('tabWrap');
    var band = document.getElementById('chartBand');
    var btn = document.getElementById('foldersToggleBtn');
    if (wrap) wrap.classList.toggle('collapsed', !visible);
    if (band) band.classList.toggle('folders-hidden', !visible);
    if (btn) {
      btn.textContent = visible ? 'Hide sections' : 'Show sections';
      btn.setAttribute('aria-expanded', visible ? 'true' : 'false');
    }
  }

  function initFoldersToggle() {
    var btn = document.getElementById('foldersToggleBtn');
    if (!btn || btn.__wired) return;
    btn.__wired = true;
    btn.addEventListener('click', function () {
      var nowVisible = document.getElementById('tabWrap').classList.contains('collapsed');
      prefSet(FOLDERS_KEY, nowVisible ? '1' : '0');
      applyFoldersVisible(nowVisible);
    });
    applyFoldersVisible(prefGet(FOLDERS_KEY) !== '0');
  }

  // ---- Show / hide the Nakshatra & Pada Details table ----
  var NAK_VISIBLE_KEY = 'vedicChartNakVisible.v1';

  function applyNakVisible(visible) {
    var body = document.getElementById('nakBody');
    var btn = document.getElementById('nakToggleBtn');
    if (body) body.classList.toggle('collapsed', !visible);
    if (btn) {
      btn.textContent = visible ? 'Hide' : 'Show';
      btn.setAttribute('aria-expanded', visible ? 'true' : 'false');
    }
  }

  function initNakToggle() {
    var btn = document.getElementById('nakToggleBtn');
    if (!btn || btn.__wired) return;
    btn.__wired = true;
    btn.addEventListener('click', function () {
      var nowVisible = document.getElementById('nakBody').classList.contains('collapsed');
      prefSet(NAK_VISIBLE_KEY, nowVisible ? '1' : '0');
      applyNakVisible(nowVisible);
    });
    applyNakVisible(prefGet(NAK_VISIBLE_KEY) !== '0');
  }

  // ---- Show / hide the Sthana Bala breakdown table (Strength tab) ----
  var STHANA_VISIBLE_KEY = 'vedicChartSthanaVisible.v1';

  function applySthanaVisible(visible) {
    var body = document.getElementById('sthanaBody');
    var btn = document.getElementById('sthanaToggleBtn');
    if (body) body.classList.toggle('collapsed', !visible);
    if (btn) {
      btn.textContent = visible ? 'Hide' : 'Show';
      btn.setAttribute('aria-expanded', visible ? 'true' : 'false');
    }
  }

  function initSthanaToggle() {
    var btn = document.getElementById('sthanaToggleBtn');
    if (!btn || btn.__wired) return;
    btn.__wired = true;
    btn.addEventListener('click', function () {
      var nowVisible = document.getElementById('sthanaBody').classList.contains('collapsed');
      prefSet(STHANA_VISIBLE_KEY, nowVisible ? '1' : '0');
      applySthanaVisible(nowVisible);
    });
    applySthanaVisible(prefGet(STHANA_VISIBLE_KEY) !== '0');
  }

  // ---- Show / hide the Kala Bala breakdown table (Strength tab) ----
  var KALA_VISIBLE_KEY = 'vedicChartKalaVisible.v1';

  function applyKalaVisible(visible) {
    var body = document.getElementById('kalaBody');
    var btn = document.getElementById('kalaToggleBtn');
    if (body) body.classList.toggle('collapsed', !visible);
    if (btn) {
      btn.textContent = visible ? 'Hide' : 'Show';
      btn.setAttribute('aria-expanded', visible ? 'true' : 'false');
    }
  }

  function initKalaToggle() {
    var btn = document.getElementById('kalaToggleBtn');
    if (!btn || btn.__wired) return;
    btn.__wired = true;
    btn.addEventListener('click', function () {
      var nowVisible = document.getElementById('kalaBody').classList.contains('collapsed');
      prefSet(KALA_VISIBLE_KEY, nowVisible ? '1' : '0');
      applyKalaVisible(nowVisible);
    });
    applyKalaVisible(prefGet(KALA_VISIBLE_KEY) !== '0');
  }

  // ---- South / North / Both — which D1 chart card(s) are shown ----
  var CHART_VIEW_KEY = 'vedicChartD1View.v1';

  function applyChartView(view) {
    var southCard = document.getElementById('southCardD1');
    var northCard = document.getElementById('northCardD1');
    if (!southCard || !northCard) return;
    southCard.classList.toggle('hidden', view === 'north');
    northCard.classList.toggle('hidden', view === 'south');
    var box = document.getElementById('chartViewSwitch');
    if (box) {
      [].slice.call(box.querySelectorAll('button')).forEach(function (b) {
        b.classList.toggle('on', b.getAttribute('data-view') === view);
      });
    }
  }

  function initChartViewSwitch() {
    var box = document.getElementById('chartViewSwitch');
    if (!box || box.__wired) return;
    box.__wired = true;
    [].slice.call(box.querySelectorAll('button')).forEach(function (b) {
      b.addEventListener('click', function () {
        var view = b.getAttribute('data-view');
        prefSet(CHART_VIEW_KEY, view);
        applyChartView(view);
      });
    });
    applyChartView(prefGet(CHART_VIEW_KEY) || 'both');
  }

  // ---- Expand / collapse the chart panel itself — independent of (and
  // stacks with) the "Hide sections" toggle, so the D1 chart(s) can be
  // grown without also having to hide the tabbed tables below. ----
  var CHART_EXPAND_KEY = 'vedicChartExpanded.v1';

  function applyChartExpanded(expanded) {
    var band = document.getElementById('chartBand');
    var btn = document.getElementById('chartExpandToggle');
    if (band) band.classList.toggle('chart-expanded', expanded);
    if (btn) {
      btn.textContent = expanded ? 'Collapse charts' : 'Expand charts';
      btn.setAttribute('aria-pressed', expanded ? 'true' : 'false');
    }
  }

  function initChartExpandToggle() {
    var btn = document.getElementById('chartExpandToggle');
    if (!btn || btn.__wired) return;
    btn.__wired = true;
    btn.addEventListener('click', function () {
      var band = document.getElementById('chartBand');
      var nowExpanded = !(band && band.classList.contains('chart-expanded'));
      prefSet(CHART_EXPAND_KEY, nowExpanded ? '1' : '0');
      applyChartExpanded(nowExpanded);
    });
    applyChartExpanded(prefGet(CHART_EXPAND_KEY) === '1');
  }

  function initNetworkToggle() {
    var box = document.getElementById('networkToggle');
    if (!box || box.__wired) return;
    box.__wired = true;
    networkEnabled = prefGet(NETWORK_VIEW_KEY) === '1';
    box.checked = networkEnabled;
    var inBox = document.getElementById('networkInToggle');
    var outBox = document.getElementById('networkOutToggle');
    // In/Out only mean something while the network is on: turning it on
    // ticks both (the full picture), turning it off unticks and disables them.
    function syncDirBoxes() {
      networkShowIn = networkShowOut = networkEnabled;
      [inBox, outBox].forEach(function (b) {
        if (!b) return;
        b.checked = networkEnabled;
        b.disabled = !networkEnabled;
      });
    }
    syncDirBoxes();
    box.addEventListener('change', function () {
      networkEnabled = box.checked;
      prefSet(NETWORK_VIEW_KEY, networkEnabled ? '1' : '0');
      networkSelectedSigns = {};
      syncDirBoxes();
      if (lastResult) renderSouthChart('southChartD1', lastResult, false, lastSb);
    });
    [[inBox, 'in'], [outBox, 'out']].forEach(function (pair) {
      if (!pair[0]) return;
      pair[0].addEventListener('change', function () {
        if (pair[1] === 'in') networkShowIn = pair[0].checked;
        else networkShowOut = pair[0].checked;
        if (lastResult) renderSouthChart('southChartD1', lastResult, false, lastSb);
      });
    });
  }

  function initDashaActivationToggle() {
    var box = document.getElementById('dashaActivationToggle');
    if (!box || box.__wired) return;
    box.__wired = true;
    dashaActivationEnabled = prefGet(DASHA_ACTIVATION_VIEW_KEY) === '1';
    box.checked = dashaActivationEnabled;
    box.addEventListener('change', function () {
      dashaActivationEnabled = box.checked;
      prefSet(DASHA_ACTIVATION_VIEW_KEY, dashaActivationEnabled ? '1' : '0');
      // Safe to use the module-level lastResult/lastSb here (unlike the hook
      // inside showDetail) — a checkbox click only ever happens once a chart
      // is already on screen, so they're guaranteed to match what's shown.
      if (lastResult) renderSouthChart('southChartD1', lastResult, false, lastSb);
    });
  }

  function initEntryMode() {
    var box = document.querySelector('.entry-switch');
    if (!box || box.__wired) return;
    box.__wired = true;
    [].slice.call(box.querySelectorAll('button')).forEach(function (b) {
      b.addEventListener('click', function () {
        var mode = b.getAttribute('data-entry');
        prefSet(ENTRY_MODE_KEY, mode);
        applyEntryMode(mode);
      });
    });
    applyEntryMode(prefGet(ENTRY_MODE_KEY) === 'sim' ? 'sim' : 'birth');
  }

  // ---- Wire up UI ----
  function init() {
    initEntryMode();
    initChartViewSwitch();
    initChartExpandToggle();
    initNetworkToggle();
    initDashaActivationToggle();
    initFoldersToggle();
    initNakToggle();
    initSthanaToggle();
    initKalaToggle();
    initResearchTab();
    populateOffsets();
    initTabs('tabWrap');
    initSideTabs();
    var placeInput = document.getElementById('placeInput');
    var suggestBox = document.getElementById('placeSuggestions');
    var latInput = document.getElementById('latInput');
    var lonInput = document.getElementById('lonInput');
    var geoStatus = document.getElementById('geoStatus');

    var currentResults = [];
    var activeIndex = -1;
    var requestId = 0;
    var placeConfirmed = false;

    function closeSuggestions() {
      suggestBox.classList.add('hidden');
      suggestBox.innerHTML = '';
      currentResults = [];
      activeIndex = -1;
    }

    function selectResult(res) {
      latInput.value = res.lat.toFixed(4);
      lonInput.value = res.lon.toFixed(4);
      latInput.classList.remove('invalid');
      lonInput.classList.remove('invalid');
      placeInput.value = res.main + (res.sub ? ', ' + res.sub : '');
      var note = '';
      if (res.tz !== undefined && res.tz !== null) {
        var sel = document.getElementById('offsetInput');
        if (sel.querySelector('option[value="' + res.tz + '"]')) {
          sel.value = String(res.tz);
          note = ' — UTC offset set to ' + offsetLabel(res.tz) + ' (adjust if daylight saving applied at birth)';
        }
      }
      geoStatus.textContent = '✓ ' + res.full + note;
      geoStatus.className = 'geo-status ok';
      placeConfirmed = true;
      closeSuggestions();
    }

    function renderSuggestions(results) {
      currentResults = results;
      activeIndex = -1;
      suggestBox.innerHTML = '';
      if (!results.length) {
        var empty = document.createElement('li');
        empty.className = 'suggestion-empty';
        empty.textContent = 'No matching places found';
        suggestBox.appendChild(empty);
      } else {
        results.forEach(function (res, i) {
          var li = document.createElement('li');
          li.className = 'suggestion-item';
          var mainLine = document.createElement('span');
          mainLine.textContent = res.main;
          var subLine = document.createElement('span');
          subLine.className = 's-sub';
          subLine.textContent = res.sub;
          li.appendChild(mainLine);
          li.appendChild(subLine);
          li.addEventListener('mousedown', function (ev) { ev.preventDefault(); selectResult(res); });
          li.addEventListener('mouseenter', function () { setActive(i); });
          suggestBox.appendChild(li);
        });
      }
      suggestBox.classList.remove('hidden');
    }

    function setActive(i) {
      var items = suggestBox.querySelectorAll('.suggestion-item');
      items.forEach(function (el, idx) { el.classList.toggle('active', idx === i); });
      activeIndex = i;
    }

    function mergeResults(local, remote) {
      var out = local.slice();
      var seen = {};
      local.forEach(function (r) { seen[r.main.toLowerCase() + '|' + r.sub.toLowerCase()] = true; });
      remote.forEach(function (r) {
        // skip a remote hit that duplicates a built-in city within ~15km
        var dup = local.some(function (l) {
          return Math.abs(l.lat - r.lat) < 0.15 && Math.abs(l.lon - r.lon) < 0.15;
        });
        var key = r.main.toLowerCase() + '|' + r.sub.toLowerCase();
        if (!dup && !seen[key]) { seen[key] = true; out.push(r); }
      });
      return out.slice(0, 9);
    }

    var doLookup = debounce(function (query) {
      var myRequest = ++requestId;
      var local = searchLocalCities(query);
      placeSuggestions(query).then(function (remote) {
        if (myRequest !== requestId) return; // stale response, a newer query superseded it
        geoStatus.textContent = '';
        geoStatus.className = 'geo-status';
        renderSuggestions(mergeResults(local, remote));
      }).catch(function () {
        if (myRequest !== requestId) return;
        // Offline / blocked / rate-limited: fall back to the built-in city list.
        if (local.length) {
          geoStatus.textContent = 'Showing built-in cities (online place search unavailable).';
          geoStatus.className = 'geo-status';
          renderSuggestions(local);
        } else {
          geoStatus.textContent = 'Online place search is unavailable and no built-in city matched — type latitude and longitude directly below.';
          geoStatus.className = 'geo-status err';
          closeSuggestions();
        }
      });
    }, 300);

    placeInput.addEventListener('input', function () {
      placeConfirmed = false;
      var q = placeInput.value.trim();
      if (q.length < 2) { closeSuggestions(); geoStatus.textContent = ''; return; }
      // show built-in matches instantly, then refine with online results
      var local = searchLocalCities(q);
      if (local.length) renderSuggestions(local);
      else { geoStatus.textContent = 'Searching…'; geoStatus.className = 'geo-status'; }
      doLookup(q);
    });

    placeInput.addEventListener('keydown', function (ev) {
      var items = suggestBox.querySelectorAll('.suggestion-item');
      if (ev.key === 'Enter') {
        // Never let Enter submit the form straight from the place box — the
        // coordinates would still be empty. Pick the highlighted (or first)
        // suggestion instead, which is what pressing Enter here means.
        if (items.length && currentResults.length) {
          ev.preventDefault();
          selectResult(currentResults[activeIndex >= 0 ? activeIndex : 0]);
          return;
        }
        if (!latInput.value.trim() || !lonInput.value.trim()) {
          ev.preventDefault();
          geoStatus.textContent = 'Pick a place from the list, or type latitude and longitude below, before generating.';
          geoStatus.className = 'geo-status err';
          return;
        }
      }
      if (!items.length) return;
      if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        setActive(Math.min(activeIndex + 1, items.length - 1));
      } else if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        setActive(Math.max(activeIndex - 1, 0));
      } else if (ev.key === 'Escape') {
        closeSuggestions();
      }
    });

    placeInput.addEventListener('blur', function () {
      // slight delay so a mousedown-selection can register first
      setTimeout(function () {
        closeSuggestions();
        if (!placeConfirmed && placeInput.value.trim() && (!latInput.value || !lonInput.value)) {
          geoStatus.textContent = 'Pick a place from the dropdown, or enter latitude/longitude manually below.';
        }
      }, 150);
    });

    document.addEventListener('click', function (ev) {
      if (ev.target !== placeInput && !suggestBox.contains(ev.target)) closeSuggestions();
    });

    // ---- Name field: recall saved profiles as you type ----
    var nameInput = document.getElementById('nameInput');
    var nameBox = document.getElementById('nameSuggestions');
    var profileHint = document.getElementById('profileHint');
    var lastRecalled = null;
    var nameResults = [], nameActive = -1;

    function closeNameBox() {
      nameBox.classList.add('hidden');
      nameBox.innerHTML = '';
      nameResults = []; nameActive = -1;
    }
    function setNameActive(i) {
      var items = nameBox.querySelectorAll('.suggestion-item');
      items.forEach(function (el, idx) { el.classList.toggle('active', idx === i); });
      nameActive = i;
    }

    function updateProfileHint() {
      var n = Object.keys(loadProfiles()).length;
      var count = n ? n + ' saved profile' + (n > 1 ? 's' : '') + ' — start typing a name to recall'
                    : 'Saved automatically when you generate — retype a name to recall it';
      if (STORAGE.kind === 'localStorage') {
        profileHint.textContent = count;
      } else if (STORAGE.kind === 'sessionStorage') {
        profileHint.textContent = count + ' (kept until you close this tab)';
      } else {
        profileHint.textContent = n
          ? n + ' profile' + (n > 1 ? 's' : '') + ' held in memory only — this preview blocks storage, so download the file to keep them'
          : 'This preview blocks browser storage — profiles will last only while the page stays open';
      }
    }

    // force = the user explicitly picked this profile (click / arrow+Enter):
    //   overwrite everything. Otherwise this is a passive match on a fully typed
    //   name, which must never clobber details the user has already entered —
    //   it only fills fields that are still empty.
    function applyProfile(p, force) {
      var dateEl = document.getElementById('dateInput');
      var timeEl = document.getElementById('timeInput');
      var sel = document.getElementById('offsetInput');
      var untouched = !dateEl.value && !timeEl.value && !latInput.value &&
                      !lonInput.value && !placeInput.value;

      var filled = 0, skipped = 0;
      function put(el, v) {
        if (force || !el.value) { if (v) { el.value = v; filled++; } }
        else if (v && el.value !== v) skipped++;
      }

      nameInput.value = p.name;
      put(dateEl, p.date);
      put(timeEl, p.time);
      put(placeInput, p.place);
      put(latInput, p.lat);
      put(lonInput, p.lon);
      if ((force || untouched) && p.offset && sel.querySelector('option[value="' + p.offset + '"]')) {
        sel.value = String(p.offset);
      }
      var styleSel = document.getElementById('chartStyleInput');
      if ((force || untouched) && p.chartStyle &&
          styleSel.querySelector('option[value="' + p.chartStyle + '"]')) {
        styleSel.value = p.chartStyle;
      }
      var nodeSel = document.getElementById('nodeTypeInput');
      if ((force || untouched) && p.nodeType &&
          nodeSel.querySelector('option[value="' + p.nodeType + '"]')) {
        nodeSel.value = p.nodeType;
      }

      latInput.classList.remove('invalid');
      lonInput.classList.remove('invalid');
      dateEl.classList.remove('invalid');
      lastRecalled = p.name.trim().toLowerCase();
      if (latInput.value && lonInput.value) placeConfirmed = true;

      if (force || filled) {
        geoStatus.textContent = '✓ Recalled saved details for ' + p.name +
          (skipped ? ' (kept what you had already typed)' : '');
        geoStatus.className = 'geo-status ok';
      } else if (skipped && geoStatus.className.indexOf('ok') < 0) {
        geoStatus.textContent = 'Saved profile "' + p.name +
          '" found — click it in the list to replace what you have typed.';
        geoStatus.className = 'geo-status';
      }
      if (force) closeNameBox();
    }

    function renderNameBox(list) {
      nameBox.innerHTML = '';
      nameResults = list;
      nameActive = -1;
      if (!list.length) { closeNameBox(); return; }
      list.forEach(function (p, idx) {
        var li = document.createElement('li');
        li.className = 'suggestion-item profile';
        var main = document.createElement('span');
        main.className = 'p-main';
        var title = document.createElement('span');
        title.textContent = p.name;
        var sub = document.createElement('span');
        sub.className = 's-sub';
        sub.textContent = [p.date || 'no date', p.time || '12:00',
          p.place || ((p.lat || '?') + ', ' + (p.lon || '?'))].join(' · ');
        main.appendChild(title); main.appendChild(sub);
        main.addEventListener('mousedown', function (ev) { ev.preventDefault(); applyProfile(p, true); });
        li.addEventListener('mouseenter', function () { setNameActive(idx); });

        var del = document.createElement('button');
        del.type = 'button';
        del.className = 'profile-del';
        del.textContent = '×';
        del.title = 'Delete this saved profile';
        del.addEventListener('mousedown', function (ev) {
          ev.preventDefault(); ev.stopPropagation();
          deleteProfile(p.name.trim().toLowerCase());
          updateProfileHint();
          renderNameBox(findProfiles(nameInput.value));
        });

        li.appendChild(main); li.appendChild(del);
        nameBox.appendChild(li);
      });
      nameBox.classList.remove('hidden');
    }

    nameInput.addEventListener('input', function () {
      var q = nameInput.value.trim();
      renderNameBox(findProfiles(q));
      if (!q) { lastRecalled = null; return; }
      // A fully-typed saved name fills in whatever is still blank (never overwrites).
      // The dropdown deliberately stays open so the match is visible and clickable.
      // No "already recalled this name" guard here: after generating a chart the
      // name is still in the box, so such a guard would block the very common
      // case of clearing the form and retyping the same name. applyProfile only
      // touches empty fields, so re-running it is harmless.
      var match = loadProfiles()[q.toLowerCase()];
      if (match) applyProfile(match, false);
    });

    nameInput.addEventListener('keydown', function (ev) {
      var items = nameBox.querySelectorAll('.suggestion-item');
      if (ev.key === 'ArrowDown' && items.length) {
        ev.preventDefault(); setNameActive(Math.min(nameActive + 1, items.length - 1));
      } else if (ev.key === 'ArrowUp' && items.length) {
        ev.preventDefault(); setNameActive(Math.max(nameActive - 1, 0));
      } else if (ev.key === 'Enter') {
        // Only an explicitly highlighted profile is applied on Enter — otherwise a
        // new name that merely prefix-matches an old one would be hijacked.
        if (nameActive >= 0 && nameResults[nameActive]) {
          ev.preventDefault();
          applyProfile(nameResults[nameActive], true);
        } else {
          closeNameBox();
        }
      } else if (ev.key === 'Escape') {
        closeNameBox();
      }
    });
    nameInput.addEventListener('focus', function () { renderNameBox(findProfiles(nameInput.value)); });
    nameInput.addEventListener('blur', function () { setTimeout(closeNameBox, 160); });
    document.addEventListener('click', function (ev) {
      if (ev.target !== nameInput && !nameBox.contains(ev.target)) closeNameBox();
    });
    updateProfileHint();

    // ---- collapse the birth-details form once a chart has been drawn ----
    var formCard = document.getElementById('birthForm');
    var collapsedBar = document.getElementById('formCollapsed');
    var fcLine = document.getElementById('fcLine');
    var editBtn = document.getElementById('editDetailsBtn');

    // Birth details render as a plain vertical sequence — one field per
    // line, no separators, no wrapping within a line — rather than the
    // older single "Name · Date · Place · ..." row. Chart style (South/North)
    // isn't included here any more: the view-switch buttons right beside the
    // chart already show and control that, so repeating it in this compact
    // list would be redundant. True Node is still called out, but only when
    // actually selected (Mean Node is the default, so the common case stays
    // exactly the four-line sequence: name, date, time+zone, place).
    collapseForm = function (name, dateStr, timeRaw, offset) {
      if (!collapsedBar || !fcLine) return;
      // a simulated chart has no date, time or place to summarise
      if (name && typeof name === 'object' && name.simulated) {
        fcLine.innerHTML =
          '<div class="fc-item"><span class="sim-badge">Simulation</span></div>' +
          '<div class="fc-item"><b>' + name.asc + '</b> Lagna</div>' +
          '<div class="fc-item">planets placed by hand</div>';
        formCard.classList.add('hidden');
        collapsedBar.classList.remove('hidden');
        return;
      }
      var lines = [];
      if (name) lines.push('<b>' + name + '</b>');
      var d = dateStr ? dateStr.split('-') : null;
      if (d) {
        var dt = new Date(Date.UTC(+d[0], +d[1] - 1, +d[2]));
        lines.push(dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }));
      }
      lines.push(formatTime12(timeRaw) + ' ' + tzAbbrev(offset));
      var place = placeInput.value.trim();
      lines.push(place || (latInput.value + ', ' + lonInput.value));
      var nodeSelEl = document.getElementById('nodeTypeInput');
      if (nodeSelEl && nodeSelEl.value === 'true') lines.push('True Node');

      fcLine.innerHTML = lines.map(function (l) { return '<div class="fc-item">' + l + '</div>'; }).join('');
      formCard.classList.add('hidden');
      collapsedBar.classList.remove('hidden');
    };

    function expandForm() {
      collapsedBar.classList.add('hidden');
      formCard.classList.remove('hidden');
    }
    if (editBtn) editBtn.addEventListener('click', expandForm);

    var errorBox = document.getElementById('formError');
    function showErrors(list) {
      if (!list.length) { errorBox.classList.add('hidden'); errorBox.innerHTML = ''; return; }
      errorBox.innerHTML = '<strong>Please fix the following:</strong><ul>' +
        list.map(function (e) { return '<li>' + e + '</li>'; }).join('') + '</ul>';
      errorBox.classList.remove('hidden');
      errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // If a "lat, lon" pair is pasted into either coordinate box, split it across both.
    function handlePastedPair(sourceInput) {
      var pair = parseCoordPair(sourceInput.value);
      if (pair) {
        latInput.value = pair.lat;
        lonInput.value = pair.lon;
        geoStatus.textContent = 'Split the pasted pair into latitude and longitude.';
        geoStatus.className = 'geo-status ok';
      }
    }
    [latInput, lonInput].forEach(function (inp) {
      inp.addEventListener('paste', function () { setTimeout(function () { handlePastedPair(inp); }, 0); });
      inp.addEventListener('change', function () { handlePastedPair(inp); });
      inp.addEventListener('input', function () { inp.classList.remove('invalid'); });
    });

    var form = document.getElementById('birthForm');

    function generateChart() {
      try {
        var name = document.getElementById('nameInput').value.trim();
        var dateStr = document.getElementById('dateInput').value;
        var timeRaw = document.getElementById('timeInput').value;
        var timeStr = timeRaw || '12:00';
        var offset = parseFloat(document.getElementById('offsetInput').value);

        handlePastedPair(latInput);
        var lat = parseCoord(latInput.value, 'lat');
        var lon = parseCoord(lonInput.value, 'lon');

        var errs = [];
        latInput.classList.remove('invalid');
        lonInput.classList.remove('invalid');
        document.getElementById('dateInput').classList.remove('invalid');

        if (!dateStr) {
          errs.push('Enter a <strong>date of birth</strong>.');
          document.getElementById('dateInput').classList.add('invalid');
        }
        if (!latInput.value.trim() && !lonInput.value.trim()) {
          errs.push('Enter a <strong>birth place</strong> — pick one from the dropdown, or type latitude and longitude directly.');
          latInput.classList.add('invalid'); lonInput.classList.add('invalid');
        } else {
          if (isNaN(lat)) {
            errs.push('<strong>Latitude</strong> "' + (latInput.value || '(empty)') + '" is not valid. Use a number between -90 and 90, e.g. <code>13.0827</code> (Chennai).');
            latInput.classList.add('invalid');
          }
          if (isNaN(lon)) {
            errs.push('<strong>Longitude</strong> "' + (lonInput.value || '(empty)') + '" is not valid. Use a number between -180 and 180, e.g. <code>80.2707</code> (Chennai).');
            lonInput.classList.add('invalid');
          }
        }
        if (isNaN(offset)) errs.push('Select a <strong>UTC offset</strong>.');

        if (errs.length) { showErrors(errs); return; }
        showErrors([]);

        var parts = dateStr.split('-').map(Number);
        var tparts = timeStr.split(':').map(Number);
        // local civil time -> UTC = local - offset
        var utcMs = Date.UTC(parts[0], parts[1] - 1, parts[2], tparts[0], tparts[1] || 0, 0);
        utcMs -= offset * 3600000;
        var birthDateUtc = new Date(utcMs);

        var nodeType = document.getElementById('nodeTypeInput').value === 'true' ? 'true' : 'mean';
        var result = window.VedicEngine.computeChart({ date: birthDateUtc, latDeg: lat, lonDeg: lon, nodeType: nodeType });
        var shadbala = window.Shadbala.compute({
          date: birthDateUtc, latDeg: lat, lonDeg: lon, tzOffsetHours: offset,
          ascLongitude: result.ascendant.longitude,
          planets: result.planets,
          relationships: result.relationships
        });

        setSectionAvailability(false);
        document.getElementById('results').classList.remove('hidden');
        // lastResult/lastSb used to be set as a side effect of the (now-removed)
        // Planet/House Interpretation tab renders — set directly here instead,
        // since the Research tab's submit handler and the network/Dasha-overlay
        // toggle re-render hooks both still read these module-level vars.
        lastResult = result; lastSb = shadbala;
        renderSummary(result, name, shadbala);
        renderDashaPicker(result, shadbala);
        initTreeToggle();
        renderFacts(result);
        renderInfluenceEngineTab(result, shadbala);
        resetResearch();
        renderShadbala(shadbala);
        renderBhavaBala(result, shadbala);
        renderVRYNote(result);
        renderPlanetTable(result, shadbala);
        renderHouseTable(result);
        renderNakshatraTable(result);
        renderRelationshipTables(result);
        // Both styles are drawn side by side; the one chosen on the form leads.
        var style = document.getElementById('chartStyleInput').value;
        var southCard = document.getElementById('southCardD1');
        var northCard = document.getElementById('northCardD1');
        applyChartView(prefGet(CHART_VIEW_KEY) || 'both');
        southCard.style.order = style === 'north' ? '2' : '1';
        northCard.style.order = style === 'north' ? '1' : '2';
        networkSelectedSigns = {};
        renderSouthChart('southChartD1', result, false, shadbala);
        renderNorthChart('northChartD1', result, false, shadbala);
        renderSouthChart('southChartD9', result, true, shadbala);
        renderNorthChart('northChartD9', result, true, shadbala);

        // Remember these details under the given name for next time
        if (name) {
          saveProfile({
            name: name,
            date: dateStr,
            time: timeRaw,
            offset: document.getElementById('offsetInput').value,
            chartStyle: document.getElementById('chartStyleInput').value,
            nodeType: nodeType,
            place: placeInput.value,
            lat: latInput.value,
            lon: lonInput.value,
            savedAt: Date.now()
          });
          lastRecalled = name.trim().toLowerCase();
          updateProfileHint();
        }
        tabApis.forEach(function (a) { a.refreshScope(name ? name.trim().toLowerCase() : 'default', name); });
        collapseForm(name, dateStr, timeRaw, offset);

        document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (err) {
        console.error(err);
        showErrors(['Something went wrong computing the chart: ' + err.message]);
      }
    }

    // Drive generation from a plain click rather than HTML form submission.
    // Sandboxed preview frames (and some embedded viewers) block form submits
    // outright — "the form's frame is sandboxed and 'allow-forms' is not set" —
    // which would otherwise make the button silently do nothing.
    document.getElementById('generateBtn').addEventListener('click', function (ev) {
      ev.preventDefault();
      if (currentEntryMode() === 'sim') renderSimulation();
      else generateChart();
    });
    // Keep Enter-to-generate working from the plain fields, without relying on
    // implicit form submission either.
    form.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter') return;
      var id = ev.target && ev.target.id;
      if (['dateInput', 'timeInput', 'offsetInput', 'latInput', 'lonInput'].indexOf(id) >= 0) {
        ev.preventDefault();
        generateChart();
      }
    });
    form.addEventListener('submit', function (ev) { ev.preventDefault(); generateChart(); });
  }

  // Run now if the document is already parsed (some embedded viewers inject the
  // page after DOMContentLoaded has fired, which would strand the whole UI).
  function boot() {
    try {
      init();
    } catch (err) {
      console.error(err);
      var box = document.getElementById('formError');
      if (box) {
        box.classList.remove('hidden');
        box.textContent = 'The app failed to start: ' + err.message;
      }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
