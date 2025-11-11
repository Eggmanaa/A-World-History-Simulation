// 3D Isometric Hex Map Engine - Ian O'Toole Board Game Style
// Tabletop Simulator-like 3D visualization with clean geometric design

// Ian O'Toole Inspired Color Palette
const OTOOLE_COLORS = {
  // Base neutrals
  charcoal: '#2a2a2a',
  ivory: '#f4f1e8',
  warmGray: '#8b8379',
  
  // Accent colors
  teal: '#2a9d8f',
  ochre: '#e9c46a',
  rust: '#e76f51',
  deepBlue: '#264653',
  sage: '#8ab17d',
  
  // Terrain palettes (desaturated, professional)
  terrain: {
    plains: { base: '#c9d1a5', shadow: '#9ca67d', highlight: '#e5edc5' },
    grassland: { base: '#88bb66', shadow: '#6a9350', highlight: '#a8d586' },
    forest: { base: '#2d5016', shadow: '#1a3008', highlight: '#3d7020' },
    mountains: { base: '#8b7355', shadow: '#6b5335', highlight: '#ab9375' },
    high_mountains: { base: '#666666', shadow: '#444444', highlight: '#888888' },
    desert: { base: '#e9c46a', shadow: '#c9a44a', highlight: '#f9e48a' },
    marsh: { base: '#6b8e6b', shadow: '#4b6e4b', highlight: '#8bae8b' },
    river: { base: '#4a90d9', shadow: '#2a70b9', highlight: '#6ab0f9' },
    ocean: { base: '#264653', shadow: '#162636', highlight: '#366673' }
  },
  
  // Building colors (warm, distinct)
  buildings: {
    house: { base: '#d4a574', shadow: '#b48554', highlight: '#f4c594', roof: '#8b4513' },
    temple: { base: '#f4f1e8', shadow: '#d4d1c8', highlight: '#ffffff', accent: '#e76f51' },
    amphitheater: { base: '#e9c46a', shadow: '#c9a44a', highlight: '#f9e48a', accent: '#e76f51' },
    wall: { base: '#8b7355', shadow: '#6b5335', highlight: '#ab9375', stone: '#5a4935' },
    archimedes_tower: { base: '#f4f1e8', shadow: '#d4d1c8', highlight: '#ffffff', accent: '#2a9d8f' },
    wonder: { base: '#e9c46a', shadow: '#c9a44a', highlight: '#f9e48a', accent: '#e76f51' }
  }
};

// 3D Terrain Configuration with elevation
const TERRAIN_3D_CONFIG = {
  plains: {
    name: 'Plains',
    icon: '🌾',
    elevation: 0,
    colors: OTOOLE_COLORS.terrain.plains
  },
  grassland: {
    name: 'Grassland',
    icon: '🌱',
    elevation: 0,
    colors: OTOOLE_COLORS.terrain.grassland
  },
  forest: {
    name: 'Forest',
    icon: '🌲',
    elevation: 2,
    colors: OTOOLE_COLORS.terrain.forest
  },
  mountains: {
    name: 'Mountains',
    icon: '⛰️',
    elevation: 8,
    colors: OTOOLE_COLORS.terrain.mountains
  },
  high_mountains: {
    name: 'High Mountains',
    icon: '🏔️',
    elevation: 12,
    colors: OTOOLE_COLORS.terrain.high_mountains
  },
  desert: {
    name: 'Desert',
    icon: '🏜️',
    elevation: 0,
    colors: OTOOLE_COLORS.terrain.desert
  },
  marsh: {
    name: 'Marsh',
    icon: '💧',
    elevation: -1,
    colors: OTOOLE_COLORS.terrain.marsh
  },
  river: {
    name: 'River',
    icon: '🌊',
    elevation: -2,
    colors: OTOOLE_COLORS.terrain.river
  },
  ocean: {
    name: 'Ocean',
    icon: '🌊',
    elevation: -3,
    colors: OTOOLE_COLORS.terrain.ocean
  }
};

