// Hex Map Rendering System
// Uses cube coordinates for hex grid math

// Terrain visual configuration
const TERRAIN_CONFIG = {
  plains: {
    color: '#c9d1a5',
    icon: '🌾',
    name: 'Plains'
  },
  grassland: {
    color: '#88cc55',
    icon: '🌱',
    name: 'Grassland'
  },
  forest: {
    color: '#2d5016',
    icon: '🌲',
    name: 'Forest'
  },
  mountains: {
    color: '#8b7355',
    icon: '⛰️',
    name: 'Mountains'
  },
  high_mountains: {
    color: '#666666',
    icon: '🏔️',
    name: 'High Mountains'
  },
  desert: {
    color: '#f4e4c1',
    icon: '🏜️',
    name: 'Desert'
  },
  marsh: {
    color: '#6b8e6b',
    icon: '💧',
    name: 'Marsh'
  },
  river: {
    color: '#4a90d9',
    icon: '🌊',
    name: 'River'
  },
  ocean: {
    color: '#1e5a8e',
    icon: '🌊',
    name: 'Ocean'
  }
};

// Building icons
const BUILDING_ICONS = {
  house: '🏘️',
  temple: '🏛️',
  amphitheater: '🎭',
  wall: '🧱',
  archimedes_tower: '🗼'
};

