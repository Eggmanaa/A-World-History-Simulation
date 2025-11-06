// Hex Map Rendering System v2 - Fixed overlap and clean edges
// Uses axial coordinates for proper hex grid layout

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

class HexMapV2 {
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
    this.hexSize = 35; // Smaller size to fit better
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
    this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
    
    // Initial render
    this.render();
  }
  
  resizeCanvas() {
    const rect = this.container.getBoundingClientRect();
    // High DPI support
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.scale(dpr, dpr);
    
    // Calculate actual drawing dimensions
    this.width = rect.width;
    this.height = rect.height;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.render();
  }
  
  // Convert cube coordinates to pixel coordinates with proper flat-top hex layout
  hexToPixel(q, r, s) {
    // Flat-top hexagon layout
    const x = this.hexSize * (3/2 * q);
    const y = this.hexSize * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
    
    return {
      x: this.centerX + x,
      y: this.centerY + y
    };
  }
  
  // Convert pixel to hex coordinates
  pixelToHex(x, y) {
    const px = x - this.centerX;
    const py = y - this.centerY;
    
    // Convert to axial coordinates
    const q = (2/3 * px) / this.hexSize;
    const r = (-1/3 * px + Math.sqrt(3)/3 * py) / this.hexSize;
    const s = -q - r;
    
    return this.roundHex(q, r, s);
  }
  
  // Round fractional hex coordinates to nearest hex
  roundHex(q, r, s) {
    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(s);
    
    const q_diff = Math.abs(rq - q);
    const r_diff = Math.abs(rr - r);
    const s_diff = Math.abs(rs - s);
    
    if (q_diff > r_diff && q_diff > s_diff) {
      rq = -rr - rs;
    } else if (r_diff > s_diff) {
      rr = -rq - rs;
    } else {
      rs = -rq - rr;
    }
    
    return { q: rq, r: rr, s: rs };
  }
  
  // Draw a single hexagon with proper flat-top orientation
  drawHex(q, r, s, fillColor, strokeColor = '#2a2a2a', lineWidth = 1.5) {
    const center = this.hexToPixel(q, r, s);
    const corners = [];
    
    // Calculate hex corners (flat-top orientation)
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 3 * i; // 60 degrees per corner
      corners.push({
        x: center.x + this.hexSize * Math.cos(angle),
        y: center.y + this.hexSize * Math.sin(angle)
      });
    }
    
    // Draw filled hexagon
    this.ctx.beginPath();
    this.ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < 6; i++) {
      this.ctx.lineTo(corners[i].x, corners[i].y);
    }
    this.ctx.closePath();
    
    // Fill
    this.ctx.fillStyle = fillColor;
    this.ctx.fill();
    
    // Stroke
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = lineWidth;
    this.ctx.stroke();
  }
  
  // Draw terrain icon on hex
  drawHexIcon(q, r, s, icon, fontSize = 20) {
    const center = this.hexToPixel(q, r, s);
    this.ctx.font = `${fontSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = '#000000';
    this.ctx.fillText(icon, center.x, center.y);
  }
  
  // Draw building icon on hex
  drawBuilding(q, r, s, buildingType, fontSize = 16) {
    const icon = BUILDING_ICONS[buildingType];
    if (!icon) return;
    
    const center = this.hexToPixel(q, r, s);
    // Draw building icon slightly above center
    this.ctx.font = `${fontSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Add background circle for building
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y - 5, fontSize/2 + 2, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Draw building icon
    this.ctx.fillStyle = '#000000';
    this.ctx.fillText(icon, center.x, center.y - 5);
  }
  
  // Get coord key for buildings map
  getCoordKey(q, r, s) {
    return `${q},${r},${s}`;
  }
  
  // Find tile by coordinates
  findTile(q, r, s) {
    return this.tiles.find(t => 
      t.coord && t.coord.q === q && t.coord.r === r && t.coord.s === s
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
  
  // Place a building on a hex
  placeBuilding(q, r, s, buildingType) {
    const key = this.getCoordKey(q, r, s);
    if (buildingType) {
      this.buildings[key] = buildingType;
    } else {
      delete this.buildings[key];
    }
    this.render();
  }
  
  // Handle click events
  handleClick(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const hex = this.pixelToHex(x, y);
    const tile = this.findTile(hex.q, hex.r, hex.s);
    
    if (tile) {
      this.selectedHex = hex;
      if (this.onHexClick) {
        this.onHexClick(tile, hex);
      }
      this.render();
    }
  }
  
  // Handle mouse move for hover effect
  handleMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const hex = this.pixelToHex(x, y);
    const tile = this.findTile(hex.q, hex.r, hex.s);
    
    if (tile) {
      // Only update if hover changed
      if (!this.hoveredHex || 
          this.hoveredHex.q !== hex.q || 
          this.hoveredHex.r !== hex.r || 
          this.hoveredHex.s !== hex.s) {
        this.hoveredHex = hex;
        this.render();
        
        // Update cursor
        this.canvas.style.cursor = 'pointer';
        
        // Show tooltip
        this.showTooltip(x, y, tile);
      }
    } else {
      if (this.hoveredHex) {
        this.hoveredHex = null;
        this.render();
        this.canvas.style.cursor = 'default';
        this.hideTooltip();
      }
    }
  }
  
  // Handle mouse leave
  handleMouseLeave() {
    this.hoveredHex = null;
    this.hideTooltip();
    this.render();
  }
  
  // Show tooltip for hex
  showTooltip(x, y, tile) {
    let tooltip = document.getElementById('hex-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'hex-tooltip';
      tooltip.style.position = 'fixed';
      tooltip.style.padding = '8px 12px';
      tooltip.style.background = 'rgba(0, 0, 0, 0.9)';
      tooltip.style.color = 'white';
      tooltip.style.borderRadius = '4px';
      tooltip.style.fontSize = '12px';
      tooltip.style.pointerEvents = 'none';
      tooltip.style.zIndex = '1000';
      tooltip.style.fontFamily = 'Arial, sans-serif';
      document.body.appendChild(tooltip);
    }
    
    const terrainInfo = TERRAIN_CONFIG[tile.terrain];
    const building = this.buildings[this.getCoordKey(tile.coord.q, tile.coord.r, tile.coord.s)];
    
    let content = `<strong>${terrainInfo?.name || tile.terrain}</strong>`;
    if (building) {
      content += `<br>Building: ${building}`;
    }
    
    // Add terrain bonuses
    const terrainBonus = this.getTerrainBonus(tile.terrain);
    if (terrainBonus.defense !== 0 || terrainBonus.industry !== 0) {
      content += '<br><span style="color: #ffd700;">Bonuses:</span>';
      if (terrainBonus.defense !== 0) {
        content += `<br>Defense: ${terrainBonus.defense > 0 ? '+' : ''}${terrainBonus.defense}`;
      }
      if (terrainBonus.industry !== 0) {
        content += `<br>Industry: ${terrainBonus.industry > 0 ? '+' : ''}${terrainBonus.industry}`;
      }
    }
    
    tooltip.innerHTML = content;
    
    const rect = this.canvas.getBoundingClientRect();
    tooltip.style.left = (rect.left + x + 10) + 'px';
    tooltip.style.top = (rect.top + y - 30) + 'px';
    tooltip.style.display = 'block';
  }
  
  // Hide tooltip
  hideTooltip() {
    const tooltip = document.getElementById('hex-tooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }
  
  // Get terrain bonus info
  getTerrainBonus(terrain) {
    const bonuses = {
      forest: { defense: 1, industry: 3 },
      mountains: { defense: 10, industry: 4 },
      high_mountains: { defense: 15, industry: 2 },
      desert: { defense: 4, industry: 0 },
      marsh: { defense: -2, industry: 0 },
      river: { defense: 1, industry: 0 },
      plains: { defense: 0, industry: 0 },
      grassland: { defense: 0, industry: 0 },
      ocean: { defense: 0, industry: 0 }
    };
    return bonuses[terrain] || { defense: 0, industry: 0 };
  }
  
  // Main render function
  render() {
    if (!this.ctx || !this.tiles) return;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Sort tiles to ensure proper rendering order (back to front)
    const sortedTiles = [...this.tiles].sort((a, b) => {
      // Sort by row (r coordinate) first, then by column (q coordinate)
      if (a.coord.r !== b.coord.r) {
        return a.coord.r - b.coord.r;
      }
      return a.coord.q - b.coord.q;
    });
    
    // Draw all hexes
    for (const tile of sortedTiles) {
      if (!tile.coord) continue;
      
      const { q, r, s } = tile.coord;
      const terrainInfo = TERRAIN_CONFIG[tile.terrain] || TERRAIN_CONFIG.plains;
      
      // Determine hex appearance
      let fillColor = terrainInfo.color;
      let strokeColor = '#2a2a2a';
      let lineWidth = 1;
      
      // Highlight selected hex
      if (this.selectedHex && 
          this.selectedHex.q === q && 
          this.selectedHex.r === r && 
          this.selectedHex.s === s) {
        strokeColor = '#ffd700';
        lineWidth = 3;
      }
      // Highlight hovered hex
      else if (this.hoveredHex && 
               this.hoveredHex.q === q && 
               this.hoveredHex.r === r && 
               this.hoveredHex.s === s) {
        strokeColor = '#ffffff';
        lineWidth = 2;
      }
      
      // Draw hex
      this.drawHex(q, r, s, fillColor, strokeColor, lineWidth);
      
      // Draw terrain icon
      if (terrainInfo.icon) {
        this.drawHexIcon(q, r, s, terrainInfo.icon, 16);
      }
      
      // Draw building if present
      const buildingKey = this.getCoordKey(q, r, s);
      if (this.buildings[buildingKey]) {
        this.drawBuilding(q, r, s, this.buildings[buildingKey]);
      }
    }
    
    // Draw legend
    this.drawLegend();
  }
  
  // Draw terrain legend
  drawLegend() {
    const legendX = 10;
    let legendY = this.height - 180;
    
    // Background for legend
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(legendX - 5, legendY - 20, 120, 170);
    
    // Title
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Terrain', legendX, legendY - 5);
    
    // Legend items
    this.ctx.font = '11px Arial';
    const terrainTypes = ['plains', 'grassland', 'forest', 'mountains', 'desert', 'river', 'ocean'];
    
    legendY += 10;
    for (const terrain of terrainTypes) {
      const config = TERRAIN_CONFIG[terrain];
      if (!config) continue;
      
      // Color box
      this.ctx.fillStyle = config.color;
      this.ctx.fillRect(legendX, legendY, 12, 12);
      this.ctx.strokeStyle = '#444';
      this.ctx.strokeRect(legendX, legendY, 12, 12);
      
      // Label
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText(`${config.icon} ${config.name}`, legendX + 18, legendY + 9);
      
      legendY += 18;
    }
  }
}

// Make it globally available
window.HexMapV2 = HexMapV2;