// Building 3D models configuration
const BUILDING_3D_CONFIG = {
  house: {
    name: 'House',
    height: 3,
    width: 0.6,
    depth: 0.6,
    colors: OTOOLE_COLORS.buildings.house,
    type: 'residential'
  },
  temple: {
    name: 'Temple',
    height: 5,
    width: 0.8,
    depth: 0.8,
    colors: OTOOLE_COLORS.buildings.temple,
    type: 'religious',
    hasColumns: true
  },
  amphitheater: {
    name: 'Amphitheater',
    height: 4,
    width: 0.9,
    depth: 0.9,
    colors: OTOOLE_COLORS.buildings.amphitheater,
    type: 'cultural',
    isCircular: true
  },
  wall: {
    name: 'Wall',
    height: 4,
    width: 0.4,
    depth: 1.2,
    colors: OTOOLE_COLORS.buildings.wall,
    type: 'defensive',
    isFortification: true
  },
  archimedes_tower: {
    name: 'Archimedes Tower',
    height: 8,
    width: 0.7,
    depth: 0.7,
    colors: OTOOLE_COLORS.buildings.archimedes_tower,
    type: 'defensive',
    isTower: true
  }
};

class HexMap3D {
  constructor(containerId, tiles = []) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('3D Hex map container not found:', containerId);
      return;
    }
    
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);
    
    // Data
    this.tiles = tiles;
    this.buildings = {};
    this.selectedHex = null;
    this.hoveredHex = null;
    this.onHexClick = null;
    
    // Isometric projection settings
    this.hexSize = 40; // Base hex size
    this.tileHeight = 4; // Height of each elevation unit in pixels
    this.isoAngle = Math.PI / 6; // 30 degrees for isometric
    
    // Lighting (from top-left for Ian O'Toole style)
    this.lightAngle = Math.PI * 1.25; // Top-left lighting
    
    // Camera/view settings
    this.zoom = 1.0;
    this.offsetX = 0;
    this.offsetY = 0;
    
    // Setup
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
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.scale(dpr, dpr);
    
    this.width = rect.width;
    this.height = rect.height;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.render();
  }
  
  // Convert cube coordinates to isometric 3D pixel coordinates
  hexToIso(q, r, s, elevation = 0) {
    // Flat-top hex to cartesian
    const x = this.hexSize * (3/2 * q);
    const y = this.hexSize * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
    
    // Apply isometric projection
    const isoX = (x - y) * Math.cos(this.isoAngle);
    const isoY = (x + y) * Math.sin(this.isoAngle) - elevation * this.tileHeight;
    
    return {
      x: this.centerX + isoX * this.zoom + this.offsetX,
      y: this.centerY + isoY * this.zoom + this.offsetY
    };
  }
  
  // Convert pixel to hex (inverse projection)
  pixelToHex(x, y) {
    // Approximate inverse - good enough for click detection
    const px = (x - this.centerX - this.offsetX) / this.zoom;
    const py = (y - this.centerY - this.offsetY) / this.zoom;
    
    // Reverse isometric
    const cosAngle = Math.cos(this.isoAngle);
    const sinAngle = Math.sin(this.isoAngle);
    
    const cartX = (px / cosAngle + py / sinAngle) / 2;
    const cartY = (py / sinAngle - px / cosAngle) / 2;
    
    // Cartesian to cube coordinates
    const q = (2/3 * cartX) / this.hexSize;
    const r = (-1/3 * cartX + Math.sqrt(3)/3 * cartY) / this.hexSize;
    const s = -q - r;
    
    return this.roundHex(q, r, s);
  }
  
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
  
  // Draw 3D isometric hex with elevation
  draw3DHex(q, r, s, terrainConfig, isSelected = false, isHovered = false) {
    const elevation = terrainConfig.elevation || 0;
    const colors = terrainConfig.colors;
    
    // Get center point at base elevation
    const center = this.hexToIso(q, r, s, 0);
    const topCenter = this.hexToIso(q, r, s, elevation);
    
    // Calculate hex corners for flat-top hex
    const corners = [];
    const topCorners = [];
    
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 3 * i;
      const dx = this.hexSize * Math.cos(angle) * this.zoom;
      const dy = this.hexSize * Math.sin(angle) * this.zoom;
      
      // Transform to isometric
      const isoX = (dx - dy * Math.sqrt(3)/2) * Math.cos(this.isoAngle);
      const isoY = (dx + dy * Math.sqrt(3)/2) * Math.sin(this.isoAngle);
      
      corners.push({
        x: center.x + isoX,
        y: center.y + isoY
      });
      
      topCorners.push({
        x: topCenter.x + isoX,
        y: topCenter.y + isoY
      });
    }
    
    // Draw sides (for elevated terrain)
    if (elevation > 0) {
      // Draw visible sides (right and left faces)
      for (let i = 0; i < 6; i++) {
        const next = (i + 1) % 6;
        
        // Determine if this face is visible (facing forward)
        const faceAngle = i * Math.PI / 3;
        const isVisible = Math.cos(faceAngle - this.lightAngle) > -0.3;
        
        if (isVisible) {
          this.ctx.beginPath();
          this.ctx.moveTo(corners[i].x, corners[i].y);
          this.ctx.lineTo(corners[next].x, corners[next].y);
          this.ctx.lineTo(topCorners[next].x, topCorners[next].y);
          this.ctx.lineTo(topCorners[i].x, topCorners[i].y);
          this.ctx.closePath();
          
          // Side color (darker shadow)
          this.ctx.fillStyle = colors.shadow;
          this.ctx.fill();
          
          // Edge line
          this.ctx.strokeStyle = OTOOLE_COLORS.charcoal;
          this.ctx.lineWidth = 1;
          this.ctx.stroke();
        }
      }
    }
    
    // Draw top face
    this.ctx.beginPath();
    this.ctx.moveTo(topCorners[0].x, topCorners[0].y);
    for (let i = 1; i < 6; i++) {
      this.ctx.lineTo(topCorners[i].x, topCorners[i].y);
    }
    this.ctx.closePath();
    
    // Fill top with base color
    this.ctx.fillStyle = colors.base;
    this.ctx.fill();
    
    // Highlight if selected or hovered
    if (isSelected) {
      this.ctx.strokeStyle = OTOOLE_COLORS.ochre;
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
    } else if (isHovered) {
      this.ctx.strokeStyle = OTOOLE_COLORS.ivory;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    } else {
      this.ctx.strokeStyle = OTOOLE_COLORS.charcoal;
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
    }
    
    // Add subtle highlight gradient for 3D effect
    if (elevation >= 0) {
      const gradient = this.ctx.createLinearGradient(
        topCorners[0].x, topCorners[0].y,
        topCorners[3].x, topCorners[3].y
      );
      gradient.addColorStop(0, `${colors.highlight}40`);
      gradient.addColorStop(1, 'transparent');
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    }
    
    return topCenter;
  }
  
  // Draw 3D isometric building
  draw3DBuilding(q, r, s, buildingType, terrainElevation = 0) {
    const config = BUILDING_3D_CONFIG[buildingType];
    if (!config) return;
    
    const baseElevation = terrainElevation;
    const buildingTop = baseElevation + config.height;
    
    const base = this.hexToIso(q, r, s, baseElevation);
    const top = this.hexToIso(q, r, s, buildingTop);
    
    const width = config.width * this.hexSize * this.zoom;
    const depth = config.depth * this.hexSize * this.zoom;
    
    // Calculate building corners in isometric space
    const hw = width / 2;
    const hd = depth / 2;
    
    // Base corners
    const corners = [
      { dx: -hw, dy: -hd }, // front-left
      { dx: hw, dy: -hd },  // front-right
      { dx: hw, dy: hd },   // back-right
      { dx: -hw, dy: hd }   // back-left
    ];
    
    const baseCorners = corners.map(c => {
      const isoX = (c.dx - c.dy) * Math.cos(this.isoAngle);
      const isoY = (c.dx + c.dy) * Math.sin(this.isoAngle);
      return { x: base.x + isoX, y: base.y + isoY };
    });
    
    const topCorners = corners.map(c => {
      const isoX = (c.dx - c.dy) * Math.cos(this.isoAngle);
      const isoY = (c.dx + c.dy) * Math.sin(this.isoAngle);
      return { x: top.x + isoX, y: top.y + isoY };
    });
    
    // Draw building faces (back to front for proper layering)
    
    // Back face (darkest)
    this.ctx.beginPath();
    this.ctx.moveTo(baseCorners[3].x, baseCorners[3].y);
    this.ctx.lineTo(baseCorners[2].x, baseCorners[2].y);
    this.ctx.lineTo(topCorners[2].x, topCorners[2].y);
    this.ctx.lineTo(topCorners[3].x, topCorners[3].y);
    this.ctx.closePath();
    this.ctx.fillStyle = config.colors.shadow;
    this.ctx.fill();
    this.ctx.strokeStyle = OTOOLE_COLORS.charcoal;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    
    // Right face (medium shadow)
    this.ctx.beginPath();
    this.ctx.moveTo(baseCorners[2].x, baseCorners[2].y);
    this.ctx.lineTo(baseCorners[1].x, baseCorners[1].y);
    this.ctx.lineTo(topCorners[1].x, topCorners[1].y);
    this.ctx.lineTo(topCorners[2].x, topCorners[2].y);
    this.ctx.closePath();
    this.ctx.fillStyle = config.colors.base;
    this.ctx.fill();
    this.ctx.strokeStyle = OTOOLE_COLORS.charcoal;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    
    // Left face (lighter)
    this.ctx.beginPath();
    this.ctx.moveTo(baseCorners[0].x, baseCorners[0].y);
    this.ctx.lineTo(baseCorners[3].x, baseCorners[3].y);
    this.ctx.lineTo(topCorners[3].x, topCorners[3].y);
    this.ctx.lineTo(topCorners[0].x, topCorners[0].y);
    this.ctx.closePath();
    this.ctx.fillStyle = config.colors.highlight;
    this.ctx.fill();
    this.ctx.strokeStyle = OTOOLE_COLORS.charcoal;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    
    // Top face (lightest)
    this.ctx.beginPath();
    this.ctx.moveTo(topCorners[0].x, topCorners[0].y);
    this.ctx.lineTo(topCorners[1].x, topCorners[1].y);
    this.ctx.lineTo(topCorners[2].x, topCorners[2].y);
    this.ctx.lineTo(topCorners[3].x, topCorners[3].y);
    this.ctx.closePath();
    this.ctx.fillStyle = config.colors.highlight;
    this.ctx.fill();
    this.ctx.strokeStyle = OTOOLE_COLORS.charcoal;
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();
    
    // Add accent details based on building type
    if (config.hasColumns) {
      // Temple columns
      this.drawColumns(topCorners, config.colors.accent);
    } else if (config.isCircular) {
      // Amphitheater circular pattern
      this.drawCircularPattern(top, width, config.colors.accent);
    } else if (config.isTower) {
      // Tower windows
      this.drawTowerWindows(baseCorners, topCorners, config.colors.accent);
    } else if (config.type === 'residential') {
      // House roof
      this.drawRoof(topCorners, config.colors.roof);
    }
    
    // Add drop shadow for depth
    this.drawBuildingShadow(baseCorners, baseElevation);
  }
  
  // Helper: Draw temple columns
  drawColumns(topCorners, accentColor) {
    const midX = (topCorners[0].x + topCorners[1].x) / 2;
    const midY = (topCorners[0].y + topCorners[1].y) / 2;
    
    for (let i = 0; i < 3; i++) {
      const x = midX + (i - 1) * 8;
      this.ctx.fillStyle = accentColor;
      this.ctx.fillRect(x - 2, midY - 10, 4, 20);
    }
  }
  
  // Helper: Draw circular amphitheater pattern
  drawCircularPattern(center, width, accentColor) {
    this.ctx.strokeStyle = accentColor;
    this.ctx.lineWidth = 2;
    for (let i = 1; i <= 3; i++) {
      this.ctx.beginPath();
      this.ctx.ellipse(center.x, center.y, width * i / 4, width * i / 6, 0, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }
  
  // Helper: Draw tower windows
  drawTowerWindows(baseCorners, topCorners, accentColor) {
    const levels = 3;
    for (let i = 0; i < levels; i++) {
      const t = (i + 0.5) / levels;
      const y = baseCorners[1].y + (topCorners[1].y - baseCorners[1].y) * t;
      const x = baseCorners[1].x + (topCorners[1].x - baseCorners[1].x) * t;
      
      this.ctx.fillStyle = accentColor;
      this.ctx.fillRect(x - 3, y - 3, 6, 6);
    }
  }
  
  // Helper: Draw house roof
  drawRoof(topCorners, roofColor) {
    const peak = {
      x: (topCorners[0].x + topCorners[1].x) / 2,
      y: (topCorners[0].y + topCorners[1].y) / 2 - 15
    };
    
    this.ctx.beginPath();
    this.ctx.moveTo(topCorners[0].x, topCorners[0].y);
    this.ctx.lineTo(peak.x, peak.y);
    this.ctx.lineTo(topCorners[1].x, topCorners[1].y);
    this.ctx.closePath();
    this.ctx.fillStyle = roofColor;
    this.ctx.fill();
    this.ctx.strokeStyle = OTOOLE_COLORS.charcoal;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }
  
  // Helper: Draw building shadow
  drawBuildingShadow(baseCorners, elevation) {
    if (elevation <= 0) return;
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.beginPath();
    this.ctx.moveTo(baseCorners[0].x, baseCorners[0].y);
    for (let i = 1; i < baseCorners.length; i++) {
      this.ctx.lineTo(baseCorners[i].x, baseCorners[i].y);
    }
    this.ctx.closePath();
    this.ctx.fill();
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
  
  // Handle mouse move for hover
  handleMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const hex = this.pixelToHex(x, y);
    const tile = this.findTile(hex.q, hex.r, hex.s);
    
    if (tile) {
      if (!this.hoveredHex || 
          this.hoveredHex.q !== hex.q || 
          this.hoveredHex.r !== hex.r || 
          this.hoveredHex.s !== hex.s) {
        this.hoveredHex = hex;
        this.render();
        this.canvas.style.cursor = 'pointer';
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
  
  handleMouseLeave() {
    this.hoveredHex = null;
    this.hideTooltip();
    this.render();
  }
  
  // Tooltip
  showTooltip(x, y, tile) {
    let tooltip = document.getElementById('hex-tooltip-3d');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'hex-tooltip-3d';
      tooltip.style.cssText = `
        position: fixed;
        padding: 12px 16px;
        background: ${OTOOLE_COLORS.charcoal};
        color: ${OTOOLE_COLORS.ivory};
        border: 2px solid ${OTOOLE_COLORS.ochre};
        border-radius: 4px;
        font-size: 13px;
        font-family: 'Arial', sans-serif;
        pointer-events: none;
        z-index: 1000;
        box-shadow: 4px 4px 0px rgba(0,0,0,0.3);
      `;
      document.body.appendChild(tooltip);
    }
    
    const terrainInfo = TERRAIN_3D_CONFIG[tile.terrain];
    const building = this.buildings[this.getCoordKey(tile.coord.q, tile.coord.r, tile.coord.s)];
    
    let content = `<strong style="color: ${OTOOLE_COLORS.ochre};">${terrainInfo?.name || tile.terrain}</strong>`;
    if (building) {
      const buildingConfig = BUILDING_3D_CONFIG[building];
      content += `<br><span style="color: ${OTOOLE_COLORS.teal};">Building:</span> ${buildingConfig.name}`;
    }
    
    tooltip.innerHTML = content;
    
    const rect = this.canvas.getBoundingClientRect();
    tooltip.style.left = (rect.left + x + 15) + 'px';
    tooltip.style.top = (rect.top + y - 40) + 'px';
    tooltip.style.display = 'block';
  }
  
  hideTooltip() {
    const tooltip = document.getElementById('hex-tooltip-3d');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }
  
  // Utility methods
  getCoordKey(q, r, s) {
    return `${q},${r},${s}`;
  }
  
  findTile(q, r, s) {
    return this.tiles.find(t => 
      t.coord && t.coord.q === q && t.coord.r === r && t.coord.s === s
    );
  }
  
  setTiles(tiles) {
    this.tiles = tiles;
    this.render();
  }
  
  setBuildings(buildings) {
    this.buildings = buildings || {};
    this.render();
  }
  
  placeBuilding(q, r, s, buildingType) {
    const key = this.getCoordKey(q, r, s);
    if (buildingType) {
      this.buildings[key] = buildingType;
    } else {
      delete this.buildings[key];
    }
    this.render();
  }
  
  // Main render function
  render() {
    if (!this.ctx || !this.tiles) return;
    
    // Clear with Ian O'Toole style background
    this.ctx.fillStyle = OTOOLE_COLORS.ivory;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Sort tiles for proper isometric rendering (back to front)
    const sortedTiles = [...this.tiles].sort((a, b) => {
      // Isometric sorting: render from back-left to front-right
      const aVal = a.coord.r * 1000 + a.coord.q;
      const bVal = b.coord.r * 1000 + b.coord.q;
      return aVal - bVal;
    });
    
    // First pass: Draw all terrain
    for (const tile of sortedTiles) {
      if (!tile.coord) continue;
      
      const { q, r, s } = tile.coord;
      const terrainConfig = TERRAIN_3D_CONFIG[tile.terrain] || TERRAIN_3D_CONFIG.plains;
      
      const isSelected = this.selectedHex && 
        this.selectedHex.q === q && 
        this.selectedHex.r === r && 
        this.selectedHex.s === s;
        
      const isHovered = this.hoveredHex && 
        this.hoveredHex.q === q && 
        this.hoveredHex.r === r && 
        this.hoveredHex.s === s;
      
      this.draw3DHex(q, r, s, terrainConfig, isSelected, isHovered);
    }
    
    // Second pass: Draw all buildings
    for (const tile of sortedTiles) {
      if (!tile.coord) continue;
      
      const { q, r, s } = tile.coord;
      const terrainConfig = TERRAIN_3D_CONFIG[tile.terrain] || TERRAIN_3D_CONFIG.plains;
      const buildingKey = this.getCoordKey(q, r, s);
      
      if (this.buildings[buildingKey]) {
        this.draw3DBuilding(q, r, s, this.buildings[buildingKey], terrainConfig.elevation);
      }
    }
    
    // Draw legend with Ian O'Toole style
    this.drawModernLegend();
  }
  
  // Modern legend with geometric Ian O'Toole style
  drawModernLegend() {
    const legendX = 15;
    const legendY = this.height - 200;
    const legendWidth = 160;
    const legendHeight = 185;
    
    // Background panel with border
    this.ctx.fillStyle = OTOOLE_COLORS.ivory;
    this.ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
    this.ctx.strokeStyle = OTOOLE_COLORS.charcoal;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);
    
    // Accent line at top
    this.ctx.fillStyle = OTOOLE_COLORS.ochre;
    this.ctx.fillRect(legendX, legendY, legendWidth, 4);
    
    // Title
    this.ctx.fillStyle = OTOOLE_COLORS.charcoal;
    this.ctx.font = 'bold 14px Arial, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('TERRAIN', legendX + 10, legendY + 25);
    
    // Legend items
    this.ctx.font = '12px Arial, sans-serif';
    const terrainTypes = ['plains', 'grassland', 'forest', 'mountains', 'desert', 'river'];
    
    let yPos = legendY + 45;
    for (const terrain of terrainTypes) {
      const config = TERRAIN_3D_CONFIG[terrain];
      if (!config) continue;
      
      // Color box with border (geometric style)
      this.ctx.fillStyle = config.colors.base;
      this.ctx.fillRect(legendX + 10, yPos, 16, 16);
      this.ctx.strokeStyle = OTOOLE_COLORS.charcoal;
      this.ctx.lineWidth = 1.5;
      this.ctx.strokeRect(legendX + 10, yPos, 16, 16);
      
      // Label
      this.ctx.fillStyle = OTOOLE_COLORS.charcoal;
      this.ctx.fillText(config.name, legendX + 32, yPos + 12);
      
      yPos += 22;
    }
  }
}

// Export to global scope
window.HexMap3D = HexMap3D;
window.TERRAIN_3D_CONFIG = TERRAIN_3D_CONFIG;
window.BUILDING_3D_CONFIG = BUILDING_3D_CONFIG;
window.OTOOLE_COLORS = OTOOLE_COLORS;
