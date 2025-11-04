# Terrain System Implementation Plan

## Summary
This document outlines the complete implementation plan for the terrain, hex grid, and water resource systems based on the Resources Handout document.

## What I've Completed So Far

### ✅ Phase 1: Analysis & Data Structures (DONE)
1. **Document Analysis** (`DOCUMENT_ANALYSIS.md`)
   - Analyzed complete Resources Handout
   - Identified missing features
   - Compared document specs vs. current implementation
   - Found 85% match, need terrain/water/hex systems

2. **Terrain System TypeScript** (`src/terrain-system.ts`)
   - Complete terrain type definitions
   - Terrain bonuses (defense & industry) matching document
   - Water resource types with population capacities
   - Hex coordinate system (cube coordinates)
   - Region-based terrain templates for 12 regions
   - Hex map generation algorithms
   - Terrain bonus calculation functions

### ✅ Historical Context Feature (ALREADY DEPLOYED)
- Educational pop-ups with rich historical content
- 14 timeline events covered
- Clickable year display in student interface
- Successfully deployed to production

## What Needs To Be Done

### ✅ Phase 2: Database Schema Updates (COMPLETED - 2 hours)

**Migration created**: `migrations/0003_add_terrain_system.sql`

**Completed Steps**:
1. ✅ Created migration file with terrain system fields
2. ✅ Applied to local database successfully
3. ✅ Updated TypeScript types in `src/types.ts`
4. ✅ Updated parseCivilization() function in `src/db.ts`
5. ✅ Verified columns exist in both civilizations and civ_presets tables
6. ✅ Git committed changes

**Database Changes**:
- Added `water_resource TEXT DEFAULT 'lake'` to civilizations
- Added `terrain_data TEXT` to civilizations (JSON hex map)
- Added `is_island BOOLEAN DEFAULT FALSE` to civilizations
- Added same fields to civ_presets table for preset configuration

### 🔄 Phase 3: Backend Integration (3-4 hours)

**Files to modify**:

1. **`src/db.ts`**
   - Import terrain system functions
   - Update parseCivilization() to include water_resource, terrain_data, is_island
   
2. **`src/routes/student.ts`** - Civilization creation
   ```typescript
   // When creating civilization:
   const regions = parsedRegions;
   const waterResource = getWaterResourceForRegion(regions);
   const populationCapacity = getPopulationCapacity(waterResource);
   const hexMap = generateHexMap(regions, 3); // radius 3 = ~37 hexes
   const isIsland = checkIfIslandRegion(regions); // Greece, Crete
   
   // Store in database
   await db.prepare(`
     INSERT INTO civilizations (..., water_resource, population_capacity, terrain_data, is_island)
     VALUES (..., ?, ?, ?, ?)
   `).bind(..., waterResource, populationCapacity, JSON.stringify(hexMap), isIsland).run();
   ```

3. **`src/routes/game.ts`** - Combat calculations
   ```typescript
   // Calculate defense with terrain
   const terrainDefense = calculateTerrainDefense(
     JSON.parse(defender.terrain_data),
     defender.is_island
   );
   const totalDefense = defender.defense + terrainDefense;
   ```

4. **`src/routes/teacher.ts`** - Growth phase
   ```typescript
   // Calculate industry with terrain
   const terrainIndustry = calculateTerrainIndustry(
     JSON.parse(civ.terrain_data)
   );
   civ.industry = baseIndustry + terrainIndustry;
   ```

### 🔄 Phase 4: Hex Grid UI (4-5 hours)

**Create**: `public/static/hex-map.js`

