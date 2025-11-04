-- Add terrain system fields to civilizations and presets
-- Phase 2: Database Schema Updates for Terrain System

-- Add terrain-related fields to civilizations
ALTER TABLE civilizations ADD COLUMN water_resource TEXT DEFAULT 'lake'; -- Type of water resource (river, lake, lake_brackish, marsh, ocean, none)
ALTER TABLE civilizations ADD COLUMN terrain_data TEXT; -- JSON hex map data with coordinates and terrain types
ALTER TABLE civilizations ADD COLUMN is_island BOOLEAN DEFAULT FALSE; -- Island bonus: +7 defense

-- Add terrain fields to civilization presets
ALTER TABLE civ_presets ADD COLUMN water_resource TEXT DEFAULT 'lake'; -- Default water resource for this preset
ALTER TABLE civ_presets ADD COLUMN is_island BOOLEAN DEFAULT FALSE; -- Island civilizations get +7 defense
ALTER TABLE civ_presets ADD COLUMN terrain_template TEXT; -- Name of terrain template to use (e.g., 'Egypt', 'Greece')

-- Create index for faster terrain queries
CREATE INDEX IF NOT EXISTS idx_civilizations_water_resource ON civilizations(water_resource);
