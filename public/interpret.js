// Layered facts & compounded interpretation — planet spine.
//
// Each rung adds ONE fact drawn from the tables the app already computes, and
// restates the reading in light of everything above it. Nothing here invents
// astronomy: every value arrives from calc-core.js or shadbala.js.
//
// Text is COMPOSED from attribute vocabularies rather than looked up, because a
// planet x sign x house table alone would need 1,296 entries before co-tenancy.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Interpret = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---- vocabularies -------------------------------------------------------

  var KARAKA = {
    Sun: 'self, vitality, father, authority, bone and eyesight',
    Moon: 'mind, emotional response, mother, nourishment, memory, the public',
    Mars: 'drive, courage, siblings, conflict, land, sharp instruments',
    Mercury: 'intellect, speech, commerce, analysis, learning, the nerves',
    Jupiter: 'wisdom, counsel, children, wealth, teachers, expansion',
    Venus: 'love, partnership, comfort, art, vehicles, refinement',
    Saturn: 'time, discipline, labour, delay, endurance, structure',
    Rahu: 'appetite, ambition, foreignness, obsession, unconventional gain',
    Ketu: 'detachment, past mastery, loss, spirituality, sudden severance'
  };

  var SUBJECT = {
    Sun: 'the core self — vitality, authority, and the will to be recognised',
    Moon: 'the responsive mind — how experience is taken in, and what settles it',
    Mars: 'the capacity to act, defend, and force an outcome',
    Mercury: 'how the person thinks, speaks and transacts',
    Jupiter: 'what the person believes, and where counsel and growth come from',
    Venus: 'what is valued, desired and found beautiful',
    Saturn: 'what must be endured, structured and earned slowly',
    Rahu: 'what the person is insatiable about',
    Ketu: 'what the person has already finished with, and lets go of'
  };

  var FUNC = {
    Sun: 'the will', Moon: 'the mind', Mars: 'the drive', Mercury: 'the intellect',
    Jupiter: 'judgement and belief', Venus: 'desire and taste',
    Saturn: 'discipline and endurance', Rahu: 'appetite', Ketu: 'detachment'
  };

  var LORD_STYLE = {
    Sun: 'lends it pride and a need to be seen',
    Moon: 'lends it changeability and a need for comfort',
    Mars: 'lends it heat, competition and urgency',
    Mercury: 'lends it curiosity, calculation and a certain detachment',
    Jupiter: 'lends it breadth, optimism and a moral frame',
    Venus: 'lends it a pull toward harmony, pleasure and refinement',
    Saturn: 'lends it restraint, patience and a long horizon'
  };

  var MODALITY_TEXT = {
    Cardinal: 'initiates and moves first',
    Fixed: 'holds its position and resists being moved',
    Mutable: 'adapts and works through change'
  };

  var ELEMENT_TEXT = {
    Fire: 'by will and enthusiasm',
    Earth: 'by tangible result and method',
    Air: 'by ideas, contact and comparison',
    Water: 'by feeling and attachment'
  };

  var HOUSE_TEXT = {
    1: 'body, vitality, temperament, appearance, overall direction',
    2: 'wealth, family, speech, food, accumulated resources, values',
    3: 'courage, siblings, effort, short journeys, skill of hand',
    4: 'mother, home, land, vehicles, schooling, inner contentment',
    5: 'children, intelligence, creativity, past merit, speculation',
    6: 'debt, disease, enemies, service, daily work, litigation',
    7: 'partnership, marriage, the other person, contracts, trade',
    8: 'longevity, inheritance, upheaval, hidden things, research',
    9: 'fortune, dharma, father, teachers, higher learning, long journeys',
    10: 'career, status, action in the world, authority, visible achievement',
    11: 'gains, income, networks, elder siblings, fulfilment of desire',
    12: 'loss, expenditure, foreign lands, seclusion, sleep, liberation'
  };

  // Kalapurusha ("Time Being") body-part correspondence, house by house — the
  // classical natural-zodiac mapping (Aries/house-1 = the head, down through
  // Pisces/house-12 = the feet), read directly off the HOUSE NUMBER, not off
  // whichever sign actually occupies that house in a given chart. This is the
  // one, widely-agreed classical version (unlike e.g. the Rahu/Ketu maitri
  // analog or nodal exaltation degree elsewhere in this app, which needed a
  // "convention, not universal" flag) — every standard Jyotish source lists
  // this same head-to-feet sequence.
  var KALA_PURUSHA_HOUSE = {
    1: 'head',
    2: 'face, right eye, mouth',
    3: 'throat, neck, shoulders, arms, hands',
    4: 'chest, heart, lungs',
    5: 'stomach, upper abdomen, liver',
    6: 'intestines, digestive organs, navel',
    7: 'lower abdomen, kidneys, lumbar region',
    8: 'reproductive organs, excretory organs',
    9: 'thighs, hips',
    10: 'knees, joints',
    11: 'calves, shins, ankles',
    12: 'feet'
  };

  // Kalapurusha body-part karakatva by PLANET — the naisargika (natural)
  // significations the seven classical grahas hold over the body, per BPHS
  // and standard Jyotish texts (widely agreed for these seven). Rahu and
  // Ketu are deliberately absent: unlike the seven grahas, there is no single
  // classical body part consistently assigned to either node across sources
  // — left out rather than guessed.
  var KALA_PURUSHA_PLANET = {
    Sun: 'bones, the heart, general vitality',
    Moon: 'blood, bodily fluids, the mind, the stomach',
    Mars: 'muscles, bone marrow, blood corpuscles',
    Mercury: 'the skin, the nervous system, organs of speech',
    Jupiter: 'fat tissue, the liver, the thighs',
    Venus: 'reproductive fluids, the kidneys, the eyes',
    Saturn: 'the nerves, the joints, the teeth, longevity generally'
  };

  var NAK_TEXT = {
    'Ashwini': 'swift beginnings, healing, restlessness',
    'Bharani': 'bearing and restraint — endurance under pressure',
    'Krittika': 'cutting and purifying — sharp discernment',
    'Rohini': 'fertility and magnetism — growth and sensory pleasure',
    'Mrigashira': 'searching and curiosity — the quest for something better',
    'Ardra': 'storm — breaking down before renewal, with sharp intelligence',
    'Punarvasu': 'return and renewal — safety recovered after loss',
    'Pushya': 'nourishment and protection — the most benevolent asterism',
    'Ashlesha': 'coiling and penetrating — hypnotic, shrewd, self-protective',
    'Magha': 'ancestry and throne — inherited authority',
    'Purva Phalguni': 'pleasure and rest — creative enjoyment',
    'Uttara Phalguni': 'patronage and contract — generous alliance',
    'Hasta': 'the hand — skill, craft, dexterity, precision',
    'Chitra': 'design and brilliance — the made object',
    'Swati': 'the independent wind — self-reliance, movement, trade',
    'Vishakha': 'focused ambition, fixed on a goal',
    'Anuradha': 'friendship and devotion — success through cooperation',
    'Jyeshtha': 'seniority and protection — hidden strength, and rivalry',
    'Mula': 'the root — uprooting, investigating to the source',
    'Purva Ashadha': 'invincibility and persuasion — unbeaten confidence',
    'Uttara Ashadha': 'enduring victory — principled, unhurried advance',
    'Shravana': 'listening and learning — transmission and reputation',
    'Dhanishta': 'rhythm and wealth — performance and timing',
    'Shatabhisha': 'the hundred healers — secrecy, remedy, isolation',
    'Purva Bhadrapada': 'intensity and asceticism — the fire underneath',
    'Uttara Bhadrapada': 'depth and patience — the still water',
    'Revati': 'safe passage — compassion and completion'
  };

  // Directional strength: the house where each planet collects full Dig bala.
  var DIG_HOUSE = { Sun: 10, Mars: 10, Jupiter: 1, Mercury: 1, Moon: 4, Venus: 4, Saturn: 7 };
  var DIG_NAME = { 1: 'the 1st', 4: 'the 4th', 7: 'the 7th', 10: 'the 10th' };

  var KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12],
      UPACHAYA = [3, 6, 10, 11], MARAKA = [2, 7];

  var KALA_NAME = {
    paksha: 'the lunar phase at birth (paksha bala)',
    hora: 'being lord of the birth hora',
    masa: 'being lord of the birth month',
    vara: 'being lord of the birth weekday',
    abda: 'being lord of the birth year',
    ayana: 'its declination (ayana bala)',
    nathonnata: 'the day/night division (nathonnata bala)',
    tribhaga: 'the third of the day it was born in'
  };

  var NODES = { Rahu: 1, Ketu: 1 };

  // Used when no Shadbala context exists (a hand-placed chart). The Moon's
  // status really depends on its phase, which a placement cannot know; the
  // common default treats it as benefic.
  var DEFAULT_BENEFIC = {
    Jupiter: true, Venus: true, Mercury: true, Moon: true,
    Sun: false, Mars: false, Saturn: false
  };

  // Benefic/malefic NATURE of any of the nine, for how its aspects and
  // conjunctions land on other planets. Rahu and Ketu are always natural
  // malefics (BPHS Ch. 3 v.11) — consistent with this app already modelling
  // Rahu on Saturn and Ketu on Mars for relationships. What can turn
  // favourable is the RESULTS a node itself delivers (see balaFramework's
  // placement exceptions); that never changes this.
  // (Shadbala's own beneficMap covers only the seven grahas, so the nodes are
  // handled here rather than there.)
  function isNaturalBenefic(name, beneficMap) {
    return NODES[name] ? false : !!beneficMap[name];
  }
  function toneWord(name, beneficMap) {
    return 'a natural ' + (isNaturalBenefic(name, beneficMap) ? 'benefic' : 'malefic');
  }

  // ---- plain-language vocabularies -----------------------------------------
  // The simple wording never repeats what the Fact column already states; it
  // says only what that fact means, in short everyday sentences.

  var SIMPLE_SUBJECT = {
    Sun: 'the self, and the wish to be seen',
    Moon: 'the mind and the feelings',
    Mars: 'the push to act and fight',
    Mercury: 'thinking, talking and trade',
    Jupiter: 'belief and good advice',
    Venus: 'love, comfort and beauty',
    Saturn: 'what gets earned the slow way',
    Rahu: 'endless wanting',
    Ketu: 'letting go'
  };

  var SIMPLE_FUNC = {
    Sun: 'The will', Moon: 'The mind', Mars: 'The drive', Mercury: 'The thinking',
    Jupiter: 'The judgement', Venus: 'The taste', Saturn: 'The discipline',
    Rahu: 'The hunger', Ketu: 'The letting go'
  };

  var MOD_VERB = { Cardinal: 'reaches', Fixed: 'holds out', Mutable: 'bends' };
  var LORD_AIM = {
    Sun: 'recognition', Moon: 'comfort', Mars: 'control', Mercury: 'the clever answer',
    Jupiter: 'the bigger picture', Venus: 'balance', Saturn: 'order'
  };
  var ELE_METHOD = {
    Fire: 'by pushing', Earth: 'by building', Air: 'by talking', Water: 'by feeling'
  };

  // One-keyword-each sentence for the Sign rung: "The {planet} seeks {sign}."
  var PLANET_KEYWORD = {
    Sun: 'self', Moon: 'mind', Mars: 'drive', Mercury: 'thinking', Jupiter: 'wisdom',
    Venus: 'love', Saturn: 'discipline', Rahu: 'hunger', Ketu: 'letting go'
  };
  var SIGN_KEYWORD = {
    Aries: 'courage', Taurus: 'comfort', Gemini: 'variety', Cancer: 'security',
    Leo: 'recognition', Virgo: 'precision', Libra: 'balance', Scorpio: 'intensity',
    Sagittarius: 'adventure', Capricorn: 'structure', Aquarius: 'originality', Pisces: 'compassion'
  };
  // Short trait-list opening the Sign rung's Fact — the sign's character in
  // plain adjectives, before the technical placement line that follows it.
  var SIGN_TRAITS = {
    Aries: 'bold, direct, competitive, quick to act',
    Taurus: 'steady, patient, sensual, values comfort and security',
    Gemini: 'curious, communicative, adaptable, quick-witted',
    Cancer: 'nurturing, protective, emotional, home- and family-oriented',
    Leo: 'confident, expressive, generous, wants recognition',
    Virgo: 'meticulous, analytical, modest, service-oriented',
    Libra: 'diplomatic, fair-minded, sociable, seeks balance',
    Scorpio: 'intense, secretive, resilient, drawn to transformation',
    Sagittarius: 'optimistic, adventurous, philosophical, freedom-loving',
    Capricorn: 'disciplined, ambitious, patient, status-conscious',
    Aquarius: 'independent, inventive, humanitarian, unconventional',
    Pisces: 'compassionate, imaginative, intuitive, dreamy'
  };
  var HOUSE_KEYWORD = {
    1: 'self', 2: 'wealth', 3: 'effort', 4: 'home', 5: 'children', 6: 'work',
    7: 'partner', 8: 'secrets', 9: 'luck', 10: 'career', 11: 'gain', 12: 'loss'
  };
  var RELATION_KEYWORD = {
    'Best Friend': 'warmth', 'Friend': 'help', 'Neutral': 'plain',
    'Enemy': 'friction', 'Worst Enemy': 'clash'
  };
  var NAK_KEYWORD = {
    'Ashwini': 'speed', 'Bharani': 'endurance', 'Krittika': 'sharpness', 'Rohini': 'growth',
    'Mrigashira': 'searching', 'Ardra': 'storm', 'Punarvasu': 'renewal', 'Pushya': 'nourishment',
    'Ashlesha': 'cunning', 'Magha': 'authority', 'Purva Phalguni': 'pleasure', 'Uttara Phalguni': 'partnership',
    'Hasta': 'skill', 'Chitra': 'craft', 'Swati': 'independence', 'Vishakha': 'ambition',
    'Anuradha': 'loyalty', 'Jyeshtha': 'seniority', 'Mula': 'roots', 'Purva Ashadha': 'confidence',
    'Uttara Ashadha': 'endurance', 'Shravana': 'listening', 'Dhanishta': 'rhythm', 'Shatabhisha': 'secrecy',
    'Purva Bhadrapada': 'intensity', 'Uttara Bhadrapada': 'patience', 'Revati': 'compassion'
  };

  var MOD_SIMPLE = {
    Cardinal: 'starts things',
    Fixed: 'holds on',
    Mutable: 'adapts'
  };

  var ELE_SIMPLE = {
    Fire: 'on energy',
    Earth: 'toward solid results',
    Air: 'through ideas',
    Water: 'through feeling'
  };

  var LORD_TRAIT = {
    Sun: 'pride', Moon: 'changing moods', Mars: 'heat and competition',
    Mercury: 'cleverness', Jupiter: 'a wide, hopeful view',
    Venus: 'a wish for harmony', Saturn: 'patience and holding back'
  };

  var HOUSE_NOUN = {
    1: 'the body and the self', 2: 'family money', 3: 'effort and siblings',
    4: 'home and peace of mind', 5: 'children and learning', 6: 'work, health and rivals',
    7: 'partnership', 8: 'hidden matters', 9: 'luck and belief',
    10: 'career and standing', 11: 'income and gains', 12: 'spending and letting go'
  };

  var SHORT_NOUN = {
    1: 'the self', 2: 'family money', 3: 'effort', 4: 'home', 5: 'children',
    6: 'daily work', 7: 'partnership', 8: 'hidden matters', 9: 'luck',
    10: 'career', 11: 'income', 12: 'spending'
  };

  var HOUSE_LANDS = {
    1: 'This shows in the body and the character.',
    2: 'This goes into money and family.',
    3: 'This goes into effort and brothers and sisters.',
    4: 'This goes into home and peace of mind.',
    5: 'This goes into children and learning.',
    6: 'This goes into work, health and rivals.',
    7: 'This goes into partnership.',
    8: 'This goes into hidden things and sudden change.',
    9: 'This goes into luck and belief.',
    10: 'This goes into career and standing.',
    11: 'This goes into income and friends.',
    12: 'This goes into spending and letting go.'
  };

  var HARD_EFFECT = {
    Saturn: 'Saturn slows things down and worries',
    Mars: 'Mars heats things up and pushes',
    Sun: 'the Sun burns and exposes',
    Rahu: 'Rahu makes restless',
    Ketu: 'Ketu cuts away and detaches',
    Moon: 'a dark Moon leaves it unsettled'
  };

  var NAK_SIMPLE = {
    'Ashwini': 'Quick to start and quick to heal.',
    'Bharani': 'Carries a heavy load without complaining.',
    'Krittika': 'Sharp, and cuts straight through.',
    'Rohini': 'Attractive, and likes growth and comfort.',
    'Mrigashira': 'Always looking for something better.',
    'Ardra': 'Storm first, clear air after.',
    'Punarvasu': 'Bounces back after loss.',
    'Pushya': 'Feeds and protects.',
    'Ashlesha': 'Clever, and keeps things close.',
    'Magha': 'Carries the family name.',
    'Purva Phalguni': 'Enjoys rest and good company.',
    'Uttara Phalguni': 'Generous, and works well with others.',
    'Hasta': 'Skilled with the hands.',
    'Chitra': 'Makes beautiful things.',
    'Swati': 'Independent, and dislikes being tied down.',
    'Vishakha': 'Fixed on a goal.',
    'Anuradha': 'Loyal, and gets there through friends.',
    'Jyeshtha': 'Senior and protective, with rivals about.',
    'Mula': 'Digs down to the root.',
    'Purva Ashadha': 'Hard to beat, and persuades rather than forces.',
    'Uttara Ashadha': 'Wins slowly and keeps it.',
    'Shravana': 'Listens, and builds a name by knowing things.',
    'Dhanishta': 'Good timing, and draws wealth.',
    'Shatabhisha': 'Private, and heals best alone.',
    'Purva Bhadrapada': 'Burns hot underneath.',
    'Uttara Bhadrapada': 'Deep and patient.',
    'Revati': 'Kind, and sees things safely home.'
  };

  // ---- vocabulary for the narrative Compounded paragraph -------------------
  // One adjective/phrase per sign, per nakshatra, per planet's domain, and per
  // house's aptitude — composed into a single flowing, second-person reading
  // that still traces back to the rungs above (Ascendant, lordship, placement,
  // sign, nakshatra, the single most defining outside influence, then the
  // dispositor's own placement, including any exchange).
  var SIGN_ADJ = {
    Aries: 'bold', Taurus: 'grounded', Gemini: 'versatile', Cancer: 'nurturing',
    Leo: 'radiant', Virgo: 'meticulous', Libra: 'diplomatic', Scorpio: 'intense',
    Sagittarius: 'expansive', Capricorn: 'disciplined', Aquarius: 'unconventional', Pisces: 'compassionate'
  };
  var NAK_ADJ = {
    'Ashwini': 'swift, healing', 'Bharani': 'enduring, restrained', 'Krittika': 'sharp, discerning',
    'Rohini': 'magnetic, growth-seeking', 'Mrigashira': 'curious, searching', 'Ardra': 'intense, transformative',
    'Punarvasu': 'resilient, renewing', 'Pushya': 'nourishing, protective', 'Ashlesha': 'shrewd, penetrating',
    'Magha': 'authoritative, ancestral', 'Purva Phalguni': 'pleasure-seeking, creative', 'Uttara Phalguni': 'generous, cooperative',
    'Hasta': 'skilled, precise', 'Chitra': 'artistic, brilliant', 'Swati': 'adaptable, self-reliant',
    'Vishakha': 'ambitious, focused', 'Anuradha': 'loyal, devoted', 'Jyeshtha': 'protective, senior',
    'Mula': 'probing, root-seeking', 'Purva Ashadha': 'confident, persuasive', 'Uttara Ashadha': 'principled, enduring',
    'Shravana': 'attentive, well-informed', 'Dhanishta': 'rhythmic, prosperous', 'Shatabhisha': 'private, healing',
    'Purva Bhadrapada': 'intense, ascetic', 'Uttara Bhadrapada': 'deep, patient', 'Revati': 'compassionate, nurturing'
  };
  var PLANET_DOMAIN = {
    Sun: 'sense of self', Moon: 'emotional mind', Mars: 'drive to act', Mercury: 'way of communicating',
    Jupiter: 'sense of purpose', Venus: 'sense of taste and value', Saturn: 'capacity for discipline',
    Rahu: 'ambition', Ketu: 'inner detachment'
  };
  var HOUSE_APTITUDE = {
    1: 'self-presentation and personal drive', 2: 'financial strategy and steady communication',
    3: 'initiative and hands-on skill', 4: 'emotional security and home life',
    5: 'creative thinking and calculated risk', 6: 'problem-solving under pressure',
    7: 'negotiation and partnership', 8: 'research and deep transformation',
    9: 'big-picture thinking and principled belief', 10: 'public reputation and ambition',
    11: 'networking and long-term gain', 12: 'introspection and behind-the-scenes work'
  };

  var BALA_SOURCE = {
    paksha: 'the moon phase on the day of birth',
    hora: 'the hour of birth',
    masa: 'the month of birth',
    vara: 'the weekday of birth',
    abda: 'the year of birth',
    ayana: 'how far north or south it stood',
    nathonnata: 'the time of day',
    tribhaga: 'the part of the day',
    chesta: 'its speed through the sky'
  };

  // ---- small helpers ------------------------------------------------------

  function tag(text, src) { return '~' + text + '|' + src + '~'; }

  function ord(n) {
    var s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
  function n2(v) { return (Math.round(v * 100) / 100).toFixed(2); }
  function n1(v) { return (Math.round(v * 10) / 10).toFixed(1); }
  function arc(a, b) { var d = Math.abs(((a - b) % 360 + 360) % 360); return d > 180 ? 360 - d : d; }
  function list(a) {
    if (!a.length) return '';
    if (a.length === 1) return a[0];
    return a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  }
  function classesOf(h) {
    var c = [];
    if (KENDRA.indexOf(h) >= 0) c.push('kendra');
    if (TRIKONA.indexOf(h) >= 0) c.push('trikona');
    if (DUSTHANA.indexOf(h) >= 0) c.push('dusthana');
    if (UPACHAYA.indexOf(h) >= 0) c.push('upachaya');
    if (MARAKA.indexOf(h) >= 0) c.push('maraka sthana');
    return c;
  }

  // One keyword for a dignity reading — used by both the graha and bhava
  // spines wherever a planet's (or a house lord's) base tone needs a single word.
  function dignityWord(keys, uch, degFromDeb, degFromEx, isNode) {
    // Rahu/Ketu now carry real dignity (exaltation, debilitation,
    // Moolatrikona, co-lord own-sign — see shadbala.js), so `keys` is
    // checked first regardless of isNode; the node-specific "no dignity"
    // fallback only applies once none of those actually matched, since a
    // node never has a measured Uchcha bala degree to fall back on either.
    if (keys.indexOf('deb') >= 0) return { word: 'strain', src: 'Debilitated' };
    if (keys.indexOf('ex') >= 0) return { word: 'peak', src: keys.indexOf('mt') >= 0 ? 'Exalted + Moolatrikona' : 'Exalted' };
    if (keys.indexOf('mt') >= 0) return { word: 'ease', src: 'Moolatrikona' };
    if (keys.indexOf('lord') >= 0) return { word: 'home', src: 'Own sign' };
    if (isNode) return { word: 'none', src: 'no further dignity for nodes' };
    if (uch !== null && uch < 15) return { word: 'strain', src: n1(degFromDeb) + '° from its low point' };
    if (uch !== null && uch > 45) return { word: 'lift', src: n1(degFromEx) + '° from its peak' };
    return { word: 'plain', src: 'neutral ground' };
  }

  // One keyword for a house-class flavour — dusthana/trikona/kendra take
  // priority in that order (upachaya and maraka don't get their own word here
  // to match the existing three-way Simple-mode split).
  function classWord(cls) {
    if (cls.indexOf('dusthana') >= 0) return { word: 'strain', src: 'dusthana' };
    if (cls.indexOf('trikona') >= 0) return { word: 'blessing', src: 'trikona' };
    if (cls.indexOf('kendra') >= 0) return { word: 'pillar', src: 'kendra' };
    return null;
  }

  // Phaladeepika's classification of a mutual exchange of signs.
  function parivartanaClass(h1, h2) {
    if (h1 === 3 || h2 === 3) return 'Khala';
    if (DUSTHANA.indexOf(h1) >= 0 || DUSTHANA.indexOf(h2) >= 0) return 'Dainya';
    return 'Maha';
  }

  // Conjunction (co-tenant) yogas — a named yoga formed purely by two planets
  // sharing a sign, independent of houses or lordship. This table is the
  // single source for these conditions: the chart hover tooltip's per-planet
  // co-tenant line asks "does a yoga form between these two?" through
  // cotenantYogas(), and conjunctionYogas() below scans the whole chart for
  // the Yogas panel. (grahaChain's own rung 6 still words Gajakesari inline
  // in its narrative text.) Order-independent: match(a, b) is tried both
  // ways by the caller.
  function pairMatch(x, y) {
    return function (a, b) { return (a === x && b === y) || (a === y && b === x); };
  }
  var COTENANT_YOGAS = [
    {
      name: 'Gajakesari Yoga', planets: ['Moon', 'Jupiter'],
      match: pairMatch('Moon', 'Jupiter'),
      reason: 'Jupiter conjunct the Moon places Jupiter in a kendra (the 1st) from the Moon — counsel, reputation and benevolence attach to the mind.'
    },
    {
      name: 'Budhaditya Yoga', planets: ['Sun', 'Mercury'],
      match: pairMatch('Sun', 'Mercury'),
      reason: 'Mercury conjunct the Sun — intellect lit by the Sun: sharp reasoning, learning and skill with words.'
    },
    {
      name: 'Chandra-Mangala Yoga', planets: ['Moon', 'Mars'],
      match: pairMatch('Moon', 'Mars'),
      reason: 'Mars conjunct the Moon — drive joined to the mind: enterprise and earning power, with a quick, restless temper.'
    }
  ];

  // Yogas formed between two co-tenant planets, if any (usually zero or one).
  // Other classical conjunction yogas can be added to the table above.
  function cotenantYogas(a, b) {
    return COTENANT_YOGAS.filter(function (y) { return y.match(a, b); })
      .map(function (y) { return { name: y.name, reason: y.reason }; });
  }

  // Lordship-based yogas for a single planet — Raja Yoga (kendra/trikona
  // lordship shape), Dhana Yoga (wealth-house lordship shape), and
  // Parivartana (mutual exchange) — independent of co-tenancy, so these can
  // apply to a planet sitting completely alone. grahaChain's own rung 5/5b
  // already computes exactly these conditions (`kt`, `isDhana`, `exchange`)
  // to build its Fact/Interpretation text; this function re-derives the same
  // three conditions from the same inputs (`H.housesOwnedBy`, `KENDRA`/
  // `TRIKONA`/`DUSTHANA`, `parivartanaClass`) as a second caller — the chart
  // hover tooltip — the same "extract, don't duplicate" approach
  // `cotenantYogas` already established for Gajakesari, rather than a third
  // reimplementation of the underlying condition.
  function planetYogas(name, result, H) {
    var out = [];
    // Rahu/Ketu now co-own real houses (SIGN_COLORDS: Virgo/Aquarius and
    // Scorpio/Pisces), so H.housesOwnedBy already returns entries for them —
    // Raja/Dhana/Parivartana yoga can genuinely form through a node's
    // co-lordship, so there's no early-return here anymore.
    var E2 = H.engine;
    var ascSign = result.ascendant.signIndex;
    var p = result.planets[name];

    var owned = H.housesOwnedBy(name, ascSign);
    if (owned.length) {
      var ownedHouses = owned.map(function (o) { return o.house; });
      var kt = ownedHouses.some(function (h) { return KENDRA.indexOf(h) >= 0; }) && TRIKONA.indexOf(p.house) >= 0 ||
               ownedHouses.some(function (h) { return TRIKONA.indexOf(h) >= 0; }) && KENDRA.indexOf(p.house) >= 0;
      if (kt) {
        var ktHouses = owned.filter(function (o) { return KENDRA.indexOf(o.house) >= 0 || TRIKONA.indexOf(o.house) >= 0; })
          .map(function (o) { return ord(o.house) + ' house'; });
        out.push({
          name: 'Raja Yoga',
          reason: name + ' rules ' + list(ktHouses) + ' and sits in the ' + ord(p.house) +
            ' — a kendra-trikona lordship, the classical shape of a Raja Yoga.'
        });
      }
      var DHANA = [2, 5, 9, 11];
      var isDhana = DHANA.indexOf(p.house) >= 0 && ownedHouses.some(function (h) { return DHANA.indexOf(h) >= 0; });
      if (isDhana) {
        out.push({
          name: 'Dhana Yoga',
          reason: name + ' rules a wealth house and sits in the ' + ord(p.house) +
            ', itself wealth-giving (2nd/5th/9th/11th) — the classical shape of a Dhana Yoga.'
        });
      }
    }

    // Parivartana (mutual exchange): co-lord-aware — checks every co-lord of
    // the sign this planet sits in (a two-lord sign carries Rahu or Ketu
    // alongside its classical primary lord), not just a single dispositor.
    E2.SIGN_COLORDS[p.signIndex].forEach(function (dispositor) {
      if (dispositor === name) return;
      var dispSign = result.planets[dispositor].signIndex;
      if (dispSign === p.signIndex) return;
      if (E2.SIGN_COLORDS[dispSign].indexOf(name) < 0) return;
      var hA = ((p.signIndex - ascSign + 12) % 12) + 1;
      var hB = ((dispSign - ascSign + 12) % 12) + 1;
      var cls = parivartanaClass(hA, hB);
      out.push({
        name: cls + ' Yoga (Parivartana)',
        reason: name + ' and ' + dispositor + ' sit in each other’s sign — a mutual exchange between the ' +
          ord(hA) + ' and ' + ord(hB) + ' lords, ' + cls + ' yoga in Phaladeepika’s classification.'
      });
    });

    return out;
  }

  // Neecha Bhanga (cancellation of debilitation) — standalone so it can be
  // reused outside the narrative chain (the Dasha tab's activation table
  // wants the same redemption check when reading a debilitated dasha lord's
  // quality, not just the House/Planet hover narrative). Originally lived
  // inline in grahaChain's rung 2; grahaChain now just calls this. Checked
  // only when the planet is debilitated by sign; any one classical condition
  // is enough to cancel it, and the condition that actually fired is named
  // explicitly (never a blanket claim) so it stays auditable:
  //   1. the dispositor of the debilitation sign is angular (kendra: 1/4/7/10)
  //      from the Lagna
  //   2. ...or angular from the Moon
  //   3. the planet exalted in this very sign is angular from the Lagna or Moon
  //   4. the dispositor is conjunct the debilitated planet (shares its house)
  function neechaBhangaFor(name, result, H) {
    if (NODES[name]) return null;
    var p = result.planets[name];
    var E2 = H.engine;
    var S = H.Shadbala;
    var dg = H.dignityOf(name, p);
    if (dg.map(function (d) { return d.k; }).indexOf('deb') < 0) return null;

    var debLord = E2.SIGN_LORDS[p.signIndex];
    var debLordP = result.planets[debLord];
    var moonSign = result.planets.Moon.signIndex;
    var nbReasons = [];
    if (debLordP && KENDRA.indexOf(debLordP.house) >= 0) {
      nbReasons.push(debLord + ', the dispositor of ' + p.sign + ', is angular (house ' + debLordP.house + ') from your Lagna');
    }
    if (debLordP) {
      var houseFromMoon = ((debLordP.signIndex - moonSign + 12) % 12) + 1;
      if (KENDRA.indexOf(houseFromMoon) >= 0) {
        nbReasons.push(debLord + ' is also angular from the Moon (house ' + houseFromMoon + ' counted from the Moon)');
      }
    }
    var exLordName = null;
    H.PLANET_ORDER.forEach(function (q) {
      if (exLordName || NODES[q] || !S || !S.EXALT[q]) return;
      if (Math.floor(S.EXALT[q] / 30) === p.signIndex) exLordName = q;
    });
    if (exLordName && exLordName !== name && exLordName !== debLord) {
      var exLordP = result.planets[exLordName];
      var exFromLagna = KENDRA.indexOf(exLordP.house) >= 0;
      var exFromMoon = KENDRA.indexOf(((exLordP.signIndex - moonSign + 12) % 12) + 1) >= 0;
      if (exFromLagna || exFromMoon) {
        nbReasons.push(exLordName + ', who is exalted in ' + p.sign + ', is angular from the ' + (exFromLagna ? 'Lagna' : 'Moon'));
      }
    }
    if (debLordP && debLordP.house === p.house && debLord !== name) {
      nbReasons.push(debLord + ' sits right alongside ' + name + ' in the same house — conjunct with its own dispositor');
    }
    return nbReasons.length ? { lord: debLord, reasons: nbReasons } : null;
  }

  // ==========================================================================
  // ---- The Influence Engine ------------------------------------------------
  // ==========================================================================
  // The chart-wide scans behind the Influence Engine tab's supporting panels —
  // yogas (with their dasha timing), the Body/Mind/Soul tripod and the
  // dispositor chains — gathered by influenceEngineChart(). The per-planet and
  // per-house verdicts themselves come from balaFramework(), further down.
  // Rahu/Ketu: functional lordship follows this app's own co-lordship
  // (SIGN_COLORDS), with the classical no-lordship reading kept alongside
  // (`roleInfo.dual`); their nature is always malefic (isNaturalBenefic).

  // A planet's own dispositor and the panchadha-maitri tier toward it —
  // mirrors app.js's own relDignityTier() (used for the Planet table's
  // Dignity column) but kept local here so this file's own rule — "nothing
  // here invents astronomy; every value arrives from calc-core.js or
  // shadbala.js" — holds for the Influence Engine too, without reaching back
  // into app.js for a helper that isn't part of the H bundle.
  function dispositorTier(name, p, result, H) {
    var lord = H.engine.SIGN_LORDS[p.signIndex];
    if (lord === name) return { k: 'own', lord: lord };
    var rel = result.relationships[name] && result.relationships[name][lord];
    if (!rel) return null;
    return { k: rel.panchadha, lord: lord };
  }

  // Whole-sign-only dignity (no partial-degree Moolatrikona — classical D-9
  // dignity is read whole-sign) — used for both the D-9 check below and for
  // reading a dispositor's own dignity, so a single small helper covers both
  // rather than two ad hoc inline checks.
  function wholeSignDignity(name, signIndex, S) {
    if (!S || !S.EXALT[name]) return [];
    var out = [];
    var exSign = Math.floor(S.EXALT[name] / 30);
    var debSign = (exSign + 6) % 12;
    if (signIndex === exSign) out.push('ex');
    if (signIndex === debSign) out.push('deb');
    if (S.OWN_SIGNS[name].indexOf(signIndex) >= 0) out.push('lord');
    return out;
  }

  function roleTagsForOwnedHouses(ownedHouses) {
    var tags = [];
    if (ownedHouses.indexOf(1) >= 0) tags.push('Lagna');
    if (ownedHouses.some(function (h) { return TRIKONA.indexOf(h) >= 0; })) tags.push('Trikona');
    if (ownedHouses.some(function (h) { return KENDRA.indexOf(h) >= 0; })) tags.push('Kendra');
    if (ownedHouses.some(function (h) { return DUSTHANA.indexOf(h) >= 0; })) tags.push('Dusthana');
    if (ownedHouses.some(function (h) { return MARAKA.indexOf(h) >= 0; })) tags.push('Maraka');
    if (ownedHouses.some(function (h) { return UPACHAYA.indexOf(h) >= 0; })) tags.push('Upachaya');
    return tags;
  }

  // Functional-role classifier (Influence Engine §2.2 / research item B6).
  // Rahu/Ketu get BOTH readings — classical (SIGN_LORDS: no independent
  // lordship at all) and this app's own established co-lordship convention
  // (H.housesOwnedBy, SIGN_COLORDS — already used by the network overlay and
  // Dasha-activation elsewhere) — rather than one being picked for them.
  function functionalRoleOf(name, result, H) {
    var ascSign = result.ascendant.signIndex;
    var E2 = H.engine;
    var classicalOwned = [];
    for (var s = 0; s < 12; s++) {
      if (E2.SIGN_LORDS[s] === name) classicalOwned.push(((s - ascSign + 12) % 12) + 1);
    }
    var classical = { ownedHouses: classicalOwned, tags: roleTagsForOwnedHouses(classicalOwned) };
    if (!NODES[name]) return { classical: classical, dual: false };
    var appOwned = H.housesOwnedBy(name, ascSign).map(function (o) { return o.house; });
    var appConvention = { ownedHouses: appOwned, tags: roleTagsForOwnedHouses(appOwned) };
    return { classical: classical, appConvention: appConvention, dual: true };
  }

  // The reading actually used to drive yoga scanning and the FROM verdict:
  // the app's own co-lordship convention for the nodes (consistent with
  // H.housesOwnedBy already being co-lord-aware everywhere else in this
  // codebase — planetYogas, the network overlay, Dasha-activation), the only
  // reading there is for the seven classical planets.
  function primaryRoleInfo(roleInfo) { return roleInfo.dual ? roleInfo.appConvention : roleInfo.classical; }

  // Two planets "associated" for yoga purposes: sharing a sign (conjunction),
  // one aspecting the other (graha drishti, either direction), or a mutual
  // sign exchange (Parivartana) — the same three conditions Raja/Dhana Yoga
  // are classically formed by.
  function planetsAssociated(a, b, result, H) {
    var pa = result.planets[a], pb = result.planets[b];
    if (pa.signIndex === pb.signIndex) return 'conjunction';
    var aAspectsB = H.aspectsCastBy(a, result).some(function (x) { return x.planet === b; });
    var bAspectsA = H.aspectsCastBy(b, result).some(function (x) { return x.planet === a; });
    if (aAspectsB || bAspectsA) return 'mutual aspect';
    if (H.engine.SIGN_COLORDS[pa.signIndex].indexOf(b) >= 0 &&
        H.engine.SIGN_COLORDS[pb.signIndex].indexOf(a) >= 0) return 'exchange';
    return null;
  }

  // Viparita Raja Yoga (research item A4): Harsha (6th lord in a dusthana),
  // Sarala (8th lord), Vimala (12th lord). Iterates SIGN_COLORDS rather than
  // the single classical SIGN_LORDS so a co-lord (Rahu/Ketu) sitting in a
  // dusthana is caught too — `isPrimaryLord` says which reading a given hit
  // came from rather than silently merging them. Deliberately surfaced as a
  // fact, not a verdict — the open classical debate over whether a benefic
  // aspect on the VRY-causing planet strengthens or dilutes its self-
  // cancelling mechanism is stated, not resolved (research §5.4).
  var VRY_DEF = [
    { name: 'Harsha Yoga', dusthana: 6 },
    { name: 'Sarala Yoga', dusthana: 8 },
    { name: 'Vimala Yoga', dusthana: 12 }
  ];
  function viparitaRajaYogas(result, H) {
    var ascSign = result.ascendant.signIndex;
    var E2 = H.engine;
    var out = [];
    VRY_DEF.forEach(function (v) {
      var signIdx = (ascSign + v.dusthana - 1) % 12;
      E2.SIGN_COLORDS[signIdx].forEach(function (lord) {
        var lp = result.planets[lord];
        if (!lp || DUSTHANA.indexOf(lp.house) < 0) return;
        out.push({
          name: v.name, dusthanaOwned: v.dusthana, lord: lord,
          lordHouse: lp.house, isPrimaryLord: E2.SIGN_LORDS[signIdx] === lord,
          reason: lord + ', lord of your ' + ord(v.dusthana) + ' house, sits in the ' + ord(lp.house) +
            ' — itself a dusthana. A dusthana lord posited in another dusthana neutralises its own ' +
            'affliction, the classical shape of ' + v.name + ' — turning what would otherwise be a weak, ' +
            'afflicted placement into an unlikely source of strength. (Whether a benefic aspect on ' + lord +
            ' strengthens or dilutes this self-cancelling mechanism is a genuine, unresolved classical ' +
            'debate, surfaced here as a fact rather than settled either way.)'
        });
      });
    });
    return out;
  }

  // Chart-wide Raja Yoga scanner (research item B7): any kendra/Lagna-lord
  // paired with any trikona-lord, associated by conjunction/aspect/exchange —
  // generalizes planetYogas' existing single-planet "holds both roles itself"
  // shape to the two-planet case, which nothing in the app scanned for before.
  function chartWideRajaYogas(result, H) {
    var out = [];
    var names = H.PLANET_ORDER;
    var ascSign = result.ascendant.signIndex;
    for (var i = 0; i < names.length; i++) {
      for (var j = i + 1; j < names.length; j++) {
        var a = names[i], b = names[j];
        if (H.isNodePair(a, b)) continue;
        var ra = primaryRoleInfo(functionalRoleOf(a, result, H)).tags;
        var rb = primaryRoleInfo(functionalRoleOf(b, result, H)).tags;
        var aKT = ra.indexOf('Kendra') >= 0 || ra.indexOf('Lagna') >= 0;
        var aTri = ra.indexOf('Trikona') >= 0;
        var bKT = rb.indexOf('Kendra') >= 0 || rb.indexOf('Lagna') >= 0;
        var bTri = rb.indexOf('Trikona') >= 0;
        var branch = aKT && bTri ? { kLord: a, tLord: b } :
                     aTri && bKT ? { kLord: b, tLord: a } : null;
        if (!branch) continue;
        var assoc = planetsAssociated(a, b, result, H);
        if (!assoc) continue;
        // Named by house number throughout — which specific owned house
        // earns the kendra/trikona label (a planet can rule more than one,
        // only sometimes both of the relevant kind), and which house each
        // planet actually stands in, since that's where the link itself
        // (conjunction/aspect/exchange) plays out. The association type
        // itself is tracked on the returned object (`association`) for
        // anything that needs it, but left out of the reason text — the
        // house numbers are what makes the combination legible; naming
        // conjunction/aspect/exchange on top of them was adding a term
        // without adding to what a reader actually needs; the case for a
        // symmetric-sounding "mutual aspect" label when the underlying
        // check (planetsAssociated) only requires one direction was a
        // separate, additional reason to stop leaning on that wording here.
        var kHouses = H.housesOwnedBy(branch.kLord, ascSign).map(function (o) { return o.house; })
          .filter(function (h) { return KENDRA.indexOf(h) >= 0; });
        var tHouses = H.housesOwnedBy(branch.tLord, ascSign).map(function (o) { return o.house; })
          .filter(function (h) { return TRIKONA.indexOf(h) >= 0; });
        out.push({
          planets: [a, b], association: assoc,
          reason: branch.kLord + ' (House ' + kHouses.join('/') + ' lord, a kendra) in House ' +
            result.planets[branch.kLord].house + ', and ' + branch.tLord + ' (House ' + tHouses.join('/') +
            ' lord, a trikona) in House ' + result.planets[branch.tLord].house +
            ', are linked — a two-planet Raja Yoga.'
        });
      }
    }
    return out;
  }

  // Chart-wide Dhana Yoga scanner (research item B8) — same 2nd/5th/9th/11th
  // "wealth house" set planetYogas' single-planet Dhana check already uses,
  // generalized to any two wealth-house lords associated with each other.
  var DHANA_HOUSES = [2, 5, 9, 11];
  function chartWideDhanaYogas(result, H) {
    var out = [];
    var names = H.PLANET_ORDER;
    var ascSign = result.ascendant.signIndex;
    for (var i = 0; i < names.length; i++) {
      for (var j = i + 1; j < names.length; j++) {
        var a = names[i], b = names[j];
        if (H.isNodePair(a, b)) continue;
        var ra = primaryRoleInfo(functionalRoleOf(a, result, H)).ownedHouses;
        var rb = primaryRoleInfo(functionalRoleOf(b, result, H)).ownedHouses;
        var aWealth = ra.filter(function (h) { return DHANA_HOUSES.indexOf(h) >= 0; });
        var bWealth = rb.filter(function (h) { return DHANA_HOUSES.indexOf(h) >= 0; });
        if (!aWealth.length || !bWealth.length) continue;
        var assoc = planetsAssociated(a, b, result, H);
        if (!assoc) continue;
        // Named by house number throughout, same reasoning as the Raja Yoga
        // scanner just above: which specific wealth house (2nd/5th/9th/11th)
        // each planet's lordship earns it the label, and which house each
        // planet actually stands in. Association type stays on the returned
        // object for anything that needs it, left out of the reason text.
        out.push({
          planets: [a, b], association: assoc,
          reason: a + ' (House ' + aWealth.join('/') + ' lord) in House ' + result.planets[a].house +
            ', and ' + b + ' (House ' + bWealth.join('/') + ' lord) in House ' + result.planets[b].house +
            ', are linked — a two-planet Dhana Yoga.'
        });
      }
    }
    return out;
  }

  // Chart-wide Neecha Bhanga scan, Gajakesari scan, and Parivartana scan —
  // added after a user report that the Influence Engine's "yogas-at-a-glance"
  // panel didn't list any of these three, even for charts (like Siva's) where
  // all three are present and already named elsewhere in the app (the Planet
  // Interpretation tab's rung 2/5b bullets, the chart hover tooltip's
  // co-tenant/lordship yoga lines). Root cause: influenceEngineChart's panel
  // only ever aggregated the yogas purpose-built for this feature — VRY,
  // and the two chart-wide (two-DIFFERENT-planet) Raja/Dhana scanners — never
  // the three yogas already computed by `neechaBhangaFor`, `cotenantYogas`
  // and `planetYogas`'s own Parivartana branch. (Neecha Bhanga
  // was never *named* in the top-level yogas panel; Gajakesari and
  // Parivartana weren't referenced by the Influence Engine at all.) Each scan
  // below reuses the exact same underlying check rather than a second
  // reimplementation, per this codebase's established "extract, don't
  // duplicate" convention.
  function neechaBhangaYogas(result, H) {
    var out = [];
    H.PLANET_ORDER.forEach(function (name) {
      var nb = neechaBhangaFor(name, result, H);
      if (nb) {
        out.push({
          name: 'Neecha Bhanga Yoga', planet: name,
          reason: name + '’s debilitation in ' + result.planets[name].sign + ' is cancelled: ' +
            list(nb.reasons) + '.'
        });
      }
    });
    return out;
  }

  function gajakesariYogas(result, H) {
    if (result.planets.Moon.signIndex !== result.planets.Jupiter.signIndex) return [];
    return cotenantYogas('Moon', 'Jupiter');
  }

  // Every other conjunction yoga in COTENANT_YOGAS (Gajakesari keeps its own
  // scan and panel group above). Budhaditya notes when Mercury is combust —
  // the usual caveat that a combust Mercury weakens the yoga's promise.
  function conjunctionYogas(result, H) {
    var out = [];
    COTENANT_YOGAS.forEach(function (y) {
      if (y.name === 'Gajakesari Yoga') return;
      var a = y.planets[0], b = y.planets[1];
      if (result.planets[a].signIndex !== result.planets[b].signIndex) return;
      var reason = y.reason;
      if (y.name === 'Budhaditya Yoga') {
        var c = result.planets.Mercury.combustion;
        if (c && c.combust) {
          reason += ' Mercury is combust (' + n1(c.separation) + '° from the Sun, orb ' + c.orb +
            '°), which is classically said to weaken this yoga.';
        }
      }
      out.push({ name: y.name, planets: y.planets.slice(), reason: reason });
    });
    return out;
  }

  // Pancha Mahapurusha Yogas — BPHS names these across five separate,
  // single-planet conditions (not one chapter this project has directly
  // verified against the Sagar/Sharma edition's own table of contents; see
  // the Influence Framework tab for why no chapter number is attached
  // here rather than guessing). One graha per yoga (the luminaries and
  // nodes don't form these): Mars (Ruchaka), Mercury (Bhadra), Jupiter
  // (Hamsa), Venus (Malavya), Saturn (Sasa) — each exalted or in its own
  // sign, standing in a Kendra (1st/4th/7th/10th) from the Lagna.
  var MAHAPURUSHA_NAMES = { Mars: 'Ruchaka', Mercury: 'Bhadra', Jupiter: 'Hamsa', Venus: 'Malavya', Saturn: 'Sasa' };
  function panchaMahapurushaYogas(result, H) {
    var out = [];
    Object.keys(MAHAPURUSHA_NAMES).forEach(function (name) {
      var p = result.planets[name];
      if (KENDRA.indexOf(p.house) < 0) return;
      var dg = wholeSignDignity(name, p.signIndex, H.Shadbala);
      var isEx = dg.indexOf('ex') >= 0, isOwn = dg.indexOf('lord') >= 0;
      if (!isEx && !isOwn) return;
      out.push({
        name: MAHAPURUSHA_NAMES[name] + ' Yoga', planet: name,
        reason: name + ' is ' + (isEx ? 'exalted' : 'in its own sign') + ' in ' + p.sign +
          ', a kendra (house ' + p.house + ') from the Lagna.'
      });
    });
    return out;
  }

  // Mirrors planetYogas' own Parivartana condition (same SIGN_COLORDS mutual-
  // dispositor test, same parivartanaClass call) but iterates chart-wide with
  // an unordered-pair dedup, since calling planetYogas() once per planet would
  // otherwise report the same exchange twice — once from each side.
  function parivartanaYogas(result, H) {
    var E2 = H.engine;
    var ascSign = result.ascendant.signIndex;
    var seen = {};
    var out = [];
    H.PLANET_ORDER.forEach(function (a) {
      var pa = result.planets[a];
      E2.SIGN_COLORDS[pa.signIndex].forEach(function (b) {
        if (b === a || H.isNodePair(a, b)) return;
        var pb = result.planets[b];
        if (!pb || pb.signIndex === pa.signIndex) return;
        if (E2.SIGN_COLORDS[pb.signIndex].indexOf(a) < 0) return;
        var key = a < b ? a + '|' + b : b + '|' + a;
        if (seen[key]) return;
        seen[key] = true;
        var hA = ((pa.signIndex - ascSign + 12) % 12) + 1;
        var hB = ((pb.signIndex - ascSign + 12) % 12) + 1;
        var cls = parivartanaClass(hA, hB);
        out.push({
          name: cls + ' Yoga (Parivartana)', planets: [a, b],
          reason: a + ' and ' + b + ' sit in each other’s sign — a mutual exchange between the ' +
            ord(hA) + ' and ' + ord(hB) + ' lords, ' + cls + ' yoga in Phaladeepika’s classification.'
        });
      });
    });
    return out;
  }

  // Tripod-impact scanner (research item B10): which planets aspect or
  // conjoin the Ascendant (Body), the Sun (Soul) or the Moon (Mind), and
  // whether that reads as stabilizing or afflicting (Rahu/Ketu as natural
  // malefics — see isNaturalBenefic).
  function tripodImpact(result, sb, H) {
    var beneficMap = (sb && sb.context && sb.context.beneficMap) || DEFAULT_BENEFIC;
    var targets = [
      { key: 'Body', sign: result.ascendant.signIndex, planet: null },
      { key: 'Soul', sign: result.planets.Sun.signIndex, planet: 'Sun' },
      { key: 'Mind', sign: result.planets.Moon.signIndex, planet: 'Moon' }
    ];
    var out = { Body: [], Soul: [], Mind: [] };
    H.PLANET_ORDER.forEach(function (name) {
      var pSign = result.planets[name].signIndex;
      targets.forEach(function (t) {
        if (t.planet === name) return;
        var stabilizing = isNaturalBenefic(name, beneficMap);
        if (pSign === t.sign) {
          out[t.key].push({ planet: name, via: name + ' conjoins ' + t.key, stabilizing: stabilizing });
          return;
        }
        var dist = ((t.sign - pSign + 12) % 12) + 1;
        var houses = H.ASPECT_HOUSES[name] || [7];
        if (houses.indexOf(dist) >= 0) {
          out[t.key].push({ planet: name, via: name + ' aspects ' + t.key + ' (' + ord(dist) + ')', stabilizing: stabilizing });
        }
      });
    });
    return out;
  }

  // Dispositor Chain (Influence Framework §5 / item 23 — "Dispositor-as-net-
  // vector," multi-hop). Walks a planet's occupied sign to that sign's
  // classical lord, then to THAT planet's own occupied sign, and so on —
  // stopping when a planet is reached that rules its own sign (self-ruled),
  // or when a planet already seen in this walk turns up again (a loop,
  // reported as a fact rather than an error). Uses classical SIGN_LORDS only
  // (not the app's own co-lordship convention) — this only needs "what sign
  // does X rule", and a co-lordship reading would let Rahu/Ketu each claim
  // two 'own' signs, ending a walk through them prematurely in a way the
  // classical convention doesn't. That also means Rahu/Ketu can only ever be
  // the walk's *starting* planet, never a link partway through — SIGN_LORDS
  // has no entry mapping to either node, matching the classical reading that
  // the nodes hold no independent dispositorship.
  //
  // Purely descriptive: per the Influence Framework's one-hop rule (§2 —
  // verdicts pull only raw one-hop facts, never another planet's already-
  // synthesized verdict, to stay safe against cycles like a mutual exchange),
  // this NEVER feeds back into a planet's own verdict. Only the dispositor's
  // raw one-hop facts do that (its dignity and house, read in balaFramework).
  //
  // Cycle detection is a visited-name set; with 9 grahas a repeat is
  // guaranteed within 9 hops by pigeonhole, so the loop below is bounded
  // defensively at 10 rather than run unbounded.
  function dispositorChain(name, result, H) {
    var E2 = H.engine;
    var chain = [name];
    var seen = {};
    seen[name] = true;
    var cursor = name;
    for (var i = 0; i < 10; i++) {
      var lord = E2.SIGN_LORDS[result.planets[cursor].signIndex];
      if (lord === cursor) return { chain: chain, terminal: 'self-ruled', planet: cursor };
      if (seen[lord]) {
        var loopStart = chain.indexOf(lord);
        return { chain: chain, terminal: 'loop', loop: chain.slice(loopStart).concat(lord) };
      }
      chain.push(lord);
      seen[lord] = true;
      cursor = lord;
    }
    return { chain: chain, terminal: 'unresolved' }; // defensive; unreachable with 9 grahas
  }

  // Dasha timing (Influence Framework — "dasha-dependent vs. dasha-
  // independent yogas"). BPHS Ch. 46 (Maraka Grahas) is the one place BPHS
  // works through trigger logic in verse rather than just stating a result:
  // the yoga-forming planet's own Mahadasha/Antardasha is the primary
  // trigger; a planet tied to it by conjunction or aspect (sambandha) is a
  // secondary trigger — Ch. 46's own worked case is Rahu/Ketu picking up a
  // Maraka's killing power through conjunction, house-placement, or being
  // in the 7th from the Maraka lord. This function generalizes that exact
  // mechanic to any yoga: pass the planet(s) that define the yoga, get back
  // the same planet(s) as the primary trigger and every co-tenant/aspecting
  // planet as a secondary trigger candidate.
  //
  // Also checks Yoga Bhanga — a planet's own affliction can suspend its
  // yoga's positive delivery during the very period this function times,
  // rather than merely timing it. Two checks, both already computed
  // elsewhere in this file/module rather than reimplemented here: an
  // uncancelled debilitation (neechaBhangaFor already does the cancellation
  // check) and Shadbala below minimum (sb.results[name].meetsMinimum,
  // the same minimum the planet verdict grades against). `sb` is optional — a hand-
  // placed Simulation chart has no Shadbala context, so that half of the
  // check is simply skipped rather than guessed at.
  //
  // This is NOT a dependent/independent classifier — VRY, Raja, Dhana,
  // Gajakesari, Neecha Bhanga, and Parivartana all reduce to one or two
  // specifically named planets, so by the test on the Influence Framework
  // tab, all six are dasha-dependent. Pancha Mahapurusha Yogas are a third,
  // Hybrid case — a permanent baseline trait from birth, plus a Dasha-timed
  // peak — so they use this same trigger mechanic without being purely
  // "dependent" the way the other six are. None of the seven is a
  // whole-chart distribution pattern the way Nabhasha Yogas (BPHS Ch. 37,
  // the one BPHS-confirmed dasha-independent category) are — those are
  // scanned separately (nabhashaYogas) and need no trigger timing.
  function dashaTiming(primaryPlanets, result, H, sb) {
    var secondary = {};
    primaryPlanets.forEach(function (p) {
      if (!result.planets[p]) return;
      var mySign = result.planets[p].signIndex;
      H.PLANET_ORDER.forEach(function (other) {
        if (primaryPlanets.indexOf(other) >= 0 || H.isNodePair(p, other)) return;
        if (result.planets[other].signIndex === mySign && !secondary[other]) {
          secondary[other] = 'conjunct ' + p;
        }
      });
      H.aspectsOntoSign(mySign, result).forEach(function (a) {
        if (primaryPlanets.indexOf(a.planet) >= 0) return;
        if (!secondary[a.planet]) secondary[a.planet] = 'aspects ' + p;
      });
    });
    var suspended = [];
    primaryPlanets.forEach(function (p) {
      if (!result.planets[p]) return;
      var dg = wholeSignDignity(p, result.planets[p].signIndex, H.Shadbala);
      if (dg.indexOf('deb') >= 0 && !neechaBhangaFor(p, result, H)) {
        suspended.push(p + ' is debilitated with no Neecha Bhanga cancellation');
      }
      if (sb && sb.results && sb.results[p] && !sb.results[p].meetsMinimum) {
        suspended.push(p + '’s Shadbala is below its minimum');
      }
    });
    return {
      primary: primaryPlanets.slice(),
      secondary: Object.keys(secondary).map(function (p) { return { planet: p, via: secondary[p] }; }),
      suspended: suspended
    };
  }
  function dashaTimingText(timing, opts) {
    var hybrid = opts && opts.hybrid;
    var s = hybrid
      ? 'Hybrid — a permanent baseline trait from birth; peak material delivery during ' +
        list(timing.primary) + '’s own Dasha/Antardasha (BPHS Ch. 46 mechanic).'
      : 'Dasha-dependent — primary trigger: ' + list(timing.primary) +
        '’s own Dasha/Antardasha (BPHS Ch. 46 mechanic).';
    if (timing.secondary.length) {
      s += ' Secondary trigger candidates (sambandha-tied): ' +
        timing.secondary.map(function (t) { return t.planet + ' (' + t.via + ')'; }).join(', ') + '.';
    }
    if (timing.suspended.length) {
      s += ' Yoga Bhanga caution: ' + timing.suspended.join('; ') +
        ' — classically, this can suspend the yoga’s positive delivery during its own period rather than simply timing it.';
    }
    return s;
  }

  // Single entry point (research item D20-adjacent — this is what a UI layer
  // calls once per chart): computes the chart-wide scans exactly once, plus
  // each planet's dispositor chain, rather than each caller re-running the
  // O(n²) yoga scanners per planet.
  // ---- Nabhasha Yogas (BPHS Ch. 37) ----
  // Whole-chart patterns in how the seven grahas (Sun to Saturn; Rahu/Ketu
  // excluded, as in BPHS) are distributed. BPHS says their results are felt
  // "throughout, in all the Dasha periods" — the one dasha-independent
  // category. All four groups are coded here.
  //   Ashraya (by sign quality): all seven in movable signs — Rajju; fixed —
  //     Musala; dual — Nala.
  //   Dala (by kendra occupation): natural benefics in three kendras and no
  //     natural malefic in any kendra — Mala; natural malefics in three
  //     kendras and no natural benefic in any — Sarpa. Benefic/malefic from
  //     the chart's own Shadbala map (so the Moon's status follows its
  //     phase), else DEFAULT_BENEFIC.
  //   Akriti (20 shapes, by which houses from the Lagna are occupied — same
  //     definitions as Varahamihira's Brihat Jataka). "All planets in houses
  //     X" is read as: all seven confined to those houses AND every one of
  //     them occupied — the usual reading, and it keeps shapes from
  //     overlapping (planets only in the 1st and 4th would otherwise be Gada,
  //     Yupa and Nauka at once). Vajra and Yava can't physically occur (they
  //     need Venus or Mercury 90° from the Sun, as Varahamihira himself
  //     noted) but are coded for completeness.
  //   Sankhya (by count of occupied signs): 7 Vallaki, 6 Daama, 5 Pasha,
  //     4 Kedara, 3 Shula, 2 Yuga, 1 Gola. Always exactly one applies; BPHS
  //     treats Sankhya as the fallback when no other Nabhasha Yoga forms, so
  //     the note says so when another one is present.
  var NABHASHA_GRAHAS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  var ASHRAYA = [
    { name: 'Rajju', quality: 'movable', text: 'fond of travel and movement, with fortune found away from home' },
    { name: 'Musala', quality: 'fixed', text: 'steady, honoured and firm of purpose, with lasting possessions' },
    { name: 'Nala', quality: 'dual', text: 'skilful and resourceful, gathering wealth through many means' }
  ];
  // Akriti shapes: every house set that forms the yoga (any one is enough).
  function consecutive(start, len) {
    var out = [];
    for (var i = 0; i < len; i++) out.push(((start - 1 + i) % 12) + 1);
    return out;
  }
  var AKRITI = [
    { name: 'Gada', sets: [[1, 4], [4, 7], [7, 10], [10, 1]], where: 'two adjacent kendras',
      text: 'wealth earned through steady effort, learning and devotion to duty' },
    { name: 'Shakata', sets: [[1, 7]], where: 'the 1st and 7th',
      text: 'fortunes that rise and fall like a cart’s wheel, with toil and periods of want' },
    { name: 'Vihaga', sets: [[4, 10]], where: 'the 4th and 10th',
      text: 'a restless, travelling life — a go-between or messenger, not easily settled' },
    { name: 'Shringataka', sets: [[1, 5, 9]], where: 'the trines 1, 5 and 9',
      text: 'happiness, good fortune and favour from those in authority' },
    { name: 'Hala', sets: [[2, 6, 10], [3, 7, 11], [4, 8, 12]], where: 'a set of trines other than the Lagna’s',
      text: 'a life tied to the land and hard work, providing for many' },
    { name: 'Kamala (Padma)', sets: [[1, 4, 7, 10]], where: 'all four kendras',
      text: 'fame, virtue, wealth and a long life' },
    { name: 'Vapi', sets: [[2, 5, 8, 11], [3, 6, 9, 12]], where: 'all four panapharas or all four apoklimas',
      text: 'accumulated wealth and comfort, held onto rather than spent' },
    { name: 'Yupa', sets: [consecutive(1, 4)], where: 'the four houses from the 1st',
      text: 'generosity, virtue and devotion to sacred duty' },
    { name: 'Shara (Ishu)', sets: [consecutive(4, 4)], where: 'the four houses from the 4th',
      text: 'a sharp, forceful nature, drawn to hard or harsh work' },
    { name: 'Shakti', sets: [consecutive(7, 4)], where: 'the four houses from the 7th',
      text: 'long life and skill in contests, with little ease or wealth' },
    { name: 'Danda', sets: [consecutive(10, 4)], where: 'the four houses from the 10th',
      text: 'separation from those dear, and service to others' },
    { name: 'Nauka', sets: [consecutive(1, 7)], where: 'the seven houses from the 1st',
      text: 'fame and gain, especially through water or trade, with a grasping streak' },
    { name: 'Kuta', sets: [consecutive(4, 7)], where: 'the seven houses from the 4th',
      text: 'a hard, guarded nature and difficult means' },
    { name: 'Chhatra', sets: [consecutive(7, 7)], where: 'the seven houses from the 7th',
      text: 'kindness and support for others, happy early and late in life' },
    { name: 'Chapa (Dhanus)', sets: [consecutive(10, 7)], where: 'the seven houses from the 10th',
      text: 'a secretive, enterprising nature, happiest in middle life' },
    { name: 'Ardha Chandra', sets: [2, 3, 5, 6, 8, 9, 11, 12].map(function (h) { return consecutive(h, 7); }),
      where: 'seven consecutive houses starting from a non-kendra', text: 'good looks, command over others and wealth' },
    { name: 'Chakra', sets: [[1, 3, 5, 7, 9, 11]], where: 'the six alternate houses from the 1st',
      text: 'rulership and command — among the most exalted of the shapes' },
    { name: 'Samudra', sets: [[2, 4, 6, 8, 10, 12]], where: 'the six alternate houses from the 2nd',
      text: 'abundant wealth and enjoyments, living like royalty' }
  ];

  var SANKHYA = {
    7: { name: 'Vallaki (Veena)', text: 'many friends and a love of music and the arts' },
    6: { name: 'Daama', text: 'generous and helpful, with wealth and renown' },
    5: { name: 'Pasha', text: 'capable and skilled in work, though tied to many obligations' },
    4: { name: 'Kedara', text: 'useful to others, prospering through land, cultivation and steady effort' },
    3: { name: 'Shula', text: 'sharp and courageous, but prone to conflict and hardship' },
    2: { name: 'Yuga', text: 'unconventional in outlook, with means that come and go' },
    1: { name: 'Gola', text: 'struggle with means and learning early in life' }
  };
  function nabhashaYogas(result, sb, H) {
    var out = [];
    var beneficMap = (sb && sb.context && sb.context.beneficMap) || DEFAULT_BENEFIC;
    var signs = NABHASHA_GRAHAS.map(function (n) { return result.planets[n].signIndex; });

    // Ashraya — sign quality: signIndex % 3 is 0 movable, 1 fixed, 2 dual.
    var qualities = signs.map(function (s) { return s % 3; });
    if (qualities.every(function (q) { return q === qualities[0]; })) {
      var a = ASHRAYA[qualities[0]];
      out.push({ group: 'Ashraya', name: a.name + ' Yoga', reason: 'All seven planets occupy ' + a.quality +
        ' signs — ' + a.text + '.' });
    }

    // Dala — kendra occupation by natural benefics / malefics.
    var kendraBen = 0, kendraMal = 0, anyBen = false, anyMal = false;
    [1, 4, 7, 10].forEach(function (h) {
      var occ = NABHASHA_GRAHAS.filter(function (n) { return result.planets[n].house === h; });
      var hasBen = occ.some(function (n) { return isNaturalBenefic(n, beneficMap); });
      var hasMal = occ.some(function (n) { return !isNaturalBenefic(n, beneficMap); });
      if (hasBen) { kendraBen++; anyBen = true; }
      if (hasMal) { kendraMal++; anyMal = true; }
    });
    if (kendraBen >= 3 && !anyMal) {
      out.push({ group: 'Dala', name: 'Mala (Srik) Yoga', reason: 'Natural benefics occupy ' + kendraBen +
        ' of the four kendras and no natural malefic sits in any — comfort, enjoyments and a pleasant life.' });
    }
    if (kendraMal >= 3 && !anyBen) {
      out.push({ group: 'Dala', name: 'Sarpa Yoga', reason: 'Natural malefics occupy ' + kendraMal +
        ' of the four kendras and no natural benefic sits in any — a harder, more struggling path.' });
    }

    // Akriti — house shapes. Confined to the set, and every house in it occupied.
    var houses = NABHASHA_GRAHAS.map(function (n) { return result.planets[n].house; });
    function fills(set) {
      return houses.every(function (h) { return set.indexOf(h) >= 0; }) &&
             set.every(function (h) { return houses.indexOf(h) >= 0; });
    }
    AKRITI.forEach(function (a) {
      var set = a.sets.filter(fills)[0];
      if (set) {
        out.push({ group: 'Akriti', name: a.name + ' Yoga', reason: 'The seven planets fill ' + a.where +
          ' (houses ' + set.join(', ') + ') — ' + a.text + '.' });
      }
    });
    // Vajra / Yava — benefics and malefics split between the kendra pairs.
    var ben = NABHASHA_GRAHAS.filter(function (n) { return isNaturalBenefic(n, beneficMap); });
    var mal = NABHASHA_GRAHAS.filter(function (n) { return !isNaturalBenefic(n, beneficMap); });
    function splitFills(group, set) {
      var hs = group.map(function (n) { return result.planets[n].house; });
      return hs.every(function (h) { return set.indexOf(h) >= 0; }) &&
             set.every(function (h) { return hs.indexOf(h) >= 0; });
    }
    if (splitFills(ben, [1, 7]) && splitFills(mal, [4, 10])) {
      out.push({ group: 'Akriti', name: 'Vajra Yoga', reason: 'Natural benefics fill the 1st and 7th and natural ' +
        'malefics the 4th and 10th — happy early and late in life, brave and fortunate.' });
    }
    if (splitFills(mal, [1, 7]) && splitFills(ben, [4, 10])) {
      out.push({ group: 'Akriti', name: 'Yava Yoga', reason: 'Natural malefics fill the 1st and 7th and natural ' +
        'benefics the 4th and 10th — virtuous and generous, happiest in middle life.' });
    }
    // Vajra and Yava are Kamala (all four kendras) with a specific
    // benefic/malefic split, so the more specific one replaces Kamala.
    if (out.some(function (y) { return y.name === 'Vajra Yoga' || y.name === 'Yava Yoga'; })) {
      out = out.filter(function (y) { return y.name !== 'Kamala (Padma) Yoga'; });
    }

    // Sankhya — number of distinct signs occupied.
    var distinct = signs.filter(function (s, i) { return signs.indexOf(s) === i; }).length;
    var sk = SANKHYA[distinct];
    out.push({ group: 'Sankhya', name: sk.name + ' Yoga', reason: 'The seven planets occupy ' + distinct +
      ' sign' + (distinct > 1 ? 's' : '') + ' — ' + sk.text + '.' +
      (out.length ? ' BPHS treats Sankhya Yogas as applying only when no other Nabhasha Yoga forms, so the ' +
        list(out.map(function (y) { return y.name; })) + ' above ' + (out.length > 1 ? 'take' : 'takes') + ' precedence here.' : '') });
    return out;
  }

  function influenceEngineChart(result, sb, H) {
    var vry = viparitaRajaYogas(result, H);
    var raja = chartWideRajaYogas(result, H);
    var dhana = chartWideDhanaYogas(result, H);
    var neechaBhanga = neechaBhangaYogas(result, H);
    var gajakesari = gajakesariYogas(result, H);
    var conjunction = conjunctionYogas(result, H);
    var parivartana = parivartanaYogas(result, H);
    var mahapurusha = panchaMahapurushaYogas(result, H);
    var nabhasha = nabhashaYogas(result, sb, H);
    nabhasha.forEach(function (y) { y.dashaClass = 'independent'; });
    vry.forEach(function (y) { y.timing = dashaTiming([y.lord], result, H, sb); y.timingText = dashaTimingText(y.timing); y.dashaClass = 'dependent'; });
    raja.forEach(function (y) { y.timing = dashaTiming(y.planets, result, H, sb); y.timingText = dashaTimingText(y.timing); y.dashaClass = 'dependent'; });
    dhana.forEach(function (y) { y.timing = dashaTiming(y.planets, result, H, sb); y.timingText = dashaTimingText(y.timing); y.dashaClass = 'dependent'; });
    neechaBhanga.forEach(function (y) { y.timing = dashaTiming([y.planet], result, H, sb); y.timingText = dashaTimingText(y.timing); y.dashaClass = 'dependent'; });
    gajakesari.forEach(function (y) { y.timing = dashaTiming(['Moon', 'Jupiter'], result, H, sb); y.timingText = dashaTimingText(y.timing); y.dashaClass = 'dependent'; });
    conjunction.forEach(function (y) { y.timing = dashaTiming(y.planets, result, H, sb); y.timingText = dashaTimingText(y.timing); y.dashaClass = 'dependent'; });
    parivartana.forEach(function (y) { y.timing = dashaTiming(y.planets, result, H, sb); y.timingText = dashaTimingText(y.timing); y.dashaClass = 'dependent'; });
    mahapurusha.forEach(function (y) { y.timing = dashaTiming([y.planet], result, H, sb); y.timingText = dashaTimingText(y.timing, { hybrid: true }); y.dashaClass = 'hybrid'; });
    var tripod = tripodImpact(result, sb, H);
    var planets = {};
    H.PLANET_ORDER.forEach(function (name) {
      planets[name] = { dispositorChain: dispositorChain(name, result, H) };
    });
    return {
      vry: vry, raja: raja, dhana: dhana,
      neechaBhanga: neechaBhanga, gajakesari: gajakesari, conjunction: conjunction, parivartana: parivartana,
      mahapurusha: mahapurusha, nabhasha: nabhasha, tripod: tripod, planets: planets
    };
  }

  // ---- the chain ----------------------------------------------------------
  //
  // H is the helper bundle handed in by app.js so the aspect and ownership
  // rules are computed in exactly one place rather than reimplemented here.

  function grahaChain(name, result, sb, H) {
    var E = H.engine;
    var p = result.planets[name];
    var ascSign = result.ascendant.signIndex;
    var isNode = !!NODES[name];
    var S = H.Shadbala;
    var res = sb && sb.results ? sb.results[name] : null;
    var benefic = sb && sb.context && sb.context.beneficMap ? sb.context.beneficMap : DEFAULT_BENEFIC;
    function isBenefic(g) { return NODES[g] ? false : !!benefic[g]; }
    var noDeg = !!result.simulated;

    var rungs = [], T = {};
    function add(rung, fact, interp, simple, illus) {
      rungs.push({ rung: rung, fact: fact, interp: interp, simple: simple || interp, illus: illus || simple || interp });
    }

    var mod = H.MODALITY[p.signIndex % 3].name;
    var ele = H.ELEMENT[p.signIndex % 4].name;
    var pol = p.signIndex % 2 === 0 ? 'yang' : 'yin';
    // Deliberately kept single-primary-lord (E.SIGN_LORDS, not SIGN_COLORDS):
    // rungs 1/3/5b build an entire "employer" narrative around one dispositor
    // (its placement, dignity, relationship, and any Parivartana with it).
    // Virgo/Aquarius/Scorpio/Pisces now have a second lord (Rahu/Ketu), but
    // there's no established classical convention for a two-boss narrative,
    // so this chain — and bhavaChain's mirroring house-lord spine, and
    // neechaBhangaFor's debLord — stay single-lord by deliberate choice.
    // Ownership/ "Lord of X" DATA everywhere else (housesOwnedBy,
    // nodeAgentsOf, the network overlay, activationsFor's Parivartana check,
    // planetYogas, and the House/Planet tab display labels) is fully
    // co-lord-aware via SIGN_COLORDS.
    var dispositor = E.SIGN_LORDS[p.signIndex];

    // ---- 0 · Planet ----
    add('0 · Planet',
      name + ' — ' + KARAKA[name],
      'The subject is ' + SUBJECT[name] + '.',
      'This is about ' + SIMPLE_SUBJECT[name] + '.',
      'This is about ' + tag(PLANET_KEYWORD[name], name) + '.');

    // ---- 1 · Sign ----
    add('1 · Sign',
      p.sign + ': ' + (SIGN_TRAITS[p.sign] || 'a distinctive sign') + '. ' +
      p.degreeFormatted + ' — ' + mod + ' ' + ele + ', ' + pol + ', ruled by ' + dispositor,
      'This is the register in which ' + FUNC[name] + ' works. ' + p.sign + ' ' + MODALITY_TEXT[mod] +
      ', and it does so ' + ELEMENT_TEXT[ele] + '. ' + dispositor + ' as ruler ' +
      (LORD_STYLE[dispositor] || 'colours it') + '.',
      SIMPLE_FUNC[name] + ' ' + MOD_SIMPLE[mod] + ', and works ' + ELE_SIMPLE[ele] + '.',
      'The ' + tag(PLANET_KEYWORD[name], name) + ' seeks ' + tag(SIGN_KEYWORD[p.sign], p.sign) + '.');

    // ---- 2 · Dignity ----
    var dg = H.dignityOf(name, p);
    var keys = dg.map(function (d) { return d.k; });
    var uch = res ? res.sthanaDetail.uchcha : null;
    var degFromDeb = uch === null ? null : uch * 3;
    var degFromEx = (S && S.EXALT[name]) ? arc(p.longitude, S.EXALT[name]) : null;

    // ---- Neecha Bhanga (cancellation of debilitation) ----
    var neechaBhanga = (!isNode && keys.indexOf('deb') >= 0) ? neechaBhangaFor(name, result, H) : null;

    var dFact = (dg.length ? dg.map(function (d) { return d.full; }).join('; ') : 'No dignity by sign') +
      (uch === null ? '' : '. Uchcha bala ' + n2(uch) + '/60 — ' + n1(degFromDeb) +
        '° from its exact debilitation point') +
      (neechaBhanga ? '. Neecha Bhanga Yoga — the debilitation is cancelled (' + neechaBhanga.reasons[0] + ')' : '');
    // Rahu/Ketu now carry real dignity (exaltation in Taurus/Scorpio,
    // Moolatrikona in Gemini/Sagittarius, co-lord own-sign in Virgo+Aquarius
    // / Scorpio+Pisces — shadbala.js), so `keys` drives this chain the same
    // way it does for the seven classical grahas; only the node-specific
    // fallback (no dignity at all) and the 'own sign' wording (a co-lord,
    // not the node's own sole dispositor — rung 3 stays the classical single
    // lord) are special-cased for isNode.
    var dInt;
    if (keys.indexOf('deb') >= 0 && neechaBhanga) {
      dInt = 'Debilitated by sign, and only ' + n1(degFromDeb) +
        '° from the exact debilitation degree, so Uchcha bala is still ' + n2(uch) + ' of 60. ' +
        'But this is a textbook Neecha Bhanga Yoga: ' + list(neechaBhanga.reasons) +
        ', which classically cancels the debility rather than erasing the placement — read the base tone as redeemed, not weak.';
    } else if (keys.indexOf('deb') >= 0) {
      dInt = isNode
        ? 'Debilitated by sign — the nodal exaltation/debilitation axis puts it at its weakest here. ' +
          'No Neecha Bhanga is evaluated for the nodes (no classical convention located for cancelling a node’s debility), ' +
          'so read this rung as strained with nothing below to redeem it.'
        : 'Base tone at its lowest. Debilitated by sign, and only ' + n1(degFromDeb) +
          '° from the exact debilitation degree, so Uchcha bala is ' + n2(uch) + ' of 60. ' +
          'Whatever follows has to work against this rung, not with it.';
    } else if (keys.indexOf('ex') >= 0) {
      dInt = isNode
        ? 'The strongest base tone available for a node: exalted' +
          (keys.indexOf('mt') >= 0 ? ' **and** in Moolatrikona, which is rare' : '') +
          '. No Uchcha bala is measured for the nodes, so this reads as a clean sign-level exaltation with no finer degree to qualify it.'
        : 'The strongest base tone available: exalted' +
          (keys.indexOf('mt') >= 0 ? ' **and** in Moolatrikona, which is rare' : '') +
          '. One honest qualifier — deep exaltation is a single degree, and this sits ' + n1(degFromEx) +
          '° from it, so Uchcha bala is ' + n2(uch) + ' rather than the full 60. Exalted by sign, not at its perfect point.';
    } else if (keys.indexOf('mt') >= 0) {
      dInt = 'In its Moolatrikona arc — its preferred working ground, one band below exaltation. It does here what it most wants to do.';
    } else if (keys.indexOf('lord') >= 0 && isNode) {
      dInt = name + ' co-owns ' + p.sign + ' alongside its classical lord (see rung 3 for that dispositor relationship), ' +
        'so this placement carries its own affairs directly rather than needing a middleman for at least this sign.';
    } else if (keys.indexOf('lord') >= 0) {
      dInt = 'On its own ground. Comfortable and self-directed rather than exceptional — it answers to itself, since it is its own dispositor.';
    } else if (isNode) {
      dInt = 'No exaltation, debilitation, Moolatrikona or co-ownership here, and no Shadbala/Uchcha bala is computed for the nodes — ' +
        'this rung yields nothing further; read it through rung 3 (dispositor) and rung 6 (co-tenants) instead.';
    } else if (uch !== null && uch < 15) {
      dInt = 'No dignity by sign — and the degree tells a story the Ownership column hides: it sits only ' +
        n1(degFromDeb) + '° from its exact debilitation point, the weakest kind of positional dignity. ' +
        'There is no home advantage here; steadiness has to be built rather than inherited.';
    } else if (uch !== null && uch > 45) {
      dInt = 'No dignity by sign, but by degree it is close to its exaltation point (' + n1(degFromEx) +
        '° away), so Uchcha bala is a healthy ' + n2(uch) + '. Quietly better placed than the table suggests.';
    } else {
      dInt = 'Neutral ground — no dignity to draw on and none lost. The tone of this rung is set entirely by the dispositor below.';
    }
    var dSimple;
    if (keys.indexOf('deb') >= 0 && neechaBhanga) dSimple = 'A weak spot, redeemed — Neecha Bhanga Yoga cancels the debility.';
    else if (keys.indexOf('deb') >= 0) dSimple = 'Its weakest spot.';
    else if (keys.indexOf('ex') >= 0) dSimple = 'A very strong spot.';
    else if (keys.indexOf('mt') >= 0) dSimple = 'A comfortable spot.';
    else if (keys.indexOf('lord') >= 0) dSimple = isNode ? 'Co-owns this ground.' : 'On home ground.';
    else if (isNode) dSimple = 'No rank of its own here.';
    else if (uch !== null && uch < 15) dSimple = 'A weak spot — it has to work harder.';
    else if (uch !== null && uch > 45) dSimple = 'Quietly well placed.';
    else dSimple = 'Neutral ground.';
    var dw = dignityWord(keys, uch, degFromDeb, degFromEx, isNode);
    add('2 · Dignity', dFact, dInt, dSimple,
      'The ' + tag(PLANET_KEYWORD[name], name) + ' sits at ' +
      (neechaBhanga ? tag('redeemed', 'Neecha Bhanga Yoga') : tag(dw.word, dw.src)) + '.');

    // ---- 3 · Dispositor ----
    var dp = result.planets[dispositor];
    var rel = (result.relationships[name] && result.relationships[name][dispositor]) || null;
    var dRes = sb && sb.results ? sb.results[dispositor] : null;
    var dispFact, dispInt;
    if (dispositor === name) {
      dispFact = 'Its own dispositor — ' + name + ' rules ' + p.sign;
      dispInt = 'There is no employer above it. Nothing filters or qualifies the placement, which makes the rungs below carry more weight than usual.';
    } else {
      dispFact = p.sign + '’s lord ' + dispositor + ' in ' + dp.sign + ', house ' + dp.house +
        (dRes ? ', ' + Math.round(dRes.percent) + '%' : '') +
        (rel ? '. ' + name + ' regards it as a panchadha ' + rel.panchadha : '');
      var strong = dRes && dRes.percent >= 100;
      var friendly = rel && (rel.panchadha === 'Best Friend' || rel.panchadha === 'Friend');
      var relClause = friendly
        ? 'The working relationship is ' + (rel.panchadha === 'Best Friend' ? 'the best available in the five-fold scheme' : 'friendly') + ', and it'
        : (rel && (rel.panchadha === 'Enemy' || rel.panchadha === 'Worst Enemy')
            ? 'The relationship is hostile (' + rel.panchadha + '), so support is grudging, and it'
            : 'It');
      dispInt = 'The employer. ' + dispositor + ' holds ' + name + '’s results, so its condition qualifies everything above. ' +
        relClause + ' ' +
        (!dRes ? 'sits in ' + dp.sign + ', house ' + dp.house + '; its strength is not measurable here.'
          : strong ? 'is above its own minimum, so the support is real.'
          : 'is below its own minimum, so the support is willing rather than powerful.') +
        (DUSTHANA.indexOf(dp.house) >= 0 ? ' Note it sits in a dusthana (house ' + dp.house + '), which drags on what it can pass along.' : '');
    }
    var dispSimple;
    if (dispositor === name) {
      dispSimple = 'It answers to nobody.';
    } else {
      var sStrong = dRes && dRes.percent >= 100;
      var sFriendly = rel && (rel.panchadha === 'Best Friend' || rel.panchadha === 'Friend');
      var sHostile = rel && (rel.panchadha === 'Enemy' || rel.panchadha === 'Worst Enemy');
      dispSimple = 'Its boss is ' +
        (sFriendly ? 'friendly, so it gets help.' : sHostile ? 'unfriendly, so help is grudging.' : 'neutral towards it.');
    }
    var dispIllus = dispositor === name
      ? 'The ' + tag(PLANET_KEYWORD[name], name) + ' answers to itself.'
      : 'The ' + tag(PLANET_KEYWORD[name], name) + ' gets ' +
        tag(rel ? (RELATION_KEYWORD[rel.panchadha] || 'plain') : 'plain', rel ? rel.panchadha : 'neutral') +
        ' from ' + tag(PLANET_KEYWORD[dispositor], dispositor) + '.';
    add('3 · Dispositor', dispFact, dispInt, dispSimple, dispIllus);

    // ---- 4 · House ----
    var cls = classesOf(p.house);
    var dig = res ? res.dig : null;
    var digHome = DIG_HOUSE[name];
    var hFact = 'House ' + p.house + ' — ' + HOUSE_TEXT[p.house] +
      (cls.length ? ' · ' + cls.join(', ') : '') +
      (dig === null ? '' : ' · Dig bala ' + n2(dig) + '/60');
    var hInt = 'The field, and nothing below may move it: results land in ' +
      HOUSE_TEXT[p.house].split(', ').slice(0, 3).join(', ') + '. ' +
      FUNC[name].charAt(0).toUpperCase() + FUNC[name].slice(1) +
      ', shaped by ' + p.sign + ', is spent here. ';
    if (cls.indexOf('kendra') >= 0) hInt += 'A kendra gives it a public, structural place in the life. ';
    if (cls.indexOf('trikona') >= 0) hInt += 'A trikona makes it fortunate ground. ';
    if (cls.indexOf('dusthana') >= 0) hInt += 'A dusthana costs it — the results arrive through friction, loss or effort. ';
    if (cls.indexOf('upachaya') >= 0) hInt += 'Being an upachaya, it improves with age rather than starting well. ';
    if (cls.indexOf('maraka sthana') >= 0) hInt += 'It is also a maraka sthana, though the maraka is properly its lord, not the occupant. ';
    if (dig !== null && digHome) {
      hInt += (p.house === digHome
        ? 'This is exactly where ' + name + ' collects its directional strength, and the Dig bala of ' + n2(dig) + ' shows it.'
        : name + '’s directional home is ' + DIG_NAME[digHome] + ' house, so it gathers only ' + n2(dig) +
          ' of 60 here — ' + (dig < 20 ? 'angular or not, it is directionally out of place.' : 'moderately placed by direction.'));
    }
    var hSimple = HOUSE_LANDS[p.house].replace(/\.$/,
      cls.indexOf('dusthana') >= 0 ? ', the hard way.'
      : cls.indexOf('trikona') >= 0 ? ', on lucky ground.'
      : cls.indexOf('kendra') >= 0 ? ', a pillar of the life.'
      : '.');
    var hcw = classWord(cls);
    add('4 · House', hFact, hInt, hSimple,
      'This goes into ' + tag(HOUSE_KEYWORD[p.house], ord(p.house) + ' house') +
      (hcw ? ', ' + tag(hcw.word, hcw.src) : '') + '.');

    // ---- 5 · Lordship (+ emergent exchange) ----
    // H.housesOwnedBy is co-lord-aware (SIGN_COLORDS), so Rahu/Ketu now
    // genuinely own 2 houses each (Aquarius+Virgo / Scorpio+Pisces) and take
    // the same "owns N signs" branch below as any classical planet — the
    // "owns nothing, acts through an agent" branch is kept as a defensive
    // fallback (every planet now owns at least one sign) rather than removed.
    var owned = H.housesOwnedBy(name, ascSign);
    var lFact, lInt;
    if (!owned.length) {
      var agents = [dispositor];
      H.PLANET_ORDER.forEach(function (q) {
        if (q !== name && !NODES[q] && result.planets[q].signIndex === p.signIndex) agents.push(q);
      });
      lFact = 'Owns no sign (Parashari). Acts through ' + list(agents);
      lInt = 'The nodes own nothing, so this rung is borrowed: ' + name + ' delivers the affairs of whatever ' +
        list(agents.map(function (a) {
          var o = H.housesOwnedBy(a, ascSign).map(function (x) { return ord(x.house); });
          return a + (o.length ? ' (lord of the ' + list(o) + ')' : '');
        })) + ' rules, filtered through its own placement in house ' + p.house + '.';
    } else {
      lFact = 'Owns ' + list(owned.map(function (o) { return o.sign + ' = the ' + ord(o.house); }));
      var ownedHouses = owned.map(function (o) { return o.house; });
      lInt = 'Lordship extends the field. As ' + list(owned.map(function (o) { return 'the ' + ord(o.house) + ' lord'; })) +
        ' placed in the ' + ord(p.house) + ', it carries ' +
        list(owned.map(function (o) { return HOUSE_TEXT[o.house].split(', ').slice(0, 2).join(', '); })) +
        ' into ' + HOUSE_TEXT[p.house].split(', ').slice(0, 2).join(', ') + '. ';
      var kt = ownedHouses.some(function (h) { return KENDRA.indexOf(h) >= 0; }) && TRIKONA.indexOf(p.house) >= 0 ||
               ownedHouses.some(function (h) { return TRIKONA.indexOf(h) >= 0; }) && KENDRA.indexOf(p.house) >= 0;
      if (kt) lInt += 'A kendra–trikona association, which classical texts read as auspicious for the houses involved. ';
      var DHANA = [2, 5, 9, 11];
      var isDhana = DHANA.indexOf(p.house) >= 0 && ownedHouses.some(function (h) { return DHANA.indexOf(h) >= 0; });
      if (isDhana) {
        lInt += 'Both the house it rules and the house it sits in are wealth-giving (2, 5, 9, 11), which is the classical shape of a Dhana yoga. ';
      }
      if (ownedHouses.some(function (h) { return DUSTHANA.indexOf(h) >= 0; })) {
        lInt += 'It also rules a dusthana, so some of what it carries is debt, illness or upheaval rather than gain. ';
      }
      lInt += 'This is a far more specific statement than "' + name + ' in the ' + ord(p.house) + '".';
      var lYogas = [];
      if (kt) lYogas.push('Raja Yoga shape — kendra/trikona lord');
      if (isDhana) lYogas.push('Dhana Yoga shape — wealth houses linked');
      if (lYogas.length) lFact += '. ' + list(lYogas);
    }

    // mutual exchange (parivartana) — invisible at rung 3 or rung 5 alone
    var exchange = null;
    if (!isNode && dispositor !== name && !NODES[dispositor]) {
      var dispSign = result.planets[dispositor].signIndex;
      if (E.SIGN_LORDS[dispSign] === name) {
        var hA = ((p.signIndex - ascSign + 12) % 12) + 1;
        var hB = ((dispSign - ascSign + 12) % 12) + 1;
        exchange = { other: dispositor, hA: hA, hB: hB, cls: parivartanaClass(hA, hB) };
      }
    }
    var lSimple;
    if (!owned.length) {
      lSimple = 'It owns nothing, so it borrows from its neighbours.';
    } else {
      var elsewhere = owned.filter(function (o) { return o.house !== p.house; });
      var ownsThisOne = owned.length !== elsewhere.length;
      lSimple = (ownsThisOne ? 'It sits in a house it owns, so it works on it directly.' : '') +
        (elsewhere.length
          ? (ownsThisOne ? ' It also carries ' : 'This carries ') +
            list(elsewhere.map(function (o) { return SHORT_NOUN[o.house]; })) +
            ' into ' + SHORT_NOUN[p.house] + '.'
          : '');
    }
    var lIllus = owned.length
      ? 'It carries ' + list(owned.map(function (o) { return tag(HOUSE_KEYWORD[o.house], 'owns the ' + ord(o.house)); })) +
        ' into ' + tag(HOUSE_KEYWORD[p.house], 'sits in the ' + ord(p.house)) + '.'
      : 'The ' + tag(PLANET_KEYWORD[name], name) + ' runs ' + tag('borrowed', 'owns nothing') + '.';
    add('5 · Lordship', lFact, lInt, lSimple, lIllus);
    if (exchange) {
      add('5b · Emergent',
        dispositor + ' (' + ord(exchange.hA) + ' lord) sits in ' + name + '’s sign, while ' + name +
        ' (' + ord(exchange.hB) + ' lord) sits in ' + dispositor + '’s — a mutual exchange. ' +
        exchange.cls + ' Yoga (parivartana)',
        'A parivartana between the ' + ord(exchange.hA) + ' and ' + ord(exchange.hB) +
        ' lords — ' + exchange.cls + ' yoga in Phaladeepika’s classification' +
        (exchange.cls === 'Maha' ? ', the auspicious class' : exchange.cls === 'Dainya' ? ', the difficult class, since a dusthana is involved' : ', the mixed class') +
        '. The two houses now behave as one system. This is the point of the method: the yoga is invisible at rung 3 alone and at rung 5 alone, and exists only when both are held together.',
        cap(SHORT_NOUN[exchange.hA]) + ' and ' + SHORT_NOUN[exchange.hB] + ' now work as one — ' +
        (exchange.cls === 'Maha' ? 'a good sign.' : exchange.cls === 'Dainya' ? 'a difficult one.' : 'a mixed one.'),
        tag(HOUSE_KEYWORD[exchange.hA], ord(exchange.hA) + ' house') + ' and ' +
        tag(HOUSE_KEYWORD[exchange.hB], ord(exchange.hB) + ' house') + ' become one — ' +
        tag(exchange.cls === 'Maha' ? 'good' : exchange.cls === 'Dainya' ? 'hard' : 'mixed', exchange.cls + ' yoga') + '.');
    }

    // ---- 6 · Co-tenants ----
    var mates = H.PLANET_ORDER.filter(function (q) {
      return q !== name && result.planets[q].signIndex === p.signIndex;
    });
    var cFact, cInt;
    if (!mates.length) {
      cFact = 'None — alone in ' + p.sign;
      cInt = 'Nothing dilutes or redirects the reading above. Worth one line only: the placement stays unmixed.';
    } else {
      cFact = list(mates.map(function (q) {
        var m = result.planets[q];
        var flags = [];
        if (m.retrograde && !NODES[q]) flags.push('retrograde');
        if (m.navamsaSignIndex === m.signIndex) flags.push('vargottama');
        var mres = sb && sb.results ? sb.results[q] : null;
        if (mres) flags.push(Math.round(mres.percent) + '%');
        return q + ' ' + m.degreeFormatted + (flags.length ? ' (' + flags.join(', ') + ')' : '') +
          ' — ' + n1(arc(p.longitude, m.longitude)) + '° away';
      }));
      var bits = [];
      mates.forEach(function (q) {
        var r1 = result.relationships[name] && result.relationships[name][q];
        var r2 = result.relationships[q] && result.relationships[q][name];
        var s = q + ' is a natural ' + (isBenefic(q) ? 'benefic' : 'malefic') + ', so it ' +
          (isBenefic(q) ? 'lifts' : 'weighs on') + ' the tone. ';
        if (r1 && r2) {
          s += name + '→' + q + ' reads ' + r1.panchadha + ', ' + q + '→' + name + ' reads ' + r2.panchadha +
            (r1.panchadha !== r2.panchadha ? ' — the asymmetry is real: one gives more than it gets. ' : '. ');
        }
        if (q === dispositor) s += 'It is also the dispositor, so rung 3 and this rung are the same planet — count it once. ';
        bits.push(s);
      });
      if ((name === 'Moon' && mates.indexOf('Jupiter') >= 0) || (name === 'Jupiter' && mates.indexOf('Moon') >= 0)) {
        bits.push('Jupiter conjunct the Moon puts Jupiter in a kendra from the Moon — **Gajakesari yoga**: counsel, reputation and benevolence attached to the mind.');
      }
      bits.push('One caution on the numbers: co-tenants share a sign, which is the 1st from each other, and tatkalika maitri scores the 1st as an enemy — always. The temporary term therefore carries no information here, and the live signal is the natural relation plus benefic/malefic nature.');
      cInt = bits.join(' ').replace(/\s+/g, ' ');
      if ((name === 'Moon' && mates.indexOf('Jupiter') >= 0) || (name === 'Jupiter' && mates.indexOf('Moon') >= 0)) {
        cFact += '. Gaja Kesari Yoga (Moon–Jupiter conjunction)';
      }
    }
    var cSimple;
    if (!mates.length) {
      cSimple = 'Nothing else is mixed in.';
    } else {
      var goodMates = mates.filter(isBenefic), hardMates = mates.filter(function (q) { return !isBenefic(q); });
      if ((name === 'Moon' && mates.indexOf('Jupiter') >= 0) || (name === 'Jupiter' && mates.indexOf('Moon') >= 0)) {
        cSimple = 'The Moon and Jupiter together — good name and good advice.';
      } else {
        cSimple = goodMates.length && hardMates.length
          ? 'Helpful and hard planets both sit with it.'
          : goodMates.length ? 'A helpful planet sits with it.' : 'A hard planet sits with it.';
      }
    }
    var cIllus;
    if (!mates.length) {
      cIllus = 'The ' + tag(PLANET_KEYWORD[name], name) + ' stands ' + tag('alone', 'no co-tenants') + '.';
    } else if ((name === 'Moon' && mates.indexOf('Jupiter') >= 0) || (name === 'Jupiter' && mates.indexOf('Moon') >= 0)) {
      cIllus = 'The ' + tag(PLANET_KEYWORD[name], name) + ' gains ' + tag('good name', 'Gajakesari') + '.';
    } else {
      var cTone = goodMates.length && hardMates.length ? 'mixed' : goodMates.length ? 'help' : 'strain';
      cIllus = 'The ' + tag(PLANET_KEYWORD[name], name) + ' shares its sign with ' + tag(cTone, list(mates)) + '.';
    }
    add('6 · Co-tenants', cFact, cInt, cSimple, cIllus);

    // ---- 7 · Aspects ----
    var onto = H.aspectsOntoSign(p.signIndex, result).filter(function (a) {
      return a.planet !== name && !H.isNodePair(name, a.planet);
    });
    var cast = H.aspectsCastBy(name, result);
    var castSigns = (H.ASPECT_HOUSES[name] || [7]).map(function (n) {
      return E.SIGNS[(p.signIndex + n - 1) % 12] + ' (' + ord(n) + ', house ' + (((p.house - 1 + n - 1) % 12) + 1) + ')';
    });
    var drik = res ? res.drikDetail : null;
    var aFact = (onto.length
        ? 'Receives ' + list(onto.map(function (a) { return a.planet + ' (' + ord(a.aspect) + ')'; }))
        : 'Receives no whole-sign aspect') +
      '. Casts on ' + list(castSigns) +
      (drik ? '. Sphuta drishti: ' + drik.map(function (d) {
        return d.from + ' ' + (d.value >= 0 ? '+' : '') + n2(d.value);
      }).join(', ') + ' → net ' + (res.drik >= 0 ? '+' : '') + n2(res.drik) : '');
    var aInt = '';
    if (onto.length) {
      var mal = onto.filter(function (a) { return !isBenefic(a.planet); }).map(function (a) { return a.planet; });
      var ben = onto.filter(function (a) { return isBenefic(a.planet); }).map(function (a) { return a.planet; });
      if (mal.length && !ben.length) aInt += 'Every whole-sign aspect it receives is malefic (' + list(mal) + ') — constraint, delay or hunger falls on this placement with nothing benefic to soften it. ';
      else if (ben.length && !mal.length) aInt += 'Every whole-sign aspect it receives is benefic (' + list(ben) + ') — protection and relief. ';
      else aInt += 'Mixed contact: ' + list(ben) + ' benefic against ' + list(mal) + ' malefic. ';
    } else {
      aInt += 'No whole-sign aspect at all — by that model it stands unmodified. ';
    }
    aInt += 'Bounded, though: contact adjusts tone, it cannot cancel a dignity. ';
    if (drik && drik.length) {
      var heaviest = drik.slice().sort(function (a, b) { return Math.abs(b.value) - Math.abs(a.value); })[0];
      var wsNames = onto.map(function (a) { return a.planet; }).sort().join(', ');
      var sdNames = drik.map(function (d) { return d.from; }).sort().join(', ');
      aInt += 'By graded (sphuta) drishti the heaviest single influence is ' + heaviest.from + ' at ' +
        (heaviest.value >= 0 ? '+' : '') + n2(heaviest.value) + ', and the net is ' +
        (res.drik >= 0 ? 'positive' : 'negative') + ' at ' + n2(res.drik) + '. ';
      if (wsNames !== sdNames) {
        aInt += 'Note the two models name different planets — whole-sign is binary and by sign, sphuta drishti is graded and by degree, and it excludes the nodes. Pick one before trusting this rung.';
        T.aspectModel = 'Whole-sign aspects (' + (wsNames || 'none') + ') and graded sphuta drishti (' + sdNames + ') name different planets. The app runs both — pick one before trusting rung 7.';
      }
    }
    var aSimple;
    if (!onto.length) {
      aSimple = 'Nothing is looking at it.';
    } else {
      var goodEyes = onto.filter(function (a) { return isBenefic(a.planet); }).map(function (a) { return a.planet; });
      var hardEyes = onto.filter(function (a) { return !isBenefic(a.planet); }).map(function (a) { return a.planet; });
      aSimple = hardEyes.length && !goodEyes.length
          ? 'Only hard planets look at it — ' + (HARD_EFFECT[hardEyes[0]] || hardEyes[0] + ' presses on it') + '.'
        : goodEyes.length && !hardEyes.length
          ? 'Only helpful planets look at it.'
          : 'Mixed — ' + list(goodEyes) + ' help, ' + list(hardEyes) + ' press.';
    }
    var aIllus;
    if (!onto.length) {
      aIllus = 'The ' + tag(PLANET_KEYWORD[name], name) + ' draws ' + tag('no eyes', 'no aspects') + '.';
    } else {
      var aTone = hardEyes.length && !goodEyes.length ? 'pressure'
        : goodEyes.length && !hardEyes.length ? 'protection' : 'mixed';
      aIllus = 'The ' + tag(PLANET_KEYWORD[name], name) + ' draws ' +
        tag(aTone, list(onto.map(function (a) { return a.planet + ' ' + ord(a.aspect); }))) + '.';
    }
    add('7 · Aspects', aFact, aInt, aSimple, aIllus);

    // ---- 8 · Nakshatra ----
    var vargottama = p.navamsaSignIndex === p.signIndex;
    var navLord = E.SIGN_LORDS[p.navamsaSignIndex];
    var nFact = p.nakshatra + ' pada ' + p.pada + ', lord ' + p.nakshatraLord +
      '; navamsa ' + p.navamsaSign + (vargottama ? ' (vargottama)' : '') +
      (p.retrograde && !NODES[name] ? '; retrograde' : '');
    var nInt = 'Texture, not direction — this rung flavours the reading, it never reverses it. ' +
      p.nakshatra + ' is ' + (NAK_TEXT[p.nakshatra] || 'its own register') + '. ' +
      'In navamsa it falls in ' + p.navamsaSign + ', ruled by ' + navLord + ', ' +
      (vargottama ? 'the same sign as in D1 — vargottama, so the D1 reading is confirmed rather than qualified, and it holds unusually steady. '
                  : 'which shifts the register from ' + p.sign + ' and is worth reading as a second opinion. ');
    var nlPlanet = result.planets[p.nakshatraLord];
    if (nlPlanet) {
      var nlAspects = onto.some(function (a) { return a.planet === p.nakshatraLord; });
      var nlConj = mates.indexOf(p.nakshatraLord) >= 0;
      if (nlAspects || nlConj) {
        nInt += 'Note the doubling: ' + p.nakshatraLord + ' rules this nakshatra **and** ' +
          (nlConj ? 'sits with it' : 'aspects it') + ', so its signature is native here, not merely imposed. ';
      }
    }
    if (p.retrograde && !NODES[name]) {
      nInt += 'Retrograde: it works inward, revisits, and externalises late.';
    }
    if (noDeg) {
      add('8 · Nakshatra',
        'Not available — needs the exact degree',
        'A nakshatra is a 13°20′ slice of a sign, so it can only be known from a planet’s degree. A placement fixes the sign but not the point inside it, and the same is true of the navamsa. This rung stays empty until a birth time supplies degrees.',
        'Needs the exact degree, which a placed chart does not have.');
    } else {
    var nSimple = (NAK_SIMPLE[p.nakshatra] || 'It carries its own flavour.') +
      (p.retrograde && !NODES[name] ? ' Going backwards, so it shows late.' : '');
    add('8 · Nakshatra', nFact, nInt, nSimple,
      'The ' + tag(PLANET_KEYWORD[name], name) + ' carries ' + tag(NAK_KEYWORD[p.nakshatra] || 'its own flavour', p.nakshatra) + '.' +
      (p.retrograde && !NODES[name] ? ' ' + tag('late', 'retrograde') + '.' : ''));
    }

    // ---- 9 · Shadbala ----
    var sFact, sInt;
    if (!res && noDeg) {
      sFact = 'Not available — needs exact degrees and the birth moment';
      sInt = 'Shadbala draws on exact degrees, sunrise, weekday, lunar phase and real planetary motion. A placed chart supplies none of those, so there is no capacity figure to scale the rungs above. Read them as promise without magnitude.';
    } else if (!res) {
      sFact = 'Not computed — Shadbala covers the seven planets only';
      sInt = 'The nodes have no Shadbala in the classical scheme, so there is no capacity figure. Judge magnitude from the dispositor and co-tenants instead.';
    } else {
      var kd = res.kalaDetail;
      sFact = n2(res.rupa) + ' rūpa vs ' + res.required + ' required = ' + Math.round(res.percent) +
        '%, rank ' + res.rank + ' of 7. Sthana ' + n2(res.sthana) + ' · Dig ' + n2(res.dig) +
        ' · Kala ' + n2(res.kala) + ' · Chesta ' + n2(res.chesta) + ' · Naisargika ' + n2(res.naisargika) +
        ' · Drik ' + n2(res.drik);
      // which component is doing work that has NOT already been narrated
      var fresh = [];
      Object.keys(kd).forEach(function (k) {
        if (k !== 'total' && kd[k] > 0) fresh.push({ k: KALA_NAME[k] || k, v: kd[k] });
      });
      if (res.chesta > 0) fresh.push({ k: 'its apparent motion (chesta bala)', v: res.chesta });
      fresh.sort(function (a, b) { return b.v - a.v; });
      sInt = 'Capacity only — this rung scales what is already assembled, it cannot make a difficult placement pleasant. ' +
        'And do not re-count: Sthana already contains the dignity term (Uchcha) from rung 2 and the angularity from rung 4, while Drik already contains the aspects from rung 7. ' +
        (fresh.length
          ? 'The genuinely new information is ' + fresh[0].k + ' at ' + n2(fresh[0].v) +
            (fresh[1] ? ', then ' + fresh[1].k + ' at ' + n2(fresh[1].v) : '') + '. '
          : '') +
        (res.percent >= 100
          ? 'At ' + Math.round(res.percent) + '% it clears its minimum, so everything above lands reliably — including whatever the aspect rung put there.'
          : 'At ' + Math.round(res.percent) + '% it falls short of its classical minimum, so the promises above are made but not fully delivered.');
      if (uch !== null && uch < 15 && res.percent >= 100) {
        sInt += ' Worth naming: with Uchcha bala at only ' + n2(uch) + ', this strength is borrowed from timing and division, not from position.';
        T.borrowed = 'Shadbala clears the minimum (' + Math.round(res.percent) + '%) while Uchcha bala is only ' + n2(uch) + '/60 — strength borrowed from timing and division, not from where it sits.';
      }
      if (res.yuddha) {
        sFact += '. Graha Yuddha: within ' + res.yuddha.orb.toFixed(2) + '° of ' + res.yuddha.opponent +
          ' — ' + (res.yuddha.role === 'winner' ? 'wins' : 'loses') + ' the war';
        sInt += ' ' + (res.yuddha.role === 'winner'
          ? 'It is also in planetary war (Graha Yuddha) with ' + res.yuddha.opponent + ', within ' + res.yuddha.orb.toFixed(2) +
            '° — and, by ecliptic latitude, comes out ahead of it. A caveat layered on top of the Shadbala score above, not folded into it.'
          : 'It is also in planetary war (Graha Yuddha) with ' + res.yuddha.opponent + ', within ' + res.yuddha.orb.toFixed(2) +
            '° — and, by ecliptic latitude, is the one defeated. This does not change the Shadbala score above, but classically dampens this placement’s results, especially during its own dasha.');
        if (res.yuddha.role === 'loser') {
          T.yuddha = name + ' is defeated in Graha Yuddha (planetary war) by ' + res.yuddha.opponent +
            ' — within ' + res.yuddha.orb.toFixed(2) + '° of it, and behind it by the ecliptic-latitude rule used here. ' +
            'A classical caveat on this placement’s results that Shadbala’s own total does not capture.';
        }
      }
    }
    var sSimple;
    if (!res && noDeg) {
      sSimple = 'Strength cannot be measured without a birth time.';
    } else if (!res) {
      sSimple = 'No strength score exists for the nodes.';
    } else {
      var freshList = [];
      Object.keys(res.kalaDetail).forEach(function (k) {
        if (k !== 'total' && res.kalaDetail[k] > 0 && BALA_SOURCE[k]) freshList.push({ k: k, v: res.kalaDetail[k] });
      });
      if (res.chesta > 0) freshList.push({ k: 'chesta', v: res.chesta });
      freshList.sort(function (a, b) { return b.v - a.v; });
      var src = freshList.length ? BALA_SOURCE[freshList[0].k] : null;
      sSimple = (res.percent >= 100 ? 'Strong enough to work' : 'Short of the strength it needs') +
        (src ? ', and it comes from ' + src + '.' : '.') +
        (res.yuddha ? (res.yuddha.role === 'winner'
          ? ' Also winning a close planetary war with ' + res.yuddha.opponent + '.'
          : ' Also losing a close planetary war to ' + res.yuddha.opponent + '.') : '');
    }
    var sIllus = !res
      ? 'The ' + tag(PLANET_KEYWORD[name], name) + ' has ' + tag('no score', 'no Shadbala') + '.'
      : 'The ' + tag(PLANET_KEYWORD[name], name) + ' runs ' +
        tag(res.percent >= 100 ? 'strong' : 'short', Math.round(res.percent) + '%') +
        (res.yuddha ? ', ' + tag(res.yuddha.role === 'winner' ? 'winning' : 'losing', 'Graha Yuddha') + ' with ' + res.yuddha.opponent : '') + '.';
    add('9 · Shadbala', sFact, sInt, sSimple, sIllus);

    // ---- 10 · Timing ----
    var today = new Date();
    var md = null;
    result.dasha.forEach(function (d) { if (d.lord === name && !md) md = d; });
    var ads = (result.antardashas || []).filter(function (a) { return a.antar === name; });
    var pastAd = null, nextAd = null;
    ads.forEach(function (a) {
      if (a.end < today) pastAd = a;
      else if (!nextAd) nextAd = a;
    });
    var running = null;
    result.antardashas.forEach(function (a) { if (a.start <= today && a.end >= today) running = a; });
    if (noDeg) {
      md = null; nextAd = null;
      add('10 · Timing',
        'Not available — needs the Moon’s degree and a birth date',
        'Vimshottari is measured from the exact point the Moon occupies inside its nakshatra, and then counted forward from a date. A placed chart has neither, so nothing above can be given a when.',
        'Needs the Moon’s degree and a birth date.');
    } else {
    var tFact = (md ? name + ' Mahadasha ' + H.fmtDate(md.start) + ' → ' + H.fmtDate(md.end) : 'No ' + name + ' Mahadasha in the computed span') +
      (pastAd ? '. Last ' + name + ' antardasha: ' + pastAd.maha + '–' + name + ' ' + H.fmtDate(pastAd.start) + ' → ' + H.fmtDate(pastAd.end) : '') +
      (nextAd ? '. Next: ' + nextAd.maha + '–' + name + ' ' + H.fmtDate(nextAd.start) + ' → ' + H.fmtDate(nextAd.end) : '') +
      (running ? '. Currently running ' + running.maha + '–' + running.antar : '');
    var tInt = 'A gate, not a modifier — this rung changes when, never what. ';
    if (md) {
      var age = (md.start - result.dasha[0].start) / (365.25 * 86400000);
      if (md.end < today) tInt += 'Its own Mahadasha is already past, so everything above now delivers through sub-periods rather than a headline one. ';
      else if (md.start <= today) tInt += 'Its own Mahadasha is running now — this is the chapter in which the whole chain above is the main story. ';
      else if (age > 75) tInt += 'Its Mahadasha does not arrive until roughly age ' + Math.round(age) + ', so for practical purposes it never gets a headline period and works only through sub-periods. ';
      else tInt += 'Its Mahadasha is still ahead, beginning around age ' + Math.round(age) + '. ';
      if (md.end < today || md.start > today) {
        if (md.end < today && !nextAd) tInt += 'No further ' + name + ' antardasha falls in the computed span.';
        else if (nextAd) tInt += 'The window to mark is ' + nextAd.maha + '–' + name + ', from ' + H.fmtDate(nextAd.start) +
          (nextAd.maha === dispositor ? ' — and its Mahadasha lord is this planet’s own dispositor, so rung 3 lights up at the same time.' : '.');
      }
    }
    var tSimple;
    if (!md) {
      tSimple = 'No big period of its own falls in the years covered here.';
    } else {
      var ageAt = (md.start - result.dasha[0].start) / (365.25 * 86400000);
      tSimple = md.end < today ? 'Its big period is over; it works through short ones now.'
        : md.start <= today ? 'Its big period is running now.'
        : ageAt > 75 ? 'Its big period comes too late in life to count.'
        : 'Its big period starts around age ' + Math.round(ageAt) + '.';
      if (nextAd) tSimple += ' Next window: ' + H.fmtDate(nextAd.start) + '.';
    }
    var tTone = !md ? 'quiet'
      : md.end < today ? 'past'
      : md.start <= today ? 'now'
      : ((md.start - result.dasha[0].start) / (365.25 * 86400000) > 75 ? 'late' : 'ahead');
    var tIllus = 'Its big period runs ' + tag(tTone, md ? name + ' Mahadasha' : 'no period') + '.' +
      (nextAd ? ' Next window: ' + tag(H.fmtDate(nextAd.start), nextAd.maha + '–' + name) + '.' : '');
    add('10 · Timing', tFact, tInt, tSimple, tIllus);
    }

    // ---- tensions ------------------------------------------------------
    if (!dg.length && uch !== null && uch < 15) {
      T.hiddenDeb = 'The Ownership column reads “—” while Uchcha bala reads ' + n2(uch) + '/60 — the table gives no hint that this planet sits ' + n1(degFromDeb) + '° from its floor.';
    }
    if (res && res.percent >= 100 && res.drik < 0) {
      T.drik = 'Above its strength minimum, yet net aspectual Drik bala is negative (' + n2(res.drik) + ') — strong is not the same as comfortable.';
    }
    if (res && dig !== null && dig < 20 && res.percent >= 100) {
      T.dig = 'Clears its Shadbala minimum with Dig bala at only ' + n2(dig) + '/60 — capable, but directionally out of place.';
    }
    if (mates.length) {
      var artefact = mates.filter(function (q) {
        var r1 = result.relationships[name] && result.relationships[name][q];
        return r1 && (r1.panchadha === 'Enemy' || r1.panchadha === 'Worst Enemy') && r1.natural !== 'Enemy';
      });
      if (artefact.length) T.artefact = ('Panchadha reads hostile toward ' + list(artefact) + ', but only because same-sign is always a tatkalika enemy. The natural relation is not hostile — read this as an artefact, not a conflict.');
    }
    if (MARAKA.indexOf(p.house) >= 0 && (KENDRA.indexOf(p.house) >= 0 || p.house === 2)) {
      T.maraka = ('House ' + p.house + ' is both ' + (p.house === 2 ? 'the wealth house' : 'a kendra') + ' and a maraka sthana — the same field carries the benefit and the caution.');
    }
    if (md && md.end < today && !nextAd) {
      T.noWindow = 'Its Mahadasha is past and no further antardasha falls in the computed span — the chain above has no remaining window of its own.';
    }

    var tensions = ['hiddenDeb', 'borrowed', 'yuddha', 'drik', 'dig', 'aspectModel', 'artefact', 'maraka', 'noWindow']
      .map(function (k) { return T[k]; }).filter(Boolean);

    // ---- compounded: one narrative paragraph, used in every mode -------
    // Ascendant → lordship & placement → sign → nakshatra → the single most
    // defining outside influence → the dispositor's own placement (folding in
    // any exchange). Every clause traces back to a rung above; nothing here
    // is invented.
    var ascSignName = E.SIGNS[ascSign];
    var placeHouseWords = HOUSE_TEXT[p.house].split(', ').slice(0, 3);
    var narr = [];

    var lordClause;
    if (dispositor === name) {
      lordClause = name + ' rules the very sign it occupies here';
    } else if (owned.length) {
      lordClause = name + ' acts as ' + list(owned.map(function (o) {
        return 'the ruler of your ' + ord(o.house) + ' house of ' + HOUSE_TEXT[o.house].split(', ')[0];
      }));
    } else {
      // Unreachable in practice now — owned.length is never 0 for any of the
      // nine grahas since Rahu/Ketu co-own real houses too (SIGN_COLORDS) —
      // kept as a defensive fallback rather than removed.
      lordClause = name + ' owns no house of its own here' + (isNode ? ', and expresses through ' + dispositor : '');
    }
    narr.push('For your ' + ascSignName + ' Ascendant, ' + lordClause +
      ' and is placed in your ' + ord(p.house) + ' house of ' + list(placeHouseWords) +
      ' in the ' + (SIGN_ADJ[p.sign] || 'distinctive') + ' sign of ' + p.sign + '.');

    if (!noDeg) {
      narr.push('Situated in the ' + (NAK_ADJ[p.nakshatra] || 'distinctive') + ' ' + p.nakshatra +
        ' Nakshatra (ruled by ' + p.nakshatraLord + '), your ' + (PLANET_DOMAIN[name] || name) +
        ' is naturally wired for ' + (HOUSE_APTITUDE[p.house] || 'the matters of this house') + '.');
    }

    if (neechaBhanga) {
      narr.push('The most defining feature of this placement is a Neecha Bhanga Yoga: although ' + name +
        ' is debilitated in ' + p.sign + ', ' + list(neechaBhanga.reasons) +
        ', which classically cancels the debility — read this as quiet, self-made strength rather than weakness.');
    } else if (mates.length) {
      var mateDescs = mates.map(function (q) {
        var m = result.planets[q];
        return (m.retrograde && !NODES[q] ? 'retrograde ' : '') + q;
      });
      var isGajakesari = (name === 'Moon' && mates.indexOf('Jupiter') >= 0) || (name === 'Jupiter' && mates.indexOf('Moon') >= 0);
      var goodMates2 = mates.filter(isBenefic), hardMates2 = mates.filter(function (q) { return !isBenefic(q); });
      var yogaPhrase = isGajakesari
        ? 'which forms a powerful Gaja Kesari Yoga — a highly protective combination that grants persuasive communication, sound judgement and lasting resilience'
        : goodMates2.length && !hardMates2.length
          ? 'which lends a steady, supportive undertone to everything else in this reading'
          : hardMates2.length && !goodMates2.length
            ? 'which adds real friction — this placement has to work harder for what it wants'
            : 'which mixes support and friction in equal measure';
      narr.push('The most defining feature of this placement is its conjunction with ' + list(mateDescs) + ', ' + yogaPhrase + '.');
    } else if (keys.indexOf('ex') >= 0 || keys.indexOf('deb') >= 0) {
      narr.push('The most defining feature of this placement is its dignity: ' + name +
        (keys.indexOf('ex') >= 0 ? ' is exalted here, at its classical peak of strength' : ' is debilitated here, working from its weakest classical footing') + '.');
    } else if (onto.length) {
      var hardEyes3 = onto.filter(function (a) { return !isBenefic(a.planet); }).map(function (a) { return a.planet; });
      var goodEyes3 = onto.filter(function (a) { return isBenefic(a.planet); }).map(function (a) { return a.planet; });
      narr.push('The most defining outside influence on this placement is the aspect it receives from ' +
        list(onto.map(function (a) { return a.planet; })) +
        (hardEyes3.length && !goodEyes3.length ? ', which presses on it rather than helping'
          : goodEyes3.length && !hardEyes3.length ? ', which offers steady support'
          : ', a mix of help and pressure') + '.');
    } else {
      narr.push(name + ' sits here unaccompanied and unaspected, so this placement reads on its own terms rather than through outside influence.');
    }

    if (dispositor === name) {
      narr.push(name + ' answers to nobody here — its results are self-directed rather than borrowed from another planet’s condition.');
    } else {
      var dispHouseWords = list(HOUSE_TEXT[dp.house].split(', ').slice(0, 2));
      if (exchange) {
        narr.push('Because ' + name + '’s dispositor, ' + dispositor + ', is sitting in your ' + ord(dp.house) +
          ' house of ' + dispHouseWords + ', it creates a ' + exchange.cls + ' Yoga — a parivartana, a mutual exchange — ' +
          'a continuous, mutually supportive loop where ' +
          HOUSE_TEXT[dp.house].split(', ')[0] + ' and ' + HOUSE_TEXT[p.house].split(', ')[0] + ' flow directly into one another.');
      } else {
        narr.push('Because ' + name + '’s dispositor, ' + dispositor + ', is sitting in your ' + ord(dp.house) +
          ' house of ' + dispHouseWords + ', some of what this placement promises depends on how well that house is doing in your life.');
      }
    }

    var narrative = narr.join(' ');

    return {
      rungs: rungs,
      summary: narrative,
      summarySimple: narrative,
      summaryOne: narrative,
      tensions: tensions
    };
  }

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // ---- the chain, house spine --------------------------------------------
  //
  // A house has no dignity or nakshatra of its own, so it is read through its
  // lord, its karaka, and whatever aspects it. Under whole-sign houses only the
  // lagna carries a degree, so rung 9 falls back to the lord's nakshatra.

  var KARAKA_OF_HOUSE = {
    1: ['Sun'], 2: ['Jupiter'], 3: ['Mars'], 4: ['Moon'], 5: ['Jupiter'],
    6: ['Mars', 'Saturn'], 7: ['Venus'], 8: ['Saturn'], 9: ['Jupiter', 'Sun'],
    10: ['Sun', 'Mercury', 'Jupiter', 'Saturn'], 11: ['Jupiter'], 12: ['Saturn']
  };

  function bhavaChain(house, result, sb, H) {
    var E = H.engine;
    var ascSign = result.ascendant.signIndex;
    var signIdx = (ascSign + house - 1) % 12;
    var sign = E.SIGNS[signIdx];
    var lord = E.SIGN_LORDS[signIdx];
    var lp = result.planets[lord];
    var lres = sb && sb.results ? sb.results[lord] : null;
    var benefic = sb && sb.context && sb.context.beneficMap ? sb.context.beneficMap : DEFAULT_BENEFIC;
    function isBenefic(g) { return NODES[g] ? false : !!benefic[g]; }
    var noDeg = !!result.simulated;

    // ---- Bhava Bala, computed here (not read from a cached table) so the
    // hover narrative and the House Interpretation tab always match the
    // Strength tab's own figures. Needs the same inputs as renderBhavaBala()
    // in app.js: per-planet Shadbala results (Bhavadhipati) and longitudes
    // (Bhava Drishti) — both already on hand as sb/result. Ranked against the
    // other eleven houses so rung 10 and the summary can say *how* strong,
    // not just a raw Virupa figure.
    var myBala = null, myBalaRank = null;
    if (!noDeg && sb && sb.results && H.Shadbala && typeof H.Shadbala.bhavaBala === 'function') {
      try {
        var balaLongitudes = {};
        (sb.grahas || []).forEach(function (g) {
          if (result.planets[g]) balaLongitudes[g] = result.planets[g].longitude;
        });
        var balaAll = H.Shadbala.bhavaBala({
          ascSign: ascSign, results: sb.results,
          longitudes: balaLongitudes, beneficMap: benefic,
          ascLon: result.ascendant.longitude, mcLon: sb.context && sb.context.midheaven, isDay: sb.context && sb.context.isDay
        });
        myBala = balaAll[house];
        var balaRanked = [];
        for (var bh = 1; bh <= 12; bh++) balaRanked.push(balaAll[bh]);
        balaRanked.sort(function (a, b) { return b.total - a.total; });
        balaRanked.forEach(function (b, idx) { if (b.house === house) myBalaRank = idx + 1; });
      } catch (balaErr) { myBala = null; myBalaRank = null; }
    }

    var rungs = [], T = {};
    function add(rung, fact, interp, simple, illus) {
      rungs.push({ rung: rung, fact: fact, interp: interp, simple: simple || interp, illus: illus || simple || interp });
    }

    var mod = H.MODALITY[signIdx % 3].name;
    var ele = H.ELEMENT[signIdx % 4].name;
    var pol = signIdx % 2 === 0 ? 'yang' : 'yin';
    var cls = classesOf(house);
    var today = new Date();

    // ---- 0 · House ----
    add('0 · House',
      'House ' + house + ' — ' + HOUSE_TEXT[house] + (cls.length ? ' · ' + cls.join(', ') : ''),
      'The subject is ' + HOUSE_TEXT[house].split(', ').slice(0, 3).join(', ') + '. ' +
      (cls.indexOf('kendra') >= 0 ? 'As a kendra it is structural — a pillar of the life rather than a detail. ' : '') +
      (cls.indexOf('trikona') >= 0 ? 'As a trikona it is fortunate ground, and its lord is auspicious wherever it goes. ' : '') +
      (cls.indexOf('dusthana') >= 0 ? 'As a dusthana its affairs arrive through friction, and its lord carries that friction elsewhere. ' : '') +
      (cls.indexOf('upachaya') >= 0 ? 'As an upachaya it improves with age rather than starting well. ' : '') +
      (cls.indexOf('maraka sthana') >= 0 ? 'It is also a maraka sthana, which attaches to its lord rather than to the house itself. ' : ''),
      (cls.indexOf('dusthana') >= 0 ? 'A hard house — what it gives comes the hard way.'
        : cls.indexOf('trikona') >= 0 ? 'Lucky ground.'
        : cls.indexOf('kendra') >= 0 ? 'A main pillar of the life.'
        : 'A steady, ordinary part of life.'),
      (function () {
        var cw = classWord(cls);
        return 'This is about ' + tag(HOUSE_KEYWORD[house], ord(house) + ' house') + (cw ? ', ' + tag(cw.word, cw.src) : '') + '.';
      })());

    // ---- 1 · Sign ----
    add('1 · Sign',
      sign + ' — ' + mod + ' ' + ele + ', ' + pol + ', ruled by ' + lord +
      (house === 1 ? '. Rising at ' + result.ascendant.degreeFormatted : ''),
      'The sign sets the manner in which these affairs are conducted: ' + sign + ' ' + MODALITY_TEXT[mod] +
      ', and does so ' + ELEMENT_TEXT[ele] + '. ' + lord + ' as ruler ' + (LORD_STYLE[lord] || 'colours it') + '. ' +
      (house === 1 && !noDeg
        ? 'The lagna degree is ' + result.ascendant.degreeFormatted + ' — ' +
          (result.ascendant.degree < 6 ? 'early in the sign, so its qualities show in a raw, unformed way.'
           : result.ascendant.degree > 24 ? 'late in the sign, so its qualities are worn thin and the next sign presses in.'
           : 'mid-sign, so the qualities are expressed maturely rather than rawly.')
        : 'Under whole-sign houses the house takes the whole of ' + sign + ', so there is no cusp degree to weigh.'),
      'This part of life ' + MOD_SIMPLE[mod] + ', and works ' + ELE_SIMPLE[ele] + '.',
      'The ' + tag(HOUSE_KEYWORD[house], ord(house) + ' house') + ' seeks ' + tag(SIGN_KEYWORD[sign], sign) + '.');

    // ---- 2 · Occupants ----
    var occ = H.PLANET_ORDER.filter(function (q) { return result.planets[q].signIndex === signIdx; });
    var oFact, oInt;
    if (!occ.length) {
      oFact = 'None — ' + sign + ' is empty';
      oInt = 'No planet imposes its own nature on this house. That is not weakness: it means the reading rests entirely on the lord, the karaka and the aspects, and those rungs must carry more weight than they would in a tenanted house.';
    } else {
      oFact = list(occ.map(function (q) {
        var m = result.planets[q];
        var d = H.dignityOf(q, m).map(function (x) { return x.t; }).join('+');
        var r = sb && sb.results ? sb.results[q] : null;
        return q + ' ' + m.degreeFormatted + (d ? ' (' + d + ')' : '') + (r ? ' ' + Math.round(r.percent) + '%' : '');
      }));
      var ben = occ.filter(isBenefic), mal = occ.filter(function (q) { return !isBenefic(q); });
      oInt = 'Occupants speak louder than the lord for the flavour of a house — they sit in the field itself. ' +
        (ben.length && mal.length ? 'Here the house is mixed: ' + list(ben) + ' benefic against ' + list(mal) + ' malefic. '
         : ben.length ? 'Every occupant is benefic (' + list(ben) + '), so the house is protected from the inside. '
         : 'Every occupant is malefic (' + list(mal) + '), so its affairs are driven hard and come with friction. ') +
        occ.map(function (q) {
          return q + ' brings ' + KARAKA[q].split(', ').slice(0, 3).join(', ') + ' into these matters';
        }).join('; ') + '.';
      var karakaHere = (KARAKA_OF_HOUSE[house] || []).filter(function (k) { return occ.indexOf(k) >= 0; });
      if (karakaHere.length) {
        oInt += ' Note ' + list(karakaHere) + ' is the karaka of this very house — the classical dictum *karako house nashaya* warns that a karaka sitting in its own house harms it.';
        T.karako = list(karakaHere) + ' is both the karaka of house ' + house + ' and an occupant of it — auspicious by strength, inauspicious by the karako house nashaya rule. The tradition disagrees with itself here.';
      }
      if (occ.indexOf('Moon') >= 0 && occ.indexOf('Jupiter') >= 0) {
        oFact += '. Gaja Kesari Yoga (Moon–Jupiter conjunction)';
        oInt += ' Moon and Jupiter together here also form **Gajakesari yoga** — counsel, reputation and benevolence attached to whatever this house governs.';
      }
    }
    var oSimple;
    if (!occ.length) {
      oSimple = 'No planet sits here — read it through its owner.';
    } else {
      var goodOcc = occ.filter(isBenefic), hardOcc = occ.filter(function (q) { return !isBenefic(q); });
      oSimple = goodOcc.length && hardOcc.length
        ? 'Helpful and hard planets both sit here.'
        : goodOcc.length ? 'Helpful planets sit here, so it is protected.'
        : 'Hard planets sit here, so it comes with friction.';
    }
    var oIllus;
    if (!occ.length) {
      oIllus = 'The ' + tag(HOUSE_KEYWORD[house], ord(house) + ' house') + ' stands ' + tag('empty', 'no occupants') + '.';
    } else {
      var oTone = goodOcc.length && hardOcc.length ? 'mixed' : goodOcc.length ? 'help' : 'strain';
      oIllus = 'The ' + tag(HOUSE_KEYWORD[house], ord(house) + ' house') + ' holds ' + tag(oTone, list(occ)) + '.';
    }
    add('2 · Occupants', oFact, oInt, oSimple, oIllus);

    // ---- 3 · Lord's placement ----
    var fromOwn = ((lp.house - house + 12) % 12) + 1;
    add('3 · Lord’s placement',
      lord + ' in ' + lp.sign + ' ' + lp.degreeFormatted + ', house ' + lp.house +
      (lp.retrograde && !NODES[lord] ? ', retrograde' : '') + ' — the ' + ord(fromOwn) + ' from this house',
      'Where the lord goes, the house’s results are delivered. This house’s affairs therefore express through ' +
      HOUSE_TEXT[lp.house].split(', ').slice(0, 3).join(', ') + '. ' +
      (classesOf(lp.house).indexOf('dusthana') >= 0
        ? 'The lord sits in a dusthana, which costs the house — its matters come under strain. '
        : classesOf(lp.house).indexOf('kendra') >= 0 || classesOf(lp.house).indexOf('trikona') >= 0
          ? 'The lord sits in a kendra or trikona, which supports the house. ' : '') +
      (DUSTHANA.indexOf(fromOwn) >= 0
        ? 'Counted from the house itself the lord falls in the ' + ord(fromOwn) +
          ', one of the difficult positions in bhavat bhavam — a classical weakening of the house. '
        : fromOwn === 1 ? 'The lord occupies its own house, which is the strongest thing it can do for it. ' : ''),
      'Its results show up in ' + SHORT_NOUN[lp.house] +
      (fromOwn === 1 ? ', its own house — the best it can do.'
        : classesOf(lp.house).indexOf('dusthana') >= 0 ? ', a hard house, which costs it.'
        : (classesOf(lp.house).indexOf('kendra') >= 0 || classesOf(lp.house).indexOf('trikona') >= 0)
          ? ', and the owner is well placed.' : '.'),
      'Its results show up in ' + tag(HOUSE_KEYWORD[lp.house], lord + ' in the ' + ord(lp.house)) + '.');

    // ---- 4 · Lord's dignity & dispositor ----
    var ldg = H.dignityOf(lord, lp);
    var lkeys = ldg.map(function (d) { return d.k; });
    var luch = lres ? lres.sthanaDetail.uchcha : null;
    var ldisp = E.SIGN_LORDS[lp.signIndex];
    var lrel = (result.relationships[lord] && result.relationships[lord][ldisp]) || null;
    var ldres = sb && sb.results ? sb.results[ldisp] : null;
    add('4 · Lord’s dignity & dispositor',
      (ldg.length ? ldg.map(function (d) { return d.full; }).join('; ') : 'No dignity by sign') +
      (luch === null ? '' : ' · Uchcha bala ' + n2(luch) + '/60') +
      (ldisp === lord ? ' · its own dispositor'
        : ' · dispositor ' + ldisp + ' in ' + result.planets[ldisp].sign + ', house ' + result.planets[ldisp].house +
          (ldres ? ', ' + Math.round(ldres.percent) + '%' : '') +
          (lrel ? ' (' + lrel.panchadha + ')' : '')),
      'The quality the lord brings back to the house. ' +
      (lkeys.indexOf('ex') >= 0 ? 'Exalted, so it serves this house from a position of strength. '
       : lkeys.indexOf('deb') >= 0 ? 'Debilitated, so it serves this house poorly however well placed it is by house. '
       : lkeys.indexOf('mt') >= 0 ? 'In Moolatrikona — its preferred working ground. '
       : lkeys.indexOf('lord') >= 0 ? 'In its own sign, comfortable and self-directed. '
       : luch !== null && luch < 15 ? 'No dignity, and by degree it sits close to its debilitation point — thin ground. '
       : 'No dignity either way — neutral ground. ') +
      (ldisp === lord ? 'It answers to nobody, so nothing filters what it passes back.'
        : 'It answers to ' + ldisp + (lrel ? ', which it regards as a panchadha ' + lrel.panchadha : '') +
          (ldres ? ', and that planet is ' + (ldres.percent >= 100 ? 'above' : 'below') + ' its own minimum.' : '.')),
      (lkeys.indexOf('ex') >= 0 ? 'The owner is in a strong spot.'
        : lkeys.indexOf('deb') >= 0 ? 'The owner is in its weakest spot.'
        : lkeys.indexOf('mt') >= 0 ? 'The owner is comfortable.'
        : lkeys.indexOf('lord') >= 0 ? 'The owner is on home ground.'
        : (luch !== null && luch < 15) ? 'The owner is on thin ground.'
        : 'The owner is on neutral ground.'),
      (function () {
        var lw = dignityWord(lkeys, luch, luch === null ? null : luch * 3,
          (H.Shadbala && H.Shadbala.EXALT[lord]) ? arc(lp.longitude, H.Shadbala.EXALT[lord]) : null, false);
        return 'The owner sits at ' + tag(lw.word, lw.src) + '.';
      })());

    // ---- 5 · Lord's other lordship (+ emergent) ----
    var lOwned = H.housesOwnedBy(lord, ascSign).filter(function (o) { return o.house !== house; });
    var lOwnedHouses = lOwned.map(function (o) { return o.house; });
    var lkt = lOwnedHouses.some(function (h) { return KENDRA.indexOf(h) >= 0; }) && TRIKONA.indexOf(house) >= 0 ||
              lOwnedHouses.some(function (h) { return TRIKONA.indexOf(h) >= 0; }) && KENDRA.indexOf(house) >= 0;
    var HDHANA = [2, 5, 9, 11];
    var lDhana = HDHANA.indexOf(house) >= 0 && lOwnedHouses.some(function (h) { return HDHANA.indexOf(h) >= 0; });
    var lYogas5 = [];
    if (lkt) lYogas5.push('Raja Yoga shape — kendra/trikona lord');
    if (lDhana) lYogas5.push('Dhana Yoga shape — wealth houses linked');
    add('5 · Lord’s other lordship',
      (lOwned.length ? lord + ' also owns ' + list(lOwned.map(function (o) { return o.sign + ' = the ' + ord(o.house); }))
                    : lord + ' owns this house alone') +
      (lYogas5.length ? '. ' + list(lYogas5) : ''),
      lOwned.length
        ? 'The same planet carries two portfolios, so these houses are wired together: whatever happens to ' +
          list(lOwned.map(function (o) { return HOUSE_TEXT[o.house].split(', ').slice(0, 2).join(', '); })) +
          ' is felt in this one, and vice versa. ' +
          (lOwned.some(function (o) { return DUSTHANA.indexOf(o.house) >= 0; })
            ? 'One of them is a dusthana, so this house inherits some of that difficulty.'
            : 'Both portfolios are benign houses, so the pairing is clean.') +
          (lkt ? ' A kendra–trikona association between the two — classically read as the shape of a Raja Yoga.' : '') +
          (lDhana ? ' Both houses are wealth-giving (2, 5, 9, 11) — the classical shape of a Dhana Yoga.' : '')
        : 'A single portfolio — the lord works for this house and nothing else, which concentrates its attention here.',
      lOwned.length
        ? 'The same planet also runs ' + list(lOwned.map(function (o) { return SHORT_NOUN[o.house]; })) + '.'
        : 'The owner works for this house alone.',
      lOwned.length
        ? 'The owner also runs ' + list(lOwned.map(function (o) { return tag(HOUSE_KEYWORD[o.house], lord + ' owns the ' + ord(o.house)); })) + '.'
        : 'The owner runs ' + tag('this house alone', lord + ' owns one sign') + '.');

    var exch = null;
    if (!NODES[lord] && ldisp !== lord && !NODES[ldisp]) {
      if (E.SIGN_LORDS[result.planets[ldisp].signIndex] === lord) {
        // the exchanged houses are the ones each planet OCCUPIES, which need not
        // include the house being read — the lord may be entangled elsewhere
        var hA = lp.house, hB = result.planets[ldisp].house;
        exch = { other: ldisp, hA: hA, hB: hB, cls: parivartanaClass(hA, hB), own: (hA === house || hB === house) };
      }
    }
    if (exch) {
      add('5b · Emergent',
        lord + ' and ' + exch.other + ' occupy each other’s signs — the ' + ord(exch.hA) +
        ' and the ' + ord(exch.hB) + ' exchange lords. ' + exch.cls + ' Yoga (parivartana)',
        'A parivartana between the ' + ord(exch.hA) + ' and the ' + ord(exch.hB) + ' — ' + exch.cls +
        ' yoga in Phaladeepika’s classification. Those two houses now behave as one system. ' +
        (exch.own
          ? 'This house is one of the two, so the pairing is direct.'
          : 'Neither of them is this house, but its lord is tied up in the exchange, so part of ' + lord +
            '’s attention is committed elsewhere — read that as a claim on what it can deliver here.') +
        ' Invisible at rung 3 alone and at rung 4 alone.',
        cap(SHORT_NOUN[exch.hA]) + ' and ' + SHORT_NOUN[exch.hB] + ' now work as one — ' +
        (exch.cls === 'Maha' ? 'a good sign.' : exch.cls === 'Dainya' ? 'a difficult one.' : 'a mixed one.'),
        tag(HOUSE_KEYWORD[exch.hA], ord(exch.hA) + ' house') + ' and ' +
        tag(HOUSE_KEYWORD[exch.hB], ord(exch.hB) + ' house') + ' become one — ' +
        tag(exch.cls === 'Maha' ? 'good' : exch.cls === 'Dainya' ? 'hard' : 'mixed', exch.cls + ' yoga') + '.');
    }

    // ---- 6 · Karaka ----
    var kar = KARAKA_OF_HOUSE[house] || [];
    add('6 · Karaka',
      list(kar.map(function (k) {
        var kp = result.planets[k], kr = sb && sb.results ? sb.results[k] : null;
        return k + ' in ' + kp.sign + ', house ' + kp.house + (kr ? ', ' + Math.round(kr.percent) + '%, rank ' + kr.rank : '');
      })),
      'The natural significator — it speaks for this house’s matters in every chart, independent of who owns the sign. ' +
      kar.map(function (k) {
        var kp = result.planets[k], kr = sb && sb.results ? sb.results[k] : null;
        return k + ' is ' + (kr ? (kr.percent >= 100 ? 'above its minimum at ' + Math.round(kr.percent) + '%' : 'below its minimum at ' + Math.round(kr.percent) + '%') : 'not measurable here') +
          ' and sits in the ' + ord(kp.house) +
          (classesOf(kp.house).indexOf('dusthana') >= 0 ? ', a dusthana, which weakens what it can signify' : '');
      }).join('; ') + '. ' +
      'A house is judged by lord, occupants, karaka and aspects together — this is the third of those four.',
      (function () {
        var weakKar = kar.filter(function (k) {
          var kr = sb && sb.results ? sb.results[k] : null;
          return kr && kr.percent < 100;
        });
        var badKar = kar.filter(function (k) { return classesOf(result.planets[k].house).indexOf('dusthana') >= 0; });
        var measured = kar.some(function (k) { return sb && sb.results && sb.results[k]; });
        return !measured ? 'Its natural signifier cannot be weighed without a birth time.'
          : weakKar.length ? 'Its natural signifier is weak, so these matters are thinly supplied.'
          : 'Its natural signifier is strong, so these matters are well supplied.';
      })(),
      (function () {
        var measured2 = kar.some(function (k) { return sb && sb.results && sb.results[k]; });
        var weak2 = kar.filter(function (k) { var kr = sb && sb.results ? sb.results[k] : null; return kr && kr.percent < 100; });
        var kw = !measured2 ? 'unknown' : weak2.length ? 'weak' : 'strong';
        return 'Its signifier runs ' + tag(kw, list(kar)) + '.';
      })());

    // ---- 7 · Aspects on the house ----
    var onto = H.aspectsOntoSign(signIdx, result).filter(function (a) {
      return occ.indexOf(a.planet) < 0;
    });
    var aInt;
    if (!onto.length) {
      aInt = 'Nothing aspects this house, so no outside agent modifies it. Whatever the lord, occupants and karaka establish stands unaltered.';
    } else {
      var ab = onto.filter(function (a) { return isBenefic(a.planet); }).map(function (a) { return a.planet; });
      var am = onto.filter(function (a) { return !isBenefic(a.planet); }).map(function (a) { return a.planet; });
      aInt = (ab.length && am.length ? 'Mixed: ' + list(ab) + ' benefic against ' + list(am) + ' malefic. '
        : ab.length ? 'Only benefic aspects (' + list(ab) + ') — protection from outside. '
        : 'Only malefic aspects (' + list(am) + ') — pressure on these affairs with nothing to soften it. ') +
        onto.map(function (a) {
          var owns = H.housesOwnedBy(a.planet, ascSign)
            .sort(function (x, y) { return x.house - y.house; })
            .map(function (o) { return ord(o.house); });
          return a.planet + ' throws its ' + ord(a.aspect) + ' from the ' + ord(a.fromHouse) +
            (owns.length ? ', bringing the ' + list(owns) + ' with it' : '');
        }).join('; ') + '.';
      var dust = onto.filter(function (a) {
        return H.housesOwnedBy(a.planet, ascSign).some(function (o) { return DUSTHANA.indexOf(o.house) >= 0; });
      });
      if (dust.length) aInt += ' Note ' + list(dust.map(function (d) { return d.planet; })) +
        ' rules a dusthana, so part of what it brings here is debt, illness or upheaval.';
    }
    add('7 · Aspects on the house',
      (onto.length ? 'Aspected by ' + list(onto.map(function (a) { return a.planet + ' (' + ord(a.aspect) + ', from house ' + a.fromHouse + ')'; }))
                   : 'No whole-sign aspect') +
      '. The app computes graded drishti per planet, not per house, so this rung is whole-sign only',
      aInt,
      (function () {
        if (!onto.length) return 'Nothing looks at this house from outside.';
        var gd = onto.filter(function (a) { return isBenefic(a.planet); }).map(function (a) { return a.planet; });
        var hd = onto.filter(function (a) { return !isBenefic(a.planet); }).map(function (a) { return a.planet; });
        return hd.length && !gd.length
            ? 'Only hard planets look at it — ' + (HARD_EFFECT[hd[0]] || hd[0] + ' presses on it') + '.'
          : gd.length && !hd.length ? 'Only helpful planets look at it, so it is protected.'
          : 'Mixed — ' + list(gd) + ' help, ' + list(hd) + ' press.';
      })(),
      (function () {
        if (!onto.length) return 'The house draws ' + tag('nothing', 'no aspects') + '.';
        var gd2 = onto.filter(function (a) { return isBenefic(a.planet); });
        var hd2 = onto.filter(function (a) { return !isBenefic(a.planet); });
        var hTone = hd2.length && !gd2.length ? 'pressure' : gd2.length && !hd2.length ? 'protection' : 'mixed';
        return 'The house draws ' + tag(hTone, list(onto.map(function (a) { return a.planet + ' ' + ord(a.aspect); }))) + '.';
      })());

    // ---- 8 · Aspects on the lord ----
    var lOnto = H.aspectsOntoSign(lp.signIndex, result).filter(function (a) {
      return a.planet !== lord && !H.isNodePair(lord, a.planet);
    });
    var lDrik = lres ? lres.drikDetail : null;
    var lFact = (lOnto.length ? lord + ' receives ' + list(lOnto.map(function (a) { return a.planet + ' (' + ord(a.aspect) + ')'; }))
                              : lord + ' receives no whole-sign aspect') +
      (lDrik ? '. Sphuta drishti: ' + lDrik.map(function (d) { return d.from + ' ' + (d.value >= 0 ? '+' : '') + n2(d.value); }).join(', ') +
        ' → net ' + (lres.drik >= 0 ? '+' : '') + n2(lres.drik) : '');
    var lInt = 'Whatever conditions the lord conditions the house at one remove. ';
    if (lOnto.length) {
      var lb = lOnto.filter(function (a) { return isBenefic(a.planet); }).map(function (a) { return a.planet; });
      var lm = lOnto.filter(function (a) { return !isBenefic(a.planet); }).map(function (a) { return a.planet; });
      lInt += (lb.length && lm.length ? 'Mixed contact: ' + list(lb) + ' against ' + list(lm) + '. '
        : lb.length ? 'Benefic contact only (' + list(lb) + '). ' : 'Malefic contact only (' + list(lm) + '). ');
    } else {
      lInt += 'By whole sign it stands unaspected. ';
    }
    if (lDrik && lDrik.length) {
      var hv = lDrik.slice().sort(function (a, b) { return Math.abs(b.value) - Math.abs(a.value); })[0];
      lInt += 'By graded drishti the heaviest influence on it is ' + hv.from + ' at ' + (hv.value >= 0 ? '+' : '') + n2(hv.value) +
        ', net ' + (lres.drik >= 0 ? 'positive' : 'negative') + ' at ' + n2(lres.drik) + '. ';
      var wsN = lOnto.map(function (a) { return a.planet; }).sort().join(', ');
      var sdN = lDrik.map(function (d) { return d.from; }).sort().join(', ');
      if (wsN !== sdN) {
        lInt += 'The two models name different planets — choose one before trusting this rung.';
        T.aspectModel = 'On the lord ' + lord + ', whole-sign names ' + (wsN || 'nobody') +
          ' while graded sphuta drishti names ' + sdN + '. The app runs both, and they can flip “isolated” into “supported”.';
      }
    }
    var lSimpleAsp;
    if (!lOnto.length) {
      lSimpleAsp = 'Nothing works on the owner either.';
    } else {
      var lg = lOnto.filter(function (a) { return isBenefic(a.planet); });
      var lh = lOnto.filter(function (a) { return !isBenefic(a.planet); });
      lSimpleAsp = lg.length && lh.length ? 'The owner gets a mix of help and pressure.'
        : lg.length ? 'The owner is helped, and that reaches this house.'
        : 'The owner is pressed, and that reaches this house.';
    }
    var lAspTone = !lOnto.length ? 'nothing' : (function () {
      var lg2 = lOnto.filter(function (a) { return isBenefic(a.planet); });
      var lh2 = lOnto.filter(function (a) { return !isBenefic(a.planet); });
      return lg2.length && lh2.length ? 'mixed' : lg2.length ? 'help' : 'strain';
    })();
    add('8 · Aspects on the lord', lFact, lInt, lSimpleAsp,
      'The owner draws ' + tag(lAspTone,
        lOnto.length ? list(lOnto.map(function (a) { return a.planet + ' ' + ord(a.aspect); })) : 'no aspects on ' + lord) + '.');

    // ---- 9 · Nakshatra ----
    var nFactParts = [], nIntParts = [], nSimpleParts2 = [];
    if (noDeg) {
      add('9 · Nakshatra',
        'Not available — needs exact degrees',
        'The rising star and the owner’s star both come from exact degrees. A placement fixes signs only, so this rung and the navamsa reading behind it stay empty.',
        'Needs exact degrees, which a placed chart does not have.');
    } else {
    if (house === 1) {
      var an = result.ascendant.nakshatra;
      nFactParts.push('Lagna in ' + an.name + ' pada ' + an.pada + ', lord ' + an.lord +
        '; ascendant navamsa ' + result.ascendant.navamsaSign);
      nIntParts.push('The lagna is the one house with a degree of its own. ' + an.name + ' is ' +
        (NAK_TEXT[an.name] || 'its own register') + '. The ascendant falls in ' + result.ascendant.navamsaSign +
        ' navamsa, ruled by ' + E.SIGN_LORDS[result.ascendant.navamsaSignIndex] +
        (E.SIGN_LORDS[result.ascendant.navamsaSignIndex] === lord
          ? ' — the lagna lord itself, which ties the chart to ' + lord + ' a second time.' : '.'));
    }
    nFactParts.push(lord + ' in ' + lp.nakshatra + ' pada ' + lp.pada + ', lord ' + lp.nakshatraLord +
      '; navamsa ' + lp.navamsaSign + (lp.navamsaSignIndex === lp.signIndex ? ' (vargottama)' : ''));
    nIntParts.push('The lord carries the register of ' + lp.nakshatra + ' (' +
      (NAK_TEXT[lp.nakshatra] || 'its own signature') + ') into this house’s affairs. ' +
      (lp.navamsaSignIndex === lp.signIndex
        ? 'Vargottama in navamsa, so its condition holds unusually steady across the divisions.'
        : 'In navamsa it shifts to ' + lp.navamsaSign + ', worth reading as a second opinion on the same planet.'));
    var nSimpleParts = [];
    if (house === 1) {
      nSimpleParts.push('Rising star: ' +
        (NAK_SIMPLE[result.ascendant.nakshatra.name] || 'its own flavour.').replace(/^./, function (c) { return c.toLowerCase(); }));
    }
    nSimpleParts.push('Owner: ' +
      (NAK_SIMPLE[lp.nakshatra] || 'its own flavour.').replace(/^./, function (c) { return c.toLowerCase(); }));
    var nIllusParts = [];
    if (house === 1) nIllusParts.push('Rising star carries ' +
      tag(NAK_KEYWORD[result.ascendant.nakshatra.name] || 'its own flavour', result.ascendant.nakshatra.name) + '.');
    nIllusParts.push('The owner carries ' + tag(NAK_KEYWORD[lp.nakshatra] || 'its own flavour', lp.nakshatra) + '.');
    add('9 · Nakshatra', nFactParts.join(' · '), nIntParts.join(' '), nSimpleParts.join(' '), nIllusParts.join(' '));
    }

    // ---- 10 · Strength of the three ----
    var trio = [];
    if (lres) trio.push({ who: lord + ' (lord)', pct: lres.percent, rank: lres.rank });
    kar.forEach(function (k) {
      var kr = sb && sb.results ? sb.results[k] : null;
      if (kr) trio.push({ who: k + ' (karaka)', pct: kr.percent, rank: kr.rank });
    });
    onto.forEach(function (a) {
      var ar = sb && sb.results ? sb.results[a.planet] : null;
      if (ar) trio.push({ who: a.planet + ' (aspecting)', pct: ar.percent, rank: ar.rank });
    });
    var top3 = trio.filter(function (t) { return t.rank <= 3; });
    var shortAgents = trio.filter(function (t) { return t.pct < 100; });
    if (noDeg) {
      add('10 · Strength of the three',
        'Not available — Shadbala needs the birth moment',
        'Bhava Bala, and the owner/karaka/aspect Shadbala figures behind it, all need exact degrees and the moment of birth. Without it, this house can be described but not measured.',
        'Cannot be measured without a birth time.');
    } else {
    add('10 · Strength of the three',
      (myBala
        ? 'Bhava Bala ' + n2(myBala.rupa) + ' Rūpa (' + Math.round(myBala.total) + ' Virupas) — rank ' + myBalaRank + ' of 12 houses'
        : 'Bhava Bala not available for this house') +
      (trio.length ? ' · agents: ' + trio.map(function (t) { return t.who + ' ' + Math.round(t.pct) + '%, rank ' + t.rank; }).join(', ')
                   : ' · no agent Shadbala figures apply'),
      (myBala
        ? 'Bhava Bala measures this house directly — ' + n2(myBala.rupa) + ' Rūpa, the ' + ord(myBalaRank) + ' strongest of the twelve houses, built from its lord’s own Shadbala (' +
          Math.round(myBala.adhipati) + ' Virupas, the dominant term by classical convention), its directional angularity (' + Math.round(myBala.dig) + ') and the net aspects landing on it (' +
          Math.round(myBala.drishti) + '). '
        : 'Bhava Bala could not be computed for this house. ') +
      (top3.length >= 2
        ? 'Its individual agents also converge: ' + list(top3.map(function (t) { return t.who; })) +
          ' are all inside the chart’s top three by Shadbala. '
        : '') +
      (shortAgents.length && shortAgents.length < trio.length
        ? list(shortAgents.map(function (t) { return t.who; })) + ' fall short of their own Shadbala minimum even so. '
        : '') +
      (myBala && myBalaRank
        ? (shortAgents.length === trio.length && trio.length && myBalaRank <= 4
            ? 'Worth flagging: every individual agent falls short of its own minimum, yet the measured Bhava Bala still ranks this house near the top — weight the measured figure over the agent-by-agent read. '
            : !shortAgents.length && trio.length && myBalaRank >= 9
              ? 'Worth flagging: every agent clears its own minimum, yet Bhava Bala ranks this house near the bottom — angularity and the net aspect balance are pulling the measured figure down. '
              : 'The agent read and the measured Bhava Bala broadly agree here. ')
        : ''),
      (function () {
        if (myBala) return 'Bhava Bala: ' + n2(myBala.rupa) + ' Rūpa, rank ' + myBalaRank + ' of 12.';
        if (!trio.length) return 'No strength scores apply to this house’s planets.';
        return shortAgents.length
          ? 'Some of its planets are short of strength, so part of the promise is not delivered.'
          : 'Its planets are all strong enough, so what is set up above actually lands.';
      })(),
      (function () {
        if (myBala) return 'Bhava Bala runs ' + tag(myBalaRank <= 6 ? 'strong' : 'weak', n2(myBala.rupa) + ' Rūpa, rank ' + myBalaRank + ' of 12') + '.';
        if (!trio.length) return 'Its agents run ' + tag('unmeasured', 'no Shadbala') + '.';
        return 'Its agents run ' + tag(shortAgents.length ? 'short' : 'strong',
          trio.map(function (t) { return t.who.replace(/\s*\(.*\)/, '') + ' ' + Math.round(t.pct) + '%'; }).join(', ')) + '.';
      })());
    }

    // ---- 11 · Timing ----
    var actors = [];
    H.PLANET_ORDER.forEach(function (q) {
      var why = [];
      if (H.housesOwnedBy(q, ascSign).some(function (o) { return o.house === house; })) why.push('owns it');
      if (result.planets[q].signIndex === signIdx) why.push('occupies it');
      var d = ((signIdx - result.planets[q].signIndex + 12) % 12) + 1;
      if ((H.ASPECT_HOUSES[q] || [7]).indexOf(d) >= 0) why.push('aspects it');
      if (why.length) actors.push({ planet: q, why: why.join(', ') });
    });
    var windows = [];
    actors.forEach(function (a) {
      result.dasha.forEach(function (dd) {
        if (dd.lord === a.planet) windows.push({ planet: a.planet, why: a.why, start: dd.start, end: dd.end });
      });
    });
    windows.sort(function (a, b) { return a.start - b.start; });
    var actorNames = actors.map(function (a) { return a.planet; });
    var nextAd = null;
    (result.antardashas || []).forEach(function (a) {
      if (nextAd || a.start <= today) return;
      if (actorNames.indexOf(a.antar) >= 0 || actorNames.indexOf(a.maha) >= 0) nextAd = a;
    });
    var current = null, next = null;
    windows.forEach(function (w) {
      if (w.start <= today && w.end >= today) current = w;
      else if (w.start > today && !next) next = w;
    });
    if (noDeg) {
      add('11 · Timing',
        'Not available — dasha needs the Moon’s degree and a birth date',
        'A house comes forward when one of its own planets holds a period. Which period is running, and when the next arrives, both depend on the Moon’s exact degree and a birth date.',
        'Needs the Moon’s degree and a birth date.');
    } else {
    add('11 · Timing',
      (actors.length ? 'Activated by ' + list(actors.map(function (a) { return a.planet + ' (' + a.why + ')'; })) : 'No planet activates it') +
      (current ? '. Currently in ' + current.planet + ' Mahadasha' : '') +
      (next ? '. Next activating Mahadasha: ' + next.planet + ', from ' + H.fmtDate(next.start) : ''),
      'A gate, not a modifier. This house comes forward when one of its own agents holds a period — the Parashari rule is that a planet signifies whatever it owns, occupies or aspects. ' +
      (current ? 'It is live right now: ' + current.planet + '’s Mahadasha runs to ' + H.fmtDate(current.end) + ', and it ' + (actors.filter(function (a) { return a.planet === current.planet; })[0] || {}).why + '. '
               : 'No activating Mahadasha is running, so this house is presently in the background. ') +
      (next ? 'The next Mahadasha window opens with ' + next.planet + ' from ' + H.fmtDate(next.start) + '. ' : '') +
      (nextAd ? 'Sooner than that, ' + nextAd.maha + '–' + nextAd.antar + ' from ' + H.fmtDate(nextAd.start) +
        ' brings an activating planet in as antardasha lord.' : ''),
      (current ? 'One of its planets is running a period now, until ' + H.fmtDate(current.end) + '.'
               : 'None of its planets is running a period, so it is quiet just now.') +
      (nextAd ? ' Next window: ' + H.fmtDate(nextAd.start) + '.' : ''),
      'The house is ' + tag(current ? 'active' : 'quiet',
        actors.length ? list(actors.map(function (a) { return a.planet; })) : 'no activating planet') + '.' +
      (nextAd ? ' Next window: ' + tag(H.fmtDate(nextAd.start), nextAd.maha + '–' + nextAd.antar) + '.' : ''));
    }

    // ---- compounded ----
    var sum = [];
    sum.push('House ' + house + ' in ' + sign + (occ.length ? ', holding ' + list(occ) : ', empty') +
      ', with its lord ' + lord + ' in the ' + ord(lp.house) +
      (lkeys.indexOf('ex') >= 0 ? ' and exalted' : lkeys.indexOf('deb') >= 0 ? ' and debilitated' : '') + '.');
    if (exch) sum.push('The exchange between ' + lord + ' and ' + exch.other + ' is a ' + exch.cls +
      ' Yoga — a parivartana — binding this house to the ' + ord(exch.hB) + '.');
    sum.push('Its karaka ' + list(kar) + ' ' + (kar.length > 1 ? 'are' : 'is') + ' ' +
      list(kar.map(function (k) {
        var kr = sb && sb.results ? sb.results[k] : null;
        return 'in the ' + ord(result.planets[k].house) + (kr ? ' at ' + Math.round(kr.percent) + '%' : '');
      })) + '.');
    sum.push(onto.length ? 'From outside it receives ' + list(onto.map(function (a) { return a.planet; })) + '.'
                         : 'Nothing aspects it from outside.');
    if (lres) sum.push(lres.percent >= 100
      ? 'The lord clears its minimum, so the house delivers rather than merely promises.'
      : 'The lord falls short of its minimum, so the house reads better on paper than it performs.');
    if (myBala && myBalaRank) sum.push('Its measured Bhava Bala is ' + n2(myBala.rupa) + ' Rūpa — the ' +
      ord(myBalaRank) + ' strongest of the twelve houses.');

    // ---- tensions ----
    if (lres && lres.percent >= 100 && classesOf(lp.house).indexOf('dusthana') >= 0) {
      T.lordDusthana = 'The lord is strong (' + Math.round(lres.percent) + '%) but sits in a dusthana — strength delivered into difficult ground, which is not the same as a good result.';
    }
    if (DUSTHANA.indexOf(fromOwn) >= 0) {
      T.bhavatBhavam = 'Counted from its own house the lord falls in the ' + ord(fromOwn) +
        ', a bhavat-bhavam weakening — yet by absolute house it may look well placed. The two framings disagree.';
    }
    if (!occ.length && !onto.length) {
      T.quiet = 'The house is empty and unaspected, so the entire reading rests on one planet. That is a thin evidential base — weight it accordingly.';
    }
    if (cls.indexOf('kendra') >= 0 && cls.indexOf('maraka sthana') >= 0) {
      T.maraka = 'House ' + house + ' is both a kendra and a maraka sthana — the same field carries the structural benefit and the classical caution.';
    }
    if (myBala && myBalaRank && trio.length) {
      var shortAgentsT = trio.filter(function (t) { return t.pct < 100; });
      if (shortAgentsT.length === trio.length && myBalaRank <= 4) {
        T.balaDivergence = 'Every individual agent of this house (owner, karaka, aspecting planets) falls short of its own Shadbala minimum, yet the measured Bhava Bala still ranks it ' +
          ord(myBalaRank) + ' strongest of the twelve houses — the agent-by-agent read and the measured figure disagree. Weight the measured Bhava Bala (Strength tab).';
      } else if (!shortAgentsT.length && myBalaRank >= 9) {
        T.balaDivergence = 'Every agent of this house clears its own Shadbala minimum, yet the measured Bhava Bala ranks it only ' +
          ord(myBalaRank) + ' of twelve — angularity and the net aspects landing on the house are pulling the measured figure down even though each agent looks capable on its own.';
      }
    }

    var tensions = ['karako', 'lordDusthana', 'bhavatBhavam', 'aspectModel', 'quiet', 'maraka', 'balaDivergence']
      .map(function (k) { return T[k]; }).filter(Boolean);

    var bsimp = [];
    bsimp.push(occ.length
      ? 'Planets sitting here shape this house directly.'
      : 'No planet sits here, so the owner carries it.');
    bsimp.push('Its owner is in ' + SHORT_NOUN[lp.house] + ', so that is where these matters show up.');
    if (exch) bsimp.push('An exchange ties it to ' + SHORT_NOUN[exch.hA === house ? exch.hB : exch.hA] + '.');
    if (onto.length) {
      var hardOn = onto.filter(function (a) { return !isBenefic(a.planet); });
      bsimp.push(hardOn.length === onto.length ? 'Only hard planets look at it.'
        : hardOn.length ? 'What looks at it is mixed.' : 'Helpful planets look at it.');
    } else {
      bsimp.push('Nothing looks at it from outside.');
    }
    if (lres) {
      bsimp.push(lres.percent >= 100 ? 'The owner is strong enough, so it delivers.'
        : 'The owner is short of strength, so it promises more than it gives.');
    }

    var bone = [];
    bone.push('The ' + ord(house) + ' house' + (occ.length ? ', holding ' + list(occ) : ', empty'));
    bone.push('run by ' + lord + ' from ' + SHORT_NOUN[lp.house]);
    if (exch) bone.push('tied to ' + SHORT_NOUN[exch.hA === house ? exch.hB : exch.hA] + ' by an exchange');
    if (lkeys.indexOf('deb') >= 0) bone.push('with that owner weak by sign');
    else if (lkeys.indexOf('ex') >= 0) bone.push('with that owner strong by sign');
    if (onto.length) {
      var bh = onto.filter(function (a) { return !isBenefic(a.planet); }).map(function (a) { return a.planet; });
      bone.push(bh.length ? 'pressed by ' + list(bh) : 'protected by ' + list(onto.map(function (a) { return a.planet; })));
    } else {
      bone.push('with nothing looking at it');
    }
    if (lres) bone.push(lres.percent >= 100 ? 'and strong enough to deliver' : 'but short of the strength to deliver');

    return {
      rungs: rungs,
      summary: sum.join(' '),
      summarySimple: bsimp.join(' '),
      summaryOne: cap(bone.join(', ')) + '.',
      tensions: tensions,
      // The measured Bhava Bala this chain already computed for rung 10 and
      // the Compounded summary (see above) — exposed directly so a caller
      // that only wants the number/rank (the chart hover tooltip) doesn't
      // have to re-run bhavaBala() itself or regex-parse the prose. null
      // when unavailable (Simulation mode, or no Shadbala context).
      myBala: myBala, myBalaRank: myBalaRank
    };
  }

  // HOUSE_TEXT, KARAKA, KARAKA_OF_HOUSE and SIGN_TRAITS are exported so other
  // parts of the app (the Research tab, the chart hover tooltip) can resolve
  // a plain-language topic or trait line to the same classical significations
  // already used inside the chains, rather than maintaining a second,
  // possibly-inconsistent copy.
  // ---- Bala framework (the Influence Engine tab's content) -----------------
  //
  // For one House ↔ Planet entry: every Shadbala and Bhava Bala component with
  // the qualitative dimension it quantifies, this chart's actual condition and
  // the arithmetic behind the number — then the reading factors neither system
  // scores. Returns plain data (blocks → groups → rows); app.js renders it.
  // Needs real Shadbala, so a hand-placed chart (sb null) returns null.
  var CLASS_LABEL = { kendra: 'Kendra', trikona: 'Trikona', dusthana: 'Dusthana', upachaya: 'Upachaya', 'maraka sthana': 'Maraka' };
  var BHAVA_TYPE_NAME = { nara: 'human', chatushpada: 'quadruped', keeta: 'insect', jala: 'watery' };
  var FW_VARGAS = ['D1', 'D2', 'D3', 'D7', 'D9', 'D12', 'D30'];
  var FW_DAY_STRONG = ['Sun', 'Jupiter', 'Venus'];

  // Verdict = the number (Strong / Adequate / Weak) crossed with the factors
  // the number leaves out (Supported / Mixed / Afflicted). Uncounted factors
  // weigh 2 (heavy: lordship of a Dusthana, Trikona or the lagna, combustion,
  // debilitation or exaltation incl. D9, Neecha Bhanga) or 1 (light: avasthas,
  // dispositor, placement, Kartari, Vargottama, karaka, directional strength,
  // the nodes). Viparita Raja Yoga is heavy. Rahu and Ketu also take the
  // favourable-result rules of nodeFavourableFactors(). Supported / Afflicted
  // need a margin of FW_MARGIN points.
  var FW_HEAVY = 2, FW_LIGHT = 1, FW_MARGIN = 2;
  // Ishta against Kashta Bala says whether a planet's own periods lean
  // auspicious or difficult. It is shown under the planet's number, not
  // scored: active while the planet is a lord of the period in view, dormant
  // otherwise. A lead under FW_ISHTA_LEAN Virupas reads as balanced.
  var FW_ISHTA_LEAN = 10;
  var FW_PLANET_STRONG = 1.25, FW_PLANET_ADEQUATE = 1.0; // × the required Shadbala
  // Bhava Bala has no classical minimum, so a house is graded against a
  // benchmark of this app's own making: its lord's required Shadbala plus the
  // midpoint of Bhava Digbala (aspects, occupation and day-night taken as
  // neutral), with the same Strong / Adequate cut-offs as the planets. Ranking
  // the twelve instead would call four houses Weak in every chart.
  var FW_HOUSE_DIG_MID = 30;
  var FW_VERDICT = {
    Strong:   { Supported: ['Strong', 'green'], Mixed: ['Strong', 'green'], Afflicted: ['Strong but afflicted', 'amber'] },
    Adequate: { Supported: ['Adequate, supported', 'green'], Mixed: ['Adequate', 'amber'], Afflicted: ['Adequate but afflicted', 'amber'] },
    Weak:     { Supported: ['Weak but supported', 'amber'], Mixed: ['Weak', 'red'], Afflicted: ['Weak', 'red'] },
    // No number at all (Rahu, Ketu): the uncounted factors are the verdict.
    none:     { Supported: ['Supported', 'green'], Mixed: ['Mixed', 'amber'], Afflicted: ['Afflicted', 'red'] }
  };
  function fwVerdict(number, numberBasis, help, hurt, rankText) {
    function sum(a) { return a.reduce(function (t, f) { return t + f.w; }, 0); }
    var helpScore = sum(help), hurtScore = sum(hurt), diff = helpScore - hurtScore;
    var quality = diff >= FW_MARGIN ? 'Supported' : diff <= -FW_MARGIN ? 'Afflicted' : 'Mixed';
    var v = FW_VERDICT[number || 'none'][quality];
    return {
      word: v[0], color: v[1], number: number, quality: quality, helpScore: helpScore, hurtScore: hurtScore,
      basis: (number ? number + ' (' + numberBasis + ')' + (rankText ? ', ' + rankText : '') + '. ' : '') +
        quality + ' (helping ' + helpScore + ', hurting ' + hurtScore + ').'
    };
  }

  // ---- Rahu/Ketu: when their RESULTS turn favourable ----
  // Their nature stays malefic (isNaturalBenefic), but BPHS and classical
  // commentary give specific conditions under which the results a node itself
  // delivers turn good. Each is a helping factor in the node's verdict, never a
  // change to how its aspects land.

  // Yogakaraka planets for this Lagna: lords of both a kendra (4/7/10) and a
  // trikona (5/9), by classical sign lords.
  function yogakarakaPlanetsOf(result, H) {
    var asc = result.ascendant.signIndex, owns = {};
    for (var h = 1; h <= 12; h++) {
      var lord = H.engine.SIGN_LORDS[(asc + h - 1) % 12];
      (owns[lord] = owns[lord] || []).push(h);
    }
    return Object.keys(owns).filter(function (p) {
      return owns[p].some(function (h) { return [4, 7, 10].indexOf(h) >= 0; }) &&
             owns[p].some(function (h) { return [5, 9].indexOf(h) >= 0; });
    });
  }

  // Kujavat Ketu, Shanivat Rahu (classical commentary, not a BPHS verse):
  // Ketu behaves like Mars and Rahu like Saturn, so where that planet is a
  // functional benefic for this Lagna, the node inherits the favourable role.
  var NODE_PROXY = { Rahu: 'Saturn', Ketu: 'Mars' };

  // Own signs for this rule per BPHS Ch. 50 v.42 — Aquarius for Rahu, Scorpio
  // for Ketu (narrower than the app's co-lordship, which also gives Rahu
  // Virgo and Ketu Pisces).
  var NODE_OWN_SIGN = { Rahu: 10, Ketu: 7 };

  // BPHS, Yoga Karakas chapter (Ch. 34 in Santhanam's translation; verse
  // numbering differs between editions): "yadi kendre trikoṇe vā nivasetāṃ
  // tamograhau / nāthenānyatareṇāpi sambandhād yogakārakau" — if Rahu or
  // Ketu occupies a kendra or trikona and has a relationship (sambandha)
  // with the lord of the other, it becomes a yogakaraka. Read here the
  // standard way, as the same kendra–trikona pairing Raja Yoga uses: a node
  // in a kendra linked to a trikona lord, or in a trikona linked to a kendra
  // lord (the 1st counts as both). A looser translation — linked to the lord
  // of *any* kendra or trikona — would make nearly every node in an angle or
  // trine qualify, so it isn't used. Sambandha is planetsAssociated():
  // conjunction, aspect either way, or exchange. Lords are the classical
  // sign lords (the seven grahas). Returns null, or what qualified it.
  function nodeYogakaraka(node, result, H) {
    var np = result.planets[node];
    var inKendra = KENDRA.indexOf(np.house) >= 0, inTrikona = TRIKONA.indexOf(np.house) >= 0;
    if (!inKendra && !inTrikona) return null;
    var ascSign = result.ascendant.signIndex;
    var partnerHouses = inKendra && inTrikona ? KENDRA.concat(TRIKONA)
      : inKendra ? TRIKONA : KENDRA;
    var found = null;
    partnerHouses.forEach(function (h) {
      if (found) return;
      var lord = H.engine.SIGN_LORDS[(ascSign + h - 1) % 12];
      var assoc = planetsAssociated(node, lord, result, H);
      if (assoc) {
        found = { node: node, house: np.house, placement: inKendra ? 'kendra' : 'trikona',
          lord: lord, lordOf: h, lordOfKind: TRIKONA.indexOf(h) >= 0 ? 'trikona' : 'kendra', association: assoc };
      }
    });
    return found;
  }

  // The node's helping factors for balaFramework(), as { t, w, dasha }. A
  // `dasha` factor describes the node's own periods, so the caller scores it
  // only while the node is a lord of the period in view.
  function nodeFavourableFactors(node, result, H, beneficMap) {
    var out = [];
    var p = result.planets[node];
    var others = H.PLANET_ORDER.filter(function (n) { return !NODES[n]; });
    var conjoined = others.filter(function (n) { return result.planets[n].signIndex === p.signIndex; });
    var aspecting = H.aspectsOntoSign(p.signIndex, result)
      .filter(function (a) { return !NODES[a.planet]; }).map(function (a) { return a.planet; });
    var beneficLinks = conjoined.concat(aspecting).filter(function (n, i, arr) {
      return arr.indexOf(n) === i && isNaturalBenefic(n, beneficMap);
    });
    var ykPlanets = yogakarakaPlanetsOf(result, H);
    var withYk = conjoined.filter(function (n) { return ykPlanets.indexOf(n) >= 0; });

    // 1. Yogakaraka verse (Yoga Karakas chapter) — a standing role, like lordship.
    var yk = nodeYogakaraka(node, result, H);
    if (yk) {
      out.push({ t: 'it is a yogakaraka (BPHS, Yoga Karakas): in the ' + ord(yk.house) + ', a ' + yk.placement +
        ', linked by ' + yk.association + ' with ' + yk.lord + ', lord of the ' + ord(yk.lordOf) + ', a ' + yk.lordOfKind,
        w: FW_HEAVY, dasha: false });
    }

    // 2. Kujavat Ketu, Shanivat Rahu — inherit the proxy's favourable role.
    var proxy = NODE_PROXY[node];
    var proxyRole = functionalRoleOf(proxy, result, H).classical;
    var pKendra = proxyRole.ownedHouses.some(function (h) { return [4, 7, 10].indexOf(h) >= 0; });
    var pTrikona = proxyRole.ownedHouses.some(function (h) { return [5, 9].indexOf(h) >= 0; });
    var pDusthana = proxyRole.tags.indexOf('Dusthana') >= 0;
    var dictum = node === 'Rahu' ? 'Shanivat Rahu' : 'Kujavat Ketu';
    if (pKendra && pTrikona) {
      out.push({ t: dictum + ': ' + proxy + ' is the yogakaraka for this lagna, and ' + node + ' inherits that role', w: FW_HEAVY, dasha: false });
    } else if ((pTrikona || proxyRole.tags.indexOf('Lagna') >= 0) && !pDusthana) {
      out.push({ t: dictum + ': ' + proxy + ' is a functional benefic for this lagna, and ' + node + ' inherits that role', w: FW_LIGHT, dasha: false });
    }

    // 3. Rahu in an upachaya house (BPHS Ch. 55 v.3). The 3rd, 6th and 11th are
    // already credited by the malefic-in-Upachaya placement rule; the 10th is not.
    if (node === 'Rahu' && p.house === 10) {
      out.push({ t: 'Rahu in the 10th, an Upachaya house, gives favourable results (BPHS Ch. 55 v.3)', w: FW_LIGHT, dasha: false });
    }

    // 4. Dasha results (BPHS Ch. 57 v.16 for Ketu; Ch. 59 v.45 and Ch. 55 for
    // Rahu): the node's own periods turn auspicious when any of these hold.
    var exSign = Math.floor(H.Shadbala.EXALT[node] / 30);
    var lord = H.engine.SIGN_LORDS[p.signIndex];
    var rel = result.relationships[node] && result.relationships[node][lord];
    var conds = [];
    if (p.signIndex === exSign) conds.push('exalted in ' + p.sign);
    if (p.signIndex === NODE_OWN_SIGN[node]) conds.push('in its own sign ' + p.sign);
    if (beneficLinks.length) conds.push('joined or aspected by ' + list(beneficLinks));
    if (rel && rel.natural === 'Friend') conds.push('in a friendly sign (' + p.sign + ', ruled by ' + lord + ')');
    if (withYk.length) conds.push('conjoined with the yogakaraka ' + list(withYk));
    if (conds.length) {
      out.push({ t: 'its dasha periods tend to give auspicious results, being ' + list(conds) +
        ' (BPHS ' + (node === 'Ketu' ? 'Ch. 57 v.16' : 'Ch. 59 v.45, Ch. 55') + ')', w: FW_LIGHT, dasha: true });
    }
    return out;
  }

  // opts.activeLords ([{ lord, role }] — the MD/AD/PD chain in view) decides
  // which yogas count: a yoga delivers in the dasha of the planet forming it,
  // so its points are scored only while that planet is a lord of the period in
  // view, and it is listed as dormant (0 points) otherwise. Everything else in
  // the verdict is a standing condition and ignores the period.
  function balaFramework(entry, result, sb, H, opts) {
    if (!sb || !sb.results || !sb.context) return null;
    var activeRole = {};
    ((opts && opts.activeLords) || []).forEach(function (l) {
      activeRole[l.lord] = activeRole[l.lord] ? activeRole[l.lord] + ' and ' + l.role : l.role;
    });
    var periodLabel = (opts && opts.periodLabel) || '';
    var S = H.Shadbala, E2 = H.engine, ctx = sb.context;
    var beneficMap = ctx.beneficMap || DEFAULT_BENEFIC;
    var ascSign = result.ascendant.signIndex;
    var rels = result.relationships || {};

    function fl(lon) {
      lon = ((lon % 360) + 360) % 360;
      var d = lon % 30, deg = Math.floor(d), min = Math.floor((d - deg) * 60);
      return E2.SIGNS[Math.floor(lon / 30)] + ' ' + deg + '°' + (min < 10 ? '0' : '') + min + '′';
    }
    function norm(x) { return ((x % 360) + 360) % 360; }
    function classText(h) { return classesOf(h).map(function (c) { return CLASS_LABEL[c]; }).join(', '); }
    function houseText(h) { return 'house ' + h + ' (' + classText(h) + ')'; }
    function relOf(a, b) { return rels[a] && rels[a][b] ? rels[a][b] : null; }
    function dignityText(name) {
      var p = result.planets[name];
      var dg = H.dignityOf(name, p).map(function (d) { return d.full; });
      if (dg.length) return dg.join(', ');
      var tier = dispositorTier(name, p, result, H);
      return tier ? 'in a ' + tier.k + '’s sign (' + tier.lord + ')' : 'no special dignity';
    }
    function strengthText(name) {
      var r = sb.results[name];
      return r ? 'Shadbala ' + n2(r.rupa) + ' rupas, ' + n2(r.rupa / r.required) + '× its requirement' : 'no Shadbala (node)';
    }
    function stateOf(name) {
      var p = result.planets[name];
      var bits = [name + ' in ' + p.sign + ', ' + houseText(p.house), dignityText(name), strengthText(name)];
      if (p.retrograde && !NODES[name]) bits.push('retrograde');
      if (p.combustion && p.combustion.combust) bits.push('combust');
      return bits.join('; ');
    }
    function lordshipText(name) {
      var owned = H.housesOwnedBy(name, ascSign);
      if (!owned.length) return 'rules no house';
      return 'rules ' + list(owned.map(function (o) { return 'house ' + o.house + ' (' + o.sign + ': ' + classText(o.house) + ')'; }));
    }
    function cotenantsOf(name) {
      var s = result.planets[name].signIndex;
      return H.PLANET_ORDER.filter(function (n) { return n !== name && result.planets[n].signIndex === s; });
    }
    function signed(v) { return (v >= 0 ? '+' : '−') + n2(Math.abs(v)); }
    function aspectCalc(d) {
      var full = (d.from === 'Jupiter' || d.from === 'Mercury');
      return 'Angle ' + n1(d.angle) + '° gives an aspect value of ' + n2(Math.abs(d.value)) + '; ' +
        (full ? 'counted in full' : '÷ 4') + ' = ' + signed(d.weighted);
    }
    // Compound (panchadha) relation of one planet toward another, as a word.
    var REL_WORD = { 'Best Friend': 'Best friend', Friend: 'Friend', Neutral: 'Neutral', Enemy: 'Enemy', 'Worst Enemy': 'Bitter enemy' };
    function relWord(from, to) {
      var rel = result.relationships[from] && result.relationships[from][to];
      return (rel && REL_WORD[rel.panchadha]) || '';
    }
    // How an aspecting planet stands toward the sign it aspects: its own
    // dignity there first, else its compound relation to the sign's lord.
    // Interpretive only — neither Drik nor Bhava Drishti scores it.
    function signRelation(from, signIdx) {
      if (S.EXALT[from] != null) {
        var ex = Math.floor(S.EXALT[from] / 30);
        if (ex === signIdx) return 'Exaltation sign';
        if ((ex + 6) % 12 === signIdx) return 'Debilitation sign';
      }
      if (S.MOOLATRIKONA[from] && S.MOOLATRIKONA[from].sign === signIdx) return 'Moolatrikona sign';
      if (S.OWN_SIGNS[from] && S.OWN_SIGNS[from].indexOf(signIdx) >= 0) return 'Own sign';
      var word = relWord(from, E2.SIGN_LORDS[signIdx]);
      return word ? word + '’s sign' : '';
    }
    // For an aspect on a planet: how the aspecting planet regards the planet
    // itself, then the sign it falls in.
    function aspectRelation(from, to) {
      return [relWord(from, to), signRelation(from, result.planets[to].signIndex)].filter(Boolean).join(' · ');
    }

    var longitudes = {};
    sb.grahas.forEach(function (g) { longitudes[g] = result.planets[g].longitude; });
    var bhavaAll = S.bhavaBala({
      ascSign: ascSign, results: sb.results, longitudes: longitudes, beneficMap: beneficMap,
      ascLon: result.ascendant.longitude, mcLon: ctx.midheaven, isDay: ctx.isDay
    });

    var blocks = [], narr = [];

    // ---- Shadbala as a collapsible tree for the planet narrative ----
    // Each node: name, Virupas, the most it can score (max) where that is
    // fixed, and the classical minimum (B.V. Raman, after BPHS) where one
    // exists — the total, Sthana, Dig, Kala, Chesta and Ayana.
    var SB_MIN = {
      sthana: { Sun: 165, Moon: 133, Mars: 96, Mercury: 165, Jupiter: 165, Venus: 133, Saturn: 96 },
      dig: { Sun: 35, Moon: 50, Mars: 30, Mercury: 35, Jupiter: 35, Venus: 50, Saturn: 30 },
      kala: { Sun: 112, Moon: 100, Mars: 67, Mercury: 112, Jupiter: 112, Venus: 100, Saturn: 67 },
      chesta: { Sun: 50, Moon: 30, Mars: 40, Mercury: 50, Jupiter: 50, Venus: 30, Saturn: 40 },
      ayana: { Sun: 30, Moon: 40, Mars: 20, Mercury: 30, Jupiter: 30, Venus: 40, Saturn: 20 }
    };
    function shadbalaTree(name, r) {
      var sd = r.sthanaDetail, kd = r.kalaDetail;
      return {
        n: 'Shadbala', v: r.total, min: r.required * 60, note: 'Rank ' + r.rank + ' of 7', c: [
          { n: 'Sthana (positional)', v: r.sthana, min: SB_MIN.sthana[name], c: [
            { n: 'Uchcha', v: sd.uchcha, max: 60 },
            { n: 'Saptavargaja', v: sd.saptavargaja, max: 315, c: FW_VARGAS.map(function (k) {
              return { n: k + ' ' + E2.SIGNS[sd.vargas[k].sign], v: sd.vargas[k].value, max: 45 };
            }) },
            { n: 'Ojha-Yugma', v: sd.ojhayugma, max: 30 },
            { n: 'Kendradi', v: sd.kendradi, max: 60 },
            { n: 'Drekkana', v: sd.drekkana, max: 15 }
          ] },
          { n: 'Dig (directional)', v: r.dig, min: SB_MIN.dig[name], max: 60 },
          { n: 'Kala (temporal)', v: r.kala, min: SB_MIN.kala[name], c: [
            { n: 'Natonnata', v: kd.nathonnata, max: 60 },
            { n: 'Paksha', v: kd.paksha, max: 60 },
            { n: 'Tribhaga', v: kd.tribhaga, max: 60 },
            { n: 'Time lords', v: kd.abda + kd.masa + kd.vara + kd.hora, max: 150, c: [
              { n: 'Abda (year)', v: kd.abda, max: 15 }, { n: 'Masa (month)', v: kd.masa, max: 30 },
              { n: 'Vara (weekday)', v: kd.vara, max: 45 }, { n: 'Hora', v: kd.hora, max: 60 }
            ] },
            { n: 'Ayana', v: kd.ayana, min: SB_MIN.ayana[name], max: 60 }
          ] },
          { n: 'Chesta (motional)', v: r.chesta, min: SB_MIN.chesta[name], max: 60 },
          { n: 'Naisargika (natural)', v: r.naisargika, max: 60 },
          { n: 'Drik (aspectual)', v: r.drik, c: (r.drikDetail || []).map(function (d) {
            return { n: 'From ' + d.from, v: d.weighted, raw: d.value, note: aspectRelation(d.from, name), noteBelow: true };
          }) }
        ]
      };
    }

    // ---- What a planet carries: inputs, filters, delivery ----
    // Content travels one step: every other planet named here brings only its
    // own nature, lordships and placement, while its strength (its Shadbala)
    // already folds in whatever acts on it. Each input is paired with how much
    // it weighs and whether the planet's own Shadbala already counts it.
    var houseRank = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].sort(function (a, b) { return bhavaAll[b].total - bhavaAll[a].total; });
    function houseStrength(h) {
      var b = bhavaAll[h], lres = sb.results[b.lord];
      var bench = lres ? lres.required * 60 + FW_HOUSE_DIG_MID : null;
      return 'Bhava Bala ' + Math.round(b.total) + (bench ? ' (' + n2(b.total / bench) + '× its benchmark)' : '') +
        ', rank ' + (houseRank.indexOf(h) + 1) + ' of 12';
    }
    function planetWeight(n) {
      var pr = sb.results[n];
      return pr ? n + ' ' + n2(pr.rupa / pr.required) + '× its requirement, rank ' + pr.rank + ' of 7' : n + ' has no Shadbala (node)';
    }
    function identity(n) {
      return n + ' (' + KARAKA[n] + '), which ' + lordshipText(n) + ', from house ' + result.planets[n].house;
    }
    function tenantsOf(signIdx, except) {
      return H.PLANET_ORDER.filter(function (n) { return n !== except && result.planets[n].signIndex === signIdx; });
    }
    // A node's 7th aspect lands on the other node's sign; it counts only on
    // the other planets there, never on the other node (as in the network).
    function aspectorsOnto(signIdx, except) {
      return H.aspectsOntoSign(signIdx, result).filter(function (a) {
        if (a.planet === except) return false;
        if (!NODES[a.planet]) return true;
        var other = a.planet === 'Rahu' ? 'Ketu' : 'Rahu';
        return result.planets[other].signIndex !== signIdx ||
          tenantsOf(signIdx, other).some(function (n) { return n !== a.planet; });
      });
    }
    // Rising type of each sign (as in Bhava Bala) and each planet's age of
    // maturity (graha paka), as commonly cited in the Parashari tradition.
    var SIRSHODAYA_SIGNS = [2, 4, 5, 6, 7, 10], PRISHTODAYA_SIGNS = [0, 1, 3, 8, 9];
    var MATURITY_AGE = { Jupiter: 16, Sun: 22, Moon: 24, Venus: 25, Mars: 28, Mercury: 32, Saturn: 36, Rahu: 42, Ketu: 48 };
    var AV5_SHARE = { Bala: 'about a quarter of its results', Kumara: 'about half of its results', Yuva: 'its full results',
      Vriddha: 'very little of its results', Mrita: 'almost none of its results' };
    var CARRY_IN = [{ label: 'Input', width: '16%' }, { label: 'What it brings', width: '38%' },
      { label: 'How much it weighs', width: '26%' }, { label: 'Already in its Shadbala?', width: '20%' }];
    var CARRY_FILTER = [{ label: 'Filter', width: '16%' }, { label: 'Condition', width: '38%' }, { label: 'Effect on what it sends', width: '46%' }];
    var CARRY_OUT = [{ label: 'Target', width: '16%' }, { label: 'What arrives there', width: '38%' },
      { label: 'Strength of the contact', width: '20%' }, { label: 'Target’s capacity', width: '26%' }];

    function carriesBlock(name, pNumber, pRatio, received) {
      var p = result.planets[name], r = sb.results[name];
      var lord = E2.SIGN_LORDS[p.signIndex];
      var owned = H.housesOwnedBy(name, ascSign);
      var mt = S.MOOLATRIKONA[name];
      var inRows = [], filterRows = [], outRows = [];
      var inShort = [];

      // ---- 1. Inputs ----
      owned.forEach(function (o) {
        var sIdx = E2.SIGNS.indexOf(o.sign), b = bhavaAll[o.house];
        var ten = tenantsOf(sIdx, name);
        var asps = aspectorsOnto(sIdx, name);
        var dominant = mt && mt.sign === sIdx && owned.length > 1;
        inRows.push([
          'House it rules: ' + o.house,
          o.sign + ' (' + classText(o.house) + '): ' + HOUSE_TEXT[o.house] + '. ' +
            (ten.length ? 'With ' + list(ten.map(function (t) { return t + ' (' + KARAKA[t] + ')'; })) + ' in it.' : 'Empty.') +
            (asps.length ? ' Aspected by ' + list(asps.map(function (a) { return a.planet; })) + '.' : '') +
            (sIdx === p.signIndex ? ' It sits here itself.' : '') +
            ((H.ASPECT_HOUSES[name] || [7]).indexOf(((sIdx - p.signIndex + 12) % 12) + 1) >= 0 ? ' It aspects this house itself.' : '') +
            (dominant ? ' Its Moolatrikona sign, so this is its dominant lordship.' : ''),
          'The house without its lord’s share: ' + n2(b.total - b.adhipati) + ' Virupas (sign ' + n2(b.dig) + ', aspects ' + signed(b.drishti) +
            ', occupants ' + signed(b.occupation) + ', day-night ' + b.dayNight + ').' +
            ten.map(function (t) { return ' ' + planetWeight(t) + '.'; }).join(''),
          'No. Shadbala does not see lordship' + (ten.some(function (t) { return NODES[t]; }) ? ', and the nodes have no Shadbala.' : '.')
        ]);
        inShort.push('the ' + ord(o.house) + (ten.length ? ' (with ' + list(ten) + ')' : sIdx === p.signIndex ? '' : ' (empty)'));
      });
      if (!owned.length) inRows.push(['Houses it rules', 'None.', '—', '—']);
      inRows.push([
        'House it occupies: ' + p.house,
        p.sign + ' (' + classText(p.house) + '): ' + HOUSE_TEXT[p.house] + '.',
        houseStrength(p.house) + '.',
        r ? 'Partly. Kendradi (' + Math.round(r.sthanaDetail.kendradi) + ') and Dig (' + n2(r.dig) + ') score the position, not the house’s meaning or strength.'
          : 'No Shadbala.'
      ]);
      if (owned.every(function (o) { return o.house !== p.house; })) inShort.push('the ' + ord(p.house) + ' it sits in');
      var cot = tenantsOf(p.signIndex, name);
      cot.forEach(function (n) {
        var a = relOf(name, n), b2 = relOf(n, name);
        inRows.push([
          'Co-tenant: ' + n,
          cap(identity(n)) + '. ' + name + ' sees it as ' + (a ? a.panchadha : '—') + ', it sees ' + name + ' as ' + (b2 ? b2.panchadha : '—') + '.' +
            (result.planets[n].combustion && result.planets[n].combustion.combust ? ' ' + n + ' is combust.' : ''),
          planetWeight(n) + '.',
          'Only a planetary war (Yuddha).'
        ]);
      });
      if (!cot.length) inRows.push(['Co-tenants', 'None.', '—', '—']);
      else inShort.push('its co-tenant' + (cot.length > 1 ? 's ' : ' ') + list(cot));
      received.forEach(function (a) {
        var v = NODES[a.planet] ? null : S.sphutaDrishti(p.longitude - result.planets[a.planet].longitude, a.planet);
        inRows.push([
          'Aspect from ' + a.planet,
          cap(ord(a.aspect)) + ' aspect from ' + identity(a.planet) + '. A natural ' + (isNaturalBenefic(a.planet, beneficMap) ? 'benefic' : 'malefic') + '.',
          (v === null ? 'A sign aspect (a node has no degree value). ' : 'Aspect value ' + n2(v) + ' of 60. ') + planetWeight(a.planet) + '.',
          NODES[a.planet] ? 'No. The nodes are left out of Drik Bala.'
            : r ? 'The aspect value is, in Drik Bala; ' + a.planet + '’s own strength is not.' : 'No Shadbala.'
        ]);
      });
      if (!received.length) inRows.push(['Aspects received', 'None.', '—', '—']);
      else inShort.push('the aspect' + (received.length > 1 ? 's' : '') + ' of ' + list(received.map(function (a) { return a.planet; })));
      if (lord !== name) {
        inRows.push([
          'Dispositor: ' + lord,
          cap(identity(lord)) + '; ' + dignityText(lord) +
            (result.planets[lord].combustion && result.planets[lord].combustion.combust ? '; combust' : '') + '. It owns the sign, so it sets the conditions.',
          planetWeight(lord) + '.',
          r ? 'Only its relationship to ' + name + ' (Saptavargaja).' : 'No Shadbala.'
        ]);
        inShort.push('its dispositor ' + lord);
      }
      if (p.nakshatraLord && p.nakshatraLord !== name) {
        inRows.push([
          'Nakshatra lord: ' + p.nakshatraLord,
          p.nakshatra + (p.pada ? ' pada ' + p.pada : '') + ', ruled by ' + p.nakshatraLord + ' (' + KARAKA[p.nakshatraLord] + '). A finer colouring.',
          planetWeight(p.nakshatraLord) + '.',
          'No.'
        ]);
      }

      // ---- 2. Filters ----
      filterRows.push([
        'Its nature',
        name + ': ' + KARAKA[name] + '.',
        LORD_STYLE[name] ? cap(LORD_STYLE[name].replace('lends it', 'lends everything it carries')) + '.'
          : 'A node acts through its dispositor (' + lord + ') and the houses it touches; it amplifies what it carries.'
      ]);
      filterRows.push([
        'The sign',
        p.sign + ' (' + SIGN_TRAITS[p.sign] + ')' + (lord === name ? ', its own sign.' : ', ruled by ' + lord + '.'),
        'It delivers in ' + p.sign + '’s manner' + (lord === name ? ', at home.' : '; ' + lord + '’s condition (above) shapes it.')
      ]);
      var dg = H.dignityOf(name, p).map(function (d) { return d.k; });
      var exS = Math.floor(S.EXALT[name] / 30), debS = (exS + 6) % 12;
      var nb = p.signIndex === debS ? neechaBhangaFor(name, result, H) : null;
      var lRel = relOf(name, lord);
      filterRows.push([
        'Dignity',
        cap(dignityText(name)) + '.' + (nb ? ' Neecha Bhanga: ' + nb.reasons[0] + '.' : ''),
        dg.indexOf('deb') >= 0 ? 'Distorts what it sends' + (nb ? '; the cancellation restores part of it.' : '.')
          : (dg.indexOf('ex') >= 0 || dg.indexOf('mt') >= 0 || dg.indexOf('lord') >= 0) ? 'Delivers cleanly and with confidence.'
          : 'Delivers according to its ' + (lRel ? lRel.panchadha : 'Neutral') + ' relationship with ' + lord + '.'
      ]);
      filterRows.push([
        'Volume (Shadbala)',
        r ? n2(pRatio) + '× its requirement, rank ' + r.rank + ' of 7.' : 'No Shadbala.',
        !r ? 'Its force comes from its dispositor and the houses it touches.'
          : pNumber === 'Strong' ? 'Delivers forcefully.' : pNumber === 'Adequate' ? 'Delivers at ordinary strength.' : 'Delivers faintly.'
      ]);
      var ik = r && r.ishtaKashta;
      if (ik) {
        var ikGap = ik.ishta - ik.kashta, pct = Math.round(ik.ishta / (ik.ishta + ik.kashta) * 100);
        filterRows.push([
          'Tone (Ishta / Kashta)',
          'Ishta ' + n1(ik.ishta) + ', Kashta ' + n1(ik.kashta) + '.',
          'About ' + pct + '% of what it delivers feels easy and ' + (100 - pct) + '% hard; ' +
            (ikGap >= FW_ISHTA_LEAN ? 'it leans auspicious' : ikGap <= -FW_ISHTA_LEAN ? 'it leans difficult' : 'it leans neither way') +
            '. Felt most in its own periods.'
        ]);
      }
      var avBits = [];
      if (p.baladiAvastha) avBits.push('Av5 ' + p.baladiAvastha);
      if (!NODES[name]) {
        avBits.push('Av3 ' + S.jagratAvastha(name, p.signIndex, p.degree, rels));
        var av9 = S.deeptadiAvastha(name, p.signIndex, result.planets, rels, beneficMap);
        if (av9) avBits.push('Av9 ' + av9);
      }
      var av12 = S.shayanadiAvastha ? S.shayanadiAvastha(name, p.longitude, ctx) : null;
      if (av12) avBits.push('Av12 ' + av12);
      if (avBits.length) {
        filterRows.push([
          'Avasthas',
          avBits.join(', ') + '.',
          AV5_SHARE[p.baladiAvastha] ? 'By its Baladi state it gives ' + AV5_SHARE[p.baladiAvastha] + '.' : 'Its states colour how readily it gives results.'
        ]);
      }
      if (p.combustion && p.combustion.combust) {
        filterRows.push(['Combustion', 'Combust: ' + n1(p.combustion.separation) + '° from the Sun.', 'The Sun overshadows what it carries.']);
      }
      if (p.retrograde && !NODES[name]) {
        filterRows.push(['Motion', 'Retrograde.', 'Delivers in a delayed, revisited or unusual way.']);
      }
      var redirect = [];
      viparitaRajaYogas(result, H).forEach(function (y) { if (y.lord === name) redirect.push(y.name + ' (Viparita Raja Yoga)'); });
      if (nb) redirect.push('Neecha Bhanga');
      if (redirect.length) {
        var role = activeRole[name];
        filterRows.push([
          'Yogas',
          list(redirect) + ', ' + (role ? 'active: ' + name + ' is the ' + role + ' lord of the period in view.' : 'dormant until ' + name + '’s dasha.'),
          'Redirect the end result: the hardship it carries turns into gain, after it has been endured.'
        ]);
      }

      // Timing of results. Within its periods: by how its sign rises (head-first
      // early, hind-first late, Pisces throughout) and by its drekkana (1st
      // early, 2nd middle, 3rd late). Over a life: its age of maturity.
      var riseKind = SIRSHODAYA_SIGNS.indexOf(p.signIndex) >= 0 ? 'early' : PRISHTODAYA_SIGNS.indexOf(p.signIndex) >= 0 ? 'late' : 'middle';
      var riseText = p.sign + (riseKind === 'early' ? ' rises head-first (Sirshodaya)' : riseKind === 'late' ? ' rises hind-first (Prishtodaya)' : ' rises both ways (Ubhayodaya)');
      // Without a degree (e.g. a divisional placement) only the sign speaks.
      var hasDeg = typeof p.degree === 'number' && isFinite(p.degree);
      var dk = hasDeg ? Math.min(2, Math.floor(p.degree / 10)) : -1;
      var dkKind = hasDeg ? ['early', 'middle', 'late'][dk] : null;
      var whenText = !hasDeg ? cap(riseKind) + ' in its periods by its sign.'
        : riseKind === dkKind ? cap(riseKind) + ' in its periods: both point to the ' + { early: 'start', middle: 'middle', late: 'end' }[riseKind] + ' of its MD, AD and PD.'
        : 'Spread through its periods: ' + riseKind + ' by its sign, ' + dkKind + ' by its drekkana.';
      var mAge = MATURITY_AGE[name];
      var birthYear = ctx.sunrise ? ctx.sunrise.getFullYear() : null;
      filterRows.push([
        'Timing of results',
        riseText + (hasDeg ? ', and ' + fl(p.longitude).replace(p.sign + ' ', '') + ' is in its ' + ord(dk + 1) + ' drekkana' : '') +
          '. It matures at age ' + mAge + (birthYear ? ' (around ' + (birthYear + mAge) + ').' : '.'),
        whenText + ' Its full results come from age ' + mAge + '.'
      ]);

      // ---- 3. Delivery ----
      var outShort = [];
      (H.ASPECT_HOUSES[name] || [7]).forEach(function (dist) {
        var tSign = (p.signIndex + dist - 1) % 12, tHouse = ((tSign - ascSign + 12) % 12) + 1;
        var occ = tenantsOf(tSign, name);
        if (NODES[name]) {
          var otherNode = name === 'Rahu' ? 'Ketu' : 'Rahu';
          occ = occ.filter(function (n) { return n !== otherNode; });
          if (!occ.length) return;
        }
        var cuspD = bhavaAll[tHouse].drishtiDetail.filter(function (d) { return d.from === name; })[0];
        var contact = NODES[name] ? 'A sign aspect (a node has no degree value).'
          : 'Cusp ' + n2(cuspD ? Math.abs(cuspD.value) : 0) + ' of 60.' + occ.map(function (o) {
            return ' ' + o + ' ' + n2(S.sphutaDrishti(result.planets[o].longitude - p.longitude, name)) + '.';
          }).join('');
        outRows.push([
          cap(ord(dist)) + ' aspect: house ' + tHouse,
          E2.SIGNS[tSign] + ' (' + classText(tHouse) + '): ' + HOUSE_TEXT[tHouse] + '. ' +
            (occ.length ? 'Lands on ' + list(occ.map(function (o) { return o + ' (' + KARAKA[o] + ')'; })) + '.' : 'No planet there.'),
          contact,
          houseStrength(tHouse) + '.' + occ.map(function (o) { return ' ' + planetWeight(o) + '.'; }).join('')
        ]);
        outShort.push(String(tHouse));
      });
      owned.forEach(function (o) {
        if (o.house === p.house) return;
        outRows.push([
          'As lord: house ' + o.house,
          'Its whole condition (everything above) reaches the ' + ord(o.house) + ', which it rules: ' + HOUSE_TEXT[o.house] + '.',
          r ? 'Bhavadhipati Bala ' + n2(r.total) + '.' : 'Through its dispositor ' + lord + '.',
          houseStrength(o.house) + '.'
        ]);
      });
      if (!outRows.length) outRows.push(['None', 'It aspects no house with a planet in it and rules none.', '—', '—']);

      var dWord = dg.indexOf('deb') >= 0 ? 'debilitated' : dg.indexOf('ex') >= 0 ? 'exalted' : dg.indexOf('mt') >= 0 ? 'in its Moolatrikona'
        : dg.indexOf('lord') >= 0 ? 'in its own sign' : 'placed';
      var summary = name + ' takes in ' + list(inShort) + '. It filters them through being ' + dWord + ' in ' + p.sign +
        (r ? ', at ' + n2(pRatio) + '× strength' : '') + (ik ? ', with Ishta ' + n1(ik.ishta) + ' against Kashta ' + n1(ik.kashta) : '') +
        (outShort.length ? ', and delivers by aspect to house' + (outShort.length > 1 ? 's ' : ' ') + list(outShort) : '') + '.';
      return {
        kind: 'carries',
        heading: name + ': what it carries',
        summary: summary,
        groups: [
          { title: '1. What it takes in (each planet brings its own nature, lordships and placement; its strength already includes what acts on it)', headers: CARRY_IN, rows: inRows },
          { title: '2. How it filters what it carries', headers: CARRY_FILTER, rows: filterRows },
          { title: '3. Where it delivers', headers: CARRY_OUT, rows: outRows }
        ]
      };
    }

    // ======================= Planet =======================
    if (entry.kind === 'planet') {
      var name = entry.key, p = result.planets[name], r = sb.results[name];
      var lord = E2.SIGN_LORDS[p.signIndex];
      var cot = cotenantsOf(name);

      if (r) {
        var sd = r.sthanaDetail, kd = r.kalaDetail;
        var exPt = S.EXALT[name], debPt = norm(exPt + 180);
        var dgKeys = H.dignityOf(name, p).map(function (d) { return d.k; });
        var exSign = Math.floor(exPt / 30), debSign = (exSign + 6) % 12;

        // ---- 1. Sthana ----
        var sthana = [];
        sthana.push({
          dim: 'Dignity: Exaltation / Debilitation',
          cond: (dgKeys.indexOf('ex') >= 0 ? 'Exalted in ' + p.sign : dgKeys.indexOf('deb') >= 0 ? 'Debilitated in ' + p.sign : 'Neither exalted nor debilitated') +
            '. ' + n1(arc(p.longitude, exPt)) + '° from its exaltation point (' + fl(exPt) + ').',
          calc: 'Arc from the debilitation point (' + fl(debPt) + ') = ' + n2(arc(p.longitude, debPt)) + '°; ÷ 3',
          value: n2(sd.uchcha), comp: 'Uchcha Bala'
        });
        var d1v = sd.vargas.D1.value;
        sthana.push({
          dim: 'Dignity: Moolatrikona / Own sign',
          cond: dgKeys.indexOf('mt') >= 0 ? 'In its Moolatrikona band of ' + p.sign + '.'
            : dgKeys.indexOf('lord') >= 0 ? 'In its own sign, ' + p.sign + '.'
            : 'Neither. ' + p.sign + ' is ruled by ' + lord + '.',
          calc: d1v === 45 ? 'Moolatrikona in the rasi = 45' : d1v === 30 ? 'Own sign in the rasi = 30' : 'Scored by relationship instead (next row)',
          value: '', comp: 'Saptavargaja Bala'
        });
        var lordRel = relOf(name, lord);
        sthana.push({
          dim: 'Planet in signs: dispositor relationship',
          cond: lord === name ? 'It is its own dispositor.'
            : lord + ' is the dispositor. Compound relationship: ' + (lordRel ? lordRel.panchadha + ' (natural ' + lordRel.natural + ' + temporal ' + lordRel.temporary + ')' : 'Neutral') +
              '. The dispositor’s own state is not scored.',
          calc: 'D1 ' + p.sign + ' = ' + d1v, value: '', comp: 'Saptavargaja Bala'
        });
        var vargaFlags = [];
        FW_VARGAS.forEach(function (k) {
          if (k === 'D1') return;
          var vs = sd.vargas[k].sign;
          if (S.OWN_SIGNS[name].indexOf(vs) >= 0) vargaFlags.push(k + ' ' + E2.SIGNS[vs] + ' is its own sign');
          if (vs === exSign) vargaFlags.push(k + ' ' + E2.SIGNS[vs] + ' is its exaltation sign (scored only by relationship)');
          if (vs === debSign) vargaFlags.push(k + ' ' + E2.SIGNS[vs] + ' is its debilitation sign (scored only by relationship)');
        });
        if (p.vargottama) vargaFlags.push('Vargottama: same sign in D1 and D9');
        sthana.push({
          dim: 'Divisional dignity (D1, D2, D3, D7, D9, D12, D30)',
          cond: vargaFlags.length ? vargaFlags.join('. ') + '.' : 'No own, exaltation or debilitation sign in the other six vargas.',
          calc: FW_VARGAS.map(function (k) { return k + ' ' + E2.SIGNS[sd.vargas[k].sign] + ' ' + sd.vargas[k].value; }).join(' + '),
          value: n2(sd.saptavargaja), comp: 'Saptavargaja Bala'
        });
        var av3 = S.jagratAvastha(name, p.signIndex, p.degree, rels);
        sthana.push({
          dim: 'Avastha Av3 (Jagradadi)',
          cond: av3 + (av3 === 'Jagrat' ? ' (awake).' : av3 === 'Swapna' ? ' (dreaming).' : ' (asleep).') +
            ' By its natural relationship to ' + lord + (lordRel ? ' (' + lordRel.natural + ')' : '') + '.',
          calc: 'Own sign or exaltation Jagrat; natural friend or neutral Swapna; natural enemy or debilitation Sushupti. Not a separate term',
          value: '', comp: 'Saptavargaja Bala'
        });
        var av9 = S.deeptadiAvastha(name, p.signIndex, result.planets, rels, beneficMap);
        sthana.push({
          dim: 'Avastha Av9 (Deeptadi)',
          cond: av9 + '. By its compound relationship to ' + lord + (lordRel ? ' (' + lordRel.panchadha + ')' : '') + '.',
          calc: 'Same dignity basis as the rasi score (debilitation is Khala); not a separate term',
          value: '', comp: 'Saptavargaja (+ Uchcha)'
        });
        var evenStrong = (name === 'Moon' || name === 'Venus');
        var rasiOdd = p.signIndex % 2 === 0, navOdd = sd.vargas.D9.sign % 2 === 0;
        sthana.push({
          dim: 'Odd/even sign and navamsa vs planet gender',
          cond: p.sign + ' is an ' + (rasiOdd ? 'odd' : 'even') + ' sign; navamsa ' + E2.SIGNS[sd.vargas.D9.sign] + ' is ' + (navOdd ? 'odd' : 'even') +
            '. ' + name + ' gains in ' + (evenStrong ? 'even' : 'odd') + ' signs.',
          calc: ((evenStrong ? !rasiOdd : rasiOdd) ? 15 : 0) + ' (rasi) + ' + ((evenStrong ? !navOdd : navOdd) ? 15 : 0) + ' (navamsa)',
          value: n2(sd.ojhayugma), comp: 'Ojha-Yugma Bala'
        });
        var kTier = sd.kendradi === 60 ? 'Kendra' : sd.kendradi === 30 ? 'Panaphara' : 'Apoklima';
        var unscored = classesOf(p.house).filter(function (c) { return c !== 'kendra' && c !== 'upachaya'; }).map(function (c) { return CLASS_LABEL[c]; });
        sthana.push({
          dim: 'Own placement: Trikona / Dusthana / Kendra / Maraka',
          cond: 'House ' + p.house + ': ' + classText(p.house) + '.' + (unscored.length ? ' Its ' + list(unscored) + ' status is not scored.' : ''),
          calc: kTier + ' = ' + sd.kendradi + ' (Kendra 60, Panaphara 30, Apoklima 15)',
          value: n2(sd.kendradi), comp: 'Kendradi Bala'
        });
        var decan = Math.min(2, Math.floor(p.degree / 10)) + 1;
        var gender = ['Sun', 'Mars', 'Jupiter'].indexOf(name) >= 0 ? 'male' : (name === 'Moon' || name === 'Venus') ? 'female' : 'neuter';
        sthana.push({
          dim: 'Decanate vs planet gender',
          cond: 'In the ' + ord(decan) + ' drekkana. ' + name + ' is a ' + gender + ' planet, which gains in the ' +
            (gender === 'male' ? '1st' : gender === 'female' ? '2nd' : '3rd') + '.',
          calc: sd.drekkana ? 'Match = 15' : 'No match = 0', value: n2(sd.drekkana), comp: 'Drekkana Bala'
        });

        // ---- 2. Dig ----
        var mc = ctx.midheaven, asc = result.ascendant.longitude;
        var weak = (name === 'Sun' || name === 'Mars') ? norm(mc + 180)
          : (name === 'Jupiter' || name === 'Mercury') ? norm(asc + 180)
          : (name === 'Moon' || name === 'Venus') ? mc : asc;
        var digRows = [{
          dim: 'Own placement (house) and directional strength',
          cond: 'In house ' + p.house + '. ' + name + ' has full directional strength in the ' + ord(DIG_HOUSE[name]) +
            '; it is ' + n1(180 - arc(p.longitude, weak)) + '° from that peak point.',
          calc: 'Arc from the weakest point (' + fl(weak) + ') = ' + n2(arc(p.longitude, weak)) + '°; ÷ 3',
          value: n2(r.dig), comp: 'Dig Bala'
        }];

        // ---- 3. Kala ----
        var kala = [];
        var isDayPlanet = FW_DAY_STRONG.indexOf(name) >= 0;
        var hoursFromNoon = name === 'Mercury' ? null : 12 * (1 - (isDayPlanet ? kd.nathonnata : 60 - kd.nathonnata) / 60);
        var birthWord = ctx.isDay === true ? 'A day birth. ' : ctx.isDay === false ? 'A night birth. ' : '';
        kala.push({
          dim: 'Day or night birth',
          cond: birthWord + (name === 'Mercury' ? 'Mercury gains at all hours.' : name + ' gains ' + (isDayPlanet ? 'towards noon.' : 'towards midnight.')),
          calc: name === 'Mercury' ? 'Always 60'
            : 'Birth was ' + n2(hoursFromNoon) + ' h from local noon: ' + (isDayPlanet ? '' : '60 − ') + '60 × (1 − ' + n2(hoursFromNoon) + ' ÷ 12)',
          value: n2(kd.nathonnata), comp: 'Natonnata Bala'
        });
        var sunLon = result.planets.Sun.longitude, moonLon = result.planets.Moon.longitude;
        var elong = arc(moonLon, sunLon), waxing = norm(moonLon - sunLon) < 180;
        kala.push({
          dim: 'Waxing or waning Moon',
          cond: 'The Moon is ' + (waxing ? 'waxing (Shukla paksha)' : 'waning (Krishna paksha)') + ', ' + n1(elong) + '° from the Sun. ' +
            name + ' counts as a ' + (beneficMap[name] ? 'benefic' : 'malefic') + ' here.',
          calc: beneficMap[name] ? n2(elong) + ' ÷ 3' : '60 − ' + n2(elong) + ' ÷ 3',
          value: n2(kd.paksha), comp: 'Paksha Bala'
        });
        var tribLord = sb.grahas.filter(function (g) { return g !== 'Jupiter' && sb.results[g].kalaDetail.tribhaga === 60; })[0];
        kala.push({
          dim: 'Third of the day or night',
          cond: (tribLord ? 'This third of the ' + (ctx.isDay === false ? 'night' : 'day') + ' is ruled by ' + tribLord + '.' : 'The third could not be determined.') +
            (name === 'Jupiter' ? ' Jupiter always gains.' : ''),
          calc: kd.tribhaga ? 'Lord of the third (or Jupiter) = 60' : 'Not the lord = 0', value: n2(kd.tribhaga), comp: 'Tribhaga Bala'
        });
        kala.push({
          dim: 'Year, month, weekday and hora lords',
          cond: 'Year ' + ctx.varshaLord + ', month ' + ctx.masaLord + ', weekday ' + ctx.varaLord + ', hora ' + ctx.horaLord + '.',
          calc: kd.abda + ' (year, of 15) + ' + kd.masa + ' (month, of 30) + ' + kd.vara + ' (weekday, of 45) + ' + kd.hora + ' (hora, of 60)',
          value: n2(kd.abda + kd.masa + kd.vara + kd.hora), comp: 'Abda / Masa / Vara / Hora Bala'
        });
        var southStrong = (name === 'Moon' || name === 'Saturn');
        var tropLon = norm(p.longitude + (ctx.ayanamsa || 0));
        var isNorth = Math.sin(tropLon * Math.PI / 180) >= 0;
        kala.push({
          dim: 'North or south of the equator',
          cond: 'Tropical longitude ' + n1(tropLon) + '°: its point on the ecliptic is ' + (isNorth ? 'north' : 'south') + ' of the equator. ' +
            (name === 'Mercury' ? 'Mercury gains on either side.' : name + ' is strong in the ' + (southStrong ? 'south' : 'north') + '.') +
            ' The planet’s own latitude is not counted.',
          calc: name === 'Mercury' ? '30 × (1 + |sin ' + n1(tropLon) + '°|)'
            : '30 × (1 ' + (southStrong ? '−' : '+') + ' sin ' + n1(tropLon) + '°)',
          value: n2(kd.ayana), comp: 'Ayana Bala'
        });
        kala.push({
          dim: 'Co-tenants: planetary war',
          cond: r.yuddha ? (r.yuddha.role === 'winner' ? 'Wins a planetary war against ' : 'Loses a planetary war to ') + r.yuddha.opponent + ' (' + n2(r.yuddha.orb) + '° apart).'
            : (name === 'Sun' || name === 'Moon') ? 'The Sun and Moon never take part in a planetary war.'
            : 'No planet within 1°, so no planetary war.',
          calc: r.yuddha ? 'Flagged only; this app does not move Virupas for it' : '0',
          value: r.yuddha ? '—' : '0.00', comp: 'Yuddha Bala'
        });

        // ---- 4–5. Chesta, Naisargika ----
        var chestaRows = [{
          dim: 'Retrograde, stationary or direct motion',
          cond: name === 'Sun' ? 'The Sun never goes retrograde; it borrows its Ayana Bala.'
            : name === 'Moon' ? 'The Moon never goes retrograde; it borrows its Paksha Bala.'
            : (p.retrograde ? 'Retrograde.' : 'Direct.'),
          calc: name === 'Sun' ? '= Ayana Bala' : name === 'Moon' ? '= Paksha Bala'
            : name === 'Mars' ? 'Angle between the Sun and its heliocentric longitude ÷ 3 (fitted to Parashara’s Light)'
            : (name === 'Jupiter' || name === 'Saturn') ? 'Angle between the Sun and its heliocentric longitude, scaled up with its daily speed (×1.76 at top direct speed, ×1 in deep retrograde), ÷ 3 (fitted to Parashara’s Light)'
            : name === 'Venus' ? 'Its mean angle from the mean Sun plus 0.45 × its elongation, ÷ 3 (fitted to Parashara’s Light)'
            : 'Its mean angle from the mean Sun plus 1.6 × its elongation, ÷ 3 (fitted to Parashara’s Light; the loosest of the five, typically within 3–4 Virupas)',
          value: n2(r.chesta), comp: 'Chesta Bala'
        }];
        var naisRows = [{
          dim: 'Natural strength (luminosity)',
          cond: 'Fixed for every chart: the Sun is strongest, Saturn weakest.',
          calc: 'Fixed value', value: n2(r.naisargika), comp: 'Naisargika Bala'
        }];

        // ---- 6. Drik ----
        var drik = [];
        (r.drikDetail || []).forEach(function (d) {
          drik.push({
            dim: 'Aspect from ' + d.from,
            cond: cap(stateOf(d.from)) + '. Counts as a ' + (d.value >= 0 ? 'benefic' : 'malefic') + '; its own state is not scored.' +
              (aspectRelation(d.from, name) ? ' ' + aspectRelation(d.from, name) + ': read but not scored.' : ''),
            calc: aspectCalc(d), value: '', comp: 'Drik Bala'
          });
        });
        drik.push({
          dim: 'Net of aspects received',
          cond: (r.drikDetail || []).length ? 'Benefic aspects minus malefic aspects.' : 'No planet aspects it by degree.',
          calc: (r.drikDetail || []).map(function (d) { return signed(d.weighted); }).join(' ') || '0',
          value: n2(r.drik), comp: 'Drik Bala'
        });
        var aspecting = {};
        (r.drikDetail || []).forEach(function (d) { aspecting[d.from] = true; });
        cot.filter(function (n) { return !NODES[n] && !aspecting[n]; }).forEach(function (n) {
          drik.push({
            dim: 'Co-tenant ' + n + ' (conjunction)',
            cond: n + ' is ' + n1(arc(p.longitude, result.planets[n].longitude)) + '° away in ' + p.sign + '.',
            calc: 'A conjunction has an aspect value of 0', value: '', comp: 'Drik Bala'
          });
        });

        blocks.push({
          kind: 'bala',
          heading: name + ': Shadbala, qualitative and quantitative',
          summary: 'Total ' + n2(r.total) + ' Virupas = ' + n2(r.rupa) + ' rupas, ' + n2(r.rupa / r.required) + '× the ' + r.required +
            '-rupa requirement, rank ' + r.rank + ' of 7.' +
            (r.ishtaKashta ? ' Ishta ' + n2(r.ishtaKashta.ishta) + ', Kashta ' + n2(r.ishtaKashta.kashta) + '.' : ''),
          groups: [
            { title: '1. Sthana Bala (positional strength): ' + n2(r.sthana), rows: sthana },
            { title: '2. Dig Bala (directional strength): ' + n2(r.dig), rows: digRows },
            { title: '3. Kala Bala (temporal strength): ' + n2(r.kala), rows: kala },
            { title: '4. Chesta Bala (motional strength): ' + n2(r.chesta), rows: chestaRows },
            { title: '5. Naisargika Bala (natural strength): ' + n2(r.naisargika), rows: naisRows },
            { title: '6. Drik Bala (aspectual strength): ' + n2(r.drik), rows: drik }
          ]
        });
      } else {
        blocks.push({
          kind: 'note',
          heading: name + ': Shadbala, qualitative and quantitative',
          summary: 'Shadbala is defined only for the seven planets from the Sun to Saturn, so ' + name +
            ' has no Shadbala figures. Its reading rests entirely on the factors below.'
        });
      }

      // ---- Planet factors not covered ----
      var gaps = [];
      gaps.push({ dim: 'Lordship (Trikona / Dusthana / Kendra / Maraka)',
        cond: name + ' ' + lordshipText(name) + '.',
        note: 'Shadbala does not consider which houses a planet rules.' });
      gaps.push({ dim: 'Own placement: Trikona / Dusthana / Maraka',
        cond: 'House ' + p.house + ': ' + classText(p.house) + '.',
        note: 'Kendradi Bala only separates Kendra, Panaphara and Apoklima.' });
      gaps.push({ dim: 'Dispositor’s net state',
        cond: lord === name ? name + ' is in its own sign, so it is its own dispositor.' : cap(stateOf(lord)) + '; ' + lordshipText(lord) + '.',
        note: 'Saptavargaja scores only the relationship to the dispositor.' });
      if (r) {
        var vg = [];
        var exS = Math.floor(S.EXALT[name] / 30), debS = (exS + 6) % 12;
        FW_VARGAS.forEach(function (k) {
          var vs2 = r.sthanaDetail.vargas[k].sign;
          if (vs2 === exS) vg.push('exalted in ' + k);
          if (vs2 === debS) vg.push('debilitated in ' + k);
        });
        if (p.vargottama) vg.push('Vargottama');
        var nb = (p.signIndex === debS) ? neechaBhangaFor(name, result, H) : null;
        gaps.push({ dim: 'Exaltation or debilitation in divisional charts',
          cond: (vg.length ? cap(list(vg)) + '.' : 'None.') + (p.signIndex === debS ? (nb ? ' Neecha Bhanga applies: ' + nb.reasons[0] + '.' : ' No Neecha Bhanga found.') : ''),
          note: 'Uchcha Bala reads only the rasi degree; the vargas are scored by relationship.' });
      } else if (p.vargottama) {
        gaps.push({ dim: 'Divisional charts', cond: 'Vargottama: same sign in D1 and D9.', note: 'Not scored.' });
      }
      gaps.push({ dim: 'Avastha Av5 (Baladi)',
        cond: p.baladiAvastha ? p.baladiAvastha + '.' : 'Not available.',
        note: 'The degree-age state is not scored anywhere.' });
      var av12 = S.shayanadiAvastha ? S.shayanadiAvastha(name, p.longitude, ctx) : null;
      gaps.push({ dim: 'Avastha Av12 (Shayanadi)', cond: av12 ? av12 + '.' : 'Needs the moment of birth.', note: 'Not scored anywhere.' });
      var combText;
      if (name === 'Sun') {
        var burnt = H.PLANET_ORDER.filter(function (n) { var c = result.planets[n].combustion; return c && c.combust; });
        combText = 'Not applicable to the Sun itself. ' + (burnt.length ? 'The Sun combusts ' + list(burnt) + '.' : 'It combusts no planet in this chart.');
      } else if (!p.combustion) combText = 'Not applicable.';
      else combText = (p.combustion.combust ? 'Combust: ' : 'Not combust: ') + n1(p.combustion.separation) + '° from the Sun (orb ' + p.combustion.orb + '°).';
      gaps.push({ dim: 'Combustion', cond: combText, note: 'Not a Shadbala factor.' });
      gaps.push({ dim: 'Co-tenants: each pair’s compound relationship',
        cond: cot.length ? cot.map(function (n) {
          var a = relOf(name, n), b = relOf(n, name);
          return n + ' (' + n1(arc(p.longitude, result.planets[n].longitude)) + '° away): ' + name + ' sees it as ' + (a ? a.panchadha : '—') +
            ', it sees ' + name + ' as ' + (b ? b.panchadha : '—') +
            (result.planets[n].combustion && result.planets[n].combustion.combust ? '; ' + n + ' is combust' : '');
        }).join('. ') + '.' : 'No co-tenants.',
        note: 'Only a planetary war is scored, and a conjunction has no aspect value.' });
      var asp = H.aspectsOntoSign(p.signIndex, result).filter(function (a) { return a.planet !== name && cot.indexOf(a.planet) < 0 && !(NODES[name] && NODES[a.planet]); });
      gaps.push({ dim: 'Net state of the planets aspecting it',
        cond: asp.length ? asp.map(function (a) { return cap(ord(a.aspect)) + ' aspect from ' + stateOf(a.planet) + '; ' + lordshipText(a.planet); }).join('. ') + '.' : 'No planet aspects its sign.',
        note: 'Drik Bala uses only natural benefic or malefic status and the angle. Rahu and Ketu are left out of it.' });
      gaps.push({ dim: 'Nakshatra and its lord',
        cond: p.nakshatra + (p.pada ? ' pada ' + p.pada : '') + '; lord ' + p.nakshatraLord +
          (p.nakshatraLord !== name ? ' (' + stateOf(p.nakshatraLord) + ')' : ' (itself)') + '.',
        note: 'Not scored.' });
      // ---- Planet narrative: what the number rests on, and what it leaves out ----
      var pHelp = [], pHurt = [];
      var pRole = activeRole[name] || null, pHasYoga = false;
      H.housesOwnedBy(name, ascSign).forEach(function (o) {
        if (DUSTHANA.indexOf(o.house) >= 0) pHurt.push({ t: 'it rules the ' + ord(o.house) + ', a Dusthana', w: FW_HEAVY });
        else if (o.house === 1) pHelp.push({ t: 'it is the lagna lord', w: FW_HEAVY });
        else if (TRIKONA.indexOf(o.house) >= 0) pHelp.push({ t: 'it rules the ' + ord(o.house) + ', a Trikona', w: FW_HEAVY });
      });
      // Placement. Three classical exceptions turn a malefic's difficult house
      // to good account, so they replace the plain "sits in a Dusthana" penalty:
      // a natural malefic in the 3rd, 6th or 11th (Upachaya houses); Saturn, the
      // significator of longevity, in the 8th; Ketu, the significator of
      // liberation, in the 12th. The nature stays malefic — only the results turn.
      var pMalefic = !isNaturalBenefic(name, beneficMap);
      if (pMalefic && [3, 6, 11].indexOf(p.house) >= 0) {
        pHelp.push({ t: 'a natural malefic in the ' + ord(p.house) + ', an Upachaya house, gives favourable results', w: FW_LIGHT });
      } else if (name === 'Saturn' && p.house === 8) {
        pHelp.push({ t: 'Saturn in the 8th supports longevity (longevity only, so no points)', w: 0 });
      } else if (name === 'Ketu' && p.house === 12) {
        pHelp.push({ t: 'Ketu in the 12th supports liberation (spiritual, not material)', w: FW_LIGHT });
      } else if (DUSTHANA.indexOf(p.house) >= 0) {
        pHurt.push({ t: 'it sits in the ' + ord(p.house) + ', a Dusthana', w: FW_LIGHT });
      } else if (p.house === 5 || p.house === 9) {
        pHelp.push({ t: 'it sits in the ' + ord(p.house) + ', a Trikona', w: FW_LIGHT });
      }
      // Viparita Raja Yoga: a Dusthana lord in a Dusthana cancels its own harm.
      viparitaRajaYogas(result, H).forEach(function (y) {
        if (y.lord !== name) return;
        pHasYoga = true;
        pHelp.push({ t: y.name + ' (Viparita Raja Yoga): as lord of the ' + ord(y.dusthanaOwned) + ' in the ' + ord(y.lordHouse) + ', it cancels its own harm — ' +
          (pRole ? 'active' : 'dormant until ' + name + '’s dasha'), w: pRole ? FW_HEAVY : 0 });
      });
      // Rahu/Ketu: the classical conditions under which a node's results turn good.
      if (NODES[name]) {
        nodeFavourableFactors(name, result, H, beneficMap).forEach(function (fct) {
          if (!fct.dasha) { pHelp.push({ t: fct.t, w: fct.w }); return; }
          pHasYoga = true;
          pHelp.push({ t: fct.t + ' — ' + (pRole ? 'active' : 'dormant until ' + name + '’s dasha'), w: pRole ? fct.w : 0 });
        });
      }
      var nExS = Math.floor(S.EXALT[name] / 30), nDebS = (nExS + 6) % 12;
      // Neecha Bhanga is half condition, half yoga: the cancelled weakness always
      // counts (1), its Raja Yoga fruits only in the planet's own dasha (+1).
      if (p.signIndex === nDebS && neechaBhangaFor(name, result, H)) {
        pHasYoga = true;
        pHelp.push({ t: 'Neecha Bhanga cancels its debilitation — its Raja Yoga is ' +
          (pRole ? 'active' : 'dormant until ' + name + '’s dasha'), w: pRole ? FW_HEAVY : FW_LIGHT });
      }
      if (r) {
        var nD9 = r.sthanaDetail.vargas.D9.sign;
        if (nD9 === nDebS) pHurt.push({ t: 'it is debilitated in D9', w: FW_HEAVY });
        else if (nD9 === nExS) pHelp.push({ t: 'it is exalted in D9', w: FW_HEAVY });
      }
      if (p.vargottama) pHelp.push({ t: 'it is Vargottama', w: FW_LIGHT });
      if (p.baladiAvastha === 'Yuva') pHelp.push({ t: 'it is in Yuva (prime) avastha', w: FW_LIGHT });
      else if (p.baladiAvastha === 'Bala') pHurt.push({ t: 'it is in Bala (infant) avastha', w: FW_LIGHT });
      else if (p.baladiAvastha === 'Mrita') pHurt.push({ t: 'it is in Mrita (dead) avastha', w: FW_LIGHT });
      if (p.combustion && p.combustion.combust) pHurt.push({ t: 'it is combust', w: FW_HEAVY });
      else {
        var nMal = cot.filter(function (n) { return !isNaturalBenefic(n, beneficMap); });
        if (nMal.length) pHurt.push({ t: 'it shares its sign with the malefic' + (nMal.length > 1 ? 's ' : ' ') + list(nMal), w: FW_LIGHT });
      }
      if (lord !== name) {
        var nLp = result.planets[lord], nLd = H.dignityOf(lord, nLp).map(function (d) { return d.k; });
        if (nLd.indexOf('deb') >= 0) pHurt.push({ t: 'its dispositor ' + lord + ' is debilitated', w: FW_LIGHT });
        else if (nLd.length) pHelp.push({ t: 'its dispositor ' + lord + ' is strong by dignity', w: FW_LIGHT });
        if (DUSTHANA.indexOf(nLp.house) >= 0) pHurt.push({ t: 'its dispositor ' + lord + ' sits in the ' + ord(nLp.house) + ', a Dusthana', w: FW_LIGHT });
        else if (KENDRA.indexOf(nLp.house) >= 0 || TRIKONA.indexOf(nLp.house) >= 0) pHelp.push({ t: 'its dispositor ' + lord + ' is well placed in the ' + ord(nLp.house), w: FW_LIGHT });
      }
      var pGroups = [];
      if (r) {
        var nStr = [], nWeak = [], nSd = r.sthanaDetail, nKd = r.kalaDetail;
        if (nSd.vargas.D1.value === 45) nStr.push('its Moolatrikona sign');
        else if (nSd.vargas.D1.value === 30) nStr.push('its own sign');
        if (nSd.uchcha >= 45) nStr.push('closeness to its exaltation point');
        else if (nSd.uchcha <= 15) nWeak.push('closeness to its debilitation point');
        if (nSd.kendradi === 60) nStr.push('a Kendra placement');
        if (r.dig >= 45) nStr.push('near-peak directional strength');
        else if (r.dig <= 15) nWeak.push('very little directional strength');
        if (name !== 'Mercury') {
          if (nKd.nathonnata >= 45) nStr.push(ctx.isDay === false ? 'a night birth' : 'a day birth');
          else if (nKd.nathonnata <= 15) nWeak.push(ctx.isDay === false ? 'a night birth' : 'a day birth');
        }
        if (name !== 'Moon') {
          if (nKd.paksha >= 45) nStr.push('the lunar phase');
          else if (nKd.paksha <= 15) nWeak.push('the lunar phase');
        }
        if (nKd.tribhaga === 60 && name !== 'Jupiter') nStr.push('ruling the third of the ' + (ctx.isDay === false ? 'night' : 'day') + ' at birth');
        var nLords = [];
        if (nKd.abda) nLords.push('year'); if (nKd.masa) nLords.push('month'); if (nKd.vara) nLords.push('weekday'); if (nKd.hora) nLords.push('hora');
        if (nLords.length) nStr.push('being lord of the birth ' + list(nLords));
        if (nKd.ayana >= 45) nStr.push('its position north or south of the equator');
        else if (nKd.ayana <= 15) nWeak.push('its position north or south of the equator');
        if (name === 'Moon') {
          if (r.chesta >= 45) nStr.push('a bright Moon');
          else if (r.chesta <= 15) nWeak.push('a dark Moon');
        } else if (name !== 'Sun') {
          if (r.chesta >= 45) nStr.push(p.retrograde ? 'its retrograde motion' : 'its motion');
          else if (r.chesta <= 15) nWeak.push('little motional strength');
        }
        var nTop = (r.drikDetail || []).slice().sort(function (a, b) { return Math.abs(b.weighted) - Math.abs(a.weighted); })[0];
        if (r.drik >= 20) nStr.push(nTop && nTop.weighted > 0 ? nTop.from + '’s aspect' : 'benefic aspects');
        else if (r.drik <= -10) nWeak.push(nTop && nTop.weighted < 0 ? nTop.from + '’s aspect' : 'malefic aspects');
        // One item per line: "The strength comes from X", then "Y", "Z"…
        if (nStr.length) pGroups.push(['The strength comes from ' + nStr[0]].concat(nStr.slice(1).map(cap)));
        if (nWeak.length) pGroups.push(['It is held back by ' + nWeak[0]].concat(nWeak.slice(1).map(cap)));
      } else {
        pGroups.push([name + ' has no Shadbala, so there is no number to weigh', 'Its reading rests on the factors below']);
      }
      // graded on the figure as displayed (2 decimals), so 1.25× never reads as below 1.25
      var pRatio = r ? Math.round(r.rupa / r.required * 100) / 100 : null;
      var pNumber = !r ? null : pRatio >= FW_PLANET_STRONG ? 'Strong' : pRatio >= FW_PLANET_ADEQUATE ? 'Adequate' : 'Weak';
      var pPeriod = !pHasYoga ? '' : !periodLabel ? 'No dasha period is in view, so its dasha-dependent factors are dormant.'
        : 'Period in view: ' + periodLabel + '. ' + (pRole
          ? name + ' is its ' + pRole + ' lord, so its dasha-dependent factors count.'
          : name + ' is not a lord of this period, so its dasha-dependent factors are dormant.');
      // Ishta / Kashta Bala: shown under the number, active only in the planet's own periods.
      var pIshta = null;
      if (r && r.ishtaKashta) {
        var ik = r.ishtaKashta, ikGap = ik.ishta - ik.kashta;
        pIshta = {
          active: !!pRole,
          text: 'Ishta (' + n1(ik.ishta) + ') ' + (n1(ik.ishta) === n1(ik.kashta) ? '=' : ikGap > 0 ? '>' : '<') + ' Kashta (' + n1(ik.kashta) + ')',
          title: 'Its periods lean ' + (ikGap >= FW_ISHTA_LEAN ? 'auspicious' : ikGap <= -FW_ISHTA_LEAN ? 'difficult' : 'neither way') + '. ' +
            (pRole ? 'Active: ' + name + ' is the ' + pRole + ' lord of the period in view.' : 'Dormant until ' + name + '’s dasha.')
        };
      }
      narr.push({ kind: 'narrative', subject: 'planet', heading: name + ': Shadbala narrative', groups: pGroups, help: pHelp, hurt: pHurt, period: pPeriod, ishta: pIshta,
        total: r ? r.total : null, tree: r ? shadbalaTree(name, r) : null,
        verdict: fwVerdict(pNumber, r ? n2(pRatio) + '× its requirement' : '', pHelp, pHurt, r ? 'Rank ' + r.rank + ' of 7' : null),
        closing: (r && (pHelp.length || pHurt.length)) ? 'None of these appear in the ' + Math.round(r.total) + ' Virupas.' : '' });

      blocks.push({ kind: 'gap', heading: name + ': reading factors not covered by Shadbala or Bhava Bala', rows: gaps });
      // First of the detail blocks, right under the narratives.
      blocks.unshift(carriesBlock(name, pNumber, pRatio, asp));
    }

    // ======================= House =======================
    var house = entry.house, bb = bhavaAll[house];
    var signIdx = bb.sign, hLord = bb.lord, lordP = result.planets[hLord], lr = sb.results[hLord];
    var occupants = H.PLANET_ORDER.filter(function (n) { return result.planets[n].signIndex === signIdx; });
    var ranked = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].sort(function (a, b) { return bhavaAll[b].total - bhavaAll[a].total; });
    var hTitle = 'House ' + house + ' (' + E2.SIGNS[signIdx] + ')';

    var adhi = [];
    adhi.push({ dim: 'House lord’s overall strength',
      cond: hLord + ' rules ' + E2.SIGNS[signIdx] + '. ' + cap(strengthText(hLord)) + ', rank ' + lr.rank + ' of 7.',
      calc: 'Sthana ' + n2(lr.sthana) + ' + Dig ' + n2(lr.dig) + ' + Kala ' + n2(lr.kala) + ' + Chesta ' + n2(lr.chesta) +
        ' + Naisargika ' + n2(lr.naisargika) + ' + Drik ' + n2(lr.drik),
      value: n2(bb.adhipati), comp: 'Lord’s Shadbala total' });
    adhi.push({ dim: 'Lord’s dignity and divisional dignity',
      cond: cap(dignityText(hLord)) + '. The dispositor’s own state is not scored.',
      calc: 'Uchcha ' + n2(lr.sthanaDetail.uchcha) + ' + Saptavargaja ' + n2(lr.sthanaDetail.saptavargaja), value: '', comp: 'via Sthana Bala' });
    var fromHouse = ((lordP.house - house + 12) % 12) + 1;
    adhi.push({ dim: 'Lord’s placement',
      cond: 'In ' + houseText(lordP.house) + ' from the lagna, the ' + ord(fromHouse) + ' from its own house. Only the count from the lagna is scored.',
      calc: 'Kendradi ' + n2(lr.sthanaDetail.kendradi) + ' + Dig ' + n2(lr.dig), value: '', comp: 'via Sthana + Dig Bala' });
    adhi.push({ dim: 'Aspects the lord receives',
      cond: (lr.drikDetail || []).length ? 'From ' + list(lr.drikDetail.map(function (d) { return d.from + ' (' + (d.value >= 0 ? 'benefic' : 'malefic') + ')'; })) + '.' : 'None by degree.',
      calc: 'Drik ' + n2(lr.drik), value: '', comp: 'via Drik Bala' });
    adhi.push({ dim: 'Lord’s motion',
      cond: (hLord === 'Sun' || hLord === 'Moon') ? 'A luminary: never retrograde.' : (lordP.retrograde ? 'Retrograde.' : 'Direct.'),
      calc: 'Chesta ' + n2(lr.chesta), value: '', comp: 'via Chesta Bala' });
    adhi.push({ dim: 'Lord’s time-based strength',
      cond: 'Day or night birth, lunar phase, time lords and declination.',
      calc: 'Kala ' + n2(lr.kala), value: '', comp: 'via Kala Bala' });

    var digH = [{ dim: 'Nature of the sign on the cusp',
      cond: bb.cusp === null ? 'No cusp degree available.'
        : 'Cusp at ' + fl(bb.cusp) + ', a ' + BHAVA_TYPE_NAME[bb.signType] + ' sign: weakest at the ' + ord(bb.weakHouse) +
          ' cusp, strongest at the ' + ord(((bb.weakHouse + 5) % 12) + 1) + '.',
      calc: bb.cusp === null ? '' : 'Arc from the ' + ord(bb.weakHouse) + ' cusp (' + fl(bb.weakCusp) + ') = ' + n2(arc(bb.cusp, bb.weakCusp)) + '°; ÷ 3',
      value: n2(bb.dig), comp: 'Bhava Digbala' }];

    var dri = [];
    bb.drishtiDetail.forEach(function (d) {
      dri.push({ dim: 'Aspect from ' + d.from,
        cond: cap(stateOf(d.from)) + '. Counts as a ' + (d.value >= 0 ? 'benefic' : 'malefic') + '; its dignity and lordship are not scored.' +
          (signRelation(d.from, signIdx) ? ' ' + signRelation(d.from, signIdx) + ': read but not scored.' : ''),
        calc: aspectCalc(d), value: '', comp: 'Bhava Drishti Bala' });
    });
    dri.push({ dim: 'Net of aspects on the cusp',
      cond: bb.drishtiDetail.length ? 'Benefic aspects minus malefic aspects.' : 'No planet aspects the cusp by degree.',
      calc: bb.drishtiDetail.map(function (d) { return signed(d.weighted); }).join(' ') || '0',
      value: n2(bb.drishti), comp: 'Bhava Drishti Bala' });

    var occRows = [{ dim: 'Planets in the house',
      cond: occupants.length ? cap(list(occupants)) + '. Jupiter and Mercury add, the Sun, Mars and Saturn subtract; the Moon, Venus, Rahu and Ketu count nothing, and no occupant’s dignity is scored.' : 'Empty house.',
      calc: bb.occupationDetail.length ? bb.occupationDetail.map(function (o) { return o.planet + ' ' + (o.value > 0 ? '+' : o.value < 0 ? '−' : '') + Math.abs(o.value); }).join(', ') : '0',
      value: n2(bb.occupation), comp: 'Occupation (B.V. Raman)' }];
    var riseRows = [{ dim: 'How the sign rises vs day or night birth',
      cond: E2.SIGNS[signIdx] + ' is a ' + bb.rising + ' sign (rises ' + (bb.rising === 'Sirshodaya' ? 'head-first; gains in a day birth' : bb.rising === 'Prishtodaya' ? 'back-first; gains in a night birth' : 'both ways; gains only at twilight') + '). ' +
        (ctx.isDay === true ? 'A day birth.' : ctx.isDay === false ? 'A night birth.' : ''),
      calc: bb.dayNight ? 'Match = 15' : 'No match = 0', value: n2(bb.dayNight), comp: 'Day-Night (B.V. Raman)' }];

    blocks.push({
      kind: 'bala',
      heading: hTitle + ': Bhava Bala, qualitative and quantitative',
      summary: 'Total ' + n2(bb.total) + ' Virupas = ' + n2(bb.rupa) + ' rupas, rank ' + (ranked.indexOf(house) + 1) + ' of 12.',
      groups: [
        { title: '1. Bhavadhipati Bala (strength of the house lord): ' + n2(bb.adhipati), rows: adhi },
        { title: '2. Bhava Digbala (the sign on the cusp): ' + n2(bb.dig), rows: digH },
        { title: '3. Bhava Drishti Bala (aspects on the house): ' + n2(bb.drishti), rows: dri },
        { title: '4. Occupation: ' + n2(bb.occupation), rows: occRows },
        { title: '5. Day-Night: ' + n2(bb.dayNight), rows: riseRows }
      ]
    });

    // ---- House factors not covered ----
    var hg = [];
    hg.push({ dim: 'Lord’s placement counted from its own house',
      cond: hLord + ' is in the ' + ord(fromHouse) + ' from house ' + house + (DUSTHANA.indexOf(fromHouse) >= 0 ? ', a difficult position (6th, 8th or 12th from its house).' : '.'),
      note: 'Bhava Bala counts the lord’s placement from the lagna only.' });
    hg.push({ dim: 'Functional nature of the lord',
      cond: hLord + ' ' + lordshipText(hLord) + '.',
      note: 'Neither system considers which houses a planet rules.' });
    var pairBits = [];
    occupants.forEach(function (a, i) {
      occupants.slice(i + 1).forEach(function (b) {
        var x = relOf(a, b), y = relOf(b, a);
        pairBits.push(a + ' sees ' + b + ' as ' + (x ? x.panchadha : '—') + ', ' + b + ' sees ' + a + ' as ' + (y ? y.panchadha : '—'));
      });
    });
    hg.push({ dim: 'Occupants: dignity, lordship and relationships',
      cond: occupants.length ? occupants.map(function (n) { return cap(stateOf(n)) + '; ' + lordshipText(n); }).join('. ') + '.' +
        (pairBits.length ? ' Pairs: ' + pairBits.join('; ') + '.' : '') : 'Empty house.',
      note: 'The occupation factor is a flat ±60 for five planets.' });
    var nodeBits = [];
    ['Rahu', 'Ketu'].forEach(function (n) {
      if (result.planets[n].signIndex === signIdx) nodeBits.push(n + ' occupies the house');
    });
    var hAsp = H.aspectsOntoSign(signIdx, result).filter(function (a) { return occupants.indexOf(a.planet) < 0; });
    hAsp.forEach(function (a) { if (NODES[a.planet]) nodeBits.push(a.planet + ' aspects it from house ' + a.fromHouse); });
    hg.push({ dim: 'Rahu and Ketu', cond: nodeBits.length ? cap(list(nodeBits)) + '.' : 'Neither node occupies or aspects the house.',
      note: 'The nodes are excluded from Bhava Bala.' });
    hg.push({ dim: 'Net state of the planets aspecting the house',
      cond: hAsp.length ? hAsp.map(function (a) { return cap(ord(a.aspect)) + ' aspect from ' + stateOf(a.planet) + '; ' + lordshipText(a.planet); }).join('. ') + '.' : 'No planet aspects the sign.',
      note: 'Bhava Drishti uses only natural benefic or malefic status and the angle.' });
    var kar = KARAKA_OF_HOUSE[house] || [];
    hg.push({ dim: 'Condition of the house’s karaka',
      cond: kar.map(function (k) { return cap(stateOf(k)) + (result.planets[k].signIndex === signIdx ? ' (in the house it signifies)' : ''); }).join('. ') + '.',
      note: 'Not scored.' });
    var before = H.PLANET_ORDER.filter(function (n) { return result.planets[n].signIndex === (signIdx + 11) % 12; });
    var after = H.PLANET_ORDER.filter(function (n) { return result.planets[n].signIndex === (signIdx + 1) % 12; });
    function allTone(arr, want) { return arr.every(function (n) { return isNaturalBenefic(n, beneficMap) === want; }); }
    var kartari = (!before.length || !after.length) ? 'Not hemmed in: ' + (before.length || after.length ? 'planets on one side only' : 'both neighbouring houses are empty') + '.'
      : (allTone(before, true) && allTone(after, true)) ? 'Shubha Kartari: benefics on both sides (' + list(before) + ' behind, ' + list(after) + ' ahead).'
      : (allTone(before, false) && allTone(after, false)) ? 'Papa Kartari: malefics on both sides (' + list(before) + ' behind, ' + list(after) + ' ahead).'
      : 'Mixed: ' + list(before) + ' behind, ' + list(after) + ' ahead.';
    hg.push({ dim: 'House hemmed in by benefics or malefics (Kartari)', cond: kartari, note: 'Not scored.' });
    var bbHouse = ((2 * (house - 1)) % 12) + 1;
    if (bbHouse !== house) {
      var bbLord = E2.SIGN_LORDS[(ascSign + bbHouse - 1) % 12];
      hg.push({ dim: 'The house counted from itself (Bhavat Bhavam)',
        cond: 'House ' + bbHouse + ' is the ' + ord(house) + ' from the ' + ord(house) + '. Its lord: ' + stateOf(bbLord) + '.',
        note: 'Not scored.' });
    }
    hg.push({ dim: 'The house counted from the Moon',
      cond: E2.SIGNS[signIdx] + ' is the ' + ord(((signIdx - result.planets.Moon.signIndex + 12) % 12) + 1) + ' sign from the Moon.',
      note: 'Bhava Bala counts only from the lagna.' });
    hg.push({ dim: 'Sign quality on the cusp (movable / fixed / dual, element)',
      cond: E2.SIGNS[signIdx] + ': ' + H.MODALITY[signIdx % 3].name + ' (' + H.MODALITY[signIdx % 3].skt + '), ' + H.ELEMENT[signIdx % 4].name + '.',
      note: 'Only the human / quadruped / insect / watery type is used.' });
    hg.push({ dim: 'Ashtakavarga points and the house in divisional charts',
      cond: 'Not computed by this app.', note: 'Separate systems, not part of Bhava Bala.' });
    // ---- House narrative ----
    var hHelp = [], hHurt = [];
    var hLd = H.dignityOf(hLord, lordP).map(function (d) { return d.k; });
    if (hLd.indexOf('deb') >= 0) hHurt.push({ t: 'its lord ' + hLord + ' is debilitated', w: FW_HEAVY });
    if (house !== 1 && H.housesOwnedBy(hLord, ascSign).some(function (o) { return o.house === 1; })) hHelp.push({ t: 'its lord ' + hLord + ' is also the lagna lord', w: FW_HEAVY });
    if (DUSTHANA.indexOf(lordP.house) >= 0) hHurt.push({ t: 'its lord sits in the ' + ord(lordP.house) + ', a Dusthana', w: FW_LIGHT });
    else if (lordP.house === 5 || lordP.house === 9) hHelp.push({ t: 'its lord sits in the ' + ord(lordP.house) + ', a Trikona', w: FW_LIGHT });
    if (DUSTHANA.indexOf(fromHouse) >= 0) hHurt.push({ t: 'its lord is in the ' + ord(fromHouse) + ' from the house', w: FW_LIGHT });
    if (lordP.combustion && lordP.combustion.combust) hHurt.push({ t: 'its lord is combust', w: FW_HEAVY });
    kar.forEach(function (k) { if (result.planets[k].signIndex === signIdx) hHelp.push({ t: 'its karaka ' + k + ' sits in the house', w: FW_LIGHT }); });
    if (kartari.indexOf('Shubha') === 0) hHelp.push({ t: 'benefics flank it on both sides (Shubha Kartari)', w: FW_LIGHT });
    else if (kartari.indexOf('Papa') === 0) hHurt.push({ t: 'malefics flank it on both sides (Papa Kartari)', w: FW_LIGHT });
    // Natural malefics do well in the Upachaya houses (3rd, 6th, 10th, 11th), so
    // one sitting there helps the house — the counterpart of the planet-side
    // placement exception. The 10th counts here too: unlike the planet, the
    // house gets no Kendra credit for it, and the occupation factor has
    // already cost it 60 Virupas per malefic. A node in an Upachaya house is
    // credited the same way and is not counted as hurting it.
    var hUpachaya = UPACHAYA.indexOf(house) >= 0;
    occupants.forEach(function (n) {
      var op = result.planets[n], od = H.dignityOf(n, op).map(function (d) { return d.k; });
      if (hUpachaya && !isNaturalBenefic(n, beneficMap)) {
        hHelp.push({ t: 'its occupant ' + n + ' is a natural malefic in an Upachaya house', w: FW_LIGHT });
      }
      if (DIG_HOUSE[n] === house) hHelp.push({ t: n + ' has its full directional strength here', w: FW_LIGHT });
      if (od.indexOf('ex') >= 0) hHelp.push({ t: 'its occupant ' + n + ' is exalted', w: FW_HEAVY });
      if (od.indexOf('deb') >= 0) hHurt.push({ t: 'its occupant ' + n + ' is debilitated', w: FW_HEAVY });
      if (op.combustion && op.combustion.combust) hHurt.push({ t: 'its occupant ' + n + ' is combust', w: FW_HEAVY });
      var oDus = H.housesOwnedBy(n, ascSign).filter(function (o) { return DUSTHANA.indexOf(o.house) >= 0 && o.house !== house; }).map(function (o) { return ord(o.house); });
      if (oDus.length) hHurt.push({ t: 'its occupant ' + n + ' rules the ' + list(oDus) + (oDus.length > 1 ? ' (Dusthanas)' : ' (a Dusthana)'), w: FW_HEAVY });
    });
    nodeBits.forEach(function (b) {
      if (hUpachaya && b.indexOf(' occupies the house') >= 0) return;
      hHurt.push({ t: b, w: FW_LIGHT });
    });
    var hRank = ranked.indexOf(house) + 1;
    var hBench = lr.required * 60 + FW_HOUSE_DIG_MID;
    // graded on the figure as displayed (2 decimals), as for the planets
    var hRatio = Math.round(bb.total / hBench * 100) / 100;
    // The total and its parts, as a collapsible tree in place of a line per
    // component. Bhava Bala has no classical minimum, so the total is set
    // against the benchmark and the lord's share against its own requirement.
    var hTree = {
      n: 'Bhava Bala', v: bb.total, min: hBench, pctLabel: '% of benchmark', noMinLabel: 'no benchmark',
      note: 'Rank ' + hRank + ' of 12 · benchmark ' + Math.round(hBench) + ' = ' + hLord + '’s ' + Math.round(lr.required * 60) + ' + ' + FW_HOUSE_DIG_MID,
      c: [
        { n: 'Bhavadhipati (lord ' + hLord + ')', v: bb.adhipati, min: lr.required * 60, note: 'its Shadbala', c: [
          { n: 'Sthana', v: lr.sthana }, { n: 'Dig', v: lr.dig, max: 60 }, { n: 'Kala', v: lr.kala },
          { n: 'Chesta', v: lr.chesta, max: 60 }, { n: 'Naisargika', v: lr.naisargika, max: 60 }, { n: 'Drik', v: lr.drik }
        ] },
        { n: 'Bhava Digbala (' + E2.SIGNS[signIdx] + ' on the cusp)', v: bb.dig, max: 60 },
        { n: 'Bhava Drishti (aspects on the cusp)', v: bb.drishti, c: bb.drishtiDetail.map(function (d) {
          var rel = signRelation(d.from, signIdx);
          return { n: 'From ' + d.from, v: d.weighted, raw: d.value, note: rel, noteBelow: true };
        }) },
        { n: 'Occupation (Raman)', v: bb.occupation, c: bb.occupationDetail.map(function (o) {
          return { n: o.planet, v: o.value };
        }) },
        { n: 'Day-Night (Raman)', v: bb.dayNight, max: 15 }
      ]
    };
    var hNumber = hRatio >= FW_PLANET_STRONG ? 'Strong' : hRatio >= FW_PLANET_ADEQUATE ? 'Adequate' : 'Weak';
    narr.push({ kind: 'narrative', subject: 'house', heading: hTitle + ': Bhava Bala narrative', groups: [], help: hHelp, hurt: hHurt,
      total: bb.total, tree: hTree,
      verdict: fwVerdict(hNumber, n2(hRatio) + '× its benchmark', hHelp, hHurt, 'Rank ' + hRank + ' of 12'),
      closing: (hHelp.length || hHurt.length) ? 'None of these appear in the ' + Math.round(bb.total) + ' Virupas.' : '' });

    blocks.push({ kind: 'gap', heading: hTitle + ': house-reading factors Bhava Bala doesn’t cover', rows: hg });

    return { blocks: narr.concat(blocks) };
  }

  return {
    grahaChain: grahaChain, bhavaChain: bhavaChain,
    HOUSE_TEXT: HOUSE_TEXT, KARAKA: KARAKA, KARAKA_OF_HOUSE: KARAKA_OF_HOUSE,
    KALA_PURUSHA_HOUSE: KALA_PURUSHA_HOUSE, KALA_PURUSHA_PLANET: KALA_PURUSHA_PLANET,
    SIGN_TRAITS: SIGN_TRAITS, cotenantYogas: cotenantYogas, planetYogas: planetYogas,
    neechaBhangaFor: neechaBhangaFor,
    // House-number classification (Kendra/Trikona/Dusthana/Upachaya/Maraka),
    // exported under this name for the Houses tab's new column — `classesOf`
    // itself stays the short internal name used throughout this file.
    houseClassesOf: classesOf,
    // The Influence Engine (see the block above) — influenceEngineChart is
    // the one entry point a UI layer needs; the rest are exported too so a
    // caller that only wants one slice (e.g. just the VRY list for the
    // Strength tab) isn't forced to run the whole chart-wide computation.
    functionalRoleOf: functionalRoleOf,
    viparitaRajaYogas: viparitaRajaYogas,
    chartWideRajaYogas: chartWideRajaYogas,
    chartWideDhanaYogas: chartWideDhanaYogas,
    tripodImpact: tripodImpact,
    influenceEngineChart: influenceEngineChart, nabhashaYogas: nabhashaYogas,
    // Influence Framework additions — exported individually too, so a caller
    // that only wants one slice (e.g. the network overlay wanting a single
    // planet's functional-role-widened tone) isn't forced to run the whole
    // chart-wide computation.
    dispositorChain: dispositorChain,
    balaFramework: balaFramework,
    // The natural benefic/malefic fallback map every Influence Engine verdict
    // already reads (tripodImpact, Bhava Bala's Drishti
    // component) — exported so other renderers needing the same "nature of
    // this planet's influence" read (e.g. the South Indian network overlay's
    // arrowhead coloring) use this exact classification rather than a second,
    // possibly-drifting copy. Covers the seven grahas; Rahu/Ketu are always
    // natural malefics (isNaturalBenefic).
    DEFAULT_BENEFIC: DEFAULT_BENEFIC, isNaturalBenefic: isNaturalBenefic
  };
});
