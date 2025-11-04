# Phase 2 Implementation Plan - UI & Integration

## Phase 1 Deployed ✅
- Complete game data system (wonders, cultural bonuses, writing, religion)
- Game mechanics utility functions (15+ functions)
- Wonder building API (`/api/wonders/*`)
- Religion founding/spreading API (`/api/religion/*`)
- Database schema with new tables
- Updated types and parsers

## Phase 2 Tasks

### 1. Student Wonder UI (High Priority)
**File**: `public/static/student-game.js`

**Features to Add**:
- "Build Wonder" button in actions panel
- Wonder selection modal showing:
  - All available wonders (Ancient, Classical, Late)
  - Culture-specific buildings (Ziggurat, Cothon, etc.)
  - Cost, requirements, and effects
  - Visual icons
  - Grayed out if already built or can't afford
- Wonder placement on map grid
- Wonder effects display in stats panel

**API Calls**:
```javascript
// Get available wonders
GET /api/wonders/list

// Get wonders built in simulation
GET /api/wonders/simulation/:simId

// Build a wonder
POST /api/wonders/build
{ civId, wonderId }
```

### 2. Student Religion UI (High Priority)
**File**: `public/static/student-game.js`

**Features to Add**:
- "Found Religion" button (appears after 1000 BCE)
- Faith leaderboard showing top 3
- Religion founding modal:
  - Religion name input
  - Tenet selection (2-3 tenets depending on Israel bonus)
  - Tenet descriptions and effects
  - Already-taken tenets grayed out
- "Spread Religion" button
- Target civilization selection
- Religion info display in stats panel

**API Calls**:
```javascript
// Get faith leaderboard
GET /api/religion/leaderboard/:simId

// Get available tenets
GET /api/religion/tenets

// Found religion
POST /api/religion/found
{ civId, religionName, tenetIds: [] }

// Spread religion
POST /api/religion/spread
{ founderId, targetId }

// Get religions in simulation
GET /api/religion/simulation/:simId
```

### 3. Student Stats Panel Updates (High Priority)
**File**: `public/static/student-game.js` - `renderStatsPanel()`

**Add Sections**:
- **Wonders Built**: List with icons
- **Culture Buildings**: Count of each type
- **Religion Info**: Name, tenets, followers
- **Cultural Bonuses**: List of unlocked bonuses
- **Writing System**: Current system and science bonus
- **Achievements**: Badges for earned achievements

### 4. Teacher Dashboard Updates (High Priority)
**File**: `public/static/teacher-dashboard.js`

**Add to Civilization Overview**:
- Wonders column showing icons
- Religion name and follower count
- Cultural bonuses count
- Achievements earned

**New Tabs/Sections**:
- **Wonders Tab**: List all wonders, who built them, effects
- **Religions Tab**: All religions, founders, tenets, spread map
- **Achievements Tab**: Leaderboard for various achievements

### 5. Growth/Advance Logic Updates (Critical)
**File**: `src/routes/teacher.ts` - advance endpoint

**Auto-Apply on Timeline Advance**:
```typescript
// Check and unlock cultural bonuses
const unlockedBonuses = getUnlockedBonuses(newYear, civ.regions)
for (const bonusId of unlockedBonuses) {
  if (!currentBonuses.includes(bonusId)) {
    civ = applyCulturalBonus(civ, bonusId)
    // Send notification to student
  }
}

// Apply science effects
civ = applyScienceEffects(civ)

// Auto-apply writing system if available
const writing = getWritingSystem(civ.regions)
if (writing && !civ.writing) {
  civ.writing = writing.id
  civ.science += writing.scienceBonus
}
```

### 6. Building System Updates (Medium Priority)
**File**: `src/routes/game.ts` - build endpoint

**Add Culture-Specific Buildings**:
```typescript
// Allow building Ziggurats, Cothons, Roman Forts, etc.
// Check cultural_bonuses for unlock flags
// Use culture_buildings array instead of wonders array
```

### 7. War/Conquest Updates (Medium Priority)
**File**: `src/routes/game.ts` - war endpoint

**Track Achievements**:
```typescript
// Increment maps_conquered
// Check for "Glory to Rome" (10 conquests)
// Set "Ozymandias" for first defeated
// Increment battles_survived for defender if wins
```

### 8. Notification System (Low Priority)
**New File**: `public/static/notifications.js`

**Toast Notifications For**:
- Cultural bonus unlocked
- Wonder built (by you or others)
- Religion founded
- Religion spread to you
- Achievement earned
- Writing system adopted

### 9. Visual Enhancements (Low Priority)
**Improvements**:
- Wonder icons on map (larger, colorful)
- Religion symbol display
- Cultural bonus badges
- Achievement medals
- Animated unlock effects
- Historical images for wonders

### 10. Documentation Updates
**Files to Update**:
- `README.md` - Add Phase 1 features
- API documentation for new endpoints
- Student guide for wonders and religion
- Teacher guide for new features

## Implementation Priority Order

### Week 1 (4-6 hours):
1. ✅ Student wonder building UI
2. ✅ Student religion founding UI
3. ✅ Update stats panel displays

### Week 2 (3-4 hours):
4. ✅ Teacher dashboard wonder/religion tracking
5. ✅ Growth logic updates (auto-apply bonuses)
6. ✅ Building system updates

