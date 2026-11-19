-- Public quiz counter. One row per (UTC day, mode); incremented atomically.
CREATE TABLE IF NOT EXISTS stats (
  day  TEXT NOT NULL,
  mode TEXT NOT NULL,
  n    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, mode)
);

-- Per-day spam limiter: salted hash of the client IP, deleted the next day. No raw IP is stored.
CREATE TABLE IF NOT EXISTS rl (
  day TEXT NOT NULL,
  h   TEXT NOT NULL,
  n   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, h)
);
