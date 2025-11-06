// Type definitions for the Through History game

export type Bindings = {
  DB: D1Database
  WEBSOCKET_ROOM: DurableObjectNamespace
}

// Teacher
export interface Teacher {
  id: string
  email: string
  password_hash: string
  name?: string
  created_at: number
}

// Period (Class Period)
export interface Period {
  id: string
  teacher_id: string
  name: string
  invite_code: string
  created_at: number
  archived: boolean
}

// Student
export interface Student {
  id: string
  email: string
  password_hash: string
  name: string
  period_id: string
  created_at: number
}

// Simulation
export interface Simulation {
  id: string
  period_id: string
  current_year: number
  timeline_index: number
  started_at?: number
  paused: boolean
}

// Civilization
export interface Civilization {
  id: string
  simulation_id: string
  student_id: string
  name: string
  color: string
  
  // Core Stats
  houses: number
  population: number
  population_capacity: number
  fertility: number
  industry: number
  industry_left: number
  martial: number
  defense: number
  science: number
  culture: number
  faith: number
  diplomacy: number
  
  // Buildings
  temples: number
  amphitheaters: number
  walls: number
  archimedes_towers: number
  
  // Cultural & Religious
  cultural_stage: 'barbarism' | 'classical' | 'imperial' | 'decline'
  wonder?: string
  religion_name?: string
  religion_tenants?: string[] // stored as JSON string
  writing?: string
  culture_tag?: string
  
  // Traits & Regions
  traits?: string[] // stored as JSON string
  regions?: string[] // stored as JSON string
  bonus_features?: string[] // stored as JSON string
  
  // New Features
  wonders?: string[] // stored as JSON string - IDs of wonders built
  culture_buildings?: string[] // stored as JSON string - IDs of culture-specific buildings
  cultural_bonuses?: string[] // stored as JSON string - IDs of unlocked bonuses
  achievements?: string[] // stored as JSON string - IDs of earned achievements
  battles_survived: number
  maps_conquered: number
  religion_followers: number
  map_data?: string // stored as JSON string
  
  // Terrain System
  water_resource?: string // Type of water resource (river, lake, lake_brackish, marsh, ocean, none)
  terrain_data?: string // stored as JSON string - hex map with coordinates and terrain types
  is_island?: boolean // Island bonus: +7 defense
  houses_built_this_turn?: number // Track houses built this turn for fertility limit
  
  // Flags
  conquered: boolean
  locked_decline: boolean
  great_wall: boolean
  troy_wall_double: boolean
  alexandrian_bonus: boolean
  roman_split: boolean
  israel_bonus: boolean
  spartans_bonus: boolean
  
  // Meta
  advance_count: number
  created_at: number
  updated_at: number
}

// Alliance
export interface Alliance {
  id: string
  simulation_id: string
  civ_id_1: string
  civ_id_2: string
  created_at: number
}

// War
export interface War {
  id: string
  simulation_id: string
  attacker_id: string
  defender_id: string
  attacker_martial: number
  defender_total: number
  winner_id: string
  year: number
  created_at: number
}

// Event Log
export interface EventLog {
  id: string
  simulation_id: string
  year: number
  event_type: string
  event_data?: any // stored as JSON string
  affected_civ_ids?: string[] // stored as JSON string
  created_at: number
}

// Civilization Preset
export interface CivPreset {
  id: string
  name: string
  display_name: string
  regions: string[] // stored as JSON string
  historical_context?: string
  starting_traits?: string[] // stored as JSON string
  fertility: number
  population_capacity: number
  martial: number
  defense: number
  faith: number
  industry: number
  houses: number
  created_at: number
  
  // Terrain System
  water_resource?: string // Default water resource for this preset
  is_island?: boolean // Island civilizations get +7 defense
  terrain_template?: string // Name of terrain template to use (e.g., 'Egypt', 'Greece')
}

// Timeline Event Structure
export interface TimelineEvent {
  year: number
  data: {
    growth?: boolean
    [key: string]: any
  }
}

// Trait types
export type Trait = 'Industrious' | 'Intelligence' | 'Strength' | 'Health' | 'Creativity' | 'Wisdom' | 'Beauty'

// Cultural stages
export type CulturalStage = 'barbarism' | 'classical' | 'imperial' | 'decline'
