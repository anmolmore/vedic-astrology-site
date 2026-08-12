-- Per-user drag-and-drop planet placements on the chart, replacing the localStorage-only
-- userPlacements state in app.js that didn't sync across devices/browsers. One row per
-- placed planet, mirroring course_progress's per-user-row pattern.
CREATE TABLE chart_placements (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  planet TEXT NOT NULL,
  sign TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, planet)
);
