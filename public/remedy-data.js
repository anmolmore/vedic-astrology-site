// Remedy library — the wording of every step, kept apart from the rules in
// remedies.js so it can be edited without touching them.
//   stage: at-weakness | toward | direction | optional | period | tier
//   type:  behaviour | service | devotion
//   source: 'App convention' for steps this app proposes, 'Traditional
//   practice' for common Jyotish observances (no single text is claimed).
// Health wording stays general, and gemstones are deliberately absent.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.RemedyData = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var APP = 'App convention', TRAD = 'Traditional practice';
  function weak(planet, text) {
    return { id: 'weak-' + planet, planet: planet, stage: 'at-weakness', type: 'behaviour', text: text, source: APP };
  }
  function toward(target, text, from) {
    return { id: 'to-' + target + (from ? '-from-' + from : ''), stage: 'toward', target: target, from: from || null,
      type: 'behaviour', text: text, source: APP };
  }
  function direction(house, text) {
    return { id: 'dir-' + house, stage: 'direction', house: house, type: 'behaviour', text: text, source: APP };
  }
  function optional(planet, type, text) {
    return { id: 'opt-' + planet + '-' + type, planet: planet, stage: 'optional', type: type, text: text, source: TRAD };
  }
  function period(planet, text) {
    return { id: 'period-' + planet, planet: planet, stage: 'period', type: 'behaviour', text: text, source: APP };
  }
  function tier(name, text) {
    return { id: 'tier-' + name, tier: name, stage: 'tier', type: 'behaviour', text: text, source: APP };
  }

  return [
    weak('Sun', 'Do one thing each week without needing credit for it.'),
    weak('Moon', 'Notice when the need for order is really anxiety.'),
    weak('Mars', 'Set a stopping point before exhaustion.'),
    weak('Mercury', 'Finish one idea each week.'),
    weak('Jupiter', 'Choose one mentor or study path.'),
    weak('Venus', 'Keep one relationship that is purely enjoyable.'),
    weak('Saturn', 'Keep one small daily commitment at a fixed time.'),
    weak('Rahu', 'Pause before acting on a sudden urge.'),
    weak('Ketu', 'Give time alone a purpose and an end.'),

    toward('Sun', 'Share it with someone who will hold you to it.'),
    toward('Moon', 'Bring it home, with food you cooked and people you care for.'),
    toward('Mars', 'Attach it to walking, sport or garden work.'),
    toward('Mercury', 'Write a short plan before starting.'),
    toward('Jupiter', 'Check that it serves your values, not recognition.'),
    toward('Venus', 'Share it with your network.'),
    toward('Saturn', 'Give it a fixed routine.'),
    toward('Rahu', 'Try one new method on it.'),
    toward('Ketu', 'Set aside quiet time to reflect on it.'),
    toward('Jupiter', 'Give it ten minutes of writing or prayer.', 'Moon'),
    toward('Venus', 'End with music or the garden.', 'Moon'),
    toward('Moon', 'Bring what you learn into family conversation.', 'Jupiter'),
    toward('Venus', 'Share what you learn with your network.', 'Jupiter'),

    direction(1, 'Put your own name on the work.'),
    direction(4, 'Spend on home and garden with your partner.'),
    direction(7, 'Do it alongside a partner or colleague.'),
    direction(10, 'Do it where it can be seen.'),

    optional('Saturn', 'service', 'Saturday service to labourers and the elderly.'),
    optional('Saturn', 'devotion', 'Hanuman Chalisa; Aditya Hridayam at sunrise.'),
    optional('Mars', 'devotion', 'Tuesday Hanuman worship.'),
    optional('Mercury', 'devotion', 'Vishnu Sahasranama on Wednesdays.'),
    optional('Moon', 'devotion', 'Monday observance; care for elders.'),
    optional('Jupiter', 'devotion', 'Thursday study or teaching.'),
    optional('Venus', 'devotion', 'Friday observance; care for the women of the family.'),
    optional('Sun', 'devotion', 'Offering water to the rising Sun.'),
    optional('Rahu', 'devotion', 'Durga worship.'),
    optional('Ketu', 'devotion', 'Ganesha worship.'),

    tier('Favourable', 'Start something that can grow in this period.'),
    tier('Neutral', 'Finish work already started.'),
    tier('Hard', 'Take on responsibility, not risk, and keep health check-ups current.'),

    period('Sun', 'Take visible responsibility.'),
    period('Moon', 'Protect your sleep and routine at home.'),
    period('Mars', 'Direct energy into one physical or technical goal.'),
    period('Mercury', 'Publish the work you have built.'),
    period('Jupiter', 'Find a teacher or mentor, and commit to one direction.'),
    period('Venus', 'Invest in your partner and your network.'),
    period('Saturn', 'Follow your daily commitment without exception.'),
    period('Rahu', 'Test new ideas in small, reversible ways.'),
    period('Ketu', 'Keep one specialist focus, and give it a public outcome.')
  ];
});
