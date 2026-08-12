  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const ABBR  = {Aries:'Ari',Taurus:'Tau',Gemini:'Gem',Cancer:'Can',Leo:'Leo',Virgo:'Vir',Libra:'Lib',Scorpio:'Sco',Sagittarius:'Sag',Capricorn:'Cap',Aquarius:'Aqu',Pisces:'Pis'};
  const PLANET_DATA = [
    {name:'Sun',     symbol:'☉'},
    {name:'Moon',    symbol:'☾'},
    {name:'Mars',    symbol:'♂'},
    {name:'Mercury', symbol:'☿'},
    {name:'Jupiter', symbol:'♃'},
    {name:'Venus',   symbol:'♀'},
    {name:'Saturn',  symbol:'♄'},
    {name:'Rahu',    symbol:'☊'},
    {name:'Ketu',    symbol:'☋'}
  ];

  // Classical dignity reference (own sign, mooltrikona range, exaltation peak, debilitation deepest point)
  const DIGNITY = {
    Sun:     {own:['Leo'],
              moola:'Leo',       moolaRange:'1° – 20°',
              exalt:'Aries',     exaltDeg:'10°',
              debil:'Libra',     debilDeg:'10°'},
    Moon:    {own:['Cancer'],
              moola:'Taurus',    moolaRange:'4° – 30°',
              exalt:'Taurus',    exaltDeg:'3°',
              debil:'Scorpio',   debilDeg:'3°'},
    Mars:    {own:['Aries','Scorpio'],
              moola:'Aries',     moolaRange:'0° – 12°',
              exalt:'Capricorn', exaltDeg:'28°',
              debil:'Cancer',    debilDeg:'28°'},
    Mercury: {own:['Gemini','Virgo'],
              moola:'Virgo',     moolaRange:'16° – 20°',
              exalt:'Virgo',     exaltDeg:'15°',
              debil:'Pisces',    debilDeg:'15°'},
    Jupiter: {own:['Sagittarius','Pisces'],
              moola:'Sagittarius', moolaRange:'0° – 13°',
              exalt:'Cancer',    exaltDeg:'5°',
              debil:'Capricorn', debilDeg:'5°'},
    Venus:   {own:['Taurus','Libra'],
              moola:'Libra',     moolaRange:'0° – 15°',
              exalt:'Pisces',    exaltDeg:'27°',
              debil:'Virgo',     debilDeg:'27°'},
    Saturn:  {own:['Capricorn','Aquarius'],
              moola:'Aquarius',  moolaRange:'0° – 20°',
              exalt:'Libra',     exaltDeg:'20°',
              debil:'Aries',     debilDeg:'20°'},
    // Rahu / Ketu have no classical own/exaltation/debilitation/mooltrikona in this table's tradition
    Rahu:    {own:[], moola:null, exalt:null, debil:null},
    Ketu:    {own:[], moola:null, exalt:null, debil:null}
  };

  const DIGNITY_LABEL = {own:'Own sign', exalt:'Exaltation', debil:'Debilitation', moola:'Mooltrikona'};

  // Sign → ruling planet (classical), for hover info
  const RULER_OF = {};
  Object.entries(DIGNITY).forEach(([planet, d]) => { d.own.forEach(sign => { RULER_OF[sign] = planet; }); });
  const PLANET_SYMBOL = Object.fromEntries(PLANET_DATA.map(p => [p.name, p.symbol]));

  // Static definitions shown in the left info panel for non-sign icons
  const INFO_CONTENT = {
    ascendant: {
      title: 'Lagna (Ascendant)',
      desc: 'The zodiac sign rising on the eastern horizon at the moment of birth. It anchors House 1 and determines how all other houses fall across the chart. Rotating it here re-maps every sign to a new house.'
    },
    duality_yang: {
      title: 'Yang ( + )',
      desc: 'Active, outward, masculine polarity. Yang signs: Aries, Gemini, Leo, Libra, Sagittarius, Aquarius.'
    },
    duality_yin: {
      title: 'Yin ( − )',
      desc: 'Receptive, inward, feminine polarity. Yin signs: Taurus, Cancer, Virgo, Scorpio, Capricorn, Pisces.'
    },
    modality_cardinal: {
      title: 'Cardinal ( ▲ )',
      desc: 'Initiating energy — signs that begin each season: Aries, Cancer, Libra, Capricorn.'
    },
    modality_fixed: {
      title: 'Fixed ( ■ )',
      desc: 'Stabilizing energy — signs that sustain each season: Taurus, Leo, Scorpio, Aquarius.'
    },
    modality_mutable: {
      title: 'Mutable ( ◐ )',
      desc: 'Adaptive, transitional energy — signs that close out each season: Gemini, Virgo, Sagittarius, Pisces.'
    },
    element_fire: {
      title: 'Fire ( 🜂 )',
      desc: 'Passionate, spirited, dynamic. Fire signs: Aries, Leo, Sagittarius.'
    },
    element_earth: {
      title: 'Earth ( 🜃 )',
      desc: 'Grounded, practical, material. Earth signs: Taurus, Virgo, Capricorn.'
    },
    element_air: {
      title: 'Air ( 🜁 )',
      desc: 'Intellectual, social, communicative. Air signs: Gemini, Libra, Aquarius.'
    },
    element_water: {
      title: 'Water ( 🜄 )',
      desc: 'Emotional, intuitive, deep. Water signs: Cancer, Scorpio, Pisces.'
    },
    dignity_own: {
      title: 'Own Sign (Svakshetra)',
      desc: 'A planet placed in a sign it rules — one of its most comfortable, naturally strong placements.'
    },
    dignity_moola: {
      title: 'Mooltrikona',
      desc: 'A special degree band within a planet\'s own sign where its strength peaks even higher than an ordinary own-sign placement.'
    },
    dignity_exalt: {
      title: 'Exaltation (Uccha)',
      desc: 'The sign of a planet\'s maximum strength and most favorable expression, peaking at one specific degree.'
    },
    dignity_debil: {
      title: 'Debilitation (Neecha)',
      desc: 'The sign of a planet\'s weakest expression — always exactly opposite its exaltation sign.'
    },
    planet_sun: {
      title: '☉ Sun',
      desc: 'Soul, self-identity, vitality, father, authority. Rules Leo. The king of the chart — where it sits shows where you shine.'
    },
    planet_moon: {
      title: '☾ Moon',
      desc: 'Mind, emotions, mother, instinct. Rules Cancer. Moves fastest of all grahas — governs mood and inner comfort.'
    },
    planet_mars: {
      title: '♂ Mars',
      desc: 'Energy, courage, action, conflict, siblings. Rules Aries and Scorpio. The warrior — drive and assertiveness.'
    },
    planet_mercury: {
      title: '☿ Mercury',
      desc: 'Intellect, communication, commerce, analysis. Rules Gemini and Virgo. The messenger — how you think and speak.'
    },
    planet_jupiter: {
      title: '♃ Jupiter',
      desc: 'Wisdom, expansion, fortune, teachers, dharma. Rules Sagittarius and Pisces. The great benefic — growth and guidance.'
    },
    planet_venus: {
      title: '♀ Venus',
      desc: 'Love, beauty, relationships, luxury, art. Rules Taurus and Libra. The other benefic — attraction and pleasure.'
    },
    planet_saturn: {
      title: '♄ Saturn',
      desc: 'Discipline, delay, structure, karma, hard work. Rules Capricorn and Aquarius. The taskmaster — endurance and responsibility.'
    },
    planet_rahu: {
      title: '☊ Rahu (North Node)',
      desc: 'A lunar node, not a physical planet — shadow influence of obsession, ambition, and worldly desire. Intensifies whatever house/sign it occupies.'
    },
    planet_ketu: {
      title: '☋ Ketu (South Node)',
      desc: 'The other lunar node — shadow influence of detachment, spirituality, and past-life karma. Always exactly opposite Rahu.'
    },
    house_1: { title: 'House 1 — Tanu Bhava', desc: 'Self, physical body, personality, and how you present to the world. The house the Ascendant itself defines.' },
    house_2: { title: 'House 2 — Dhana Bhava', desc: 'Wealth, family, speech, food, and accumulated values.' },
    house_3: { title: 'House 3 — Sahaja Bhava', desc: 'Courage, effort, siblings, short journeys, and communication skills.' },
    house_4: { title: 'House 4 — Sukha Bhava', desc: 'Home, mother, emotional comfort, property, and inner peace.' },
    house_5: { title: 'House 5 — Putra Bhava', desc: 'Children, intelligence, creativity, romance, and past-life merit.' },
    house_6: { title: 'House 6 — Ripu Bhava', desc: 'Health, disease, debt, conflict, service, and daily obstacles.' },
    house_7: { title: 'House 7 — Yuvati Bhava', desc: 'Marriage, partnerships, business relationships, and the "other."' },
    house_8: { title: 'House 8 — Ayur Bhava', desc: 'Transformation, longevity, hidden matters, inheritance, and sudden change.' },
    house_9: { title: 'House 9 — Bhagya Bhava', desc: 'Fortune, dharma, higher learning, long journeys, and the father.' },
    house_10: { title: 'House 10 — Karma Bhava', desc: 'Career, status, public reputation, and worldly action.' },
    house_11: { title: 'House 11 — Labha Bhava', desc: 'Gains, income, hopes, aspirations, and social circles.' },
    house_12: { title: 'House 12 — Vyaya Bhava', desc: 'Loss, isolation, expenditure, foreign lands, and spiritual release.' }
  };

  // Active dignity categories are whichever sub-options are selected, and only while the
  // main toggle is on. Unlike Duality/Modality/Element, an EMPTY selection here means
  // "show nothing" rather than "show all" — highlighting every dignity at once by default
  // wouldn't mean anything useful the way it does for sign classifications.
  function getSelectedDignities(){
    return toggleState.dignity ? multiFilter.dignity : new Set();
  }

  function dignityTooltip(planetName, mark){
    const d = DIGNITY[planetName];
    if(mark === 'own')   return `${DIGNITY_LABEL.own}`;
    if(mark === 'exalt') return `${DIGNITY_LABEL.exalt}: peak at ${d.exaltDeg}`;
    if(mark === 'debil') return `${DIGNITY_LABEL.debil}: deepest at ${d.debilDeg}`;
    if(mark === 'moola') return `${DIGNITY_LABEL.moola}: ${d.moolaRange}`;
    return '';
  }

  // Which selected dignity categories a planet matches in `sign` (can be more than one —
  // e.g. a planet's mooltrikona sign is always also one of its own signs)
  function matchedDignitiesForSign(planetName, sign){
    const d = DIGNITY[planetName];
    const selected = getSelectedDignities();
    const matches = [];
    if(selected.has('own')   && d.own.includes(sign)) matches.push('own');
    if(selected.has('moola') && d.moola === sign)      matches.push('moola');
    if(selected.has('exalt') && d.exalt === sign)      matches.push('exalt');
    if(selected.has('debil') && d.debil === sign)      matches.push('debil');
    return matches;
  }

  // A planet belongs to `sign` if it matches ANY of the currently-selected dignity categories
  function planetBelongsToSign(planetName, sign){
    return matchedDignitiesForSign(planetName, sign).length > 0;
  }

  // Describes ALL dignity statuses a planet holds in a given sign (a planet can be both
  // Own Sign and Mooltrikona at once, since the mooltrikona sign is always one of its own signs)
  function fullDignityStatus(planetName, sign){
    const d = DIGNITY[planetName];
    const statuses = [];
    if(d.own.includes(sign)) statuses.push(dignityTooltip(planetName, 'own'));
    if(d.moola === sign)     statuses.push(dignityTooltip(planetName, 'moola'));
    if(d.exalt === sign)     statuses.push(dignityTooltip(planetName, 'exalt'));
    if(d.debil === sign)     statuses.push(dignityTooltip(planetName, 'debil'));
    return statuses.length ? statuses.join('; ') : 'no special dignity in this sign';
  }

  // User's drag-and-drop planet placements: { PlanetName: SignName }
  // Persist the latest chart positions so logout/re-login does not reset the chart.
  const PLANET_PLACEMENTS_STORAGE_KEY = 'vedicChartPlanetPlacements';
  const userPlacements = {};
  try{
    const rawPlacements = localStorage.getItem(PLANET_PLACEMENTS_STORAGE_KEY);
    const savedPlacements = rawPlacements ? JSON.parse(rawPlacements) : {};
    if(savedPlacements && typeof savedPlacements === 'object' && !Array.isArray(savedPlacements)){
      Object.assign(userPlacements, savedPlacements);
    }
  } catch(e){ /* ignore unavailable/corrupt saved placement data */ }

  function savePlanetPlacements(){
    try{ localStorage.setItem(PLANET_PLACEMENTS_STORAGE_KEY, JSON.stringify(userPlacements)); } catch(e){ /* ignore */ }
  }

  // Classical Parashari aspects: every planet aspects the 7th sign from itself (offset +6).
  // Mars, Jupiter, and Saturn have additional special aspects.
  const ASPECT_OFFSETS = {
    default: [6],
    Mars:    [3, 6, 7],
    Jupiter: [4, 6, 8],
    Saturn:  [2, 6, 9]
  };

  // Fixed pixel centers of each sign's cell in the South Indian chart (300x300 viewBox)
  const SOUTH_CENTER = {
    Pisces:[41,41], Aries:[114,41], Taurus:[186,41], Gemini:[258,41],
    Aquarius:[41,114], Cancer:[258,114],
    Capricorn:[41,186], Leo:[258,186],
    Sagittarius:[41,258], Scorpio:[114,258], Libra:[186,258], Virgo:[258,258]
  };
  // Fixed pixel centers of each house (1-12) in the North Indian chart (300x300 viewBox)
  const NORTH_HOUSE_CENTER = {
    1:[150,77], 2:[77,28], 3:[28,77], 4:[77,150], 5:[28,223], 6:[77,272],
    7:[150,223], 8:[223,272], 9:[272,223], 10:[223,150], 11:[272,77], 12:[223,28]
  };

  // Returns the list of planet names currently displayed in `sign` (user-placed takes priority, else dignity)
  function planetNamesForSign(sign){
    const placedHere = PLANET_DATA.filter(p => userPlacements[p.name] === sign);
    if(placedHere.length) return placedHere.map(p => p.name);
    if(!getSelectedDignities().size) return [];
    return PLANET_DATA.filter(p => !userPlacements[p.name] && planetBelongsToSign(p.name, sign)).map(p => p.name);
  }

  // Builds SVG-safe markup: user-dragged planets take priority; otherwise falls back to dignity display
  function planetsForSign(sign){
    const placedHere = PLANET_DATA.filter(p => userPlacements[p.name] === sign);
    if(placedHere.length){
      return placedHere.map(p =>
        `<tspan class="user-placed-txt">${p.symbol}<title>${p.name} — ${fullDignityStatus(p.name, sign)}</title></tspan>`
      ).join('<tspan dx="3"></tspan>');
    }
    if(!getSelectedDignities().size) return '';
    // Once a planet has been manually dragged anywhere, it no longer shows via the dignity system.
    // Planets are ordered by dignity category in the same fixed sequence every time — Own Sign,
    // Mooltrikona, Exaltation, Debilitation — the same "real estate and sequence" convention
    // used for Duality/Modality/Element, applied here to which planets appear and in what order.
    // A planet matching more than one selected category only appears once, at its first
    // matching category's position in that sequence.
    const shown = new Set();
    const ordered = [];
    DIGNITY_SEQUENCE.forEach(mark => {
      if(!getSelectedDignities().has(mark)) return;
      PLANET_DATA.forEach(p => {
        if(userPlacements[p.name] || shown.has(p.name)) return;
        const matched = matchedDignitiesForSign(p.name, sign);
        if(matched.includes(mark)){
          shown.add(p.name);
          ordered.push({ planet: p, matched, primary: mark });
        }
      });
    });
    return ordered.map(({ planet: p, matched, primary }) => {
      const tooltipText = matched.map(mark => dignityTooltip(p.name, mark)).join('; ');
      return `<tspan class="dignity-${primary}-txt">${p.symbol}<title>${p.name} — ${tooltipText}</title></tspan>`;
    }).join('<tspan dx="3"></tspan>');
  }
  const SIGN_INFO = {
    Aries:      {modality:'Cardinal', duality:'Yang', element:'Fire'},
    Taurus:     {modality:'Fixed',    duality:'Yin',  element:'Earth'},
    Gemini:     {modality:'Mutable',  duality:'Yang', element:'Air'},
    Cancer:     {modality:'Cardinal', duality:'Yin',  element:'Water'},
    Leo:        {modality:'Fixed',    duality:'Yang', element:'Fire'},
    Virgo:      {modality:'Mutable',  duality:'Yin',  element:'Earth'},
    Libra:      {modality:'Cardinal', duality:'Yang', element:'Air'},
    Scorpio:    {modality:'Fixed',    duality:'Yin',  element:'Water'},
    Sagittarius:{modality:'Mutable',  duality:'Yang', element:'Fire'},
    Capricorn:  {modality:'Cardinal', duality:'Yin',  element:'Earth'},
    Aquarius:   {modality:'Fixed',    duality:'Yang', element:'Air'},
    Pisces:     {modality:'Mutable',  duality:'Yin',  element:'Water'}
  };
  const GLYPH = {
    modality: {Cardinal:'▲', Fixed:'■', Mutable:'◐'},
    duality:  {Yang:'+', Yin:'−'},
    element:  {Fire:'🜂', Earth:'🜃', Air:'🜁', Water:'🜄'}
  };
  // Fixed display sequence for the dignity categories — Own Sign, Mooltrikona, Exaltation,
  // Debilitation — used to order which planets appear first when several qualify in the
  // same sign under different selected categories (see planetsForSign below).
  const DIGNITY_SEQUENCE = ['own', 'moola', 'exalt', 'debil'];

  // toggleState: on/off for each category.
  const toggleState = {modality:false, duality:false, element:false, dignity:false};
  // Duality, Modality, Element, and Dignities all support choosing any combination (empty
  // set = show all). Dignities starts with 'own' selected, matching the pre-checked button.
  // aspectsFrom/aspectsTo track which planets are toggled on in the new Aspects From / Aspects To sections.
  const multiFilter = {duality: new Set(), modality: new Set(), element: new Set(), dignity: new Set(['own']), aspectsFrom: new Set(), aspectsTo: new Set()};

  function categoryGlyph(key, sign){
    if(!toggleState[key]) return '';
    const info = SIGN_INFO[sign];
    const value = info[key];
    const set = multiFilter[key];
    if(set.size > 0 && !set.has(value)) return null; // not in the chosen combination
    return GLYPH[key][value];
  }

  // Returns ordered string: Duality, Modality, Element (skips filtered-out / off categories)
  function glyphString(sign){
    const order = ['duality','modality','element'];
    const parts = [];
    for(const key of order){
      const g = categoryGlyph(key, sign);
      if(g) parts.push(g);
    }
    return parts.join(' ');
  }

  const northSlots = document.querySelectorAll('[data-slot]');
  const northPlanets = document.querySelectorAll('[data-planets]');
  const northAscMarks = document.querySelectorAll('[data-asc-mark]');
  const northVertexGlyphs = document.querySelectorAll('[data-slot-glyph]');
  const southHouseNums = document.querySelectorAll('svg [data-sign]');
  const southAscCells = document.querySelectorAll('[data-asc-cell]');
  const southTopLeftGlyphs = document.querySelectorAll('[data-sign-label]');
  const southPlanetEls = document.querySelectorAll('[data-sign-planets]');
  const ASC_POSITION_STORAGE_KEY = 'vedicChartAscPosition';
  let currentAsc = 0;
  try{
    const savedAsc = parseInt(localStorage.getItem(ASC_POSITION_STORAGE_KEY), 10);
    if(Number.isInteger(savedAsc) && savedAsc >= 0 && savedAsc < SIGNS.length) currentAsc = savedAsc;
  } catch(e){ /* ignore unavailable/corrupt saved ascendant position */ }

  function saveAscPosition(){
    try{ localStorage.setItem(ASC_POSITION_STORAGE_KEY, String(currentAsc)); } catch(e){ /* ignore */ }
  }

  function render(ascIndex){
    currentAsc = ((ascIndex % SIGNS.length) + SIGNS.length) % SIGNS.length;
    saveAscPosition();

    // North Indian: fixed house positions (slot 1..12), sign rotates with ascendant
    northSlots.forEach(el => {
      const slot = parseInt(el.dataset.slot, 10);
      const sign = SIGNS[(ascIndex + slot - 1) % 12];
      el.textContent = ABBR[sign];
    });
    northPlanets.forEach(el => {
      const slot = parseInt(el.dataset.planets, 10);
      const sign = SIGNS[(ascIndex + slot - 1) % 12];
      el.innerHTML = planetsForSign(sign);
    });
    northAscMarks.forEach(el => {
      const slot = parseInt(el.dataset.ascMark, 10);
      el.textContent = slot === 1 ? 'ASC' : '';
    });
    // North Indian: glyphs at triangle intersection points (vertices) per house/slot
    northVertexGlyphs.forEach(el => {
      const slot = parseInt(el.dataset.slotGlyph, 10);
      const sign = SIGNS[(ascIndex + slot - 1) % 12];
      el.textContent = glyphString(sign);
    });

    // South Indian: fixed sign cells, house number rotates with ascendant
    southHouseNums.forEach(el => {
      const sign = el.dataset.sign;
      const signIndex = SIGNS.indexOf(sign);
      const house = ((signIndex - ascIndex + 12) % 12) + 1;
      el.textContent = house;
    });
    southAscCells.forEach(el => {
      el.textContent = el.dataset.ascCell === SIGNS[ascIndex] ? 'ASC' : '';
    });
    // South Indian: glyphs pinned to top-left of each fixed sign cell
    southTopLeftGlyphs.forEach(el => {
      const sign = el.dataset.signLabel;
      el.textContent = glyphString(sign);
    });
    southPlanetEls.forEach(el => {
      const sign = el.dataset.signPlanets;
      el.innerHTML = planetsForSign(sign);
    });

    renderAspectArrows();
  }

  // Planetary Aspects: only usable once at least one planet has been manually placed.
  // aspectsToggleBtn/aspectsLegend are null now that 'Show Aspect Arrows' is commented out —
  // guarded below so the per-planet Aspects From/To controls keep working without it.
  const toggleStateAspects = { on: false };
  const aspectsToggleBtn = document.getElementById('aspectsToggle');
  const aspectsLegend = document.getElementById('aspectsLegend');
  const southAspectArrows = document.getElementById('southAspectArrows');
  const northAspectArrows = document.getElementById('northAspectArrows');

  function hasAnyPlacement(){
    return Object.keys(userPlacements).length > 0;
  }

  function updateAspectsAvailability(){
    const available = hasAnyPlacement();
    if(aspectsToggleBtn) aspectsToggleBtn.disabled = !available;
    if(!available){
      toggleStateAspects.on = false;
      if(aspectsToggleBtn){
        aspectsToggleBtn.setAttribute('aria-pressed', 'false');
        aspectsToggleBtn.classList.remove('active');
      }
      if(aspectsLegend) aspectsLegend.style.display = 'none';
    }
  }

  function drawArrow(group, from, to, label){
    const [x1,y1] = from, [x2,y2] = to;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    // slight curve so overlapping aspects from the same origin stay visually distinguishable
    const mx = (x1+x2)/2, my = (y1+y2)/2;
    const dx = x2-x1, dy = y2-y1;
    const curveOffset = 12;
    const len = Math.hypot(dx,dy) || 1;
    const cx = mx - (dy/len)*curveOffset;
    const cy = my + (dx/len)*curveOffset;

    // Pull both ends back along the curve's tangent direction so the arrow starts just clear
    // of the source glyph and its arrowhead lands just short of the target glyph, instead of
    // merging into either one.
    const shorten = 14;
    const startDx = cx-x1, startDy = cy-y1;
    const startLen = Math.hypot(startDx,startDy) || 1;
    const sx = x1 + (startDx/startLen)*shorten;
    const sy = y1 + (startDy/startLen)*shorten;

    const endDx = x2-cx, endDy = y2-cy;
    const endLen = Math.hypot(endDx,endDy) || 1;
    const ex = x2 - (endDx/endLen)*shorten;
    const ey = y2 - (endDy/endLen)*shorten;

    path.setAttribute('d', `M${sx},${sy} Q${cx},${cy} ${ex},${ey}`);
    path.setAttribute('class', 'aspect-arrow-path');
    // Markers only resolve within the <svg> they're defined in — the North chart has its own
    // #aspectArrowHeadNorth copy (see its <defs>) since it can't see the South chart's marker.
    // Override the CSS default per-path so each arrow points at the marker that's actually
    // reachable from its own SVG root.
    if(group.id === 'northAspectArrows'){
      path.style.markerEnd = 'url(#aspectArrowHeadNorth)';
    }
    group.appendChild(path);

    // Place the source planet's glyph near the arrowhead (not the curve's midpoint), so it
    // reads as "this planet's aspect is landing here" rather than sitting anonymously in the
    // middle of the line. labelT=1 would be the arrowhead itself, so pull back slightly along
    // the curve, then nudge perpendicular by the same bow direction as the curve itself
    // (offset further, since the curve control point is off-path) to keep the glyph clear of
    // the stroke and the arrowhead marker.
    const labelT = 0.82;
    const labelOmT = 1 - labelT;
    const lx = labelOmT*labelOmT*sx + 2*labelOmT*labelT*cx + labelT*labelT*ex;
    const ly = labelOmT*labelOmT*sy + 2*labelOmT*labelT*cy + labelT*labelT*ey;
    const labelOffset = 9;
    const lox = lx - (dy/len)*labelOffset;
    const loy = ly + (dx/len)*labelOffset;

    const label_el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label_el.setAttribute('x', lox);
    label_el.setAttribute('y', loy);
    label_el.setAttribute('text-anchor', 'middle');
    label_el.setAttribute('class', 'aspect-arrow-label');
    label_el.textContent = label;
    group.appendChild(label_el);
  }

  // Rahu and Ketu are always exactly opposite each other, so their shared default 7th-aspect
  // offset would otherwise always point straight at one another. Classically they don't aspect
  // each other this way, so that specific link is suppressed wherever aspects are computed.
  function isRahuKetuMutualSign(planetName, targetSign){
    if(planetName === 'Rahu') return targetSign === userPlacements['Ketu'];
    if(planetName === 'Ketu') return targetSign === userPlacements['Rahu'];
    return false;
  }

  function renderAspectArrows(){
    if(!southAspectArrows || !northAspectArrows) return;
    southAspectArrows.innerHTML = '';
    northAspectArrows.innerHTML = '';

    const drawnKeys = new Set(); // avoid drawing the exact same source->target arrow twice

    function drawOne(sourceName, sourceSign, targetSign, symbol){
      const dedupeKey = `${sourceName}->${targetSign}`;
      if(drawnKeys.has(dedupeKey)) return;
      drawnKeys.add(dedupeKey);
      drawArrow(southAspectArrows, SOUTH_CENTER[sourceSign], SOUTH_CENTER[targetSign], symbol);
      const sourceHouse = ((SIGNS.indexOf(sourceSign) - currentAsc + 12) % 12) + 1;
      const targetHouse = ((SIGNS.indexOf(targetSign) - currentAsc + 12) % 12) + 1;
      drawArrow(northAspectArrows, NORTH_HOUSE_CENTER[sourceHouse], NORTH_HOUSE_CENTER[targetHouse], symbol);
    }

    // Draws every aspect cast BY the given planet (used by the global toggle and "Aspects From")
    function drawAspectsFrom(planetName){
      const ownSign = userPlacements[planetName];
      if(!ownSign) return;
      const offsets = ASPECT_OFFSETS[planetName] || ASPECT_OFFSETS.default;
      const ownIndex = SIGNS.indexOf(ownSign);
      offsets.forEach(off => {
        const targetSign = SIGNS[(ownIndex + off) % 12];
        if(isRahuKetuMutualSign(planetName, targetSign)) return;
        drawOne(planetName, ownSign, targetSign, PLANET_SYMBOL[planetName]);
      });
    }

    if(toggleStateAspects.on){
      PLANET_DATA.forEach(p => drawAspectsFrom(p.name));
    }

    multiFilter.aspectsFrom.forEach(planetName => drawAspectsFrom(planetName));

    // "Aspects To": for each selected target planet, find every OTHER placed planet whose
    // own aspect offsets land on the target's sign, and draw the arrow from that source planet.
    multiFilter.aspectsTo.forEach(targetName => {
      const targetSign = userPlacements[targetName];
      if(!targetSign) return;
      const targetIndex = SIGNS.indexOf(targetSign);
      PLANET_DATA.forEach(source => {
        if(source.name === targetName) return;
        if(isRahuKetuMutualSign(source.name, targetSign)) return;
        const sourceSign = userPlacements[source.name];
        if(!sourceSign) return;
        const offsets = ASPECT_OFFSETS[source.name] || ASPECT_OFFSETS.default;
        const sourceIndex = SIGNS.indexOf(sourceSign);
        offsets.forEach(off => {
          if((sourceIndex + off) % 12 !== targetIndex) return;
          drawOne(source.name, sourceSign, targetSign, source.symbol);
        });
      });
    });

    updateAspectsInfoPanel();
  }


  if(aspectsToggleBtn){
    aspectsToggleBtn.addEventListener('click', () => {
      if(aspectsToggleBtn.disabled) return;
      toggleStateAspects.on = !toggleStateAspects.on;
      aspectsToggleBtn.setAttribute('aria-pressed', String(toggleStateAspects.on));
      aspectsToggleBtn.classList.toggle('active', toggleStateAspects.on);
      if(aspectsLegend) aspectsLegend.style.display = toggleStateAspects.on ? 'flex' : 'none';
      renderAspectArrows();
    });
  }

  // Aspects From / Aspects To planet buttons: independent multi-select toggles per direction
  document.querySelectorAll('.aspect-planet-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const dir = btn.dataset.aspectDir; // 'from' or 'to'
      const planet = btn.dataset.planet;
      const key = dir === 'from' ? 'aspectsFrom' : 'aspectsTo';
      const set = multiFilter[key];
      if(set.has(planet)){
        set.delete(planet);
        btn.classList.remove('active');
      } else {
        set.add(planet);
        btn.classList.add('active');
      }
      render(currentAsc);
      addFlashcard(generateFlashcard({group:key, planet}));
    });
  });

  // Main category toggle buttons (Duality / Modality / Element / Dignities)
  document.querySelectorAll('.glyph-btn[data-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.toggle;
      toggleState[key] = !toggleState[key];
      btn.setAttribute('aria-pressed', String(toggleState[key]));
      const subPanel = document.querySelector(`.sub-options[data-sub-for="${key}"]`);
      if(subPanel) subPanel.classList.toggle('open', toggleState[key]);

      // Turning on Dignities clears any manual drag-and-drop placements,
      // so the algorithmic dignity display isn't blocked by earlier manual placements.
      if(key === 'dignity' && toggleState.dignity){
        Object.keys(userPlacements).forEach(k => delete userPlacements[k]);
        savePlanetPlacements();
        refreshChipStates();
        updateAspectsAvailability();
      }

      render(currentAsc);
      // Re-measure once the sub-options open/close transition (200ms) has settled
      setTimeout(syncPanelHeights, 220);
      addFlashcard(generateFlashcard({group:key}));
    });
  });

  // Duality, Modality, Element, and Dignities sub-options: multi-select — any combination can be chosen independently
  document.querySelectorAll('.sub-btn[data-multi]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const value = btn.dataset.value;
      const set = multiFilter[key];
      if(set.has(value)){
        set.delete(value);
        btn.classList.remove('active');
      } else {
        set.add(value);
        btn.classList.add('active');
      }
      render(currentAsc);
      addFlashcard(generateFlashcard({group:key, value}));
    });
  });

  // Left info panel — hover-driven
  const leftInfoPlaceholder = document.getElementById('leftInfoPlaceholder');
  const leftInfoContent = document.getElementById('leftInfoContent');
  const leftInfoTitle = document.getElementById('leftInfoTitle');
  const leftInfoList = document.getElementById('leftInfoList');

  function showLeftInfo(title, points){
    leftInfoPlaceholder.hidden = true;
    leftInfoContent.hidden = false;
    leftInfoList.style.transform = '';
    leftInfoList.style.opacity = '';
    leftInfoList.classList.remove('flashcard-mode');
    leftInfoTitle.textContent = title;
    const bullets = Array.isArray(points) ? points : [points];
    leftInfoList.innerHTML = bullets.filter(Boolean).map(b => `<li>${b}</li>`).join('');
  }
  // True while at least one planet is selected under Aspects From / Aspects To — while pinned,
  // the Info Panel shows that dynamic summary instead of the default hover placeholder.
  let aspectsInfoPinned = false;
  // True only while the Journey Coordinates tab is active — the Info Panel shows the
  // performance dashboard instead of anything else while this is true.
  let journeyPinned = false;

  function hideLeftInfo(){
    if(flashcardsPinned){
      renderCurrentFlashcard();
      return;
    }
    if(journeyPinned){
      renderJourneyDashboard();
      return;
    }
    if(aspectsInfoPinned){
      updateAspectsInfoPanel();
      return;
    }
    leftInfoList.style.transform = '';
    leftInfoList.style.opacity = '';
    leftInfoList.classList.remove('flashcard-mode');
    leftInfoPlaceholder.hidden = false;
    leftInfoContent.hidden = true;
  }

  function ordinal(n){
    const suffixes = ['th','st','nd','rd'];
    const v = n % 100;
    return n + (suffixes[(v-20)%10] || suffixes[v] || suffixes[0]);
  }

  // Bullet lines describing every aspect cast BY `planet`, for the Info Panel summary
  function aspectsFromDetails(planet){
    const sign = userPlacements[planet];
    const symbol = PLANET_SYMBOL[planet];
    if(!sign) return [`<b>${symbol} ${planet}</b> hasn't been placed on a chart yet — drag it onto a sign or house first.`];
    const offsets = ASPECT_OFFSETS[planet] || ASPECT_OFFSETS.default;
    const ownIndex = SIGNS.indexOf(sign);
    const lines = [];
    offsets.forEach(off => {
      const targetSign = SIGNS[(ownIndex + off) % 12];
      if(isRahuKetuMutualSign(planet, targetSign)) return;
      const house = ((SIGNS.indexOf(targetSign) - currentAsc + 12) % 12) + 1;
      const occupants = PLANET_DATA.filter(p => p.name !== planet && userPlacements[p.name] === targetSign);
      const occStr = occupants.length ? ` — ${occupants.map(p => `${p.symbol} ${p.name}`).join(', ')} placed there` : '';
      lines.push(`<b>${symbol} ${planet}</b> (${sign}) aspects <b>${targetSign}</b> (House ${house}, ${ordinal(off+1)} aspect)${occStr}`);
    });
    if(!lines.length) return [`<b>${symbol} ${planet}</b> (${sign}) casts no aspects.`];
    return lines;
  }

  // Bullet lines describing every aspect cast ONTO `planet` by other placed planets, for the Info Panel summary
  function aspectsToDetails(planet){
    const sign = userPlacements[planet];
    const symbol = PLANET_SYMBOL[planet];
    if(!sign) return [`<b>${symbol} ${planet}</b> hasn't been placed on a chart yet — drag it onto a sign or house first.`];
    const targetIndex = SIGNS.indexOf(sign);
    const sources = [];
    PLANET_DATA.forEach(p => {
      if(p.name === planet) return;
      if(isRahuKetuMutualSign(p.name, sign)) return;
      const sourceSign = userPlacements[p.name];
      if(!sourceSign) return;
      const offsets = ASPECT_OFFSETS[p.name] || ASPECT_OFFSETS.default;
      const sourceIndex = SIGNS.indexOf(sourceSign);
      offsets.forEach(off => {
        if((sourceIndex + off) % 12 === targetIndex){
          sources.push(`<b>${p.symbol} ${p.name}</b> (${sourceSign}) aspects <b>${symbol} ${planet}</b> (${ordinal(off+1)} aspect)`);
        }
      });
    });
    if(!sources.length) return [`No placed planet currently aspects <b>${symbol} ${planet}</b> in ${sign}.`];
    return sources;
  }

  // Rebuilds the Info Panel with a live summary of every planet selected under Aspects From /
  // Aspects To — planets not yet placed are listed first, every line is deduped, and the panel
  // releases its pin (restoring the default placeholder) once nothing is selected.
  function updateAspectsInfoPanel(){
    if(flashcardsPinned || journeyPinned) return; // flashcards / journey dashboard take priority
    const fromSet = multiFilter.aspectsFrom, toSet = multiFilter.aspectsTo;
    aspectsInfoPinned = (fromSet.size > 0 || toSet.size > 0);
    if(!aspectsInfoPinned){
      leftInfoPlaceholder.hidden = false;
      leftInfoContent.hidden = true;
      return;
    }

    const seen = new Set();
    const unplacedBullets = [];
    const placedBullets = [];
    function addUnique(target, text){
      if(seen.has(text)) return;
      seen.add(text);
      target.push(text);
    }

    fromSet.forEach(planet => {
      if(!userPlacements[planet]){
        addUnique(unplacedBullets, `<b>${PLANET_SYMBOL[planet]} ${planet}</b> hasn't been placed on a chart yet — drag it onto a sign or house first.`);
        return;
      }
      aspectsFromDetails(planet).forEach(line => addUnique(placedBullets, line));
    });
    toSet.forEach(planet => {
      if(!userPlacements[planet]){
        addUnique(unplacedBullets, `<b>${PLANET_SYMBOL[planet]} ${planet}</b> hasn't been placed on a chart yet — drag it onto a sign or house first.`);
        return;
      }
      aspectsToDetails(planet).forEach(line => addUnique(placedBullets, line));
    });

    const bullets = [...unplacedBullets, ...placedBullets];
    showLeftInfo('Aspect Details — Selected Planets', bullets);
  }

  // ----- Flashcards -----------------------------------------------------
  // Every button clicked in Cosmic Layers generates one basic
  // Vedic astrology flashcard, shown one at a time (with a hint, and a click-to-flip
  // reveal) in the Info Panel — independent of whatever else is selected there.

  const DUALITY_SIGNS  = {Yang:['Aries','Gemini','Leo','Libra','Sagittarius','Aquarius'], Yin:['Taurus','Cancer','Virgo','Scorpio','Capricorn','Pisces']};
  const MODALITY_SIGNS = {Cardinal:['Aries','Cancer','Libra','Capricorn'], Fixed:['Taurus','Leo','Scorpio','Aquarius'], Mutable:['Gemini','Virgo','Sagittarius','Pisces']};
  const ELEMENT_SIGNS  = {Fire:['Aries','Leo','Sagittarius'], Earth:['Taurus','Virgo','Capricorn'], Air:['Gemini','Libra','Aquarius'], Water:['Cancer','Scorpio','Pisces']};
  const MODALITY_SANSKRIT = {Cardinal:'Chara', Fixed:'Sthira', Mutable:'Dwiswabhava'};

  // Picks a random planet that actually has the requested dignity field defined
  // (Rahu/Ketu have no classical own/moola/exalt/debil in this table's tradition)
  function randomPlanetWithDignity(field){
    const eligible = PLANET_DATA.filter(p => {
      const d = DIGNITY[p.name];
      if(!d) return false;
      return field === 'own' ? !!(d.own && d.own.length) : !!d[field];
    });
    if(!eligible.length) return null;
    return eligible[Math.floor(Math.random() * eligible.length)].name;
  }

  // Builds one {question, hint, answer} flashcard from a clicked control's context
  function generateFlashcard(ctx){
    const {group, value, planet} = ctx || {};

    if(group === 'duality'){
      if(value){
        return {
          question: `Which zodiac signs are ${value} (${value === 'Yang' ? 'masculine' : 'feminine'})?`,
          hint: 'Duality alternates strictly sign by sign around the zodiac, starting with Aries as Yang.',
          answer: DUALITY_SIGNS[value].join(', ')
        };
      }
      return {
        question: 'What does "Duality" (Yang/Yin) describe about a zodiac sign?',
        hint: 'The twelve signs alternate this quality one by one, starting from Aries.',
        answer: 'Whether a sign is Yang (masculine, active) or Yin (feminine, receptive) — they alternate Yang, Yin, Yang, Yin... all the way around the zodiac.'
      };
    }

    if(group === 'modality'){
      if(value){
        return {
          question: `Which four signs are ${value} (${MODALITY_SANSKRIT[value]})?`,
          hint: value === 'Cardinal' ? 'These signs begin each season.' : value === 'Fixed' ? 'These signs fall in the middle of each season.' : 'These signs close out each season.',
          answer: MODALITY_SIGNS[value].join(', ')
        };
      }
      return {
        question: 'What are the three "modalities" every zodiac sign has one of?',
        hint: 'One begins a season, one sustains it, one adapts it into the next.',
        answer: 'Cardinal (Chara), Fixed (Sthira), and Mutable (Dwiswabhava) — four signs each.'
      };
    }

    if(group === 'element'){
      if(value){
        return {
          question: `Which three signs belong to the ${value} element?`,
          hint: 'Each element has exactly three signs, spaced four apart around the zodiac.',
          answer: ELEMENT_SIGNS[value].join(', ')
        };
      }
      return {
        question: 'What are the four classical elements of the zodiac signs?',
        hint: 'Each governs exactly three signs.',
        answer: 'Fire, Earth, Air, and Water.'
      };
    }

    if(group === 'dignity'){
      if(value === 'own'){
        const p = randomPlanetWithDignity('own') || 'Sun';
        return {
          question: `Which sign(s) does ${p} rule as its "Own Sign"?`,
          hint: 'A planet feels strong and comfortable in a sign it rules.',
          answer: `${p} rules ${DIGNITY[p].own.join(' and ')}.`
        };
      }
      if(value === 'moola'){
        const p = randomPlanetWithDignity('moola') || 'Sun';
        const d = DIGNITY[p];
        return {
          question: `What is ${p}'s Mooltrikona sign, and over what degree range?`,
          hint: "Mooltrikona is a special zone — even stronger than an ordinary own-sign placement.",
          answer: `${p}'s Mooltrikona is ${d.moola}, over ${d.moolaRange}.`
        };
      }
      if(value === 'exalt'){
        const p = randomPlanetWithDignity('exalt') || 'Sun';
        const d = DIGNITY[p];
        return {
          question: `In which sign is ${p} exalted, and at what exact degree?`,
          hint: "Exaltation is a planet's single strongest possible placement.",
          answer: `${p} is exalted in ${d.exalt}, at ${d.exaltDeg}.`
        };
      }
      if(value === 'debil'){
        const p = randomPlanetWithDignity('debil') || 'Sun';
        const d = DIGNITY[p];
        return {
          question: `In which sign is ${p} debilitated (weakest)?`,
          hint: "Debilitation always sits exactly opposite a planet's exaltation sign.",
          answer: `${p} is debilitated in ${d.debil}, at ${d.debilDeg}.`
        };
      }
      return {
        question: 'What are the four classical "dignities" a planet can have in a sign?',
        hint: 'They range from weakest to strongest.',
        answer: 'Debilitation (weakest), Own Sign, Mooltrikona, and Exaltation (strongest).'
      };
    }

    if(group === 'aspectsFrom' || group === 'aspectsTo'){
      if(planet){
        if(planet === 'Rahu' || planet === 'Ketu'){
          return {
            question: 'Do Rahu and Ketu cast a mutual 7th aspect on each other, like most opposite planets would?',
            hint: 'They are always exactly opposite one another in the chart.',
            answer: "No — even though Rahu and Ketu are always exactly 7 signs apart, classical tradition doesn't treat this as a mutual aspect between them."
          };
        }
        const offsets = ASPECT_OFFSETS[planet] || ASPECT_OFFSETS.default;
        if(offsets.length > 1){
          const extra = offsets.filter(o => o !== 6).map(o => ordinal(o + 1)).join(' & ');
          return {
            question: `Besides the usual 7th, which special aspect(s) does ${planet} cast?`,
            hint: `${planet} is one of only three planets (with Mars/Jupiter/Saturn) that has extra special aspects.`,
            answer: `${planet} also aspects the ${extra} sign/house from itself, in addition to the 7th.`
          };
        }
        return {
          question: `Which aspect does ${planet} cast from wherever it's placed?`,
          hint: 'Most planets only have one kind of aspect.',
          answer: `${planet} casts only the standard 7th aspect.`
        };
      }
      return {
        question: 'What is the classical "7th aspect" that (almost) every planet casts?',
        hint: 'Think of the sign or house directly opposite a planet.',
        answer: 'Every planet fully aspects (drishti) the sign/house exactly opposite itself — the 7th from its own position.'
      };
    }

    return null;
  }

  // Flashcard session state
  const flashcards = [];
  let currentFlashcardIndex = -1;
  let flashcardFlipped = false;
  // True only while the Flashcards tab is the active layer panel
  let flashcardsTabActive = false;
  // True while a flashcard (question, answer, or empty state) is the pinned content of the
  // Info Panel — only ever true while flashcardsTabActive is true.
  let flashcardsPinned = false;

  function updateFlashcardsTabStatus(){
    const countEl = document.getElementById('flashcardsCount');
    if(countEl){
      countEl.textContent = flashcards.length
        ? `${flashcards.length} flashcard${flashcards.length === 1 ? '' : 's'} generated so far.`
        : 'No flashcards yet.';
    }
  }

  // Every button click in Cosmic Layers always adds to the flashcard
  // queue, but it's only actually displayed in the Info Panel while the Flashcards tab is active —
  // otherwise the Info Panel keeps showing its normal hover-info / aspects-summary content.
  function addFlashcard(card){
    if(!card) return;
    flashcards.push(card);
    currentFlashcardIndex = flashcards.length - 1;
    flashcardFlipped = false;
    updateFlashcardsTabStatus();
    if(flashcardsTabActive){
      flashcardsPinned = true;
      renderCurrentFlashcard();
    }
  }

  // Adds a whole set of questions at once (e.g. a course's) and starts on the FIRST
  // card of that new set, rather than jumping to the last one added.
  function addFlashcardBatch(cards){
    if(!cards || !cards.length) return;
    const startIndex = flashcards.length;
    cards.forEach(card => { if(card) flashcards.push(card); });
    currentFlashcardIndex = startIndex;
    flashcardFlipped = false;
    updateFlashcardsTabStatus();
    if(flashcardsTabActive){
      flashcardsPinned = true;
      renderCurrentFlashcard();
    }
  }

  // Renders the current flashcard (question, answer, or empty state) into the Info Panel.
  // Only ever called while the Flashcards tab is active.
  function renderCurrentFlashcard(){
    leftInfoPlaceholder.hidden = true;
    leftInfoContent.hidden = false;
    leftInfoList.classList.add('flashcard-mode');

    if(currentFlashcardIndex < 0 || !flashcards[currentFlashcardIndex]){
      leftInfoTitle.textContent = 'Flashcards';
      leftInfoList.innerHTML = `<li class="flashcard-empty">No flashcards yet — click a button in Cosmic Layers to generate one, then come back here.</li>`;
      return;
    }

    const card = flashcards[currentFlashcardIndex];
    leftInfoTitle.textContent = `Flashcard ${currentFlashcardIndex + 1} of ${flashcards.length}`;

    if(!flashcardFlipped){
      leftInfoList.innerHTML = `
        <li class="flashcard-question" id="flashcardClickTarget">
          <div class="flashcard-q-text">${card.question}</div>
          ${card.hint ? `<div class="flashcard-hint">Hint: ${card.hint}</div>` : ''}
          <div class="flashcard-tap-note">Tap to reveal the answer</div>
        </li>
        <li class="flashcard-controls">
          <button type="button" class="flashcard-btn" id="flashcardNextBtn">Next</button>
          <button type="button" class="flashcard-btn flashcard-btn-end" id="flashcardEndBtn">End</button>
        </li>`;
      const clickTarget = document.getElementById('flashcardClickTarget');
      if(clickTarget) clickTarget.addEventListener('click', flipCurrentFlashcard);
    } else {
      leftInfoList.innerHTML = `
        <li class="flashcard-answer">
          <div class="flashcard-q-text">${card.question}</div>
          <div class="flashcard-a-text"><b>Answer:</b> ${card.answer}</div>
        </li>
        <li class="flashcard-controls">
          <button type="button" class="flashcard-btn" id="flashcardNextBtn">Next</button>
          <button type="button" class="flashcard-btn flashcard-btn-end" id="flashcardEndBtn">End</button>
        </li>`;
    }

    const nextBtn = document.getElementById('flashcardNextBtn');
    if(nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); nextFlashcard(); });
    const endBtn = document.getElementById('flashcardEndBtn');
    if(endBtn) endBtn.addEventListener('click', (e) => { e.stopPropagation(); endFlashcards(); });
  }

  // Click-to-flip: rotates the card left-to-right to edge-on, swaps in the answer, then rotates back
  function flipCurrentFlashcard(){
    if(flashcardFlipped) return;
    leftInfoList.style.transition = 'transform .26s ease, opacity .26s ease';
    leftInfoList.style.transform = 'rotateY(-90deg)';
    leftInfoList.style.opacity = '0.15';
    setTimeout(() => {
      flashcardFlipped = true;
      renderCurrentFlashcard();
      leftInfoList.style.transform = 'rotateY(0deg)';
      leftInfoList.style.opacity = '1';

      // Attribute this flip to the currently open course's completion progress, but only if
      // the flipped card is actually one of that course's own questions (indices 0..N-1,
      // since a course click always resets the flashcard queue to just its own questions —
      // anything added afterward from Cosmic Layers falls outside that range).
      if(typeof currentCourseId !== 'undefined' && currentCourseId){
        const openCourse = getCourseById(currentCourseId);
        if(openCourse && currentFlashcardIndex < openCourse.questions.length){
          const progress = ensureCourseProgress(currentCourseId);
          progress.flashcardsFlipped[currentFlashcardIndex] = true;
          checkCourseCompletion(currentCourseId);
        }
      }
    }, 260);
  }

  // Next always shows another question (cycling back to the start once the queue is exhausted)
  function nextFlashcard(){
    if(!flashcards.length) return;
    currentFlashcardIndex = (currentFlashcardIndex + 1) % flashcards.length;
    flashcardFlipped = false;
    renderCurrentFlashcard();
  }

  // End jumps back to the first question in the current flashcard queue — stays within
  // whichever Info Panel is showing flashcards (Flashcards tab or a Courses lesson),
  // rather than navigating away.
  function endFlashcards(){
    if(!flashcards.length) return;
    currentFlashcardIndex = 0;
    flashcardFlipped = false;
    renderCurrentFlashcard();
  }

  // Scans every currently active Cosmic Layers selection (main toggles that are
  // "on", plus whichever specific sub-values/planets are chosen under each) into flashcard contexts
  function collectActiveFlashcardContexts(){
    const contexts = [];
    ['duality', 'modality', 'element', 'dignity'].forEach(key => {
      if(!toggleState[key]) return;
      if(multiFilter[key].size){
        multiFilter[key].forEach(value => contexts.push({group:key, value}));
      } else {
        contexts.push({group:key});
      }
    });
    ['aspectsFrom', 'aspectsTo'].forEach(key => {
      if(!toggleState[key]) return;
      if(multiFilter[key].size){
        multiFilter[key].forEach(planet => contexts.push({group:key, planet}));
      } else {
        contexts.push({group:key});
      }
    });
    return contexts;
  }

  // Clears every flashcard and regenerates a fresh set from whatever is currently
  // toggled on in Cosmic Layers
  function refreshFlashcards(){
    flashcards.length = 0;
    currentFlashcardIndex = -1;
    flashcardFlipped = false;

    collectActiveFlashcardContexts().forEach(ctx => {
      const card = generateFlashcard(ctx);
      if(card) flashcards.push(card);
    });
    if(flashcards.length) currentFlashcardIndex = 0;

    updateFlashcardsTabStatus();
    if(flashcardsTabActive){
      flashcardsPinned = true;
      renderCurrentFlashcard();
    }
  }

  const flashcardsRefreshBtn = document.getElementById('flashcardsRefreshBtn');
  if(flashcardsRefreshBtn){
    flashcardsRefreshBtn.addEventListener('click', refreshFlashcards);
  }
  updateFlashcardsTabStatus();

  // ----- Journey Coordinates (Performance) -----------------------------
  // A five-card dashboard — Presence, Progress, Proficiency, Practice, Purpose — rendered
  // into the Info Panel while the Journey Coordinates tab is active. Progress and Practice
  // are computed from real, already-tracked state; the other three don't have tracking
  // wired up yet, so they're shown as clearly-labeled examples rather than invented numbers.
  // Friendly display names for the six layer categories, used to name whichever one
  // hasn't been explored yet in an encouraging suggestion
  const CATEGORY_LABELS = { duality:'Duality', modality:'Modality', element:'Element', dignity:'Dignities', aspectsFrom:'Aspects From', aspectsTo:'Aspects To' };

  // Three encouraging, concrete next steps drawn from real session state
  function generateJourneySuggestions(placedCount, exploredCount){
    const suggestions = [];

    const unexplored = Object.keys(CATEGORY_LABELS).find(k => !toggleState[k]);
    if(unexplored){
      suggestions.push(`Give <b>${CATEGORY_LABELS[unexplored]}</b> a try next — each layer you open reveals a new way of reading the chart.`);
    } else {
      suggestions.push(`You've opened every layer — wonderful range! Revisit the one that excited you most and go a little deeper.`);
    }

    if(placedCount < 9){
      suggestions.push(`Place a few more planets — you're <b>${placedCount}/9</b> of the way to your first complete chart. Keep going, you're doing great!`);
    } else {
      suggestions.push(`Your chart is fully placed — lovely work! Try <b>Aspects From</b> and <b>Aspects To</b> to see how these planets talk to each other.`);
    }

    if(flashcards.length < 5){
      suggestions.push(`Generate a few <b>Flashcards</b> — even a handful of quick recall questions builds real, lasting understanding.`);
    } else {
      suggestions.push(`You're building a great flashcard habit — keep reviewing them, a little repetition is what makes it truly stick.`);
    }

    return suggestions;
  }

  function renderJourneyDashboard(){
    leftInfoPlaceholder.hidden = true;
    leftInfoContent.hidden = false;
    leftInfoList.style.transform = '';
    leftInfoList.style.opacity = '';
    leftInfoList.classList.remove('flashcard-mode');
    leftInfoList.classList.add('journey-mode');
    leftInfoTitle.textContent = 'Journey Coordinates';

    const placedCount = Object.keys(userPlacements).length;
    const exploredCount = ['duality','modality','element','dignity','aspectsFrom','aspectsTo'].filter(k => toggleState[k]).length;

    const cards = [
      { label:'Presence',    question:'Am I showing up?',     value:'—',                 note:'Session tracking not wired up yet.' },
      { label:'Progress',    question:'Am I progressing?',    value:`${exploredCount} / 6`, note:'Layer categories explored this session.' },
      { label:'Proficiency', question:'Am I understanding?',  value:'—',                 note:'Flashcard mastery tracking not wired up yet.' },
      { label:'Practice',    question:'Am I applying?',       value:`${placedCount} / 9`,   note:'Planets currently placed on the chart.' },
      { label:'Purpose',     question:'Am I transforming?',   value:'—',                 note:'Real-reading tracking not wired up yet.' }
    ];

    const suggestions = generateJourneySuggestions(placedCount, exploredCount);

    leftInfoList.innerHTML = `
      <li class="journey-grid">${cards.map(c => `
        <div class="journey-card">
          <p class="journey-card-label">${c.label}</p>
          <p class="journey-card-question">${c.question}</p>
          <p class="journey-card-value">${c.value}</p>
          <p class="journey-card-note">${c.note}</p>
        </div>`).join('')}</li>
      <li class="journey-suggestions">
        <p class="journey-suggestions-title">Suggestions</p>
        <ul class="journey-suggestions-list">
          ${suggestions.map(s => `<li class="journey-suggestion-item">${s}</li>`).join('')}
        </ul>
      </li>`;
  }

  // Static icons: duality / modality / element / dignity / ascendant
  document.querySelectorAll('.hover-icon[data-info]').forEach(el => {
    const info = INFO_CONTENT[el.dataset.info];
    if(!info) return;
    el.addEventListener('mouseenter', () => showLeftInfo(info.title, info.desc));
    el.addEventListener('mouseleave', hideLeftInfo);
  });

  // Which of the 27 nakshatras (lunar mansions) fall within each sign, with pada coverage
  const NAKSHATRAS_BY_SIGN = {
    Aries:       [['Ashwini','Ketu','all 4 padas'], ['Bharani','Venus','all 4 padas'], ['Krittika','Sun','pada 1']],
    Taurus:      [['Krittika','Sun','padas 2-4'], ['Rohini','Moon','all 4 padas'], ['Mrigashira','Mars','padas 1-2']],
    Gemini:      [['Mrigashira','Mars','padas 3-4'], ['Ardra','Rahu','all 4 padas'], ['Punarvasu','Jupiter','padas 1-3']],
    Cancer:      [['Punarvasu','Jupiter','pada 4'], ['Pushya','Saturn','all 4 padas'], ['Ashlesha','Mercury','all 4 padas']],
    Leo:         [['Magha','Ketu','all 4 padas'], ['Purva Phalguni','Venus','all 4 padas'], ['Uttara Phalguni','Sun','pada 1']],
    Virgo:       [['Uttara Phalguni','Sun','padas 2-4'], ['Hasta','Moon','all 4 padas'], ['Chitra','Mars','padas 1-2']],
    Libra:       [['Chitra','Mars','padas 3-4'], ['Swati','Rahu','all 4 padas'], ['Vishakha','Jupiter','padas 1-3']],
    Scorpio:     [['Vishakha','Jupiter','pada 4'], ['Anuradha','Saturn','all 4 padas'], ['Jyeshtha','Mercury','all 4 padas']],
    Sagittarius: [['Mula','Ketu','all 4 padas'], ['Purva Ashadha','Venus','all 4 padas'], ['Uttara Ashadha','Sun','pada 1']],
    Capricorn:   [['Uttara Ashadha','Sun','padas 2-4'], ['Shravana','Moon','all 4 padas'], ['Dhanishta','Mars','padas 1-2']],
    Aquarius:    [['Dhanishta','Mars','padas 3-4'], ['Shatabhisha','Rahu','all 4 padas'], ['Purva Bhadrapada','Jupiter','padas 1-3']],
    Pisces:      [['Purva Bhadrapada','Jupiter','pada 4'], ['Uttara Bhadrapada','Saturn','all 4 padas'], ['Revati','Mercury','all 4 padas']]
  };
  const NAK_SYMBOL = {Ketu:'☋',Venus:'♀',Sun:'☉',Moon:'☾',Mars:'♂',Rahu:'☊',Jupiter:'♃',Saturn:'♄',Mercury:'☿'};

  function nakshatraText(sign){
    const list = NAKSHATRAS_BY_SIGN[sign];
    return list.map(([name, lord, pada]) => `${NAK_SYMBOL[lord]} ${name} (${pada})`).join(', ');
  }

  // Sign icons on both charts
  function signInfoDesc(sign, house){
    const attr = SIGN_INFO[sign];
    const ruler = RULER_OF[sign];
    const houseInfo = INFO_CONTENT['house_' + house];
    const houseName = houseInfo ? houseInfo.title.split('—')[1]?.trim() : '';

    const bullets = [];
    bullets.push(`<b>Attributes:</b> ${attr.modality} · ${attr.duality} · ${attr.element}`);
    if(ruler) bullets.push(`<b>Ruled by:</b> ${PLANET_SYMBOL[ruler]} ${ruler}`);
    if(houseInfo) bullets.push(`<b>Governs (${houseName}):</b> ${houseInfo.desc}`);

    const placedHere = PLANET_DATA.filter(p => userPlacements[p.name] === sign);
    placedHere.forEach(p => {
      bullets.push(`<b>${p.symbol} ${p.name}:</b> ${fullDignityStatus(p.name, sign)}`);
    });

    bullets.push(`<b>Nakshatras here:</b> ${nakshatraText(sign)}`);
    return bullets;
  }

  southHouseNums.forEach(el => {
    el.classList.add('hover-icon');
    el.addEventListener('mouseenter', () => {
      const sign = el.dataset.sign;
      const signIndex = SIGNS.indexOf(sign);
      const house = ((signIndex - currentAsc + 12) % 12) + 1;
      showLeftInfo(`${sign} — House ${house}`, signInfoDesc(sign, house));
    });
    el.addEventListener('mouseleave', hideLeftInfo);
  });

  northSlots.forEach(el => {
    el.classList.add('hover-icon');
    el.addEventListener('mouseenter', () => {
      const slot = parseInt(el.dataset.slot, 10);
      const sign = SIGNS[(currentAsc + slot - 1) % 12];
      const house = slot;
      showLeftInfo(`${sign} — House ${house}`, signInfoDesc(sign, house));
    });
    el.addEventListener('mouseleave', hideLeftInfo);
  });

  // Drag-and-drop: planet chips → South Indian sign cells AND North Indian house polygons
  const planetChips = document.querySelectorAll('.planet-chip');
  const dropZones = document.querySelectorAll('.drop-zone');

  function refreshChipStates(){
    planetChips.forEach(chip => {
      const planet = chip.dataset.planet;
      chip.classList.toggle('placed', !!userPlacements[planet]);
      chip.title = userPlacements[planet] ? `Currently in ${userPlacements[planet]} — drag again to move` : '';
    });
  }

  planetChips.forEach(chip => {
    chip.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', chip.dataset.planet);
      e.dataTransfer.effectAllowed = 'move';
      chip.classList.add('dragging');
    });
    chip.addEventListener('dragend', () => chip.classList.remove('dragging'));

    // Clicking a planet chip that's currently placed resets just that placement —
    // identical behavior to clicking the placed planet directly on a chart.
    chip.addEventListener('click', () => {
      const planet = chip.dataset.planet;
      if(planet === 'ASC') return; // the Ascendant marker isn't a removable placement
      removePlanetPlacements(planet);
    });
  });

  // Removes one or more planet placements and refreshes every dependent UI piece in one pass.
  // Shared by: clicking a placed planet's cell on a chart, and clicking its chip in the tray.
  function removePlanetPlacements(names){
    const list = Array.isArray(names) ? names : [names];
    let removedAny = false;
    list.forEach(name => {
      if(userPlacements[name]){
        delete userPlacements[name];
        removedAny = true;
      }
    });
    if(!removedAny) return;
    savePlanetPlacements();
    resetPlanetaryPosition();
    refreshChipStates();
    updateAspectsAvailability();
    render(currentAsc);
  }

  // Resolves a drop zone (either chart) to the sign it currently represents
  function zoneSign(zone){
    if(zone.dataset.dropSign) return zone.dataset.dropSign;             // South: fixed sign per cell
    if(zone.dataset.dropSlot){                                          // North: sign rotates with ascendant
      const slot = parseInt(zone.dataset.dropSlot, 10);
      return SIGNS[(currentAsc + slot - 1) % 12];
    }
    return null;
  }

  // Turns off the Dignities feature the moment a manual drag-drop happens,
  // since a manual placement and the algorithmic dignity display shouldn't compete for the same view.
  function resetPlanetaryPosition(){
    toggleState.dignity = false;
    const mainBtn = document.querySelector('.glyph-btn[data-toggle="dignity"]');
    if(mainBtn) mainBtn.setAttribute('aria-pressed', 'false');
    const subPanel = document.querySelector('.sub-options[data-sub-for="dignity"]');
    if(subPanel) subPanel.classList.remove('open');
  }

  // Rahu and Ketu are lunar nodes: always exactly opposite each other (7th from one another)
  function oppositeSign(sign){
    return SIGNS[(SIGNS.indexOf(sign) + 6) % 12];
  }

  // Mercury never strays far from the Sun (max elongation ~28°) — same sign, or one sign either side
  function signDistance(signA, signB){
    const a = SIGNS.indexOf(signA), b = SIGNS.indexOf(signB);
    const diff = Math.abs(a - b);
    return Math.min(diff, 12 - diff);
  }
  function isValidMercuryPlacement(sign){
    const sunSign = userPlacements['Sun'];
    if(!sunSign) return true; // Sun not placed yet — Mercury can go anywhere and become the anchor
    return signDistance(sign, sunSign) <= 1;
  }

  // Venus never strays far from the Sun either (max elongation ~48°) — up to two signs either side
  function isValidVenusPlacement(sign){
    const sunSign = userPlacements['Sun'];
    if(!sunSign) return true; // Sun not placed yet — Venus can go anywhere and become the anchor
    return signDistance(sign, sunSign) <= 2;
  }

  // The Sun itself is now constrained too: if Mercury and/or Venus were placed first, the Sun
  // must land within THEIR respective limits (1 sign for Mercury, 2 signs for Venus) — this is
  // what lets any of the three be placed first and have it constrain the other two.
  function isValidSunPlacement(sign){
    const mercurySign = userPlacements['Mercury'];
    const venusSign = userPlacements['Venus'];
    if(mercurySign && signDistance(sign, mercurySign) > 1) return false;
    if(venusSign && signDistance(sign, venusSign) > 2) return false;
    return true;
  }

  // Small error toast for rejected drag-and-drop actions
  const dropErrorBar = document.getElementById('dropErrorBar');
  const dropErrorText = document.getElementById('dropErrorText');
  let dropErrorTimer = null;
  function showDropError(message){
    dropErrorText.textContent = message;
    dropErrorBar.hidden = false;
    // force reflow so the show class transition re-triggers even if already visible
    void dropErrorBar.offsetWidth;
    dropErrorBar.classList.add('show');
    clearTimeout(dropErrorTimer);
    dropErrorTimer = setTimeout(() => {
      dropErrorBar.classList.remove('show');
      setTimeout(() => { dropErrorBar.hidden = true; }, 250);
    }, 3800);
  }

  dropZones.forEach(zone => {
    // Zones double as drag SOURCES: picking up whichever planet currently sits in that sign/house
    zone.addEventListener('dragstart', (e) => {
      const sign = zoneSign(zone);
      const names = sign ? planetNamesForSign(sign) : [];
      if(!names.length){
        e.preventDefault();
        return;
      }
      e.dataTransfer.setData('text/plain', names[0]);
      e.dataTransfer.effectAllowed = 'move';
      zone.classList.add('drag-over');
    });
    zone.addEventListener('dragend', () => zone.classList.remove('drag-over'));

    // Clicking a cell that already holds a user-placed planet resets just that placement
    // (as opposed to the Clear button, which wipes every placement on the chart).
    zone.addEventListener('click', () => {
      const sign = zoneSign(zone);
      if(!sign) return;
      const placedNames = Object.keys(userPlacements).filter(name => userPlacements[name] === sign);
      removePlanetPlacements(placedNames);
    });

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const planet = e.dataTransfer.getData('text/plain');
      const sign = zoneSign(zone);
      if(!planet || !sign) return;

      if(planet === 'ASC'){
        render(SIGNS.indexOf(sign));
        return;
      }

      if(planet === 'Mercury' && !isValidMercuryPlacement(sign)){
        const sunSign = userPlacements['Sun'];
        showDropError(`Mercury can't go in ${sign} — it must stay within one sign of the Sun (currently in ${sunSign}: only ${SIGNS[(SIGNS.indexOf(sunSign)+11)%12]}, ${sunSign}, or ${SIGNS[(SIGNS.indexOf(sunSign)+1)%12]} allowed).`);
        return;
      }

      if(planet === 'Venus' && !isValidVenusPlacement(sign)){
        const sunSign = userPlacements['Sun'];
        showDropError(`Venus can't go in ${sign} — it must stay within two signs of the Sun (currently in ${sunSign}: only ${SIGNS[(SIGNS.indexOf(sunSign)+10)%12]}, ${SIGNS[(SIGNS.indexOf(sunSign)+11)%12]}, ${sunSign}, ${SIGNS[(SIGNS.indexOf(sunSign)+1)%12]}, or ${SIGNS[(SIGNS.indexOf(sunSign)+2)%12]} allowed).`);
        return;
      }

      if(planet === 'Sun' && !isValidSunPlacement(sign)){
        const mercurySign = userPlacements['Mercury'];
        const venusSign = userPlacements['Venus'];
        const problems = [];
        if(mercurySign && signDistance(sign, mercurySign) > 1){
          problems.push(`within one sign of Mercury (currently in ${mercurySign})`);
        }
        if(venusSign && signDistance(sign, venusSign) > 2){
          problems.push(`within two signs of Venus (currently in ${venusSign})`);
        }
        showDropError(`Sun can't go in ${sign} — it must stay ${problems.join(' and ')}.`);
        return;
      }

      userPlacements[planet] = sign;
      // Rahu / Ketu are always exactly opposite each other — moving one moves the other automatically
      if(planet === 'Rahu') userPlacements['Ketu'] = oppositeSign(sign);
      if(planet === 'Ketu') userPlacements['Rahu'] = oppositeSign(sign);

      savePlanetPlacements();
      resetPlanetaryPosition();
      refreshChipStates();
      updateAspectsAvailability();
      render(currentAsc);
    });
    // Drop zones sit on top of the cell text, so they must also carry the hover-info behavior
    zone.addEventListener('mouseenter', () => {
      const sign = zoneSign(zone);
      if(!sign) return;
      const signIndex = SIGNS.indexOf(sign);
      const house = ((signIndex - currentAsc + 12) % 12) + 1;
      showLeftInfo(`${sign} — House ${house}`, signInfoDesc(sign, house));
    });
    zone.addEventListener('mouseleave', hideLeftInfo);
  });

  function clearAllPlacements(){
    Object.keys(userPlacements).forEach(k => delete userPlacements[k]);
    savePlanetPlacements();
    refreshChipStates();
    updateAspectsAvailability();
    render(currentAsc);
  }
  ['clearPlacements', 'clearPlacementsNorth'].forEach(id => {
    const btn = document.getElementById(id);
    if(btn) btn.addEventListener('click', clearAllPlacements);
  });

  // Chart view toggle: show both charts, or expand just one for a larger, clearer view
  const southPanel = document.querySelector('.south-chart-panel');
  const northPanel = document.querySelector('.north-chart-panel');
  const chartsRow = document.querySelector('.charts-row');
  // Scoped specifically to this button group — '.view-toggle-btn' alone is a shared base
  // class also used by the layer tabs and Logout, so a bare query here would incorrectly
  // catch every one of those clicks too (each with an undefined data-view, which always
  // fails the "=== 'both'" check, silently turning single-view on and stripping this
  // group's own active state any time an unrelated button was clicked).
  document.querySelectorAll('.chart-select-toggle .view-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      document.querySelectorAll('.chart-select-toggle .view-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      southPanel.classList.toggle('chart-hidden', view === 'north');
      northPanel.classList.toggle('chart-hidden', view === 'south');
      chartsRow.classList.toggle('single-view', view !== 'both');
      southPanel.classList.toggle('chart-expanded', view === 'south');
      northPanel.classList.toggle('chart-expanded', view === 'north');
      updateMyChartSingleLayout();
      syncPanelHeights();
    });
  });

  // When My Chart is active AND only one chart (South or North) is showing, the viewer gets
  // extra width (freed up by the hidden second chart) and the remaining single chart sits
  // immediately to its right — rather than leaving that freed space stranded inside the
  // normal two-chart column span. Checked from both the layer-tab and chart-view toggles,
  // since either one changing can affect whether this combined condition applies.
  function updateMyChartSingleLayout(){
    if(!mainEl) return;
    const isMyChartActive = mainEl.classList.contains('mychart-mode');
    const isSingleChart = chartsRow && chartsRow.classList.contains('single-view');
    mainEl.classList.toggle('mychart-single-chart', isMyChartActive && isSingleChart);
  }

  // Cosmic Layers / Flashcards / Journey Coordinates / Courses toggle:
  // only the selected panel is visible at a time
  const layerPanels = document.querySelectorAll('.layer-panel');
  const chartsRowWrapper = document.querySelector('.charts-row-wrapper');
  const infoLegendCol = document.querySelector('.info-legend-col');
  const chartSelectToggleEl = document.querySelector('.chart-select-toggle');
  const chartsRowEl = document.querySelector('.charts-row');
  const mediaViewerPanel = document.getElementById('mediaViewerPanel');
  const workbookViewerPanel = document.getElementById('workbookViewerPanel');
  const mychartViewerPanel = document.getElementById('mychartViewerPanel');
  const mainEl = document.querySelector('main');
  document.querySelectorAll('.layers-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.layerView;
      document.querySelectorAll('.layers-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      layerPanels.forEach(panel => {
        panel.classList.toggle('layer-hidden', panel.dataset.layerPanel !== view);
      });

      // Journey Coordinates hides the charts (and their toggle buttons) entirely and lets
      // the Info Panel column expand into the freed space for the performance dashboard.
      if(chartsRowWrapper) chartsRowWrapper.classList.toggle('charts-row-hidden', view === 'journey');
      if(infoLegendCol) infoLegendCol.classList.toggle('journey-expanded', view === 'journey');

      // Courses hides just the chart toggle (space reserved, for alignment) and the charts
      // themselves, shows the media viewer in their place, and moves the Info Panel to the
      // rightmost column so the layout reads: lesson list -> media viewer -> Info Panel.
      // My Chart is different: it keeps the charts fully visible (with drag-and-drop) in
      // their normal position, and instead swaps the My Chart document in for the Info Panel
      // within that same column, so the layout reads: section list -> document -> charts.
      const isCourses = view === 'courses';
      const isWorkbook = view === 'workbook';
      const isMyChart = view === 'mychart';
      if(mainEl){
        mainEl.classList.toggle('courses-mode', isCourses);
        mainEl.classList.toggle('workbook-mode', isWorkbook);
        mainEl.classList.toggle('mychart-mode', isMyChart);
      }
      if(chartSelectToggleEl) chartSelectToggleEl.classList.toggle('courses-hide-toggle', isCourses || isWorkbook);
      if(chartsRowEl) chartsRowEl.classList.toggle('courses-hide', isCourses || isWorkbook);
      if(mediaViewerPanel) mediaViewerPanel.classList.toggle('courses-show', isCourses);
      if(workbookViewerPanel) workbookViewerPanel.classList.toggle('workbook-show', isWorkbook);
      if(infoPanelLeft) infoPanelLeft.style.display = isMyChart ? 'none' : '';
      if(mychartViewerPanel){
        mychartViewerPanel.classList.toggle('mychart-show', isMyChart);
        if(isMyChart) renderMyChart();
      }
      updateMyChartSingleLayout();

      // Render the Info Panel's content FIRST, then sync heights — otherwise syncPanelHeights
      // measures the previous (stale) content and panels end up misaligned.
      // Courses reuses the exact same flashcard mechanism as the Flashcards tab. Workbook and
      // My Chart don't touch the Info Panel at all — they keep its normal hover-info behavior.
      flashcardsTabActive = (view === 'flashcards' || isCourses);
      journeyPinned = (view === 'journey');
      if(flashcardsTabActive){
        flashcardsPinned = true;
        renderCurrentFlashcard();
      } else if(journeyPinned){
        flashcardsPinned = false;
        renderJourneyDashboard();
      } else {
        flashcardsPinned = false;
        hideLeftInfo();
      }
      syncPanelHeights();
      updateFooterVisibility();
    });
  });

  // The "Illustrative sample chart..." footer note only makes sense while the charts are
  // actually on screen — checks real rendered visibility (offsetParent covers both the
  // element itself and any hidden ancestor, e.g. Journey Coordinates hiding the whole wrapper)
  // rather than assuming any one specific hiding mechanism.
  function updateFooterVisibility(){
    const footerEl = document.querySelector('footer');
    if(!footerEl || !chartsRowEl) return;
    const visible = chartsRowEl.offsetParent !== null && window.getComputedStyle(chartsRowEl).display !== 'none';
    footerEl.style.display = visible ? '' : 'none';
  }

  // ----- Courses (real learning content) ---------------------------------
  // Each lesson has a couple of very simple, directly-relevant questions added to the
  // SAME flashcard queue/UI used everywhere else in the app.
  // Video: a real YouTube iframe embed — YouTube's embed endpoint is built for this, so unlike
  // a random third-party page it isn't subject to the same framing issues. A small number of
  // videos still disable embedding at the uploader's choice, so a "Watch on YouTube" fallback
  // link is always shown alongside it, same as any real media-library app would do.
  // PDF / Slides: these are real, freely-available sources (linked below), but arbitrary
  // third-party pages can't be reliably framed (we hit that exact wall earlier). Rather than
  // gamble on another embed, each shows a simulated paginated preview built from real content
  // from that same source, with Prev/Next — clearly labeled as a preview, with the real file
  // linked for the full document.
  // ----- Lesson completion tracking -----------------------------------
  // { courseId: { mediaDone:bool, flashcardsFlipped:[bool,...], completed:bool } }
  const courseProgress = {};
  // Which course is currently open in the Media Viewer (used to attribute page turns and
  // flashcard flips to the right lesson)
  let currentCourseId = null;

  function ensureCourseProgress(courseId){
    if(!courseProgress[courseId]){
      const course = getCourseById(courseId);
      courseProgress[courseId] = {
        mediaDone: false,
        flashcardsFlipped: course ? course.questions.map(() => false) : [],
        completed: false
      };
      // A brand-new entry means this course was just opened for the first time —
      // persist that "viewed" moment immediately rather than waiting for completion.
      saveCourseProgress(courseId);
    }
    return courseProgress[courseId];
  }

  // Persists one course's progress to the signed-in user's account (D1-backed, via
  // functions/api/progress/[courseId].js) so it survives logout/login and follows them
  // across devices instead of resetting every session like the old localStorage-free,
  // in-memory-only version did. Best-effort: local state already reflects the change
  // either way, so a failed save just means it'll look unsaved on the next login.
  function saveCourseProgress(courseId){
    const progress = courseProgress[courseId];
    if(!progress) return;
    fetch(`/api/progress/${encodeURIComponent(courseId)}`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mediaDone: progress.mediaDone,
        flashcardsFlipped: progress.flashcardsFlipped,
        completed: progress.completed
      })
    }).catch(() => { /* best-effort */ });
  }

  // Fetches every course_progress row for the signed-in user and hydrates courseProgress
  // + viewedCourseIds from it (a row's mere existence means "viewed"). Called after login,
  // once loadMyCourses() has rendered the course-item buttons updateCourseLockState() needs.
  async function loadCourseProgress(){
    try{
      const res = await fetch('/api/progress', { credentials:'same-origin' });
      const data = res.ok ? await res.json() : {};
      Object.keys(data).forEach(courseId => {
        courseProgress[courseId] = data[courseId];
        viewedCourseIds.add(courseId);
        if(data[courseId].completed) markCourseItemCompleteUI(courseId);
      });
    } catch(e){ /* stay with whatever's already local */ }
    updateCourseLockState();
  }

  // Self-service "Clear my progress": wipes local + server-side progress for every
  // course, re-locking the list back down to just the first lesson.
  const clearProgressBtn = document.getElementById('clearProgressBtn');
  if(clearProgressBtn){
    clearProgressBtn.addEventListener('click', async () => {
      if(!confirm('Clear all your course progress? Completed lessons will show as unfinished again and the list will re-lock from the start.')) return;
      Object.keys(courseProgress).forEach(k => delete courseProgress[k]);
      viewedCourseIds.clear();
      renderCourseListFromProgramGrid();
      await fetch('/api/progress', { method:'DELETE', credentials:'same-origin' }).catch(() => {});
    });
  }

  // Marks the "watched/read the media" half of completion (video watched, or last page/slide reached)
  function markCourseMediaComplete(courseId){
    if(!courseId) return;
    const progress = ensureCourseProgress(courseId);
    if(progress.mediaDone) return;
    progress.mediaDone = true;
    checkCourseCompletion(courseId);
  }

  // A lesson counts as fully completed once its media has been consumed AND every one of
  // its flashcard questions has been flipped at least once
  function checkCourseCompletion(courseId){
    const progress = courseProgress[courseId];
    if(!progress) return;
    const flashcardsDone = progress.flashcardsFlipped.length > 0 && progress.flashcardsFlipped.every(Boolean);
    const wasComplete = progress.completed;
    progress.completed = progress.mediaDone && flashcardsDone;
    if(progress.completed && !wasComplete) markCourseItemCompleteUI(courseId);
    updateCourseLockState();
    saveCourseProgress(courseId);
  }

  // Sequential unlocking: every already-completed lesson stays clickable (for review), plus
  // exactly the next not-yet-completed lesson in list order — everything further down the
  // list stays locked (inactive) until the lessons before it are completed.
  function updateCourseLockState(){
    const items = Array.from(document.querySelectorAll('.course-item'));
    let nextUnlocked = false;
    items.forEach(item => {
      const courseId = item.dataset.courseId;
      const progress = courseProgress[courseId];
      const isComplete = !!(progress && progress.completed);
      let active;
      if(isComplete){
        active = true;
      } else if(!nextUnlocked){
        active = true;
        nextUnlocked = true;
      } else {
        active = false;
      }
      item.disabled = !active;
      item.classList.toggle('course-item-locked', !active);
    });
  }

  // Adds a small "✓ Completed" badge to a lesson's row in the Courses list
  function markCourseItemCompleteUI(courseId){
    const item = document.querySelector(`.course-item[data-course-id="${courseId}"]`);
    if(!item || item.querySelector('.course-item-complete-badge')) return;
    const textEl = item.querySelector('.course-item-text');
    if(!textEl) return;
    const badge = document.createElement('span');
    badge.className = 'course-item-complete-badge';
    badge.textContent = '✓ Completed';
    textEl.appendChild(badge);
  }

  // ----- Video "watched" tracking (dwell-time based) -----------------------
  // The YouTube JS Player API's enablejsapi=1 pattern triggers "Error 153: Video player
  // configuration error" in some hosting contexts (e.g. opening this file directly rather
  // than serving it from a matching origin) — that risk isn't worth taking just for
  // completion tracking. Instead, a plain, always-reliable iframe is used for real playback,
  // and "watched" is approximated by how long the video has been open in the viewer.
  let videoDwellTimer = null;
  const VIDEO_DWELL_MS = 45000; // ~45s open counts as "watched" for completion purposes

  function startVideoDwellTracking(courseId){
    if(videoDwellTimer) clearTimeout(videoDwellTimer);
    videoDwellTimer = setTimeout(() => {
      markCourseMediaComplete(courseId);
      videoDwellTimer = null;
    }, VIDEO_DWELL_MS);
  }

  const COURSE_CONTENT = {
    'zodiac-intro': {
      title: 'What is Astrology? — Astrology for Beginners (Jyotish, Part 1)',
      type: 'Video · MP4 (Internet Archive)',
      mediaType: 'video-file',
      fileName: 'What is Astrology.mp4',
      videoSrc: 'https://archive.org/download/vedic-astrology-astrology-for-beginners-what-is-astrology-by-alok-khandelwal-jyotish-part-1/Vedic%20Astrology%20_%20Astrology%20for%20Beginners%20_%20What%20is%20Astrology%20by%20Alok%20Khandelwal%20_%20jyotish%20_%20Part%201.mp4',
      sourceUrl: 'https://archive.org/details/vedic-astrology-astrology-for-beginners-what-is-astrology-by-alok-khandelwal-jyotish-part-1',
      description: 'A real introductory lesson on Vedic astrology basics by Alok Khandelwal, hosted on the Internet Archive.',
      note: 'A real, direct video file — not a framed third-party page, so it plays here reliably with no embedding restrictions possible.',
      questions: [
        { question:'How many zodiac signs are there?', hint:'Think of one per month, roughly.', answer:'12.' },
        { question:'What is the first sign of the zodiac?', hint:'It kicks off the whole cycle.', answer:'Aries.' }
      ]
    },
    'dignities-pdf': {
      title: 'Vedic Astrology: An Integrated Approach — Ch. 3, Planetary Dignities',
      type: 'PDF · P.V.R. Narasimha Rao',
      mediaType: 'pdf-sim',
      fileName: 'Planetary dignities.pdf',
      sourceUrl: 'https://www.vedicastrologer.org/articles/vedic_astro_textbook.pdf',
      description: 'A real, freely-shared textbook — section 3.3 "Planetary Dignities" covers own sign, exaltation, debilitation, and mooltrikona in detail.',
      note: 'Simulated preview built from the real chapter — open the full PDF for the complete text.',
      pages: [
        { heading: 'Own Sign', paras: [
          'A planet feels strongest and most natural in a sign it rules — this is its "own sign" (swakshetra).',
          'Example: the Sun rules Leo, the Moon rules Cancer, Mars rules Aries and Scorpio.'
        ]},
        { heading: 'Mooltrikona', paras: [
          'Mooltrikona is a special zone, usually overlapping a planet\u2019s own sign, that is even stronger — like a planet\u2019s "office" where it performs its duty.',
          'Example: the Sun\u2019s mooltrikona is Leo (0\u201320\u00B0); Jupiter\u2019s is Sagittarius (0\u201310\u00B0).'
        ]},
        { heading: 'Exaltation', paras: [
          'Exaltation (uchcha) is a planet\u2019s single strongest possible placement — one exact sign where it expresses its highest potential.',
          'Example: the Sun is exalted in Aries at 10\u00B0; the Moon is exalted in Taurus at 3\u00B0.'
        ]},
        { heading: 'Debilitation', paras: [
          'Debilitation (neecha) is the opposite of exaltation — a planet\u2019s weakest placement, always exactly opposite its exaltation sign.',
          'Example: the Sun is debilitated in Libra; the Moon is debilitated in Scorpio.'
        ]}
      ],
      questions: [
        { question:"What's a planet's strongest possible placement called?", hint:'It\'s the peak of its power in one exact sign.', answer:'Exaltation.' },
        { question:'What is the opposite of exaltation called?', hint:'Always the sign directly across the zodiac.', answer:'Debilitation.' }
      ]
    },
    'aspects-slides': {
      title: 'Beginners Guide to Predictive Astrology (Course 3)',
      type: 'Slides · PPTX',
      mediaType: 'ppt-sim',
      fileName: 'Predictive astrology basics.pptx',
      sourceUrl: 'https://www.slideshare.net/slideshow/beginnersguidetopredictiveastrologycourse3pptx/266620621',
      description: 'A real, publicly-shared slide deck covering signs, planets, houses, and planetary aspects.',
      note: 'Simulated preview built from the real deck\u2019s topics — open the full slides on SlideShare.',
      slides: [
        { title: 'What Is an Aspect?', bullets: [
          'An aspect (drishti) is how one planet\u2019s influence reaches another sign or house.',
          'Think of it as where a planet "casts its gaze" beyond its own position.'
        ]},
        { title: 'The 7th Aspect', bullets: [
          'Every planet casts a full aspect on the sign/house directly opposite itself.',
          'This is the one aspect every single planet shares in common.'
        ]},
        { title: 'Special Extra Aspects', bullets: [
          'Mars also aspects the 4th and 8th from itself.',
          'Jupiter also aspects the 5th and 9th from itself.',
          'Saturn also aspects the 3rd and 10th from itself.'
        ]},
        { title: 'Try It in This App', bullets: [
          'Open Cosmic Layers \u2192 Aspects From / Aspects To to see these drawn live on your chart.'
        ]}
      ],
      questions: [
        { question:'Which house does every planet aspect by default?', hint:'Straight across the chart from itself.', answer:'The 7th house from itself.' },
        { question:'Name one planet with special extra aspects.', hint:'There are exactly three of these.', answer:'Mars, Jupiter, or Saturn.' }
      ]
    }
  };

  // ----- Flexible fallback for lessons with no hand-authored content --------
  // Only the 3 lessons above have real, hand-written content in COURSE_CONTENT. Any row
  // added through the "Manage courses by program" grid (by any admin, visible to any user)
  // has just a Program/Courses/File name — no media type or content of its own. Rather than
  // silently doing nothing when clicked, this builds a simple simulated preview purely from
  // the file's own name/extension, so it's never tied to which user happens to see it.
  function inferMediaTypeFromFileName(fileName){
    const lower = (fileName || '').toLowerCase();
    if(/\.(mp4|mov|webm|avi|mkv)$/.test(lower)) return 'video-sim';
    if(/\.pdf$/.test(lower)) return 'pdf-sim';
    if(/\.(pptx|ppt)$/.test(lower)) return 'ppt-sim';
    return 'generic-sim';
  }

  function buildSimulatedCourse(row){
    const mediaType = inferMediaTypeFromFileName(row.fileName);
    const title = row.courseName || row.fileName || 'Untitled lesson';
    const base = {
      title,
      sourceUrl: '',
      description: `A simulated preview for "${row.fileName || 'this file'}" — no real file is attached yet.`,
      note: 'Placeholder content, generated from the file name — added through the Manage Courses grid.',
      questions: [
        { question: 'What is this lesson about?', hint: 'Think about the course name.', answer: title }
      ]
    };
    if(mediaType === 'pdf-sim'){
      return { ...base, type:`PDF · ${row.program || 'Simulated'}`, mediaType,
        pages: [{ heading: title, paras: [`This is a simulated page for "${row.fileName}". Real content can be added later.`] }]
      };
    }
    if(mediaType === 'ppt-sim'){
      return { ...base, type:`Slides · ${row.program || 'Simulated'}`, mediaType,
        slides: [{ title, bullets: [`This is a simulated slide for "${row.fileName}".`] }]
      };
    }
    if(mediaType === 'video-sim'){
      return { ...base, type:`Video · ${row.program || 'Simulated'}`, mediaType };
    }
    return { ...base, type:`File · ${row.program || 'Simulated'}`, mediaType };
  }

  // The real content above is matched purely by FILE NAME now, not by id — this is what a
  // click actually looks up. Any row (regardless of its internal id, and regardless of how
  // many rows share the same file name) that says "What is Astrology.mp4" plays the one real
  // video; anything else gets a simulation built from its own file name. This removes the
  // whole class of bugs where a row's id and its displayed file name could drift apart.
  const KNOWN_FILES = {};
  Object.values(COURSE_CONTENT).forEach(entry => {
    if(entry.fileName) KNOWN_FILES[entry.fileName.trim().toLowerCase()] = entry;
  });

  // Looks up a lesson purely by its CURRENT file name: a real, known file plays its real
  // content; anything else gets a simulation built from that file name/extension.
  function getCourseForFileName(fileName){
    const key = (fileName || '').trim().toLowerCase();
    return KNOWN_FILES[key] || null;
  }

  // The single lookup used everywhere a lesson needs to be found by id — resolves the row for
  // that id, then matches its file name against the known real files.
  function getCourseById(courseId){
    const row = myCourses.find(r => r.id === courseId);
    if(!row) return null;
    return getCourseForFileName(row.fileName) || buildSimulatedCourse(row);
  }

  const mediaViewerEmpty = document.getElementById('mediaViewerEmpty');
  const mediaViewerContent = document.getElementById('mediaViewerContent');
  const mediaViewerTitle = document.getElementById('mediaViewerTitle');
  const mediaViewerType = document.getElementById('mediaViewerType');
  const mediaViewerFrameWrap = document.getElementById('mediaViewerFrameWrap');
  const mediaViewerDesc = document.getElementById('mediaViewerDesc');
  const mediaViewerNote = document.getElementById('mediaViewerNote');

  // Tracks which page/slide is showing PER COURSE (not just one global position), so
  // reaching the last page of one lesson doesn't get confused with another's progress
  const mediaViewerPageByCourse = {};

  // Renders: a real YouTube player (tracked for ~90%-watched / ended completion, with a
  // "watch elsewhere" fallback since embedding can be blocked per-video by the uploader),
  // or a simulated paginated PDF/slide preview built from real content — with a link to the
  // real full source in every case. Reaching the last page/slide marks that half of completion.
  function renderMediaViewer(course){
    if(mediaViewerTitle) mediaViewerTitle.textContent = course.title;
    if(mediaViewerType) mediaViewerType.textContent = course.type;
    if(mediaViewerDesc) mediaViewerDesc.textContent = course.description;
    if(mediaViewerNote) mediaViewerNote.textContent = course.note || '';
    if(!mediaViewerFrameWrap) return;

    mediaViewerFrameWrap.innerHTML = '';

    if(course.mediaType === 'video-file' && course.videoSrc){
      const video = document.createElement('video');
      // Cache-bust every load: if a previous session's video was stopped mid-stream (pause +
      // removeAttribute('src') + load(), from stopAllMedia() on logout/login), some browsers
      // can cache that as a partial/incomplete response — a fresh query param each time this
      // is opened guarantees a genuinely new request instead of risking a stale cache hit.
      const cacheBustedSrc = course.videoSrc + (course.videoSrc.indexOf('?') === -1 ? '?' : '&') + '_cb=' + Date.now();
      video.src = cacheBustedSrc;
      video.controls = true;
      // Removes just the download button from the native control bar (Chrome/Edge) — every
      // other control (play, pause, seek, volume, fullscreen) stays fully active/visible.
      video.setAttribute('controlsList', 'nodownload');
      // Also blocks "Save video as..." via right-click, another download path the
      // controlsList attribute alone doesn't cover.
      video.addEventListener('contextmenu', (e) => e.preventDefault());
      video.preload = 'metadata';
      video.className = 'media-viewer-video';
      mediaViewerFrameWrap.appendChild(video);

      // If the browser can't actually stream this file (common when this HTML file is opened
      // directly via file:// — some browsers restrict cross-origin range requests from a
      // file:// page, even though the same video plays fine from a normal http(s) page), show
      // a helpful hint alongside the player — WITHOUT hiding the video itself, since a single
      // "error" event can be transient (a momentary network hiccup, not a real failure) and
      // hiding it would permanently break playback for something that might recover on its own
      // or with the browser's native retry/controls.
      const videoErrorMsg = document.createElement('p');
      videoErrorMsg.className = 'media-viewer-video-error';
      videoErrorMsg.hidden = true;
      videoErrorMsg.innerHTML = `Having trouble playing here? This can happen when opening this file directly rather than from a web server. <a href="${course.sourceUrl}" target="_blank" rel="noopener noreferrer">Open it directly instead ↗</a>`;
      mediaViewerFrameWrap.appendChild(videoErrorMsg);
      video.addEventListener('error', () => {
        // Only surface the hint if the video still hasn't produced any data shortly after
        // the error — a real, sustained failure — rather than reacting to a single blip.
        setTimeout(() => {
          if(video.readyState === 0){
            videoErrorMsg.hidden = false;
            syncPanelHeights();
          }
        }, 1500);
      });
      video.addEventListener('playing', () => {
        if(!videoErrorMsg.hidden){ videoErrorMsg.hidden = true; syncPanelHeights(); }
      });

      // The video's real rendered height isn't known until its metadata loads (an async
      // network round-trip) — that happens AFTER the initial syncPanelHeights() call below,
      // so without this the panels would align to a placeholder height and then visibly
      // jump out of alignment once the real video dimensions arrive. Re-sync whenever the
      // video's own size changes, so top/bottom alignment stays correct dynamically.
      video.addEventListener('loadedmetadata', () => { syncPanelHeights(); });
      if(window.ResizeObserver){
        const videoResizeObserver = new ResizeObserver(() => syncPanelHeights());
        videoResizeObserver.observe(video);
      }

      // A real <video> element fires real playback events directly — no iframe, no
      // postMessage, no cross-origin restrictions — so this tracking is fully reliable.
      const videoCourseId = currentCourseId;
      video.addEventListener('timeupdate', () => {
        if(video.duration > 0 && (video.currentTime / video.duration) >= 0.9){
          markCourseMediaComplete(videoCourseId);
        }
      });
      video.addEventListener('ended', () => markCourseMediaComplete(videoCourseId));
    } else if(course.mediaType === 'youtube' && course.youtubeId){
      const ytWrap = document.createElement('div');
      ytWrap.className = 'media-viewer-yt';
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${course.youtubeId}`;
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('title', course.title);
      ytWrap.appendChild(iframe);
      mediaViewerFrameWrap.appendChild(ytWrap);

      startVideoDwellTracking(currentCourseId);
    } else if(course.mediaType === 'pdf-sim' && course.pages){
      if(mediaViewerPageByCourse[currentCourseId] == null) mediaViewerPageByCourse[currentCourseId] = 0;
      mediaViewerPageByCourse[currentCourseId] = Math.min(mediaViewerPageByCourse[currentCourseId], course.pages.length - 1);
      const pageIdx = mediaViewerPageByCourse[currentCourseId];
      const page = course.pages[pageIdx];
      const wrap = document.createElement('div');
      wrap.className = 'media-viewer-doc-wrap';
      wrap.innerHTML = `
        <div class="media-viewer-doc-page">
          <p class="media-viewer-doc-kicker">${course.title}</p>
          <h4 class="media-viewer-doc-heading">${page.heading}</h4>
          ${page.paras.map(p => `<p class="media-viewer-doc-para">${p}</p>`).join('')}
          <p class="media-viewer-doc-pageno">\u2014 ${pageIdx + 1} \u2014</p>
        </div>
        <div class="media-viewer-pager">
          <button type="button" class="media-viewer-pager-btn" id="mvPrevBtn" ${pageIdx === 0 ? 'disabled' : ''}>\u2190 Prev</button>
          <span class="media-viewer-pager-label">Page ${pageIdx + 1} of ${course.pages.length}</span>
          <button type="button" class="media-viewer-pager-btn" id="mvNextBtn" ${pageIdx === course.pages.length - 1 ? 'disabled' : ''}>Next \u2192</button>
        </div>`;
      mediaViewerFrameWrap.appendChild(wrap);
      wireMediaPager(course, course.pages.length);
      if(pageIdx === course.pages.length - 1) markCourseMediaComplete(currentCourseId);
    } else if(course.mediaType === 'ppt-sim' && course.slides){
      if(mediaViewerPageByCourse[currentCourseId] == null) mediaViewerPageByCourse[currentCourseId] = 0;
      mediaViewerPageByCourse[currentCourseId] = Math.min(mediaViewerPageByCourse[currentCourseId], course.slides.length - 1);
      const pageIdx = mediaViewerPageByCourse[currentCourseId];
      const slide = course.slides[pageIdx];
      const wrap = document.createElement('div');
      wrap.className = 'media-viewer-doc-wrap';
      wrap.innerHTML = `
        <div class="media-viewer-slide">
          <h4 class="media-viewer-slide-title">${slide.title}</h4>
          <ul class="media-viewer-slide-bullets">${slide.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
          <p class="media-viewer-doc-pageno">Slide ${pageIdx + 1}</p>
        </div>
        <div class="media-viewer-pager">
          <button type="button" class="media-viewer-pager-btn" id="mvPrevBtn" ${pageIdx === 0 ? 'disabled' : ''}>\u2190 Prev</button>
          <span class="media-viewer-pager-label">Slide ${pageIdx + 1} of ${course.slides.length}</span>
          <button type="button" class="media-viewer-pager-btn" id="mvNextBtn" ${pageIdx === course.slides.length - 1 ? 'disabled' : ''}>Next \u2192</button>
        </div>`;
      mediaViewerFrameWrap.appendChild(wrap);
      wireMediaPager(course, course.slides.length);
      if(pageIdx === course.slides.length - 1) markCourseMediaComplete(currentCourseId);
    } else if(course.mediaType === 'video-sim' || course.mediaType === 'generic-sim'){
      // A lesson added through the Manage Courses grid with no real file attached yet —
      // shows a clearly-labeled placeholder instead of doing nothing when clicked.
      const wrap = document.createElement('div');
      wrap.className = 'media-viewer-doc-wrap';
      const heading = course.mediaType === 'video-sim' ? 'Simulated Video' : 'Simulated File';
      wrap.innerHTML = `
        <div class="media-viewer-doc-page">
          <p class="media-viewer-doc-kicker">${course.title}</p>
          <h4 class="media-viewer-doc-heading">${heading}</h4>
          <p class="media-viewer-doc-para">No real file is attached to this lesson yet — this is a placeholder so the lesson can still be opened and worked through.</p>
        </div>`;
      mediaViewerFrameWrap.appendChild(wrap);
      markCourseMediaComplete(currentCourseId);
    }
  }

  // Wires up the Prev/Next buttons for the simulated PDF/slide preview (per-course page position)
  function wireMediaPager(course, count){
    const prevBtn = document.getElementById('mvPrevBtn');
    const nextBtn = document.getElementById('mvNextBtn');
    if(prevBtn) prevBtn.addEventListener('click', () => {
      if(mediaViewerPageByCourse[currentCourseId] > 0){
        mediaViewerPageByCourse[currentCourseId] -= 1;
        renderMediaViewer(course);
      }
    });
    if(nextBtn) nextBtn.addEventListener('click', () => {
      if(mediaViewerPageByCourse[currentCourseId] < count - 1){
        mediaViewerPageByCourse[currentCourseId] += 1;
        renderMediaViewer(course);
      }
    });
  }

  const viewedCourseIds = new Set();
  const courseListEl = document.getElementById('courseListEl');

  // Wires a single course-item button (used for every dynamically-rendered lesson row)
  function wireCourseItem(item){
    item.addEventListener('click', () => {
      const course = getCourseById(item.dataset.courseId);
      if(!course) return;

      document.querySelectorAll('.course-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      viewedCourseIds.add(item.dataset.courseId);
      currentCourseId = item.dataset.courseId;
      ensureCourseProgress(currentCourseId);

      if(mediaViewerEmpty) mediaViewerEmpty.hidden = true;
      if(mediaViewerContent) mediaViewerContent.hidden = false;
      renderMediaViewer(course);

      // Each course click replaces the flashcard queue entirely with just this lesson's questions
      flashcards.length = 0;
      currentFlashcardIndex = -1;
      flashcardFlipped = false;
      addFlashcardBatch(course.questions);
      syncPanelHeights();
    });
  }

  // ----- Manage courses by program ----------------------------------------
  // The Courses panel's lesson list lives in D1 now (see migrations/0001_init.sql),
  // reached via GET /api/courses (already filtered server-side to the signed-in user's
  // enrolled programs) and, for admins, the full CRUD grid backed by /api/admin/programs.

  // The signed-in user's own course list, as returned by the server — what's rendered in
  // the Courses panel and what course clicks resolve against.
  let myCourses = [];
  let currentUserPrograms = [];

  async function loadMyCourses(){
    try{
      const res = await fetch('/api/courses', { credentials:'same-origin' });
      myCourses = res.ok ? await res.json() : [];
    } catch(e){ myCourses = []; }
    renderCourseListFromProgramGrid();
  }

  // Rebuilds the Courses panel's lesson list from myCourses. Rows whose id matches a real
  // COURSE_CONTENT entry (the 3 original lessons) open with full content; any admin-added
  // row without matching content simply does nothing when clicked (there's no lesson data
  // behind it yet) rather than erroring.
  function renderCourseListFromProgramGrid(){
    if(!courseListEl) return;
    const previousActiveId = currentCourseId;
    courseListEl.innerHTML = '';

    if(!myCourses.length){
      const empty = document.createElement('p');
      empty.className = 'access-sub';
      empty.style.margin = '0';
      empty.textContent = currentUserPrograms.length
        ? `No lessons are assigned to "${currentUserPrograms.join(', ')}" yet.`
        : 'No lessons available yet.';
      courseListEl.appendChild(empty);
      updateCourseLockState();
      return;
    }

    myCourses.forEach(row => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'course-item';
      btn.dataset.courseId = row.id;
      const titleLine = [row.program, row.courseName].filter(Boolean).join(' · ');
      btn.innerHTML = `
        <span class="course-item-text">
          <span class="course-item-title">${titleLine || '(untitled lesson)'}</span>
          <span class="course-item-type">${row.fileName || ''}</span>
        </span>`;
      if(row.id === previousActiveId) btn.classList.add('active');
      courseListEl.appendChild(btn);
      wireCourseItem(btn);
    });
    updateCourseLockState();
  }

  // ----- Admin: Manage courses by program grid (full CRUD, admin-only) ----
  let adminProgramCourses = [];
  const programCoursesBody = document.getElementById('programCoursesBody');

  async function loadAdminProgramCourses(){
    try{
      const res = await fetch('/api/admin/programs', { credentials:'same-origin' });
      adminProgramCourses = res.ok ? await res.json() : [];
    } catch(e){ adminProgramCourses = []; }
    renderProgramCoursesGrid();
  }

  async function patchProgramCourseRow(id, patch){
    await fetch(`/api/admin/programs/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    });
    // Program names feed the per-user "Programs" checkboxes in the access grid — keep
    // those columns in sync whenever a row's program name changes.
    if('program' in patch) refreshAccessGrid();
  }

  // Builds the Program/Courses/File name grid rows, each field editable in place
  function renderProgramCoursesGrid(){
    if(!programCoursesBody) return;
    programCoursesBody.innerHTML = '';
    adminProgramCourses.forEach(row => {
      const tr = document.createElement('tr');

      const tdProgram = document.createElement('td');
      const programInput = document.createElement('input');
      programInput.type = 'text';
      programInput.value = row.program || '';
      programInput.addEventListener('change', () => {
        row.program = programInput.value;
        patchProgramCourseRow(row.id, { program: row.program });
      });
      tdProgram.appendChild(programInput);
      tr.appendChild(tdProgram);

      const tdCourse = document.createElement('td');
      const courseInput = document.createElement('input');
      courseInput.type = 'text';
      courseInput.style.width = '140px';
      courseInput.value = row.courseName || '';
      courseInput.addEventListener('change', () => {
        row.courseName = courseInput.value;
        patchProgramCourseRow(row.id, { courseName: row.courseName });
      });
      tdCourse.appendChild(courseInput);
      tr.appendChild(tdCourse);

      const tdFile = document.createElement('td');
      const fileInput = document.createElement('input');
      fileInput.type = 'text';
      fileInput.style.width = '170px';
      fileInput.value = row.fileName || '';
      fileInput.addEventListener('change', () => {
        row.fileName = fileInput.value;
        patchProgramCourseRow(row.id, { fileName: row.fileName });
      });
      tdFile.appendChild(fileInput);
      tr.appendChild(tdFile);

      const tdDelete = document.createElement('td');
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'access-grid-delete-btn';
      delBtn.textContent = '✕';
      delBtn.title = 'Remove this row';
      delBtn.setAttribute('aria-label', 'Remove this row');
      delBtn.addEventListener('click', async () => {
        adminProgramCourses = adminProgramCourses.filter(r => r.id !== row.id);
        renderProgramCoursesGrid();
        await fetch(`/api/admin/programs/${encodeURIComponent(row.id)}`, { method:'DELETE', credentials:'same-origin' });
        refreshAccessGrid();
      });
      tdDelete.appendChild(delBtn);
      tr.appendChild(tdDelete);

      programCoursesBody.appendChild(tr);
    });
  }

  const newProgramInput = document.getElementById('newProgramInput');
  const addProgramBtn = document.getElementById('addProgramBtn');
  async function addProgramRow(){
    if(!newProgramInput) return;
    const programName = newProgramInput.value.trim();
    if(!programName) return;
    newProgramInput.value = '';
    const res = await fetch('/api/admin/programs', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ program: programName })
    });
    if(res.ok){
      adminProgramCourses.push(await res.json());
      renderProgramCoursesGrid();
      refreshAccessGrid();
    }
  }
  if(addProgramBtn) addProgramBtn.addEventListener('click', addProgramRow);
  if(newProgramInput) newProgramInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') addProgramRow(); });

  // Debounces by a caller-supplied key so unrelated fields (different questions/tabs) don't
  // cancel each other's pending saves — only repeated edits to the SAME field get coalesced.
  // Used for free-typed answer text, where the browser's "input" event fires per keystroke;
  // saving that straight to the network (rather than localStorage) on every keystroke would
  // spam the API, so those saves are debounced while local state still updates instantly.
  function makeKeyedDebouncer(wait){
    const timers = {};
    return (key, fn) => {
      clearTimeout(timers[key]);
      timers[key] = setTimeout(fn, wait);
    };
  }
  const debouncedSave = makeKeyedDebouncer(600);

  // ----- Shared file attachments (Workbook answers + My Chart tabs) -------
  // Both features attach at most one file to a slot (a workbook answer, or a My Chart tab);
  // uploads live in R2 with metadata in D1 (functions/api/uploads/**). One shared index,
  // fetched once per login, backs both panels instead of two separate localStorage blobs.
  const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // matches functions/_lib/uploads.js
  let uploadsIndex = {};

  async function loadUploadsIndex(){
    try{
      const res = await fetch('/api/uploads', { credentials:'same-origin' });
      const rows = res.ok ? await res.json() : [];
      uploadsIndex = {};
      rows.forEach(row => { uploadsIndex[`${row.context}:${row.contextRef}`] = row; });
    } catch(e){ uploadsIndex = {}; }
  }

  function getUpload(uploadContext, contextRef){
    return uploadsIndex[`${uploadContext}:${contextRef}`] || null;
  }

  // Uploads a file for a given slot, replacing any existing attachment there (the server
  // deletes the old R2 object/row first — see functions/api/uploads/index.js).
  async function uploadAttachment(file, uploadContext, contextRef){
    if(file.size > MAX_ATTACHMENT_BYTES){
      alert('That file is larger than 10 MB — try a smaller file.');
      return false;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('context', uploadContext);
    formData.append('contextRef', contextRef);
    const res = await fetch('/api/uploads', { method:'POST', credentials:'same-origin', body: formData });
    if(!res.ok){
      const body = await res.json().catch(() => ({}));
      alert(body.error || "Couldn't upload that file.");
      return false;
    }
    await loadUploadsIndex();
    return true;
  }

  async function removeUpload(uploadId){
    await fetch(`/api/uploads/${encodeURIComponent(uploadId)}`, { method:'DELETE', credentials:'same-origin' }).catch(() => {});
    await loadUploadsIndex();
  }

  // Shared preview card for an uploaded attachment (used by both Workbook answers and My
  // Chart tabs) — an image gets an inline thumbnail (the <img> request carries the session
  // cookie same-origin, and browsers render <img src> regardless of the download's
  // Content-Disposition), anything else gets a generic file icon + name. The download link
  // and the remove button both key off the upload's own id, so removal doesn't need to know
  // which feature the attachment belongs to.
  function attachmentPreviewHTML(upload){
    if(!upload) return '';
    const url = `/api/uploads/${upload.id}`;
    const isImage = /^image\//.test(upload.mimeType || '');
    const body = isImage
      ? `<img src="${url}" alt="${upload.fileName}" class="workbook-attachment-thumb">`
      : `<div class="workbook-attachment-file"><span class="workbook-attachment-file-icon">📄</span><span class="workbook-attachment-file-name">${upload.fileName}</span></div>`;
    return `
      <div class="workbook-attachment-preview-card">
        ${body}
        <div class="workbook-attachment-preview-footer">
          <a class="workbook-attachment-preview-name" href="${url}" download="${upload.fileName}">${upload.fileName}</a>
          <button type="button" class="workbook-attachment-remove" data-upload-id="${upload.id}" aria-label="Remove attachment">✕</button>
        </div>
      </div>`;
  }

  // ----- Workbook (fixed document text + free-typed answers) -------------
  // Each workbook is stored as a sequence of "blocks" — plain text lines (shown as-is,
  // in order, exactly like the source document) and "answer" blocks (an editable text
  // box, placed exactly where the document had a blank to fill in). This shows the whole
  // document, not just the extracted questions. Answers and any documents added via
  // "+ Add Document" are saved to the signed-in user's account (D1, via functions/api/
  // workbook/**) so everything is exactly as left the next time this file is opened —
  // on any device, not just this browser.
  const WORKBOOK_CONTENT = {
    'basic-practice-worksheet': {
      title: 'Basic Vedic Astrology — Practice Worksheet',
      type: 'Workbook · 3 questions',
      blocks: [
        { type:'text', text:'Basic Vedic Astrology — Practice Worksheet' },
        { type:'text', text:'Name: ______________________   Date: ______________________' },
        { type:'text', text:'Question 1' },
        { type:'text', text:'What are the 12 Rashis (zodiac signs), and what does each generally represent in Vedic astrology?' },
        { type:'text', text:'Answer:' },
        { type:'answer', index:0 },
        { type:'text', text:'Question 2' },
        { type:'text', text:'What is the difference between a Graha (planet) and a Rashi (zodiac sign)? Give one example of each.' },
        { type:'text', text:'Answer:' },
        { type:'answer', index:1 },
        { type:'text', text:'Question 3' },
        { type:'text', text:'What is a Nakshatra, and why is it important when interpreting a birth chart?' },
        { type:'text', text:'Answer:' },
        { type:'answer', index:2 }
      ]
    },
    'signs-basics': {
      title: 'Zodiac Signs — Practice Sheet',
      type: 'Workbook · 4 questions',
      blocks: [
        { type:'text', text:'Question 1' }, { type:'text', text:'List the three Fire signs.' }, { type:'text', text:'Answer:' }, { type:'answer', index:0 },
        { type:'text', text:'Question 2' }, { type:'text', text:'Which sign starts the zodiac, and what element is it?' }, { type:'text', text:'Answer:' }, { type:'answer', index:1 },
        { type:'text', text:'Question 3' }, { type:'text', text:'Name a Cardinal sign and a Fixed sign.' }, { type:'text', text:'Answer:' }, { type:'answer', index:2 },
        { type:'text', text:'Question 4' }, { type:'text', text:'What duality (Yang/Yin) is Taurus?' }, { type:'text', text:'Answer:' }, { type:'answer', index:3 }
      ]
    },
    'dignities-practice': {
      title: 'Planetary Dignities — Worksheet',
      type: 'Workbook · 3 questions',
      blocks: [
        { type:'text', text:'Question 1' }, { type:'text', text:'Which sign is the Sun exalted in?' }, { type:'text', text:'Answer:' }, { type:'answer', index:0 },
        { type:'text', text:'Question 2' }, { type:'text', text:"What is Jupiter's own sign(s)?" }, { type:'text', text:'Answer:' }, { type:'answer', index:1 },
        { type:'text', text:'Question 3' }, { type:'text', text:'Where is the Moon debilitated?' }, { type:'text', text:'Answer:' }, { type:'answer', index:2 }
      ]
    }
  };

  const workbookViewerEmpty = document.getElementById('workbookViewerEmpty');
  const workbookViewerContent = document.getElementById('workbookViewerContent');
  const workbookViewerTitle = document.getElementById('workbookViewerTitle');
  const workbookViewerType = document.getElementById('workbookViewerType');
  const workbookQaList = document.getElementById('workbookQaList');
  const workbookListEl = document.getElementById('workbookListEl');
  const workbookAddStatus = document.getElementById('workbookAddStatus');

  // { workbookId: [{text, editedBy, editedAt}, ...] } — what's been typed, and by whom
  const workbookAnswers = {};
  // Which workbook is currently open in the editor (so deleting it can reset the viewer)
  let currentWorkbookId = null;

  const workbookUserNameLabel = document.getElementById('workbookUserNameLabel');
  const changeUserNameBtn = document.getElementById('changeUserNameBtn');
  const WORKBOOK_USER_KEY = 'vedicChartWorkbookUserName';
  let currentUserName = 'You';
  try{ currentUserName = localStorage.getItem(WORKBOOK_USER_KEY) || 'You'; } catch(e){ /* ignore */ }
  function updateUserNameLabel(){
    if(workbookUserNameLabel) workbookUserNameLabel.textContent = currentUserName;
  }
  updateUserNameLabel();
  if(changeUserNameBtn){
    changeUserNameBtn.addEventListener('click', () => {
      const next = prompt('Your name (tagged on any answers you edit):', currentUserName);
      if(next && next.trim()){
        currentUserName = next.trim();
        try{ localStorage.setItem(WORKBOOK_USER_KEY, currentUserName); } catch(e){ /* ignore */ }
        updateUserNameLabel();
      }
    });
  }

  // Self-service "clear my uploads": wipes every file this user has ever attached, across
  // both Workbook answers and My Chart tabs, then re-renders whichever is currently open so
  // the removed attachments disappear immediately.
  const clearUploadsBtn = document.getElementById('clearUploadsBtn');
  if(clearUploadsBtn){
    clearUploadsBtn.addEventListener('click', async () => {
      if(!confirm("Clear all your uploaded files? This can't be undone.")) return;
      await fetch('/api/uploads', { method:'DELETE', credentials:'same-origin' }).catch(() => {});
      await loadUploadsIndex();
      if(currentWorkbookId) renderWorkbookViewer(currentWorkbookId);
      if(myChartTabs.length) renderMyChart();
    });
  }

  // Fetches this user's custom workbook documents and answers from the server and hydrates
  // WORKBOOK_CONTENT/workbookAnswers from them. Called after login, alongside loadMyCourses()
  // etc. — see applyAccessVisibility().
  async function loadWorkbookState(){
    try{
      const [docsRes, answersRes] = await Promise.all([
        fetch('/api/workbook/documents', { credentials:'same-origin' }),
        fetch('/api/workbook/answers', { credentials:'same-origin' }),
      ]);
      const docs = docsRes.ok ? await docsRes.json() : [];
      docs.forEach(doc => {
        WORKBOOK_CONTENT[doc.id] = { title: doc.title, type: doc.type, blocks: doc.blocks };
        addWorkbookListItem(doc.id, doc.title, doc.type);
      });
      const answers = answersRes.ok ? await answersRes.json() : {};
      Object.keys(answers).forEach(id => { workbookAnswers[id] = answers[id]; });
    } catch(e){ /* stay with whatever's already local */ }
  }

  function saveWorkbookAnswer(workbookId, questionIndex, text, editedBy, editedAt){
    fetch('/api/workbook/answers', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workbookId, questionIndex, text, editedBy, editedAt })
    }).catch(() => { /* best-effort */ });
  }

  // Renders the full document text in order, with an editable answer box (tagged with who
  // last edited it, and an optional file attachment) exactly where the document had a blank.
  function renderWorkbookViewer(workbookId){
    const wb = WORKBOOK_CONTENT[workbookId];
    if(!wb || !workbookQaList) return;
    currentWorkbookId = workbookId;
    if(workbookViewerTitle) workbookViewerTitle.textContent = wb.title;
    if(workbookViewerType) workbookViewerType.textContent = wb.type;

    const answerCount = wb.blocks.filter(b => b.type === 'answer').length;
    const blankAnswer = () => ({ text:'', editedBy:'', editedAt:'' });
    if(!workbookAnswers[workbookId]) workbookAnswers[workbookId] = new Array(answerCount).fill(0).map(blankAnswer);
    while(workbookAnswers[workbookId].length < answerCount) workbookAnswers[workbookId].push(blankAnswer());
    const savedAnswers = workbookAnswers[workbookId];

    workbookQaList.innerHTML = wb.blocks.map(block => {
      if(block.type === 'answer'){
        const idx = block.index;
        const ans = savedAnswers[idx] || blankAnswer();
        const attachment = getUpload('workbook-answer', `${workbookId}:${idx}`);
        const displayValue = (ans.text && ans.text.length) ? ans.text : `${currentUserName} : `;
        return `
          <div class="workbook-answer-input-wrap">
            <textarea class="workbook-qa-answer" data-workbook-id="${workbookId}" data-q-index="${idx}" placeholder="Type your answer here…">${displayValue}</textarea>
            <label class="workbook-attach-plus" title="Attach a file" aria-label="Attach a file">+
              <input type="file" class="workbook-attach-input" data-workbook-id="${workbookId}" data-q-index="${idx}" hidden>
            </label>
          </div>
          ${attachmentPreviewHTML(attachment)}`;
      }
      const cls = /^question\s*\d+/i.test(block.text) ? 'workbook-block-heading' : 'workbook-block-text';
      return `<p class="${cls}">${block.text}</p>`;
    }).join('');

    workbookQaList.querySelectorAll('.workbook-qa-answer').forEach(ta => {
      ta.addEventListener('input', () => {
        const wid = ta.dataset.workbookId;
        const qi = parseInt(ta.dataset.qIndex, 10);
        if(!workbookAnswers[wid]) workbookAnswers[wid] = [];
        if(!workbookAnswers[wid][qi]) workbookAnswers[wid][qi] = blankAnswer();
        workbookAnswers[wid][qi].text = ta.value;
        workbookAnswers[wid][qi].editedBy = currentUserName;
        workbookAnswers[wid][qi].editedAt = new Date().toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
        debouncedSave(`workbook:${wid}:${qi}`, () => {
          saveWorkbookAnswer(wid, qi, workbookAnswers[wid][qi].text, workbookAnswers[wid][qi].editedBy, workbookAnswers[wid][qi].editedAt);
        });
      });
    });

    workbookQaList.querySelectorAll('.workbook-attach-input').forEach(input => {
      input.addEventListener('change', async () => {
        const file = input.files && input.files[0];
        if(!file) return;
        const wid = input.dataset.workbookId;
        const qi = input.dataset.qIndex;
        const ok = await uploadAttachment(file, 'workbook-answer', `${wid}:${qi}`);
        input.value = '';
        if(ok) renderWorkbookViewer(wid);
      });
    });

    workbookQaList.querySelectorAll('.workbook-attachment-remove').forEach(btn => {
      btn.addEventListener('click', async () => {
        await removeUpload(btn.dataset.uploadId);
        renderWorkbookViewer(workbookId);
      });
    });
  }

  // Wires a workbook list button (static or dynamically added) to open it in the editor
  function wireWorkbookItem(item){
    item.addEventListener('click', () => {
      const workbookId = item.dataset.workbookId;
      if(!WORKBOOK_CONTENT[workbookId]) return;

      document.querySelectorAll('.workbook-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      if(workbookViewerEmpty) workbookViewerEmpty.hidden = true;
      if(workbookViewerContent) workbookViewerContent.hidden = false;
      renderWorkbookViewer(workbookId);
      syncPanelHeights();
    });
  }

  // Removes an uploaded document from the list, its answers/attachments, and the server.
  // Only documents added via "+ Add Document" can be removed — the built-in examples can't.
  async function removeWorkbookDocument(id){
    delete WORKBOOK_CONTENT[id];
    delete workbookAnswers[id];
    const itemBtn = workbookListEl ? workbookListEl.querySelector(`[data-workbook-id="${id}"]`) : null;
    if(itemBtn){
      const row = itemBtn.closest('.workbook-row');
      (row || itemBtn).remove();
    }
    if(currentWorkbookId === id){
      currentWorkbookId = null;
      if(workbookViewerEmpty) workbookViewerEmpty.hidden = false;
      if(workbookViewerContent) workbookViewerContent.hidden = true;
    }
    syncPanelHeights();
    await fetch(`/api/workbook/documents/${encodeURIComponent(id)}`, { method:'DELETE', credentials:'same-origin' }).catch(() => {});
    await loadUploadsIndex();
  }

  // Adds a new workbook button to the list (used both for uploads and for restoring
  // previously-added documents from the server). Uploaded documents get a small delete
  // control next to them; the built-in examples don't.
  function addWorkbookListItem(id, title, type){
    if(!workbookListEl || workbookListEl.querySelector(`[data-workbook-id="${id}"]`)) return;
    const isUploaded = id.indexOf('uploaded-') === 0;

    const itemBtn = document.createElement('button');
    itemBtn.type = 'button';
    itemBtn.className = 'workbook-item';
    itemBtn.dataset.workbookId = id;
    itemBtn.innerHTML = `
      <span class="course-item-text">
        <span class="course-item-title">${title}</span>
        <span class="course-item-type">${type}</span>
      </span>`;
    wireWorkbookItem(itemBtn);

    if(isUploaded){
      const row = document.createElement('div');
      row.className = 'workbook-row';
      row.appendChild(itemBtn);
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'workbook-delete-btn';
      delBtn.title = 'Remove this document';
      delBtn.setAttribute('aria-label', 'Remove this document');
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeWorkbookDocument(id);
      });
      row.appendChild(delBtn);
      workbookListEl.appendChild(row);
    } else {
      workbookListEl.appendChild(itemBtn);
    }
  }

  // Turns raw extracted text (from a .docx or .txt upload) into the same block sequence
  // used for the built-in workbooks: every real text line is kept and shown as-is, and any
  // run of blank-fill lines (the "___" writing lines in a printed worksheet) becomes a single
  // answer box in that exact spot — so the whole document shows, not just its questions.
  function parseWorkbookDocument(text){
    const rawLines = (text || '').split(/\r?\n/).map(l => l.trim());
    const blocks = [];
    let answerIndex = 0;
    let i = 0;
    while(i < rawLines.length){
      const line = rawLines[i];
      if(!line){ i++; continue; }
      if(/^_{5,}$/.test(line)){
        while(i < rawLines.length && (/^_{5,}$/.test(rawLines[i]) || !rawLines[i])){ i++; }
        if(!blocks.length || blocks[blocks.length - 1].type !== 'answer'){
          blocks.push({ type:'answer', index: answerIndex++ });
        }
        continue;
      }
      blocks.push({ type:'text', text: line });
      i++;
    }
    return blocks;
  }

  const addWorkbookBtn = document.getElementById('addWorkbookBtn');
  const workbookFileInput = document.getElementById('workbookFileInput');
  if(addWorkbookBtn && workbookFileInput){
    addWorkbookBtn.addEventListener('click', () => workbookFileInput.click());
    workbookFileInput.addEventListener('change', async () => {
      const file = workbookFileInput.files && workbookFileInput.files[0];
      if(!file) return;
      if(workbookAddStatus) workbookAddStatus.textContent = 'Reading ' + file.name + '…';

      let text = '';
      try{
        if(/\.docx$/i.test(file.name) && window.mammoth){
          const arrayBuffer = await file.arrayBuffer();
          const result = await window.mammoth.extractRawText({ arrayBuffer });
          text = result.value || '';
        } else {
          text = await file.text();
        }
      } catch(err){
        if(workbookAddStatus) workbookAddStatus.textContent = "Couldn't read that file — try a .docx or .txt file.";
        workbookFileInput.value = '';
        return;
      }

      const blocks = parseWorkbookDocument(text);
      const answerCount = blocks.filter(b => b.type === 'answer').length;
      if(!blocks.length){
        if(workbookAddStatus) workbookAddStatus.textContent = 'No readable text was found in that document.';
        workbookFileInput.value = '';
        return;
      }

      const title = file.name.replace(/\.[^.]+$/, '');
      const type = `Workbook · ${answerCount} question${answerCount === 1 ? '' : 's'}`;
      const res = await fetch('/api/workbook/documents', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, type, blocks })
      });
      if(!res.ok){
        if(workbookAddStatus) workbookAddStatus.textContent = "Couldn't save that document — try again.";
        workbookFileInput.value = '';
        return;
      }
      const doc = await res.json();
      WORKBOOK_CONTENT[doc.id] = { title: doc.title, type: doc.type, blocks: doc.blocks };
      addWorkbookListItem(doc.id, doc.title, doc.type);
      if(workbookAddStatus) workbookAddStatus.textContent = `Added "${file.name}" to the repository.`;
      workbookFileInput.value = '';
      syncPanelHeights();
    });
  }

  document.querySelectorAll('.workbook-item').forEach(wireWorkbookItem);

  // ----- My Chart (multi-tab collaborative document) --------------------------------
  // Same pattern as the Workbook (name tagged inline in the answer text, "+" file
  // attachment inside the answer box), organized as named sections/tabs instead of one
  // flat document. The section list lives in the narrow My Chart panel (same pattern as
  // the Courses/Workbook lists); the wide viewer just shows whichever section is active.
  // Tabs — including "Generate Interpretation" sections, whose shape grows well beyond
  // label/question/answer (generated/planetName/sign/house/sentenceStarter/responses{10
  // sub-fields}) — are persisted server-side as one JSON blob each (see functions/api/
  // mychart/tabs.js and migrations/0003_uploads_and_documents.sql).

  function defaultMyChartTabsSeed(){
    return [
      { label:'Zodiac Signs', dot:'#2f5fa8',
        question:'What are the 12 Rashis (zodiac signs), and what does each generally represent in Vedic astrology?',
        answer:'', editedBy:'', editedAt:'' },
      { label:'Planets vs Signs', dot:'#b8862f',
        question:'What is the difference between a Graha (planet) and a Rashi (zodiac sign)? Give one example of each.',
        answer:'', editedBy:'', editedAt:'' },
      { label:'Nakshatras', dot:'#2f8a4e',
        question:'What is a Nakshatra, and why is it important when interpreting a birth chart?',
        answer:'', editedBy:'', editedAt:'' }
    ];
  }

  let myChartTabs = [];
  let activeMyChartTab = null;
  let addingMyChartSection = false;
  let renamingMyChartTabId = null;
  let draggedMyChartTabId = null;

  async function createMyChartTab(fields){
    try{
      const res = await fetch('/api/mychart/tabs', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      });
      return res.ok ? await res.json() : null;
    } catch(e){ return null; }
  }

  function updateMyChartTab(id, fields){
    fetch(`/api/mychart/tabs/${encodeURIComponent(id)}`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields)
    }).catch(() => { /* best-effort */ });
  }

  async function deleteMyChartTab(id){
    await fetch(`/api/mychart/tabs/${encodeURIComponent(id)}`, { method:'DELETE', credentials:'same-origin' }).catch(() => {});
  }

  // Fetches this user's My Chart tabs; a brand-new user has none yet, so the same 3 starter
  // sections everyone used to get by default are created for them server-side. Called after
  // login, alongside loadMyCourses() etc. — see applyAccessVisibility().
  async function loadMyChartTabs(){
    try{
      const res = await fetch('/api/mychart/tabs', { credentials:'same-origin' });
      let tabs = res.ok ? await res.json() : [];
      if(!tabs.length){
        const seeds = defaultMyChartTabsSeed();
        tabs = [];
        for(let i = 0; i < seeds.length; i++){
          const created = await createMyChartTab({ ...seeds[i], sortOrder: i });
          if(created) tabs.push(created);
        }
      }
      myChartTabs = tabs;
    } catch(e){ myChartTabs = []; }
    if(!myChartTabs.length){
      // Server unreachable on a brand-new account — fall back to local-only starter
      // sections rather than showing an empty panel; they'll sync up on the next load.
      myChartTabs = defaultMyChartTabsSeed().map((t, i) => ({ id: 'local-' + i, sortOrder: i, ...t }));
    }
    activeMyChartTab = myChartTabs[0].id;
    renderMyChart();
  }

  function myChartAttachmentPreviewHTML(tabId){
    return attachmentPreviewHTML(getUpload('mychart-tab', tabId));
  }

  // Renders the section list into the narrow My Chart panel, and the active section's
  // collaborative Q&A into the wide viewer.
  function renderMyChart(){
    const listEl = document.getElementById('mychartListEl');
    const contentArea = document.getElementById('mychartContentArea');
    const titleEl = document.getElementById('mychartActiveTabTitle');
    if(!listEl || !contentArea || !myChartTabs.length) return;

    listEl.innerHTML = myChartTabs.map(t => {
      const isRenaming = t.id === renamingMyChartTabId;
      if(isRenaming){
        return `
        <div class="workbook-row" data-mychart-row="${t.id}" draggable="false">
          <div class="mychart-item mychart-item-adding">
            <span class="mychart-tab-dot" style="background:${t.dot}"></span>
            <input type="text" class="mychart-new-section-input" id="mychartRenameInput" value="${t.label.replace(/"/g,'&quot;')}">
          </div>
        </div>`;
      }
      return `
      <div class="workbook-row" data-mychart-row="${t.id}" draggable="true">
        <button type="button" class="mychart-item ${t.id === activeMyChartTab ? 'active' : ''}" data-mychart-tab="${t.id}">
          <span class="mychart-tab-handle">⠿</span>
          <span class="mychart-tab-dot" style="background:${t.dot}"></span>
          <span class="course-item-text"><span class="course-item-title mychart-label" data-mychart-label="${t.id}" title="Double-click to rename">${t.label}</span></span>
        </button>
        <button type="button" class="workbook-delete-btn" data-mychart-delete="${t.id}" title="Remove this section" aria-label="Remove this section">✕</button>
      </div>`;
    }).join('');

    if(renamingMyChartTabId){
      const renameInput = document.getElementById('mychartRenameInput');
      if(renameInput){
        let renameCommitted = false;
        const commitRename = () => {
          if(renameCommitted) return;
          renameCommitted = true;
          const tab = myChartTabs.find(t => t.id === renamingMyChartTabId);
          const newLabel = renameInput.value.trim();
          if(tab && newLabel){
            tab.label = newLabel;
            updateMyChartTab(tab.id, { label: newLabel });
          }
          renamingMyChartTabId = null;
          renderMyChart();
        };
        renameInput.addEventListener('keydown', (e) => {
          e.stopPropagation();
          if(e.key === 'Enter') commitRename();
          else if(e.key === 'Escape'){ renameCommitted = true; renamingMyChartTabId = null; renderMyChart(); }
        });
        renameInput.addEventListener('click', (e) => e.stopPropagation());
        renameInput.addEventListener('blur', commitRename);
        renameInput.focus();
        renameInput.select();
      }
    }

    // Adding a new section: an inline input line right after the existing tabs, instead of
    // a floating prompt() dialog.
    if(addingMyChartSection){
      const row = document.createElement('div');
      row.className = 'workbook-row';
      row.innerHTML = `
        <div class="mychart-item mychart-item-adding">
          <span class="mychart-tab-dot" style="background:${MYCHART_DOT_COLORS[myChartTabs.length % MYCHART_DOT_COLORS.length]}"></span>
          <input type="text" id="mychartNewSectionInput" class="mychart-new-section-input" placeholder="Section name…">
        </div>`;
      listEl.appendChild(row);
      const input = row.querySelector('#mychartNewSectionInput');
      let committed = false;
      const commit = async () => {
        // Re-entrancy guard: pressing Enter triggers renderMyChart(), which replaces this
        // input's DOM node — removing a focused element fires an implicit "blur" on it,
        // which would otherwise call commit() a second time and create a duplicate section.
        if(committed) return;
        committed = true;
        const label = input.value.trim();
        addingMyChartSection = false;
        if(label){
          const dot = MYCHART_DOT_COLORS[myChartTabs.length % MYCHART_DOT_COLORS.length];
          const created = await createMyChartTab({
            label, dot, question:'Add a question or note for this section.', answer:'', editedBy:'', editedAt:'',
            sortOrder: myChartTabs.length
          });
          if(created){
            myChartTabs.push(created);
            activeMyChartTab = created.id;
          }
        }
        renderMyChart();
      };
      input.addEventListener('keydown', (e) => {
        if(e.key === 'Enter') commit();
        else if(e.key === 'Escape'){ committed = true; addingMyChartSection = false; renderMyChart(); }
      });
      input.addEventListener('blur', commit);
      input.focus();
    }

    const active = myChartTabs.find(t => t.id === activeMyChartTab) || myChartTabs[0];
    activeMyChartTab = active.id;
    if(titleEl) titleEl.textContent = active.label;
    // Generated interpretation sections use a guided ATV conversation. Manually-added
    // sections retain the original single-question/single-answer editor below.
    const isGenerated = !!active.generated || /^mychart-interp-/.test(active.id || '');

    if(isGenerated){
      const starter = active.sentenceStarter || SENTENCE_STARTER[active.planetName] || 'I express';
      const responses = active.responses || (active.responses = {
        planetWord:'', planetSentence:'', dualityWord:'', dualitySentence:'', modalityWord:'', modalitySentence:'', elementWord:'', elementSentence:'', fourWordsSentence:'', houseWord:'', houseSentence:''
      });

      // Backward compatibility: an older generated section may only have the original
      // free-form answer. Keep it available as the first response rather than losing it.
      if(!responses.planetSentence && !responses.planetWord && active.answer){
        responses.planetSentence = active.answer;
      }

      const esc = (value) => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      const systemLine = (text) => `
        <div class="mychart-collab-line mychart-collab-system" contenteditable="false">
          <span class="mychart-name-tag">ATV:</span><span>${esc(text)}</span>
        </div>`;
      const userLine = (key, value, placeholder) => `
        <div class="mychart-collab-line mychart-collab-user">
          <span class="mychart-name-tag" contenteditable="false">${esc(currentUserName)}:</span>
          <span class="mychart-collab-user-input" contenteditable="true" spellcheck="true"
            data-atv-key="${key}" data-placeholder="${esc(placeholder)}">${esc(value)}</span>
        </div>`;

      const complete = (key) => String(responses[key] || '').trim().length > 0;
      const lines = [];
      lines.push(systemLine(`Give me one word that describes ${active.planetName || 'this planet'}.`));
      lines.push(userLine('planetWord', responses.planetWord, 'Your Planet word…'));

      if(complete('planetWord')){
        lines.push(systemLine(`Make a sentence starter with “My” or “I” and the planet word.`));
        lines.push(userLine('planetSentence', responses.planetSentence, 'Write your Sentence Starter…'));
      }
      if(complete('planetSentence')){
        lines.push(systemLine(`Give me one word that describes the Duality of this Sign.`));
        lines.push(userLine('dualityWord', responses.dualityWord, 'Your Duality word…'));
      }
      // The Duality prompt above asks for the word first; once it is supplied, replace the
      // next prompt with the sentence-building instruction while keeping everything in the
      // same collaborative input window.
      if(complete('dualityWord')){
        lines.push(systemLine(`Using the Sentence Starter and your Duality word, make a sentence.`));
        lines.push(userLine('dualitySentence', responses.dualitySentence, 'Write your sentence…'));
      }
      if(complete('dualitySentence')){
        lines.push(systemLine(`Give me one word that describes the Modality of this Sign.`));
        lines.push(userLine('modalityWord', responses.modalityWord, 'Your Modality word…'));
      }
      if(complete('modalityWord')){
        lines.push(systemLine(`Using the Sentence Starter and your Modality word, make a sentence.`));
        lines.push(userLine('modalitySentence', responses.modalitySentence, 'Write your sentence…'));
      }
      if(complete('modalitySentence')){
        lines.push(systemLine(`Give me one word that describes the Element of this Sign.`));
        lines.push(userLine('elementWord', responses.elementWord, 'Your Element word…'));
      }
      if(complete('elementWord')){
        lines.push(systemLine(`Using the Sentence Starter and your Element word, make a sentence.`));
        lines.push(userLine('elementSentence', responses.elementSentence, 'Write your sentence…'));
      }
      if(complete('elementSentence')){
        lines.push(systemLine(`Make a sentence using ${responses.planetSentence || starter}, ${responses.dualityWord}, ${responses.modalityWord}, and ${responses.elementWord}.`));
        lines.push(userLine('fourWordsSentence', responses.fourWordsSentence, 'Write your sentence…'));
      }
      if(complete('fourWordsSentence')){
        lines.push(systemLine(`Give me one word that describes House ${active.house || ''}.`));
        lines.push(userLine('houseWord', responses.houseWord, 'Your House word…'));
      }
      if(complete('houseWord')){
        lines.push(systemLine(`Using the Sentence Starter and your House word, make a sentence.`));
        lines.push(userLine('houseSentence', responses.houseSentence, 'Write your sentence…'));
      }

      // Newest prompt on top, oldest at the bottom: each system prompt + its answer line
      // was pushed above as an intact pair, in chronological order — chunk back into those
      // pairs and reverse the pair order (not the raw line order, which would separate a
      // prompt from its own answer).
      const pairs = [];
      for(let i = 0; i < lines.length; i += 2) pairs.push(lines.slice(i, i + 2));
      const orderedLines = pairs.reverse().flat();

      contentArea.innerHTML = `
        <div class="mychart-collab-input-window" id="mychartCollabInputWindow">
          ${orderedLines.join('')}
        </div>`;

      const collabWindow = document.getElementById('mychartCollabInputWindow');
      // The network save (and re-render) only happens on commit (blur / Enter) — updating
      // `responses`/`active.answer` on every keystroke stays purely local, matching the old
      // localStorage version's responsiveness without hitting the API per character typed.
      const updateCollabState = (input, commitNext) => {
        const key = input.dataset.atvKey;
        responses[key] = input.textContent.trim();
        active.answer = Object.entries(responses)
          .filter(([,v]) => String(v || '').trim())
          .map(([k,v]) => `${k}: ${String(v).trim()}`)
          .join('\n');
        active.editedBy = currentUserName;
        active.editedAt = new Date().toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
        if(commitNext){
          updateMyChartTab(active.id, { responses, answer: active.answer, editedBy: active.editedBy, editedAt: active.editedAt });
          renderMyChart();
        }
      };

      if(collabWindow){
        collabWindow.querySelectorAll('.mychart-collab-user-input').forEach(input => {
          const placeholder = input.dataset.placeholder || '';
          if(!input.textContent.trim() && placeholder) input.dataset.empty = 'true';
          input.addEventListener('focus', () => {
            if(input.dataset.empty === 'true'){
              input.textContent = '';
              input.dataset.empty = 'false';
            }
          });
          input.addEventListener('input', () => updateCollabState(input, false));
          input.addEventListener('blur', () => {
            updateCollabState(input, true);
          });
          input.addEventListener('keydown', (e) => {
            if(e.key === 'Enter'){
              e.preventDefault();
              updateCollabState(input, true);
            }
          });
        });
      }
      // The latest prompt now renders at the top, so keep the view pinned there (rather than
      // the old scroll-to-bottom) as new prompts appear.
      if(collabWindow){
        requestAnimationFrame(() => { collabWindow.scrollTop = 0; });
      }
    } else {
      const displayValue = (active.answer && active.answer.length) ? active.answer : `${currentUserName} : `;

      contentArea.innerHTML = `
        <p class="mychart-question">${active.question}</p>
        <div class="workbook-answer-input-wrap">
          <textarea class="workbook-qa-answer" id="mychartAnswerBox" placeholder="Type your answer here…">${displayValue}</textarea>
          <label class="workbook-attach-plus" title="Attach a file" aria-label="Attach a file">+
            <input type="file" id="mychartAttachInput" hidden>
          </label>
        </div>
        ${myChartAttachmentPreviewHTML(active.id)}`;

      const answerBox = document.getElementById('mychartAnswerBox');
      if(answerBox){
        answerBox.addEventListener('input', () => {
          active.answer = answerBox.value;
          active.editedBy = currentUserName;
          active.editedAt = new Date().toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
          debouncedSave(`mychart:${active.id}`, () => {
            updateMyChartTab(active.id, { answer: active.answer, editedBy: active.editedBy, editedAt: active.editedAt });
          });
        });
      }
    }

    const attachInput = document.getElementById('mychartAttachInput');
    if(attachInput){
      attachInput.addEventListener('change', async () => {
        const file = attachInput.files && attachInput.files[0];
        if(!file) return;
        const ok = await uploadAttachment(file, 'mychart-tab', active.id);
        attachInput.value = '';
        if(ok) renderMyChart();
      });
    }

    contentArea.querySelectorAll('.workbook-attachment-remove').forEach(btn => {
      btn.addEventListener('click', async () => {
        await removeUpload(btn.dataset.uploadId);
        renderMyChart();
      });
    });

    wireMyChartList();
    syncPanelHeights();
  }

  // Click-to-open, drag-to-reorder, and delete for the section list in the narrow panel
  function wireMyChartList(){
    const listEl = document.getElementById('mychartListEl');
    if(!listEl) return;

    listEl.querySelectorAll('.mychart-item').forEach(item => {
      item.addEventListener('click', () => {
        activeMyChartTab = item.dataset.mychartTab;
        renderMyChart();
      });
    });

    listEl.querySelectorAll('.mychart-label').forEach(label => {
      label.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        renamingMyChartTabId = label.dataset.mychartLabel;
        renderMyChart();
      });
    });

    listEl.querySelectorAll('[data-mychart-delete]').forEach(delBtn => {
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if(myChartTabs.length <= 1){
          alert('At least one section has to stay — add a new one before removing this last one.');
          return;
        }
        const id = delBtn.dataset.mychartDelete;
        const idx = myChartTabs.findIndex(t => t.id === id);
        if(idx === -1) return;
        myChartTabs.splice(idx, 1);
        if(activeMyChartTab === id){
          activeMyChartTab = myChartTabs[Math.max(0, idx - 1)].id;
        }
        renderMyChart();
        await deleteMyChartTab(id);
      });
    });

    listEl.querySelectorAll('.workbook-row[data-mychart-row]').forEach(row => {
      row.addEventListener('dragstart', (e) => {
        draggedMyChartTabId = row.dataset.mychartRow;
        row.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      row.addEventListener('dragend', () => {
        row.classList.remove('dragging');
        listEl.querySelectorAll('.workbook-row').forEach(r => r.classList.remove('drag-over'));
      });
      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        if(row.dataset.mychartRow !== draggedMyChartTabId) row.classList.add('drag-over');
      });
      row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
      row.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetId = row.dataset.mychartRow;
        if(!draggedMyChartTabId || draggedMyChartTabId === targetId) return;
        const fromIdx = myChartTabs.findIndex(t => t.id === draggedMyChartTabId);
        const toIdx = myChartTabs.findIndex(t => t.id === targetId);
        const [moved] = myChartTabs.splice(fromIdx, 1);
        myChartTabs.splice(toIdx, 0, moved);
        draggedMyChartTabId = null;
        renderMyChart();
        myChartTabs.forEach((t, i) => updateMyChartTab(t.id, { sortOrder: i }));
      });
    });
  }

  const MYCHART_DOT_COLORS = ['#2f5fa8', '#b8862f', '#2f8a4e', '#8891a0', '#a04ec9', '#c0392b'];
  const mychartAddTabBtn = document.getElementById('mychartAddTabBtn');
  if(mychartAddTabBtn){
    mychartAddTabBtn.addEventListener('click', () => {
      addingMyChartSection = true;
      renderMyChart();
    });
  }

  // Generate Interpretation: one section per currently-placed planet, PLUS one section for
  // the Ascendant (ASC) itself — same generation pipeline, same label formation, same guided
  // prompting sequence. ASC is folded in as just another entry: unlike a planet it doesn't
  // need to be dragged into place (its sign comes straight from the current Ascendant
  // rotation), and by definition it always occupies House 1. Labeled "{Planet} in {Sign},
  // House {House}" — reusing the exact same house formula used everywhere else in the app
  // (SIGNS.indexOf(sign) relative to currentAsc). Re-clicking only adds sections for
  // placements that don't already have a matching label — a planet (or ASC) that hasn't
  // moved is never duplicated; one that WAS moved to a new sign/house gets a new section for
  // its new placement (its label is different, so it isn't considered a match).
  const mychartGenerateBtn = document.getElementById('mychartGenerateBtn');
  if(mychartGenerateBtn){
    mychartGenerateBtn.addEventListener('click', async () => {
      const placedNames = Object.keys(userPlacements).filter(name => name !== 'ASC');

      // Same shape as a planet placement ({ name, sign }) so the loop below treats ASC
      // identically to every Graha — it's just always "placed", via the Ascendant rotation
      // rather than drag-and-drop.
      const entries = placedNames.map(name => ({ name, sign: userPlacements[name] }));
      entries.push({ name: 'ASC', sign: SIGNS[currentAsc] });

      let addedCount = 0;
      let lastAddedId = null;
      for(const { name: planetName, sign } of entries){
        const house = planetName === 'ASC' ? 1 : ((SIGNS.indexOf(sign) - currentAsc + 12) % 12) + 1;
        const label = `${planetName} in ${sign},\nHouse ${house}`;

        // Skip if a section with this exact label already exists — no duplicates on re-click
        const alreadyExists = myChartTabs.some(t => t.label === label);
        if(alreadyExists) continue;

        const starter = SENTENCE_STARTER[planetName] || 'I express';
        const dot = planetName === 'ASC' ? '#b8500f' : MYCHART_DOT_COLORS[myChartTabs.length % MYCHART_DOT_COLORS.length];
        const created = await createMyChartTab({
          label, dot, generated:true, planetName, sign, house, sentenceStarter:starter,
          question: `Using ${planetName}'s sentence starter ("${starter}...") and the duality, modality, and element of ${sign}, plus what House ${house} represents, write your interpretation of this placement.`,
          answer: '', editedBy: '', editedAt: '',
          responses:{ planetWord:'', planetSentence:'', dualityWord:'', dualitySentence:'', modalityWord:'', modalitySentence:'', elementWord:'', elementSentence:'', fourWordsSentence:'', houseWord:'', houseSentence:'' },
          sortOrder: myChartTabs.length
        });
        if(created){
          myChartTabs.push(created);
          addedCount++;
          lastAddedId = created.id;
        }
      }

      if(addedCount > 0){
        if(lastAddedId) activeMyChartTab = lastAddedId;
        renderMyChart();
      } else {
        alert('Interpretation sections for your current placements already exist — nothing new to add.');
      }
    });
  }

  // Fixed sentence starters per planet, following the Golden Rule guided-interpretation
  // method — every generated section begins from one of these, never an invented sentence.
  // ASC (Lagna) gets its own starter, matching how it's described elsewhere in the app: the
  // rising sign that shapes how you present yourself, not an inner planet.
  const SENTENCE_STARTER = {
    Sun:'I am', Moon:'I feel', Mars:'I act', Mercury:'I think', Jupiter:'I learn',
    Venus:'I enjoy', Saturn:'I work', Rahu:'I seek', Ketu:'I let go of', ASC:'I appear as'
  };

  // Keep the three toggle-button rows (South/North select, Cosmic/Flashcards
  // select, and the invisible spacer above the Info Panel) the same height, so the panels
  // below them always start at the same top edge — even if a label wraps at some width.
  function syncToggleRowHeights(){
    const rows = [
      document.querySelector('.chart-select-toggle'),
      document.querySelector('.layers-view-toggle'),
      document.querySelector('.toggle-row-spacer')
    ].filter(Boolean);
    if(!rows.length) return;

    if(window.innerWidth <= 1200){
      rows.forEach(r => { r.style.minHeight = ''; });
      return;
    }

    rows.forEach(r => { r.style.minHeight = ''; });
    const maxRowHeight = Math.max(...rows.map(r => r.offsetHeight));
    rows.forEach(r => { r.style.minHeight = maxRowHeight + 'px'; });
  }

  // Keep every relevant panel exactly the same length — South chart, North chart, whichever
  // of Cosmic/Flashcards/Journey/Courses/Workbook is active, the Media/Workbook Viewer, and
  // the Info Panel — so their tops AND bottoms always line up as one row, never just their
  // tops. The shared row height is the tallest panel's natural content height, clamped to
  // whatever's actually visible on screen below this row (so the row itself never pushes the
  // page taller than the window); anything that doesn't fit at that height scrolls inside its
  // own panel, most notably the Info Panel, whose content varies the most.
  //
  // Charts are the one exception to the scroll-if-it-doesn't-fit rule: their SVG is a fixed
  // 1:1 square, so its rendered height is locked to its own width (single-view mode already
  // caps that width against the viewport for this reason — see .charts-row.single-view). A
  // chart can't "scroll" without looking broken, so it always gets its full natural height
  // with no overflow, in both single- and dual-chart view — and the row height is never
  // allowed to clamp below whichever chart is tallest right now, so it's never clipped either.
  const infoPanelLeft = document.querySelector('.info-panel-left');
  function syncPanelHeights(){
    syncToggleRowHeights();

    const activeLayerPanel = document.querySelector('.layer-panel:not(.layer-hidden)');
    const chartPanels = [southPanel, northPanel].filter(Boolean);
    const scrollPanels = [activeLayerPanel, infoPanelLeft, mediaViewerPanel, workbookViewerPanel, mychartViewerPanel].filter(Boolean);
    const panels = [...chartPanels, ...scrollPanels];
    if(!panels.length) return;

    // Below the responsive breakpoint the columns stack full-width, so let panels size naturally.
    if(window.innerWidth <= 1200){
      panels.forEach(p => { p.style.minHeight = ''; p.style.height = ''; p.style.maxHeight = ''; p.style.overflowY = ''; });
      return;
    }

    // Reset first so we measure each panel's own natural content height, not a previously forced one
    panels.forEach(p => { p.style.minHeight = ''; p.style.height = ''; p.style.maxHeight = ''; p.style.overflowY = ''; });
    const naturalMax = Math.max(...panels.map(p => p.offsetHeight));
    const tallestChart = chartPanels.length ? Math.max(...chartPanels.map(p => p.offsetHeight)) : 0;

    // All synced panels share the same top (CSS grid row), so any one of them gives the row's
    // real position on screen right now.
    const top = panels[0].getBoundingClientRect().top;
    const viewportCap = Math.max(240, Math.floor(window.innerHeight - top - 24));
    const rowHeight = Math.max(Math.min(naturalMax, viewportCap), tallestChart);

    // Charts: natural height, aligned via min-height only — never forced shorter, never scrolls.
    chartPanels.forEach(p => { p.style.minHeight = rowHeight + 'px'; });
    // Everything else: hard-capped to the same row height, scrolling internally past it.
    scrollPanels.forEach(p => { p.style.height = rowHeight + 'px'; p.style.overflowY = 'auto'; });
  }
  window.addEventListener('load', syncPanelHeights);
  window.addEventListener('resize', syncPanelHeights);

  // Icon-only toggle buttons (Cosmic/Flashcards, Both/South/North) show a plain
  // aria-label but no visible text — hovering (or keyboard-focusing) shows a custom tooltip
  // with the label plus how many things are currently "active" for that button, computed fresh
  // each time so the count is never stale.
  function iconToggleTooltip(btn){
    const label = btn.dataset.tooltipLabel;
    if(btn.dataset.layerView === 'courses'){
      const totalVisible = document.querySelectorAll('.course-item').length;
      return `${label} — ${viewedCourseIds.size} / ${totalVisible} viewed`;
    }
    if(btn.dataset.layerView === 'cosmic'){
      const n = ['duality','modality','element','dignity','aspectsFrom','aspectsTo'].filter(k => toggleState[k]).length;
      return `${label} — ${n} active`;
    }
    if(btn.dataset.layerView === 'flashcards'){
      return `${label} — ${flashcards.length} generated`;
    }
    if(btn.dataset.layerView === 'journey'){
      const n = ['duality','modality','element','dignity','aspectsFrom','aspectsTo'].filter(k => toggleState[k]).length;
      return `${label} — ${n} / 6 explored`;
    }
    if(btn.dataset.layerView === 'workbook'){
      const n = document.querySelectorAll('.workbook-item.active').length;
      return `${label} — ${n} / ${Object.keys(WORKBOOK_CONTENT).length} open`;
    }
    if(btn.dataset.view){
      const n = Object.keys(userPlacements).length;
      return `${label} — ${n} placed`;
    }
    return label;
  }
  document.querySelectorAll('.icon-toggle-btn').forEach(btn => {
    const refreshTooltip = () => { btn.dataset.tooltip = iconToggleTooltip(btn); };
    refreshTooltip();
    btn.addEventListener('mouseenter', refreshTooltip);
    btn.addEventListener('focus', refreshTooltip);
  });

  updateAspectsAvailability();
  refreshChipStates();
  render(0);
  syncPanelHeights();

  // ----- Access Screen: sign-in gate + per-user panel visibility grid -----
  // Real accounts live in D1 (see migrations/0001_init.sql) behind Cloudflare Pages
  // Functions under /api — this section talks to that API instead of a localStorage-only
  // access grid, so accounts and access rules follow a user across devices/browsers.
  const ENTITY_LIST = [
    { key:'active',        label:'Access' },
    { key:'courses',       label:'Courses' },
    { key:'cosmic',        label:'Cosmic Layers' },
    { key:'chartSelector', label:'Chart Selector' },
    { key:'flashcards',    label:'Flashcards' },
    { key:'workbook',      label:'Workbook' },
    { key:'mychart',       label:'My Chart' },
    { key:'journey',       label:'Journey Coord.' }
  ];

  const accessGridHeadRow = document.getElementById('accessGridHeadRow');
  const accessGridBody = document.getElementById('accessGridBody');

  let adminUsersData = [];
  let knownProgramNames = [];

  async function loadAdminUsersData(){
    try{
      const res = await fetch('/api/admin/users', { credentials:'same-origin' });
      adminUsersData = res.ok ? await res.json() : [];
    } catch(e){ adminUsersData = []; }
  }

  // Refetches both the user list and the program list (the "Programs" checkbox columns
  // below are dynamic, sourced from whatever program names exist in the Manage Courses
  // grid) and re-renders. Called after any admin edit that could change either.
  async function refreshAccessGrid(){
    await Promise.all([loadAdminUsersData(), loadAdminProgramCourses(), loadAdminUploadsGrid()]);
    knownProgramNames = [...new Set(adminProgramCourses.map(r => (r.program || '').trim()).filter(Boolean))].sort();
    renderAccessGrid();
  }

  // Admin visibility into every upload across every account — the "All uploads" grid.
  const adminUploadsBody = document.getElementById('adminUploadsBody');
  function formatFileSize(bytes){
    if(bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if(bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${bytes} B`;
  }
  async function loadAdminUploadsGrid(){
    if(!adminUploadsBody) return;
    let rows = [];
    try{
      const res = await fetch('/api/admin/uploads', { credentials:'same-origin' });
      rows = res.ok ? await res.json() : [];
    } catch(e){ rows = []; }

    adminUploadsBody.innerHTML = '';
    rows.forEach(row => {
      const tr = document.createElement('tr');

      const tdUser = document.createElement('td');
      tdUser.textContent = row.username;
      tr.appendChild(tdUser);

      const tdFile = document.createElement('td');
      const link = document.createElement('a');
      link.href = `/api/uploads/${row.id}`;
      link.textContent = row.fileName;
      link.setAttribute('download', row.fileName);
      tdFile.appendChild(link);
      tr.appendChild(tdFile);

      const tdWhere = document.createElement('td');
      tdWhere.textContent = row.context === 'mychart-tab' ? 'My Chart' : 'Workbook';
      tr.appendChild(tdWhere);

      const tdSize = document.createElement('td');
      tdSize.textContent = formatFileSize(row.sizeBytes);
      tr.appendChild(tdSize);

      const tdDate = document.createElement('td');
      tdDate.textContent = new Date(row.uploadedAt).toLocaleDateString();
      tr.appendChild(tdDate);

      const tdDelete = document.createElement('td');
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'access-grid-delete-btn';
      delBtn.textContent = '✕';
      delBtn.title = `Remove ${row.fileName}`;
      delBtn.setAttribute('aria-label', `Remove ${row.fileName}`);
      delBtn.addEventListener('click', async () => {
        await fetch(`/api/admin/uploads/${row.id}`, { method:'DELETE', credentials:'same-origin' });
        loadAdminUploadsGrid();
      });
      tdDelete.appendChild(delBtn);
      tr.appendChild(tdDelete);

      adminUploadsBody.appendChild(tr);
    });
  }

  async function patchUser(username, patch){
    await fetch(`/api/admin/users/${encodeURIComponent(username)}`, {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    });
  }

  // Builds the grid table (User + one checkbox column per known Program + one per panel +
  // Reset password + Clear progress + Clear uploads + Delete) from adminUsersData
  function renderAccessGrid(){
    if(!accessGridHeadRow || !accessGridBody) return;
    accessGridHeadRow.querySelectorAll('th[data-program-th], th[data-entity-th], th[data-reset-th], th[data-clear-progress-th], th[data-clear-uploads-th], th[data-delete-th]').forEach(th => th.remove());

    knownProgramNames.forEach(program => {
      const th = document.createElement('th');
      th.textContent = program;
      th.dataset.programTh = '1';
      accessGridHeadRow.appendChild(th);
    });
    ENTITY_LIST.forEach(ent => {
      const th = document.createElement('th');
      th.textContent = ent.label;
      th.dataset.entityTh = '1';
      accessGridHeadRow.appendChild(th);
    });
    const resetTh = document.createElement('th');
    resetTh.textContent = '';
    resetTh.dataset.resetTh = '1';
    accessGridHeadRow.appendChild(resetTh);
    const clearProgressTh = document.createElement('th');
    clearProgressTh.textContent = '';
    clearProgressTh.dataset.clearProgressTh = '1';
    accessGridHeadRow.appendChild(clearProgressTh);
    const clearUploadsTh = document.createElement('th');
    clearUploadsTh.textContent = '';
    clearUploadsTh.dataset.clearUploadsTh = '1';
    accessGridHeadRow.appendChild(clearUploadsTh);
    const deleteTh = document.createElement('th');
    deleteTh.textContent = '';
    deleteTh.dataset.deleteTh = '1';
    accessGridHeadRow.appendChild(deleteTh);

    accessGridBody.innerHTML = '';
    adminUsersData.forEach(user => {
      const tr = document.createElement('tr');

      const tdUser = document.createElement('td');
      tdUser.textContent = user.username + (user.isAdmin ? ' (admin)' : '');
      tr.appendChild(tdUser);

      knownProgramNames.forEach(program => {
        const td = document.createElement('td');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = user.programs.includes(program);
        cb.addEventListener('change', () => {
          if(cb.checked){ if(!user.programs.includes(program)) user.programs.push(program); }
          else { user.programs = user.programs.filter(p => p !== program); }
          patchUser(user.username, { programs: user.programs });
        });
        td.appendChild(cb);
        tr.appendChild(td);
      });

      ENTITY_LIST.forEach(ent => {
        const td = document.createElement('td');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = !!user[ent.key];
        cb.addEventListener('change', () => { user[ent.key] = cb.checked; patchUser(user.username, { [ent.key]: cb.checked }); });
        td.appendChild(cb);
        tr.appendChild(td);
      });

      const tdReset = document.createElement('td');
      const resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.className = 'access-grid-delete-btn';
      resetBtn.textContent = '⟳';
      resetBtn.title = `Reset ${user.username}'s password`;
      resetBtn.setAttribute('aria-label', `Reset ${user.username}'s password`);
      resetBtn.addEventListener('click', async () => {
        const newPassword = prompt(`New password for "${user.username}":`);
        if(!newPassword) return;
        await fetch(`/api/admin/users/${encodeURIComponent(user.username)}/reset-password`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: newPassword })
        });
      });
      tdReset.appendChild(resetBtn);
      tr.appendChild(tdReset);

      const tdClearProgress = document.createElement('td');
      const clearProgressUserBtn = document.createElement('button');
      clearProgressUserBtn.type = 'button';
      clearProgressUserBtn.className = 'access-grid-delete-btn';
      clearProgressUserBtn.textContent = '⌫';
      clearProgressUserBtn.title = `Clear ${user.username}'s course progress`;
      clearProgressUserBtn.setAttribute('aria-label', `Clear ${user.username}'s course progress`);
      clearProgressUserBtn.addEventListener('click', async () => {
        if(!confirm(`Clear all course progress for "${user.username}"? This can't be undone.`)) return;
        await fetch(`/api/admin/users/${encodeURIComponent(user.username)}/progress`, { method:'DELETE', credentials:'same-origin' });
      });
      tdClearProgress.appendChild(clearProgressUserBtn);
      tr.appendChild(tdClearProgress);

      const tdClearUploads = document.createElement('td');
      const clearUploadsUserBtn = document.createElement('button');
      clearUploadsUserBtn.type = 'button';
      clearUploadsUserBtn.className = 'access-grid-delete-btn';
      clearUploadsUserBtn.textContent = '🗑';
      clearUploadsUserBtn.title = `Clear ${user.username}'s uploaded files`;
      clearUploadsUserBtn.setAttribute('aria-label', `Clear ${user.username}'s uploaded files`);
      clearUploadsUserBtn.addEventListener('click', async () => {
        if(!confirm(`Clear all uploaded files for "${user.username}"? This can't be undone.`)) return;
        await fetch(`/api/admin/users/${encodeURIComponent(user.username)}/uploads`, { method:'DELETE', credentials:'same-origin' });
        loadAdminUploadsGrid();
      });
      tdClearUploads.appendChild(clearUploadsUserBtn);
      tr.appendChild(tdClearUploads);

      const tdDelete = document.createElement('td');
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'access-grid-delete-btn';
      delBtn.textContent = '✕';
      delBtn.title = `Remove ${user.username}`;
      delBtn.setAttribute('aria-label', `Remove ${user.username}`);
      delBtn.addEventListener('click', () => removeAccessUser(user.username));
      tdDelete.appendChild(delBtn);
      tr.appendChild(tdDelete);

      accessGridBody.appendChild(tr);
    });
  }

  // Removes a user account entirely
  async function removeAccessUser(username){
    adminUsersData = adminUsersData.filter(u => u.username.toLowerCase() !== username.toLowerCase());
    renderAccessGrid();
    await fetch(`/api/admin/users/${encodeURIComponent(username)}`, { method:'DELETE', credentials:'same-origin' });
  }

  // Creates a new user account with a temporary password and full panel access by
  // default; no programs are checked yet — the admin ticks those in afterward.
  const accessNewUserInput = document.getElementById('accessNewUserInput');
  const accessNewUserPasswordInput = document.getElementById('accessNewUserPasswordInput');
  const accessAddUserBtn = document.getElementById('accessAddUserBtn');
  async function addAccessUser(){
    if(!accessNewUserInput || !accessNewUserPasswordInput) return;
    const username = accessNewUserInput.value.trim();
    const password = accessNewUserPasswordInput.value;
    if(!username || !password) return;
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if(res.ok){
      accessNewUserInput.value = '';
      accessNewUserPasswordInput.value = '';
      refreshAccessGrid();
    } else {
      const body = await res.json().catch(() => ({}));
      accessErrorEl.textContent = body.error || 'Could not create that user.';
      accessErrorEl.hidden = false;
    }
  }
  if(accessAddUserBtn) accessAddUserBtn.addEventListener('click', addAccessUser);
  [accessNewUserInput, accessNewUserPasswordInput].forEach(el => {
    if(el) el.addEventListener('keydown', (e) => { if(e.key === 'Enter') addAccessUser(); });
  });

  // Drops any custom Workbook documents/answers/My Chart tabs/upload metadata the current
  // browser tab has loaded, so a login or logout never briefly shows one user's content to
  // the next. Shared by applyAccessVisibility() (before loading the new user's own data) and
  // the logout handler (which has no new data to load, just needs the slate clean).
  function resetWorkbookAndMyChartState(){
    Object.keys(WORKBOOK_CONTENT).forEach(id => {
      if(id.indexOf('uploaded-') !== 0) return;
      delete WORKBOOK_CONTENT[id];
      const itemBtn = workbookListEl ? workbookListEl.querySelector(`[data-workbook-id="${id}"]`) : null;
      if(itemBtn) (itemBtn.closest('.workbook-row') || itemBtn).remove();
    });
    Object.keys(workbookAnswers).forEach(k => delete workbookAnswers[k]);
    currentWorkbookId = null;
    if(workbookViewerEmpty) workbookViewerEmpty.hidden = false;
    if(workbookViewerContent) workbookViewerContent.hidden = true;
    myChartTabs = [];
    uploadsIndex = {};
  }

  // Applies one user's account to the live app: only their checked panels stay visible
  function applyAccessVisibility(user){
    // Every login starts from a completely clean slate — nothing carries over from a
    // previous user's session in the same tab (stray playing media, PDF/slide page
    // position, completion/lock state, or viewed history). Without this, one user's
    // interactions could visibly "leak" into the next login and make behavior look
    // inconsistent between users even though the rendering code itself is identical.
    stopAllMedia();
    Object.keys(mediaViewerPageByCourse).forEach(k => delete mediaViewerPageByCourse[k]);
    Object.keys(courseProgress).forEach(k => delete courseProgress[k]);
    viewedCourseIds.clear();
    resetWorkbookAndMyChartState();

    // Load this user's own course list (server-filtered to their enrolled programs)
    // before anything else, so it's already correct by the time they land on (or switch
    // to) that tab.
    currentUserPrograms = user.programs || [];
    // loadCourseProgress() needs the course-item buttons loadMyCourses() renders (it calls
    // updateCourseLockState(), which walks the DOM), so it's chained to run after.
    loadMyCourses().then(loadCourseProgress);
    // Workbook/My Chart attachments both read from the same shared index — load it first,
    // then hydrate the two panels (order doesn't block anything visible, since neither
    // panel is on-screen until the user switches to it).
    loadUploadsIndex().then(() => {
      loadWorkbookState();
      loadMyChartTabs();
    });

    const chartSelectToggleRow = document.querySelector('.chart-select-toggle');
    const chartsRowEl = document.querySelector('.charts-row');

    // The chart toggle row uses visibility (not display) when hidden, so its space stays
    // reserved — collapsing it with display:none would let that column's panel start
    // higher than the others, breaking top alignment across the layers/info/charts columns.
    if(chartSelectToggleRow){
      chartSelectToggleRow.style.visibility = user.chartSelector ? '' : 'hidden';
      chartSelectToggleRow.style.pointerEvents = user.chartSelector ? '' : 'none';
    }
    if(chartsRowEl) chartsRowEl.style.display = user.chartSelector ? '' : 'none';

    const PANEL_KEYS = ['courses','cosmic','flashcards','mychart','journey','workbook'];
    PANEL_KEYS.forEach(key => {
      const btn = document.querySelector(`.layers-toggle-btn[data-layer-view="${key}"]`);
      if(btn) btn.style.display = user[key] ? '' : 'none';
    });

    const landingKey = user.courses ? 'courses' : PANEL_KEYS.find(k => user[k]);
    if(landingKey){
      const btn = document.querySelector(`.layers-toggle-btn[data-layer-view="${landingKey}"]`);
      if(btn) btn.click();
    }

    // Sync immediately, then again once the browser has fully settled the layout from
    // hiding/showing several elements at once — keeps every visible panel's height aligned.
    syncPanelHeights();
    setTimeout(syncPanelHeights, 60);
    updateFooterVisibility();
  }

  const accessScreenEl = document.getElementById('accessScreen');
  const accessUsernameInput = document.getElementById('accessUsername');
  const accessPasswordInput = document.getElementById('accessPassword');
  const accessErrorEl = document.getElementById('accessError');
  const accessSignInBtn = document.getElementById('accessSignInBtn');

  const manageAccessSection = document.getElementById('manageAccessSection');
  const accessContinueBtn = document.getElementById('accessContinueBtn');
  let pendingAdminUser = null;

  async function attemptSignIn(){
    const username = (accessUsernameInput.value || '').trim();
    const password = accessPasswordInput.value || '';

    if(!username || !password){
      accessErrorEl.textContent = 'Enter a user name and password.';
      accessErrorEl.hidden = false;
      return;
    }

    accessErrorEl.hidden = true;
    accessSignInBtn.disabled = true;
    try{
      const res = await fetch('/api/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const user = await res.json().catch(() => ({}));
      if(!res.ok){
        accessErrorEl.textContent = user.error || 'Sign-in failed.';
        accessErrorEl.hidden = false;
        return;
      }

      if(user.isAdmin){
        pendingAdminUser = user;
        await refreshAccessGrid();
        if(manageAccessSection) manageAccessSection.hidden = false;
        return;
      }

      if(accessScreenEl) accessScreenEl.classList.add('access-hidden');
      applyAccessVisibility(user);
    } finally {
      accessSignInBtn.disabled = false;
    }
  }

  if(accessContinueBtn){
    accessContinueBtn.addEventListener('click', () => {
      if(!pendingAdminUser) return;
      if(accessScreenEl) accessScreenEl.classList.add('access-hidden');
      if(manageAccessSection) manageAccessSection.hidden = true;
      applyAccessVisibility(pendingAdminUser);
      pendingAdminUser = null;
    });
  }

  if(accessSignInBtn) accessSignInBtn.addEventListener('click', attemptSignIn);
  [accessUsernameInput, accessPasswordInput].forEach(el => {
    if(el) el.addEventListener('keydown', (e) => { if(e.key === 'Enter') attemptSignIn(); });
  });

  // Stops any playing video and resets the Media Viewer back to its empty state — removing
  // the elements alone often stops playback, but explicitly pausing first is the reliable way
  // to guarantee it, rather than leaving audio/video running behind the Access screen.
  function stopAllMedia(){
    if(!mediaViewerFrameWrap) return;
    mediaViewerFrameWrap.querySelectorAll('video, audio').forEach(el => {
      try{ el.pause(); el.removeAttribute('src'); el.load(); } catch(e){ /* ignore */ }
    });
    mediaViewerFrameWrap.querySelectorAll('iframe').forEach(el => { el.src = 'about:blank'; });
    mediaViewerFrameWrap.innerHTML = '';
    if(mediaViewerEmpty) mediaViewerEmpty.hidden = false;
    if(mediaViewerContent) mediaViewerContent.hidden = true;
    currentCourseId = null;
    document.querySelectorAll('.course-item.active').forEach(i => i.classList.remove('active'));
  }

  // Logout: clears the server session, then brings the Access screen back. The next
  // sign-in re-applies that user's own panel visibility fresh via applyAccessVisibility().
  const accessSignInFields = document.getElementById('accessSignInFields');
  const accessSessionNotice = document.getElementById('accessSessionNotice');
  const accessSessionUser = document.getElementById('accessSessionUser');
  const accessSessionLogout = document.getElementById('accessSessionLogout');

  function doLogout(){
    fetch('/api/logout', { method:'POST', credentials:'same-origin' });
    stopAllMedia();
    if(accessScreenEl) accessScreenEl.classList.remove('access-hidden');
    if(accessPasswordInput) accessPasswordInput.value = '';
    if(accessUsernameInput) accessUsernameInput.value = '';
    if(accessErrorEl) accessErrorEl.hidden = true;
    if(manageAccessSection) manageAccessSection.hidden = true;
    if(accessSignInFields) accessSignInFields.hidden = false;
    if(accessSessionNotice) accessSessionNotice.hidden = true;
    pendingAdminUser = null;
    currentUserPrograms = [];
    myCourses = [];
    renderCourseListFromProgramGrid();
    resetWorkbookAndMyChartState();
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if(logoutBtn) logoutBtn.addEventListener('click', doLogout);
  if(accessSessionLogout){
    accessSessionLogout.addEventListener('click', (e) => {
      e.preventDefault();
      doLogout();
    });
  }
  updateFooterVisibility();

  // On page load, check for an existing session (the cookie persists across visits) and
  // skip straight past the sign-in screen if one is still valid. For an admin session this
  // still lands on the Access screen (not the app), but the sign-in fields are replaced with
  // an explicit "Signed in as ..." notice so a resumed session never looks like an unlocked
  // admin panel requiring no login.
  (async () => {
    try{
      const res = await fetch('/api/me', { credentials:'same-origin' });
      if(!res.ok) return;
      const user = await res.json();
      if(user.isAdmin){
        pendingAdminUser = user;
        await refreshAccessGrid();
        if(manageAccessSection) manageAccessSection.hidden = false;
        if(accessSignInFields) accessSignInFields.hidden = true;
        if(accessSessionUser) accessSessionUser.textContent = user.username || 'admin';
        if(accessSessionNotice) accessSessionNotice.hidden = false;
        return;
      }
      if(accessScreenEl) accessScreenEl.classList.add('access-hidden');
      applyAccessVisibility(user);
    } catch(e){ /* no valid session — stay on the sign-in screen */ }
  })();
