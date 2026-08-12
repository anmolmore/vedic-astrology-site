CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  courses INTEGER NOT NULL DEFAULT 1,
  cosmic INTEGER NOT NULL DEFAULT 1,
  chart_selector INTEGER NOT NULL DEFAULT 1,
  flashcards INTEGER NOT NULL DEFAULT 1,
  workbook INTEGER NOT NULL DEFAULT 1,
  mychart INTEGER NOT NULL DEFAULT 1,
  journey INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- expires_at is a millisecond epoch INTEGER (not TEXT datetime) so it can be compared
-- against strftime('%s','now')*1000 without the ISO-vs-SQLite-datetime string-format
-- mismatch that breaks lexicographic comparison.
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

-- id is a TEXT id (not autoincrement) because the three seeded rows below are looked up
-- directly by id from COURSE_CONTENT in app.js (real video/PDF content is keyed on them);
-- newly-added rows get a generated id in the same style.
CREATE TABLE program_courses (
  id TEXT PRIMARY KEY,
  program TEXT NOT NULL,
  course_name TEXT NOT NULL DEFAULT '',
  file_name TEXT NOT NULL DEFAULT ''
);

CREATE TABLE user_programs (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  program TEXT NOT NULL,
  PRIMARY KEY (user_id, program)
);

CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_program_courses_program ON program_courses(program);

INSERT INTO program_courses (id, program, course_name, file_name) VALUES
  ('zodiac-intro',   'Trial', 'What is Astrology?',         'What is Astrology.mp4'),
  ('dignities-pdf',  '101',   'Planetary Dignities',         'Planetary dignities.pdf'),
  ('aspects-slides', '102',   'Predictive Astrology Basics', 'Predictive astrology basics.pptx');
