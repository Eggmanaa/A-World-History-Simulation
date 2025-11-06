-- Add terrain system columns to civilizations table
-- These columns support the hex-based terrain system

-- Add water resource type (determines population capacity)
ALTER TABLE civilizations ADD COLUMN water_resource TEXT DEFAULT 'lake';

-- Add terrain data (JSON array of hex tiles with terrain types)
ALTER TABLE civilizations ADD COLUMN terrain_data TEXT DEFAULT '[]';

-- Add island flag (provides +7 defense bonus)
ALTER TABLE civilizations ADD COLUMN is_island BOOLEAN DEFAULT FALSE;

-- Add tracking for houses built this turn (for fertility limit)
ALTER TABLE civilizations ADD COLUMN houses_built_this_turn INTEGER DEFAULT 0;

-- Add tracking for maps conquered and battles survived (for achievements)
ALTER TABLE civilizations ADD COLUMN maps_conquered INTEGER DEFAULT 0;
ALTER TABLE civilizations ADD COLUMN battles_survived INTEGER DEFAULT 0;

-- Add cultural bonuses and achievements columns
ALTER TABLE civilizations ADD COLUMN cultural_bonuses TEXT DEFAULT '[]';
ALTER TABLE civilizations ADD COLUMN achievements TEXT DEFAULT '[]';

-- Create achievements tracking table
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  civ_id TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  earned_at INTEGER NOT NULL,
  year_earned INTEGER,
  FOREIGN KEY (civ_id) REFERENCES civilizations(id)
);

CREATE INDEX IF NOT EXISTS idx_achievements_civ ON achievements(civ_id);