### Week 3 (2-3 hours):
7. ✅ War/conquest achievement tracking
8. ✅ Notification system
9. ✅ Testing and bug fixes

### Week 4 (Optional):
10. ✅ Visual enhancements
11. ✅ Documentation
12. ✅ Historical accuracy review

## Testing Checklist

### Wonder System:
- [ ] Can build ancient wonders with industry
- [ ] Egyptian 30% cost reduction works
- [ ] Unique wonders can't be built twice
- [ ] Culture-specific buildings restricted correctly
- [ ] Great Pyramids give +20 to future wonders
- [ ] Wonder effects apply correctly

### Religion System:
- [ ] Only top 3 by faith can found
- [ ] Can't found before 1000 BCE
- [ ] Israel gets 3 tenets
- [ ] Tenets can't be duplicated
- [ ] Tenet effects apply correctly
- [ ] Religion spreading requires higher faith
- [ ] Follower count updates

### Cultural Bonuses:
- [ ] Bonuses unlock at correct years
- [ ] Only matching cultures get bonuses
- [ ] Bonus effects apply correctly
- [ ] Spartan multipliers work
- [ ] Greek per-house bonuses work

### Science Effects:
- [ ] Martial bonuses at levels 4, 9, 12
- [ ] Industry bonuses at levels 5, 9, 15
- [ ] Population capacity at levels 7, 16
- [ ] Faith bonus at level 10
- [ ] Archimedes unlocks at level 30

## Known Issues to Address

1. Map placement for wonders (size on grid)
2. Wonder construction animation/feedback
3. Religion spread visualization
4. Cultural bonus notification timing
5. Achievement popup design
6. Mobile responsiveness for new UI

## Backend Endpoints Summary

### Already Created:
- `GET /api/wonders/list`
- `GET /api/wonders/simulation/:simId`
- `POST /api/wonders/build`
- `GET /api/religion/tenets`
- `GET /api/religion/leaderboard/:simId`
- `POST /api/religion/found`
- `POST /api/religion/spread`
- `GET /api/religion/simulation/:simId`

### Need to Create:
- `GET /api/achievements/:civId`
- `POST /api/achievements/check`
- `GET /api/bonuses/:civId`
- `POST /api/writing/adopt`

## Database Queries Needed

### For Wonder Display:
```sql
SELECT wonders, culture_buildings FROM civilizations WHERE id = ?
```

### For Religion Leaderboard:
```sql
SELECT * FROM civilizations 
WHERE simulation_id = ? 
ORDER BY faith DESC 
LIMIT 10
```

### For Religion Spread Tracking:
```sql
SELECT * FROM religion_spread 
WHERE founder_civ_id = ?
```

### For Achievement Tracking:
```sql
SELECT * FROM achievements 
WHERE civ_id = ? 
ORDER BY earned_at DESC
```

## UI Mockup Notes

### Wonder Selection Modal:
```
┌─────────────────────────────────────┐
│  ⚡ Build Wonder                     │
├─────────────────────────────────────┤
│  Industry Available: 85             │
│                                     │
│  Ancient Wonders:                   │
│  ┌─────┐ ┌─────┐ ┌─────┐          │
│  │ 🔺  │ │ 🌳  │ │ 🧱  │          │
│  │ Pyr │ │ Gdn │ │ Wall│          │
│  │ 120 │ │ 100 │ │ 150 │          │
│  └─────┘ └─────┘ └─────┘          │
│                                     │
│  Culture Buildings:                 │
│  ┌─────┐ ┌─────┐                   │
│  │ 🏛️  │ │ ⚓  │                   │
│  │ Zig │ │Cothon│                  │
│  │  20 │ │  20 │                   │
│  └─────┘ └─────┘                   │
└─────────────────────────────────────┘
```

### Religion Founding Modal:
```
┌─────────────────────────────────────┐
│  ✨ Found Religion                   │
├─────────────────────────────────────┤
│  Faith Rank: #1 (Faith: 45)        │
│                                     │
│  Religion Name:                     │
│  [___________________________]      │
│                                     │
│  Select 2 Tenets:                   │
│  ☐ Holy War (+2 martial/map)       │
│  ☑ Polytheism (+2 faith/temple)    │
│  ☑ Holy Scriptures (2x faith)      │
│  ☐ Philosophy (faith→science)      │
│  ⊗ Monotheism (taken by Rome)      │
│                                     │
│  [  Found Religion  ] [ Cancel ]    │
└─────────────────────────────────────┘
```

## Success Metrics

### Phase 2 is complete when:
- ✅ Students can build all wonders through UI
- ✅ Students can found and spread religions
- ✅ Cultural bonuses auto-unlock at correct years
- ✅ Science effects apply automatically
- ✅ Teachers can see wonder/religion status
- ✅ Achievements track correctly
- ✅ All features tested and bug-free
- ✅ Documentation updated

## Educational Value Added

With Phase 2 complete, students will:
- Learn about famous historical wonders
- Understand religious development in ancient world
- See how technology (writing) progressed
- Experience cultural differences between civilizations
- Make strategic decisions about faith vs warfare
- Compete for achievements and recognition
- Engage with historical timeline events