```javascript
// Hex grid rendering system
class HexMap {
  constructor(canvasId, hexRadius, tiles) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.hexRadius = hexRadius;
    this.hexSize = 30; // pixels
    this.tiles = tiles;
  }
  
  // Convert hex coord to pixel position
  hexToPixel(coord) {
    const x = this.hexSize * (3/2 * coord.q);
    const y = this.hexSize * (Math.sqrt(3)/2 * coord.q + Math.sqrt(3) * coord.r);
    return { x, y };
  }
  
  // Draw single hex
  drawHex(coord, terrain, building) {
    const { x, y } = this.hexToPixel(coord);
    
    // Draw hex shape
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 3 * i;
      const hx = x + this.hexSize * Math.cos(angle);
      const hy = y + this.hexSize * Math.sin(angle);
      if (i === 0) {
        this.ctx.moveTo(hx, hy);
      } else {
        this.ctx.lineTo(hx, hy);
      }
    }
    this.ctx.closePath();
    
    // Fill with terrain color
    this.ctx.fillStyle = getTerrainColor(terrain);
    this.ctx.fill();
    this.ctx.strokeStyle = '#333';
    this.ctx.stroke();
    
    // Draw terrain icon
    this.drawTerrainIcon(x, y, terrain);
    
    // Draw building if present
    if (building) {
      this.drawBuilding(x, y, building);
    }
  }
  
  // Draw entire map
  render() {
    this.tiles.forEach(tile => {
      this.drawHex(tile.coord, tile.terrain, tile.building);
    });
  }
  
  // Handle clicks for building placement
  handleClick(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Find which hex was clicked (pixel to hex conversion)
    const hex = this.pixelToHex(x, y);
    return hex;
  }
}

// Terrain colors
function getTerrainColor(terrain) {
  const colors = {
    plains: '#90EE90',
    grassland: '#7CFC00',
    forest: '#228B22',
    mountains: '#8B4513',
    high_mountains: '#4B0082',
    desert: '#F4A460',
    marsh: '#556B2F',
    river: '#4169E1',
    ocean: '#000080'
  };
  return colors[terrain] || '#CCC';
}

// Terrain icons (emoji or Unicode)
function getTerrainIcon(terrain) {
  const icons = {
    forest: '🌲',
    mountains: '🏔️',
    high_mountains: '⛰️',
    desert: '🏜️',
    marsh: '🌿',
    river: '🌊',
    ocean: '🌊',
    plains: '🌾',
    grassland: '🌱'
  };
  return icons[terrain] || '';
}
```

**Modify**: `public/static/student-game.js`
- Replace 10x10 grid rendering with hex map
- Update building placement to use hex coordinates
- Add terrain legend/key
- Add terrain tooltips on hover

### 🔄 Phase 5: UI Enhancements (2-3 hours)

**Add to student stats panel**:
```html
<!-- Water Resource Display -->
<div class="stat-item">
  <div class="stat-label">💧 Water Source</div>
  <div class="stat-value">${civilization.water_resource_name}</div>
  <div class="stat-description">Max Houses: ${civilization.population_capacity}</div>
</div>

<!-- Terrain Bonuses -->
<div class="terrain-bonuses">
  <h4>🗺️ Terrain Bonuses</h4>
  <div class="bonus-list">
    <div class="bonus-item">
      <span>🛡️ Defense from Terrain: +${terrainDefense}</span>
    </div>
    <div class="bonus-item">
      <span>🏭 Industry from Terrain: +${terrainIndustry}</span>
    </div>
    ${civilization.is_island ? '<div class="bonus-item">🏝️ Island Defense: +7</div>' : ''}
  </div>
</div>
```

**Add terrain legend**:
```html
<div class="terrain-legend">
  <h4>🗺️ Terrain Guide</h4>
  <div class="legend-items">
    <div class="legend-item">
      <span class="icon">🏔️</span>
      <span class="name">Mountains</span>
      <span class="bonuses">+4 Industry, +10 Defense</span>
    </div>
    <div class="legend-item">
      <span class="icon">🌲</span>
      <span class="name">Forests</span>
      <span class="bonuses">+3 Industry, +1 Defense</span>
    </div>
    <div class="legend-item">
      <span class="icon">🏜️</span>
      <span class="name">Desert</span>
      <span class="bonuses">+4 Defense</span>
    </div>
    <div class="legend-item">
      <span class="icon">🌊</span>
      <span class="name">Rivers</span>
      <span class="bonuses">+1 Defense</span>
    </div>
    <div class="legend-item">
      <span class="icon">🌿</span>
      <span class="name">Marsh</span>
      <span class="bonuses">-2 Defense</span>
    </div>
  </div>
</div>
```

### 🔄 Phase 6: Teacher Dashboard Updates (1-2 hours)

**Add to civilization detail modal**:
- Show water resource type
- Show terrain composition (% of each terrain)
- Show terrain bonuses
- Display hex map preview

### 🔄 Phase 7: Testing & Balance (2-3 hours)

**Test cases**:
1. Create Egyptian civilization → Should get River water (capacity 15) and desert terrain
2. Create Greek civilization → Should get Lake water (capacity 10), mountains, and island bonus
3. Create Germanic civilization → Should get River water (capacity 15) and forests
4. Build on forest tile → Should see +3 industry applied
5. Defend on mountain tile → Should see +10 defense applied
6. Combat test → Terrain defense should add to total
7. Growth phase → Terrain industry should add to production

