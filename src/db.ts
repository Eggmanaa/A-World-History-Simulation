// Database utility functions
import type { Civilization, CivPreset } from './types'

// Generate unique ID
export function generateId(): string {
  return crypto.randomUUID()
}

// Generate invite code (6 characters, uppercase alphanumeric)
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed confusing characters
  let code = ''
  const array = new Uint8Array(6)
  crypto.getRandomValues(array)
  for (let i = 0; i < 6; i++) {
    code += chars[array[i] % chars.length]
  }
  return code
}

// Hash password using Web Crypto API
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

// Parse JSON safely
export function parseJSON<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback
  try {
    return JSON.parse(str) as T
  } catch {
    return fallback
  }
}

// Get civilization stats with JSON parsing
export function parseCivilization(row: any): Civilization {
  return {
    ...row,
    traits: parseJSON(row.traits, []),
    regions: parseJSON(row.regions, []),
    bonus_features: parseJSON(row.bonus_features, []),
    religion_tenants: parseJSON(row.religion_tenants, []),
    wonders: parseJSON(row.wonders, []),
    culture_buildings: parseJSON(row.culture_buildings, []),
    cultural_bonuses: parseJSON(row.cultural_bonuses, []),
    achievements: parseJSON(row.achievements, []),
    battles_survived: row.battles_survived || 0,
    maps_conquered: row.maps_conquered || 0,
    religion_followers: row.religion_followers || 0,
    terrain_data: row.terrain_data ? parseJSON(row.terrain_data, []) : undefined,
    conquered: Boolean(row.conquered),
    locked_decline: Boolean(row.locked_decline),
    great_wall: Boolean(row.great_wall),
    troy_wall_double: Boolean(row.troy_wall_double),
    alexandrian_bonus: Boolean(row.alexandrian_bonus),
    roman_split: Boolean(row.roman_split),
    israel_bonus: Boolean(row.israel_bonus),
    spartans_bonus: Boolean(row.spartans_bonus),
    is_island: Boolean(row.is_island)
  }
}

// Parse civilization preset
export function parseCivPreset(row: any): CivPreset {
  return {
    ...row,
    regions: parseJSON(row.regions, []),
    starting_traits: parseJSON(row.starting_traits, [])
  }
}

// Get default civilization stats
export function getDefaultCivStats(): Partial<Civilization> {
  return {
    houses: 0,
    population: 0,
    population_capacity: 200,
    fertility: 2,
    industry: 5,
    industry_left: 5,
    martial: 5,
    defense: 5,
    science: 0,
    culture: 0,
    faith: 5,
    diplomacy: 0,
    temples: 0,
    amphitheaters: 0,
    walls: 0,
    archimedes_towers: 0,
    cultural_stage: 'barbarism',
    battles_survived: 0,
    maps_conquered: 0,
    religion_followers: 0,
    conquered: false,
    locked_decline: false,
    great_wall: false,
    troy_wall_double: false,
    alexandrian_bonus: false,
    roman_split: false,
    israel_bonus: false,
    spartans_bonus: false,
    advance_count: 0
  }
}
