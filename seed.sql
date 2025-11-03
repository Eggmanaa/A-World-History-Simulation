-- Civilization Presets Data
-- Based on historical civilizations from the game

INSERT OR IGNORE INTO civ_presets (id, name, display_name, regions, historical_context, starting_traits, fertility, population_capacity, martial, defense, faith, industry, houses, created_at) VALUES
-- Ancient Egypt
('egypt', 'egypt', 'Ancient Egypt', '["Egypt", "North Africa"]', 'One of the world''s oldest civilizations, Egypt flourished along the Nile River from 3100 BCE. Known for pyramids, pharaohs, and advanced architecture.', '["Industrious", "Wisdom"]', 2, 200, 5, 5, 10, 10, 0, 0),

-- Ancient Greece
('greece', 'greece', 'Ancient Greece', '["Greece", "Aegean"]', 'Birthplace of democracy, philosophy, and Western civilization. Greek city-states like Athens and Sparta shaped ancient history.', '["Intelligence", "Beauty"]', 2, 200, 7, 5, 5, 5, 0, 0),

-- Roman Empire
('rome', 'rome', 'Roman Empire', '["Italia", "Rome"]', 'One of history''s greatest empires, Rome dominated the Mediterranean world through military might and advanced governance.', '["Strength", "Industrious"]', 3, 250, 10, 8, 5, 8, 0, 0),

-- Ancient China
('china', 'china', 'Ancient China', '["China"]', 'Ancient Chinese civilization developed along the Yellow and Yangtze rivers, creating advanced technologies and philosophies.', '["Industrious", "Intelligence"]', 3, 250, 8, 6, 5, 10, 0, 0),

-- Ancient India
('india', 'india', 'Ancient India', '["India"]', 'The Indus Valley civilization was one of the world''s earliest urban cultures, later developing rich religious and philosophical traditions.', '["Wisdom", "Creativity"]', 3, 205, 6, 5, 10, 6, 0, 0),

-- Mesopotamia
('mesopotamia', 'mesopotamia', 'Mesopotamia', '["Mesopotamia", "Fertile Crescent"]', 'The cradle of civilization between the Tigris and Euphrates rivers. Home to Sumerians, Babylonians, and Assyrians.', '["Intelligence", "Industrious"]', 3, 200, 6, 5, 8, 8, 0, 0),

-- Persia
('persia', 'persia', 'Persian Empire', '["Persia"]', 'The Achaemenid Persian Empire became one of history''s largest empires under Cyrus the Great and Darius I.', '["Strength", "Beauty"]', 2, 200, 12, 6, 6, 6, 0, 0),

-- Phoenicia
('phoenicia', 'phoenicia', 'Phoenicia', '["Phoenicia"]', 'Master seafarers and traders of the Mediterranean. Phoenicians created the alphabet and founded Carthage.', '["Beauty", "Creativity"]', 2, 200, 5, 5, 5, 7, 0, 0),

-- Israel
('israel', 'israel', 'Ancient Israel', '["Israel"]', 'Ancient Hebrew civilization known for monotheistic religion and rich religious texts.', '["Wisdom", "Faith"]', 2, 200, 5, 5, 12, 5, 0, 0),

-- Sparta
('sparta', 'sparta', 'Sparta', '["Greece", "Laconia"]', 'Legendary warrior society of ancient Greece focused on military excellence and discipline.', '["Strength", "Health"]', 2, 200, 15, 10, 3, 4, 0, 0),

-- Anatolia (Hittites, Lydians, etc.)
('anatolia', 'anatolia', 'Anatolia', '["Anatolia"]', 'Home to many ancient civilizations including the Hittites, known for iron working and military power.', '["Strength", "Industrious"]', 2, 200, 8, 6, 5, 7, 0, 0),

-- Crete (Minoans)
('crete', 'crete', 'Minoan Crete', '["Crete", "Aegean"]', 'Advanced Bronze Age civilization known for palace complexes and maritime trade.', '["Beauty", "Creativity"]', 2, 200, 4, 4, 5, 6, 0, 0),

-- Gaul (Celts)
('gaul', 'gaul', 'Gaul', '["Gaul", "Celts"]', 'Celtic peoples of Western Europe known for warrior culture and resistance to Rome.', '["Strength", "Health"]', 2, 200, 8, 5, 4, 5, 0, 0),

-- Germania (Germanic Tribes)
('germania', 'germania', 'Germania', '["Germania", "Teutons"]', 'Germanic tribes that challenged and eventually conquered the Western Roman Empire.', '["Strength", "Health"]', 3, 200, 10, 6, 4, 4, 0, 0),

-- Carthage
('carthage', 'carthage', 'Carthage', '["Carthage", "North Africa"]', 'Phoenician colony that became a major Mediterranean power, rival to Rome.', '["Beauty", "Strength"]', 2, 200, 9, 7, 5, 7, 0, 0),

-- Macedonia
('macedon', 'macedon', 'Macedonia', '["Macedon", "Greece"]', 'Kingdom that produced Alexander the Great and briefly united the Greek world.', '["Strength", "Beauty"]', 2, 200, 12, 6, 5, 6, 0, 0),

-- Assyria
('assyria', 'assyria', 'Assyrian Empire', '["Assyria", "Mesopotamia"]', 'Powerful Neo-Assyrian Empire known for military prowess and administrative efficiency.', '["Strength", "Industrious"]', 2, 200, 12, 7, 5, 7, 0, 0),

-- Cush (Nubia)
('cush', 'cush', 'Kingdom of Kush', '["Cush", "Nubia"]', 'Ancient African kingdom south of Egypt, known for trade and military power.', '["Strength", "Health"]', 2, 200, 7, 6, 6, 6, 0, 0);
