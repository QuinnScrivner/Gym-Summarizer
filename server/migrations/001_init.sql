PRAGMA foreign_keys = ON;

--canonical names to keep data clean
CREATE TABLE IF NOT EXISTS exercises (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  body_part TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- A session (date/time, notes) 
CREATE TABLE IF NOT EXISTS workouts (
  id INTEGER PRIMARY KEY,
  date TEXT NOT NULL,               -- ISO datetime
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- exercise, weight, reps, RPE
CREATE TABLE IF NOT EXISTS sets (
  id INTEGER PRIMARY KEY,
  workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL REFERENCES exercises(id),
  weight REAL NOT NULL,             -- lbs or kg (TBD in settings)
  reps INTEGER NOT NULL,
  rpe REAL,                         -- optional
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- daily body weight
CREATE TABLE IF NOT EXISTS body_weight_logs (
  id INTEGER PRIMARY KEY,
  date TEXT UNIQUE NOT NULL,        -- ISO date
  weight REAL NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- calories + macros per day 
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id INTEGER PRIMARY KEY,
  date TEXT UNIQUE NOT NULL,        -- ISO date
  calories INTEGER,
  protein REAL, carbs REAL, fat REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- weight goal, macro target
CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY,
  active INTEGER DEFAULT 1,         -- 1 active, 0 archived
  target_body_weight REAL,
  calories INTEGER,
  protein REAL, carbs REAL, fat REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_sets_exercise_date ON sets(exercise_id, created_at);
CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date);
