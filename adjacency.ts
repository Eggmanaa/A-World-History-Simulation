// Adjacency map - which civilizations can interact
// This is the core constraint that drives classroom negotiation
export const CIV_ADJACENCY: Record<string, string[]> = {
  'egypt': ['cush', 'israel', 'carthage', 'mesopotamia', 'phoenicia', 'ethiopia'],
  'mesopotamia': ['egypt', 'assyria', 'persia', 'israel', 'anatolia'],
  'greece': ['crete', 'macedon', 'sparta', 'anatolia', 'phoenicia', 'carthage', 'troy'],
  'rome': ['gaul', 'carthage', 'greece', 'macedon', 'germania'],
  'persia': ['mesopotamia', 'india', 'china', 'anatolia', 'assyria', 'scythia'],
  'china': ['india', 'persia', 'korea', 'scythia'],
  'india': ['persia', 'china', 'cush', 'khmer'],
  'carthage': ['rome', 'gaul', 'egypt', 'phoenicia', 'olmec'],
  'phoenicia': ['greece', 'carthage', 'israel', 'anatolia', 'egypt', 'sparta'],
  'germania': ['gaul', 'rome', 'scythia'],
  'sparta': ['greece', 'crete', 'phoenicia', 'troy'],
  'anatolia': ['greece', 'persia', 'mesopotamia', 'phoenicia', 'assyria', 'troy'],
  'crete': ['greece', 'sparta', 'egypt'],
  'gaul': ['rome', 'carthage', 'germania'],
  'macedon': ['greece', 'rome', 'anatolia', 'troy'],
  'assyria': ['mesopotamia', 'persia', 'anatolia'],
  'cush': ['egypt', 'carthage', 'india', 'ethiopia'],
  'israel': ['egypt', 'mesopotamia', 'phoenicia'],
  // New civs
  'troy': ['greece', 'sparta', 'anatolia', 'macedon'],
  'scythia': ['persia', 'china', 'germania'],
  'olmec': ['carthage'],
  'korea': ['china', 'khmer'],
  'khmer': ['india', 'korea', 'china'],
  'ethiopia': ['egypt', 'cush'],
};

// Get adjacent civilization IDs for a given civ
export function getAdjacentCivs(civId: string): string[] {
  return CIV_ADJACENCY[civId] || [];
}

// Check if two civs are adjacent
export function areAdjacent(civId1: string, civId2: string): boolean {
  const adj = CIV_ADJACENCY[civId1];
  return adj ? adj.includes(civId2) : false;
}

// Dynamic adjacency unlocks (some connections open later in history)
export const DYNAMIC_ADJACENCY: { year: number; from: string; to: string; description: string }[] = [
  { year: -670, from: 'germania', to: 'rome', description: 'Germanic tribes reach Roman borders' },
  { year: 375, from: 'germania', to: 'rome', description: 'Barbarian Invasions intensify' },
];