class HexMap {
  constructor(containerId, tiles = []) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('Hex map container not found:', containerId);
      return;
    }
    
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);
    
    this.tiles = tiles;
    this.hexSize = 40; // Pixel radius of each hex
    this.buildings = {}; // Map of coord key -> building type
    this.selectedHex = null;
    this.hoveredHex = null;
    this.onHexClick = null; // Callback function
    
    // Set canvas size
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // Mouse events
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    
    // Initial render
    this.render();
  }
  
  resizeCanvas() {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;
    this.render();
  }
  
  // Convert cube coordinates to pixel coordinates
  cubeToPixel(q, r, s) {
    const x = this.hexSize * (3/2 * q);
    const y = this.hexSize * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
    return {
      x: this.centerX + x,
      y: this.centerY + y
    };
  }
  
  // Convert pixel coordinates to cube coordinates (approximate)
  pixelToCube(x, y) {
    const relX = x - this.centerX;
    const relY = y - this.centerY;
    
    const q = (2/3 * relX) / this.hexSize;
    const r = (-1/3 * relX + Math.sqrt(3)/3 * relY) / this.hexSize;
    const s = -q - r;
    
    return this.roundCube(q, r, s);
  }
  
  // Round fractional cube coordinates to nearest hex
  roundCube(fq, fr, fs) {
    let q = Math.round(fq);
    let r = Math.round(fr);
    let s = Math.round(fs);
    
    const q_diff = Math.abs(q - fq);
    const r_diff = Math.abs(r - fr);
    const s_diff = Math.abs(s - fs);
    
    if (q_diff > r_diff && q_diff > s_diff) {
      q = -r - s;
    } else if (r_diff > s_diff) {
      r = -q - s;
    } else {
      s = -q - r;
    }
    
    return { q, r, s };
  }
  
  // Draw a single hexagon
  drawHex(q, r, s, fillColor, strokeColor = '#333', lineWidth = 2) {
    const center = this.cubeToPixel(q, r, s);
    const corners = [];
    
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 180 * (60 * i - 30);
      corners.push({
        x: center.x + this.hexSize * Math.cos(angle),
        y: center.y + this.hexSize * Math.sin(angle)
      });
    }
    
    this.ctx.beginPath();
    this.ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < 6; i++) {
      this.ctx.lineTo(corners[i].x, corners[i].y);
    }
    this.ctx.closePath();
    
    this.ctx.fillStyle = fillColor;
    this.ctx.fill();
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = lineWidth;
    this.ctx.stroke();
  }
  
  // Draw text/icon on hex
  drawHexIcon(q, r, s, icon, fontSize = 24) {
    const center = this.cubeToPixel(q, r, s);
    this.ctx.font = `${fontSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(icon, center.x, center.y);
  }
  
  // Get coord key for buildings map
  getCoordKey(q, r, s) {
    return `${q},${r},${s}`;
  }
  
  // Find tile by coordinates
  findTile(q, r, s) {
    return this.tiles.find(t => 
      t.coord.q === q && t.coord.r === r && t.coord.s === s
    );
  }
  
  // Update tiles data
  setTiles(tiles) {
    this.tiles = tiles;
    this.render();
  }
  
  // Set buildings data
  setBuildings(buildings) {
    this.buildings = buildings || {};
    this.render();
  }
  
  // Add/update building on hex
  placeBuilding(q, r, s, buildingType) {
    const key = this.getCoordKey(q, r, s);
    this.buildings[key] = buildingType;
    this.render();
  }
  
  // Remove building from hex
  removeBuilding(q, r, s) {
    const key = this.getCoordKey(q, r, s);
    delete this.buildings[key];
    this.render();
  }
  
  // Main render function
  render() {
    if (!this.ctx) return;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw all tiles
    for (const tile of this.tiles) {
      const { q, r, s } = tile.coord;
      const terrain = tile.terrain || 'plains';
      const config = TERRAIN_CONFIG[terrain] || TERRAIN_CONFIG.plains;
      
      // Determine hex color
      let fillColor = config.color;
      let strokeColor = '#333';
      let lineWidth = 2;
      
      // Highlight selected hex
      if (this.selectedHex && 
          this.selectedHex.q === q && 
          this.selectedHex.r === r && 
          this.selectedHex.s === s) {
        strokeColor = '#ffd700';
        lineWidth = 4;
      }
      
      // Highlight hovered hex
      if (this.hoveredHex && 
          this.hoveredHex.q === q && 
          this.hoveredHex.r === r && 
          this.hoveredHex.s === s) {
        fillColor = this.lightenColor(fillColor, 20);
        strokeColor = '#ffeb3b';
        lineWidth = 3;
      }
      
      // Draw hex
      this.drawHex(q, r, s, fillColor, strokeColor, lineWidth);
      
      // Draw terrain icon (smaller)
      this.drawHexIcon(q, r, s, config.icon, 16);
      
      // Draw building if present
      const key = this.getCoordKey(q, r, s);
      if (this.buildings[key]) {
        const buildingIcon = BUILDING_ICONS[this.buildings[key]] || '🏘️';
        this.drawHexIcon(q, r, s, buildingIcon, 28);
      }
    }
  }
  
  // Lighten a hex color
  lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + 
      (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1);
  }
  
  // Handle mouse click
  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const coord = this.pixelToCube(x, y);
    const tile = this.findTile(coord.q, coord.r, coord.s);
    
    if (tile) {
      this.selectedHex = coord;
      this.render();
      
      if (this.onHexClick) {
        this.onHexClick(tile, coord);
      }
    }
  }
  
  // Handle mouse move (for hover effect)
  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const coord = this.pixelToCube(x, y);
    const tile = this.findTile(coord.q, coord.r, coord.s);
    
    if (tile) {
      // Check if hover changed
      if (!this.hoveredHex || 
          this.hoveredHex.q !== coord.q ||
          this.hoveredHex.r !== coord.r ||
          this.hoveredHex.s !== coord.s) {
        this.hoveredHex = coord;
        this.render();
        
        // Update tooltip
        this.showTooltip(e, tile);
      }
    } else {
      if (this.hoveredHex) {
        this.hoveredHex = null;
        this.render();
        this.hideTooltip();
      }
    }
  }
  
  // Show tooltip
  showTooltip(e, tile) {
    let tooltip = document.getElementById('hex-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'hex-tooltip';
      tooltip.style.position = 'fixed';
      tooltip.style.background = 'rgba(0, 0, 0, 0.9)';
      tooltip.style.color = 'white';
      tooltip.style.padding = '8px 12px';
      tooltip.style.borderRadius = '6px';
      tooltip.style.fontSize = '14px';
      tooltip.style.pointerEvents = 'none';
      tooltip.style.zIndex = '10000';
      tooltip.style.maxWidth = '200px';
      document.body.appendChild(tooltip);
    }
    
    const terrain = tile.terrain || 'plains';
    const config = TERRAIN_CONFIG[terrain] || TERRAIN_CONFIG.plains;
    
    // Get terrain bonuses
    const terrainBonuses = getTerrainBonuses(terrain);
    
    let html = `<strong>${config.icon} ${config.name}</strong><br>`;
    if (terrainBonuses.defense !== 0) {
      html += `Defense: ${terrainBonuses.defense > 0 ? '+' : ''}${terrainBonuses.defense}<br>`;
    }
    if (terrainBonuses.industry !== 0) {
      html += `Industry: ${terrainBonuses.industry > 0 ? '+' : ''}${terrainBonuses.industry}<br>`;
    }
    
    // Check for building
    const key = this.getCoordKey(tile.coord.q, tile.coord.r, tile.coord.s);
    if (this.buildings[key]) {
      html += `<br><strong>🏗️ ${this.buildings[key]}</strong>`;
    }
    
    tooltip.innerHTML = html;
    tooltip.style.left = (e.clientX + 10) + 'px';
    tooltip.style.top = (e.clientY + 10) + 'px';
    tooltip.style.display = 'block';
  }
  
  // Hide tooltip
  hideTooltip() {
    const tooltip = document.getElementById('hex-tooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }
}

// Helper function to get terrain bonuses
function getTerrainBonuses(terrain) {
  const bonuses = {
    plains: { defense: 0, industry: 0 },
    grassland: { defense: 0, industry: 0 },
    forest: { defense: 1, industry: 3 },
    mountains: { defense: 10, industry: 4 },
    high_mountains: { defense: 15, industry: 2 },
    desert: { defense: 4, industry: 0 },
    marsh: { defense: -2, industry: 0 },
    river: { defense: 1, industry: 0 },
    ocean: { defense: 0, industry: 0 }
  };
  
  return bonuses[terrain] || { defense: 0, industry: 0 };
}

// Calculate total terrain bonuses for all tiles
function calculateTotalTerrainBonuses(tiles, isIsland = false) {
  let totalDefense = 0;
  let totalIndustry = 0;
  
  for (const tile of tiles) {
    const bonuses = getTerrainBonuses(tile.terrain);
    totalDefense += bonuses.defense;
    totalIndustry += bonuses.industry;
  }
  
  if (isIsland) {
    totalDefense += 7;
  }
  
  return { defense: totalDefense, industry: totalIndustry };
}

// Export for use in other scripts
window.HexMap = HexMap;
window.getTerrainBonuses = getTerrainBonuses;
window.calculateTotalTerrainBonuses = calculateTotalTerrainBonuses;
window.TERRAIN_CONFIG = TERRAIN_CONFIG;