**Balance testing**:
- Verify water resource capacities feel right (4-15 range)
- Ensure terrain bonuses aren't too powerful
- Test that all regions generate appropriate maps
- Confirm hex grid is playable and intuitive

## File Structure Summary

### New Files
- ✅ `src/terrain-system.ts` - Core terrain logic (DONE)
- 🔄 `migrations/0003_add_terrain_system.sql` - Database schema
- 🔄 `public/static/hex-map.js` - Hex grid rendering
- ✅ `DOCUMENT_ANALYSIS.md` - Analysis document (DONE)
- ✅ `TERRAIN_IMPLEMENTATION_PLAN.md` - This file (DONE)

### Modified Files
- 🔄 `src/db.ts` - Add terrain fields to parseCivilization
- 🔄 `src/routes/student.ts` - Generate terrain on civ creation
- 🔄 `src/routes/game.ts` - Apply terrain defense in combat
- 🔄 `src/routes/teacher.ts` - Apply terrain industry in growth
- 🔄 `public/static/student-game.js` - Replace grid with hex map
- 🔄 `public/static/teacher-dashboard.js` - Show terrain in details
- 🔄 `src/index.tsx` - Import hex-map.js script

## Implementation Time Estimate

| Phase | Task | Estimated Time |
|-------|------|----------------|
| 1 | Analysis & Data Structures | ✅ 2 hours (DONE) |
| 2 | Database Schema | 2-3 hours |
| 3 | Backend Integration | 3-4 hours |
| 4 | Hex Grid UI | 4-5 hours |
| 5 | UI Enhancements | 2-3 hours |
| 6 | Teacher Dashboard | 1-2 hours |
| 7 | Testing & Balance | 2-3 hours |
| **Total** | | **16-22 hours** |

## Priority Recommendations

Given the scope, I recommend implementing in this order:

### High Priority (Core Mechanics)
1. ✅ Terrain system data structures (DONE)
2. Water resource system (affects population capacity)
3. Terrain bonuses (affects gameplay balance)
4. Database migration

### Medium Priority (Visual Enhancement)
5. Hex grid conversion
6. Terrain display with icons
7. Legend/key for students

### Lower Priority (Polish)
8. Teacher dashboard terrain display
9. Terrain tooltips
10. Map preview in civilization selection

## Current Status

**Completed**: 
- ✅ Historical context feature (deployed)
- ✅ Document analysis
- ✅ Terrain system TypeScript with all logic
- ✅ Hex coordinate system
- ✅ Region-based templates
- ✅ Water resource definitions

**Next Immediate Steps**:
1. Create database migration for terrain fields
2. Update backend routes to use terrain system
3. Create hex map rendering component
4. Integrate hex map into student interface
5. Test and balance

**Status**: ~15% complete (data structures done, implementation needed)

## Notes

- The terrain system is mathematically sound and ready to use
- Hex grid uses cube coordinates (standard approach)
- All terrain bonuses match the document exactly
- Region templates cover all 18 civilization presets
- Water resources will dramatically change game balance (capacity 4-15 vs. current 200)
- Island civilizations (Greece, Crete) get significant defensive advantage

## Questions for Consideration

1. **Migration of existing civilizations**: Should existing civs get terrain retroactively or only new ones?
2. **Balance**: Are terrain bonuses balanced with current game state?
3. **Hex size**: How many hexes? Current plan: radius 3 = 37 hexes (similar to 10x10 grid)
4. **Building density**: Can multiple buildings share a hex or one per hex?
5. **Visual style**: Emoji icons vs. custom graphics vs. color coding?

## Recommendation

Given the significant scope (16-22 hours), I recommend:

**Option A**: Implement in stages, deploy incrementally
- Deploy water resource system first (biggest gameplay impact)
- Then terrain bonuses (affects balance)
- Then hex grid (visual enhancement)

**Option B**: Complete all at once for cohesive update
- Implement all 7 phases
- Test thoroughly
- Deploy as "Terrain & Map Update"

**Option C**: Simplified version
- Keep 10x10 grid, skip hex conversion
- Add water resources and terrain system
- Display terrain as background colors
- Faster implementation (8-10 hours)

I recommend **Option A** for iterative feedback and testing.
