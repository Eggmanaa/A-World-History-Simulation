-- Add field to track houses built this turn (for fertility limit)
ALTER TABLE civilizations ADD COLUMN houses_built_this_turn INTEGER DEFAULT 0;

-- This will be reset to 0 when timeline advances
