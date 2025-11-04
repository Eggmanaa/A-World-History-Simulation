-- Add new fields for wonders, cultural bonuses, and achievements

-- Add new civilization fields
ALTER TABLE civilizations ADD COLUMN wonders TEXT; -- JSON array of wonder IDs
ALTER TABLE civilizations ADD COLUMN culture_buildings TEXT; -- JSON array of culture-specific building IDs  
ALTER TABLE civilizations ADD COLUMN cultural_bonuses TEXT; -- JSON array of unlocked bonus IDs
ALTER TABLE civilizations ADD COLUMN achievements TEXT; -- JSON array of achievement IDs
ALTER TABLE civilizations ADD COLUMN battles_survived INTEGER DEFAULT 0;
ALTER TABLE civilizations ADD COLUMN maps_conquered INTEGER DEFAULT 0;
ALTER TABLE civilizations ADD COLUMN religion_followers INTEGER DEFAULT 0; -- Count of maps following this civ's religion

-- Add achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  civ_id TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  earned_at INTEGER NOT NULL,
  year_earned INTEGER NOT NULL,
  FOREIGN KEY (civ_id) REFERENCES civilizations(id)
);

CREATE INDEX IF NOT EXISTS idx_achievements_civ ON achievements(civ_id);

-- Add religion spreading table
CREATE TABLE IF NOT EXISTS religion_spread (
  id TEXT PRIMARY KEY,
  simulation_id TEXT NOT NULL,
  religion_name TEXT NOT NULL,
  founder_civ_id TEXT NOT NULL,
  follower_civ_id TEXT NOT NULL,
  spread_at INTEGER NOT NULL,
  FOREIGN KEY (simulation_id) REFERENCES simulations(id),
  FOREIGN KEY (founder_civ_id) REFERENCES civilizations(id),
  FOREIGN KEY (follower_civ_id) REFERENCES civilizations(id)
);

CREATE INDEX IF NOT EXISTS idx_religion_spread_sim ON religion_spread(simulation_id);
CREATE INDEX IF NOT EXISTS idx_religion_spread_founder ON religion_spread(founder_civ_id);
