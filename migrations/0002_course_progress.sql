-- Per-user, per-course lesson progress, replacing the in-memory-only courseProgress/
-- viewedCourseIds state in app.js that used to reset on every login. A row's mere
-- existence means that course has been opened ("viewed"); media_done and
-- flashcards_flipped track the two halves of completion, mirrored from app.js's
-- ensureCourseProgress()/checkCourseCompletion().
CREATE TABLE course_progress (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  media_done INTEGER NOT NULL DEFAULT 0,
  flashcards_flipped TEXT NOT NULL DEFAULT '[]',
  completed INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, course_id)
);
