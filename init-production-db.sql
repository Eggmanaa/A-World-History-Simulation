-- Drop existing tables if they have wrong schema
DROP TABLE IF EXISTS alliances;
DROP TABLE IF EXISTS wars;
DROP TABLE IF EXISTS event_log;
DROP TABLE IF EXISTS civilizations;
DROP TABLE IF EXISTS simulations;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS periods;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS civ_presets;
DROP TABLE IF EXISTS civilization_presets;
DROP TABLE IF EXISTS game_state;

-- Create correct schema from migrations/0001_initial_schema.sql

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at INTEGER NOT NULL
);

-- Periods (class periods)
CREATE TABLE IF NOT EXISTS periods (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL,
  archived BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

-- Students
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  period_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (period_id) REFERENCES periods(id)
);

-- Simulations (one per period)
CREATE TABLE IF NOT EXISTS simulations (
  id TEXT PRIMARY KEY,
  period_id TEXT UNIQUE NOT NULL,
  current_year INTEGER NOT NULL DEFAULT -50000,
  timeline_index INTEGER NOT NULL DEFAULT 0,
  started_at INTEGER,
  paused BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (period_id) REFERENCES periods(id)
);

-- Civilizations (student civilizations)
CREATE TABLE IF NOT EXISTS civilizations (
  id TEXT PRIMARY KEY,
  simulation_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  
  -- Core Stats
  houses INTEGER NOT NULL DEFAULT 0,
  population INTEGER NOT NULL DEFAULT 0,
  population_capacity INTEGER NOT NULL DEFAULT 200,
  fertility INTEGER NOT NULL DEFAULT 2,
  industry INTEGER NOT NULL DEFAULT 5,
  industry_left INTEGER NOT NULL DEFAULT 5,
  martial INTEGER NOT NULL DEFAULT 5,
  defense INTEGER NOT NULL DEFAULT 5,
  science INTEGER NOT NULL DEFAULT 0,
  culture INTEGER NOT NULL DEFAULT 0,
  faith INTEGER NOT NULL DEFAULT 5,
  diplomacy INTEGER NOT NULL DEFAULT 0,
  
  -- Buildings
  temples INTEGER NOT NULL DEFAULT 0,
  amphitheaters INTEGER NOT NULL DEFAULT 0,
  walls INTEGER NOT NULL DEFAULT 0,
  archimedes_towers INTEGER NOT NULL DEFAULT 0,
  
  -- Cultural & Religious
  cultural_stage TEXT NOT NULL DEFAULT 'barbarism',
  wonder TEXT,
  religion_name TEXT,
  religion_tenants TEXT,
  writing TEXT,
  culture_tag TEXT,
  
  -- Traits & Regions
  traits TEXT,
  regions TEXT,
  bonus_features TEXT,
  
  -- Flags
  conquered BOOLEAN DEFAULT FALSE,
  locked_decline BOOLEAN DEFAULT FALSE,
  great_wall BOOLEAN DEFAULT FALSE,
  troy_wall_double BOOLEAN DEFAULT FALSE,
  alexandrian_bonus BOOLEAN DEFAULT FALSE,
  roman_split BOOLEAN DEFAULT FALSE,
  israel_bonus BOOLEAN DEFAULT FALSE,
  spartans_bonus BOOLEAN DEFAULT FALSE,
  
  -- Meta
  advance_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  
  FOREIGN KEY (simulation_id) REFERENCES simulations(id),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Alliances
CREATE TABLE IF NOT EXISTS alliances (
  id TEXT PRIMARY KEY,
  simulation_id TEXT NOT NULL,
  civ_id_1 TEXT NOT NULL,
  civ_id_2 TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (simulation_id) REFERENCES simulations(id),
  FOREIGN KEY (civ_id_1) REFERENCES civilizations(id),
  FOREIGN KEY (civ_id_2) REFERENCES civilizations(id)
);

-- Wars (combat history)
CREATE TABLE IF NOT EXISTS wars (
  id TEXT PRIMARY KEY,
  simulation_id TEXT NOT NULL,
  attacker_id TEXT NOT NULL,
  defender_id TEXT NOT NULL,
  attacker_martial INTEGER NOT NULL,
  defender_total INTEGER NOT NULL,
  winner_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (simulation_id) REFERENCES simulations(id),
  FOREIGN KEY (attacker_id) REFERENCES civilizations(id),
  FOREIGN KEY (defender_id) REFERENCES civilizations(id),
  FOREIGN KEY (winner_id) REFERENCES civilizations(id)
);

-- Event Log
CREATE TABLE IF NOT EXISTS event_log (
  id TEXT PRIMARY KEY,
  simulation_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  event_data TEXT,
  affected_civ_ids TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (simulation_id) REFERENCES simulations(id)
);

-- Civilization Presets
CREATE TABLE IF NOT EXISTS civ_presets (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  regions TEXT NOT NULL,
  historical_context TEXT,
  starting_traits TEXT,
  fertility INTEGER DEFAULT 2,
  population_capacity INTEGER DEFAULT 200,
  martial INTEGER DEFAULT 5,
  defense INTEGER DEFAULT 5,
  faith INTEGER DEFAULT 5,
  industry INTEGER DEFAULT 5,
  houses INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_periods_teacher ON periods(teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_period ON students(period_id);
CREATE INDEX IF NOT EXISTS idx_civilizations_simulation ON civilizations(simulation_id);
CREATE INDEX IF NOT EXISTS idx_civilizations_student ON civilizations(student_id);
CREATE INDEX IF NOT EXISTS idx_alliances_simulation ON alliances(simulation_id);
CREATE INDEX IF NOT EXISTS idx_wars_simulation ON wars(simulation_id);
CREATE INDEX IF NOT EXISTS idx_event_log_simulation ON event_log(simulation_id);
CREATE INDEX IF NOT EXISTS idx_event_log_year ON event_log(simulation_id, year);
