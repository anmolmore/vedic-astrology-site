-- File uploads (R2-backed) plus full server-side persistence for the Workbook and My
-- Chart panels, which previously lived only in localStorage as base64 dataUrls.

CREATE TABLE uploads (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  context TEXT NOT NULL,              -- 'workbook-answer' | 'mychart-tab'
  context_ref TEXT NOT NULL,          -- '<workbookId>:<questionIndex>' or a mychart tab id
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT '',
  size_bytes INTEGER NOT NULL,
  r2_key TEXT NOT NULL,
  uploaded_at INTEGER NOT NULL,
  UNIQUE (user_id, context, context_ref)
);
CREATE INDEX idx_uploads_user ON uploads(user_id);

-- Custom "+ Add Document" workbooks only — the 3 built-in seeded workbooks stay hardcoded
-- in app.js (WORKBOOK_CONTENT), same as COURSE_CONTENT for lessons.
CREATE TABLE workbook_documents (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT '',
  blocks TEXT NOT NULL,               -- JSON array, same shape as the in-memory `blocks`
  created_at INTEGER NOT NULL
);

-- edited_at is TEXT, not an epoch: the client already formats it as a display-ready string
-- (toLocaleString) before saving, same as it always did — the server just stores/returns
-- whatever string it's given rather than reformatting it.
CREATE TABLE workbook_answers (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workbook_id TEXT NOT NULL,          -- built-in id OR workbook_documents.id
  question_index INTEGER NOT NULL,
  answer_text TEXT NOT NULL DEFAULT '',
  edited_by TEXT NOT NULL DEFAULT '',
  edited_at TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (user_id, workbook_id, question_index)
);

-- My Chart tabs carry a variable, growing shape (label/dot/question/answer/editedBy/editedAt
-- for a manually-added section; generated/planetName/sign/house/sentenceStarter/responses{10
-- sub-fields} for a "Generate Interpretation" section) — stored as one JSON blob rather than
-- rigid columns, same reasoning as workbook_documents.blocks. sort_order is pulled out as its
-- own column purely so drag-reorder can be queried/ordered without parsing every blob.
CREATE TABLE mychart_tabs (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_mychart_tabs_user ON mychart_tabs(user_id);
