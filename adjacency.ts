// Adjacency map - which civilizations can interact
// This is the core constraint that drives classroom negotiation
export const CIV_ADJACENCY: Record<string, string[]> = {
  'egypt': ['cush', 'israel', 'carthage', 'mesopotamia', 'phoenicia'],
  'mesopotamia': ['egypt', 'assyria', 'persia', 'israel', 'anatolia'],
  'greece': ['crete', 'macedon', 'sparta', 'anatolia', 'phoenicia', 'carthage'],
  'rome': ['gaul', 'carthage', 'greece', 'macedon', 'germania'],
  'persia': ['mesopotamia', 'india', 'anatolia', 'assyria'],
  'china': ['india'], // distant trade route only
  'india': ['persia', 'china'],
  'carthage': ['rome', 'gaul', 'egypt', 'phoenicia'],
  'phoenicia': ['greece', 'carthage', 'israel', 'anatolia', 'egypt'],
  'germania': ['gaul', 'rome'],
  'sparta': ['greece', 'crete'],
  'anatolia': ['greece', 'persia', 'mesopotamia', 'phoenicia', 'assyria'],
  'crete': ['greece', 'sparta', 'egypt'],
  'gaul': ['rome', 'carthage', 'germania'],
  'macedon': ['greece', 'rome', 'anatolia'],
  'assyria': ['mesopotamia', 'persia', 'anatolia'],
  'cush': ['egypt'],
  'israel': ['egypt', 'mesopotamia', 'phoenicia'],
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
