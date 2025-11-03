// Student Game Interface JavaScript

let currentStudent = null;
let civilization = null;
let simulation = null;
let selectedPreset = null;
let buildingMap = {}; // Store building positions: { x_y: 'building_type' }

// Check authentication
document.addEventListener('DOMContentLoaded', async () => {
  const studentData = sessionStorage.getItem('student');
  if (!studentData) {
    window.location.href = '/student/login';
    return;
  }
  
  currentStudent = JSON.parse(studentData);
  await loadGame();
});

// Logout
function logout() {
  sessionStorage.removeItem('student');
  window.location.href = '/';
}

// Load game
async function loadGame() {
  try {
    // Load civilization
    const civResponse = await axios.get(`/api/student/civilization/${currentStudent.id}`);
    civilization = civResponse.data.civilization;
    
    // Load simulation
    const simResponse = await axios.get(`/api/student/simulation/${currentStudent.id}`);
    simulation = simResponse.data.simulation;
    
    if (!civilization) {
      showCivilizationSetup();
    } else {
      // Load building map if exists
      if (civilization.map_data) {
        try {
          buildingMap = JSON.parse(civilization.map_data);
        } catch (e) {
          buildingMap = {};
        }
      }
      renderGame();
    }
  } catch (error) {
    if (error.response?.status === 404) {
      showCivilizationSetup();
    } else {
      console.error('Failed to load game:', error);
      alert('Failed to load game');
    }
  }
}

// Show civilization setup
function showCivilizationSetup() {
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-6">
          <i class="fas fa-flag mr-2 text-blue-600"></i>
          Choose Your Civilization
        </h1>
        
        <form id="createCivForm" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">Select a Historical Civilization</label>
            <div id="presetGrid" class="grid md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-2">
              <div class="text-center text-gray-500">Loading civilizations...</div>
            </div>
          </div>
          
          <div id="selectedCivInfo" class="hidden bg-blue-50 border-2 border-blue-500 rounded-lg p-4">
            <h3 class="font-bold text-lg mb-2 text-blue-900"></h3>
            <p class="text-sm text-gray-700 mb-2"></p>
            <div class="text-sm">
              <strong>Regions:</strong> <span class="regions"></span>
            </div>
            <div class="text-sm">
              <strong>Starting Traits:</strong> <span class="traits"></span>
            </div>
          </div>
          
          <div class="flex gap-4">
            <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition font-bold disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              <i class="fas fa-check mr-2"></i>Create Civilization
            </button>
            <button type="button" onclick="logout()" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  loadPresets();
  document.getElementById('createCivForm').addEventListener('submit', createCivilization);
}

// Load presets
async function loadPresets() {
  try {
    const response = await axios.get('/api/student/presets');
    const presets = response.data.presets || [];
    
    const grid = document.getElementById('presetGrid');
    grid.innerHTML = presets.map(p => `
      <div class="preset-card border-2 border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:shadow-lg transition" 
           onclick="selectPreset('${p.id}', ${JSON.stringify(p).replace(/"/g, '&quot;')})">
        <h3 class="font-bold text-lg mb-1 text-gray-800">${p.display_name}</h3>
        <p class="text-xs text-gray-600 mb-2">${p.regions.join(', ')}</p>
        <div class="flex flex-wrap gap-1">
          ${(p.starting_traits || []).map(t => `
            <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">${t}</span>
          `).join('')}
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load presets:', error);
    document.getElementById('presetGrid').innerHTML = '<div class="text-center text-red-600">Failed to load civilizations</div>';
  }
}

// Select preset
function selectPreset(id, preset) {
  selectedPreset = preset;
  
  // Highlight selected
  document.querySelectorAll('.preset-card').forEach(card => {
    card.classList.remove('border-blue-500', 'bg-blue-50');
    card.classList.add('border-gray-300');
  });
  event.currentTarget.classList.remove('border-gray-300');
  event.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
  
  // Show info
  const info = document.getElementById('selectedCivInfo');
  info.classList.remove('hidden');
  info.querySelector('h3').textContent = preset.display_name;
  info.querySelector('p').textContent = preset.historical_context || 'An ancient civilization.';
  info.querySelector('.regions').textContent = preset.regions.join(', ');
  info.querySelector('.traits').textContent = (preset.starting_traits || []).join(', ');
  
  // Enable submit button
  document.querySelector('button[type="submit"]').disabled = false;
}

// Create civilization
async function createCivilization(e) {
  e.preventDefault();
  
  if (!selectedPreset) {
    alert('Please select a civilization first!');
    return;
  }
  
  // Generate random color from predefined palette
  const colors = ['#a20927', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  try {
    const response = await axios.post('/api/student/civilization', {
      studentId: currentStudent.id,
      name: selectedPreset.display_name, // Use historical name
      presetId: selectedPreset.id,
      color
    });
    
    civilization = response.data.civilization;
    buildingMap = {}; // Initialize empty map
    alert(`Welcome to ${selectedPreset.display_name}! Your civilization has been created.`);
    
    await loadGame();
  } catch (error) {
    console.error('Failed to create civilization:', error);
    alert(error.response?.data?.error || 'Failed to create civilization');
  }
}

// Render game
function renderGame() {
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen bg-gray-900 text-white">
      <!-- Header -->
      <header class="bg-gray-800 border-b border-gray-700">
        <div class="max-w-full mx-auto px-4 py-3">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-xl font-bold">
                <span class="inline-block w-3 h-3 rounded-full mr-2" style="background-color: ${civilization.color}"></span>
                ${civilization.name}
              </h1>
              <p class="text-gray-400 text-sm">${currentStudent.name}</p>
            </div>
            <div class="flex items-center gap-4">
              <div class="text-center">
                <div class="text-xl font-bold text-yellow-400">${formatYear(simulation.current_year)}</div>
                <div class="text-xs text-gray-400">Current Year</div>
              </div>
              <button onclick="refreshGame()" class="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded transition text-sm">
                <i class="fas fa-sync-alt"></i>
              </button>
              <button onclick="logout()" class="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded transition">
                <i class="fas fa-sign-out-alt"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-full mx-auto px-4 py-4">
        <div class="grid lg:grid-cols-4 gap-4">
          
          <!-- Left: Stats Panel -->
          <div class="lg:col-span-1">
            ${renderStatsPanel()}
          </div>

          <!-- Center: Map -->
          <div class="lg:col-span-2">
            ${renderMap()}
          </div>

          <!-- Right: Actions Panel -->
          <div class="lg:col-span-1">
            ${renderActionsPanel()}
          </div>
          
        </div>
      </main>
    </div>
  `;
  
  // Setup map click handlers
  setupMapHandlers();
}

// Render stats panel
function renderStatsPanel() {
  return `
    <div class="bg-gray-800 rounded-lg p-4 sticky top-4">
      <h2 class="text-lg font-bold mb-3 border-b border-gray-700 pb-2">
        <i class="fas fa-chart-bar mr-2 text-blue-400"></i>Stats
      </h2>
      
      ${civilization.conquered ? `
        <div class="bg-red-900 border border-red-700 rounded-lg p-3 mb-3">
          <i class="fas fa-skull text-xl mb-1"></i>
          <p class="font-bold text-sm">Conquered!</p>
        </div>
      ` : ''}
      
      <div class="space-y-2 text-sm">
        <div class="flex justify-between bg-gray-700 px-2 py-1 rounded">
          <span><i class="fas fa-home mr-1 text-yellow-400"></i>Houses:</span>
          <span class="font-bold">${civilization.houses}</span>
        </div>
        <div class="flex justify-between bg-gray-700 px-2 py-1 rounded">
          <span><i class="fas fa-users mr-1 text-blue-400"></i>Population:</span>
          <span class="font-bold">${civilization.population}</span>
        </div>
        <div class="flex justify-between bg-gray-700 px-2 py-1 rounded">
          <span><i class="fas fa-box mr-1 text-gray-400"></i>Capacity:</span>
          <span class="font-bold">${civilization.population_capacity}</span>
        </div>
        <hr class="border-gray-600">
        <div class="flex justify-between bg-gray-700 px-2 py-1 rounded">
          <span><i class="fas fa-seedling mr-1 text-green-400"></i>Fertility:</span>
          <span class="font-bold text-green-400">${civilization.fertility}</span>
        </div>
        <div class="flex justify-between bg-gray-700 px-2 py-1 rounded">
          <span><i class="fas fa-industry mr-1 text-yellow-400"></i>Industry:</span>
          <span class="font-bold text-yellow-400">${civilization.industry_left}/${civilization.industry}</span>
        </div>
        <hr class="border-gray-600">
        <div class="flex justify-between bg-gray-700 px-2 py-1 rounded">
          <span><i class="fas fa-fist-raised mr-1 text-red-400"></i>Martial:</span>
          <span class="font-bold text-red-400">${civilization.martial}</span>
        </div>
        <div class="flex justify-between bg-gray-700 px-2 py-1 rounded">
          <span><i class="fas fa-shield-alt mr-1 text-blue-400"></i>Defense:</span>
          <span class="font-bold text-blue-400">${civilization.defense}</span>
        </div>
        <hr class="border-gray-600">
        <div class="flex justify-between bg-gray-700 px-2 py-1 rounded">
          <span><i class="fas fa-flask mr-1 text-purple-400"></i>Science:</span>
          <span class="font-bold">${civilization.science}</span>
        </div>
        <div class="flex justify-between bg-gray-700 px-2 py-1 rounded">
          <span><i class="fas fa-theater-masks mr-1 text-pink-400"></i>Culture:</span>
          <span class="font-bold">${civilization.culture}</span>
        </div>
        <div class="flex justify-between bg-gray-700 px-2 py-1 rounded">
          <span><i class="fas fa-pray mr-1 text-yellow-300"></i>Faith:</span>
          <span class="font-bold">${civilization.faith}</span>
        </div>
      </div>

      <div class="mt-3 pt-3 border-t border-gray-700">
        <h3 class="font-bold mb-2 text-xs text-gray-400">Cultural Stage</h3>
        <div class="bg-purple-900 rounded px-2 py-1 text-center text-sm font-bold capitalize">
          ${civilization.cultural_stage}
        </div>
      </div>

      <div class="mt-3">
        <h3 class="font-bold mb-2 text-xs text-gray-400">Buildings</h3>
        <div class="grid grid-cols-2 gap-1 text-xs">
          <div class="bg-gray-700 px-2 py-1 rounded"><i class="fas fa-church mr-1"></i>${civilization.temples}</div>
          <div class="bg-gray-700 px-2 py-1 rounded"><i class="fas fa-theater-masks mr-1"></i>${civilization.amphitheaters}</div>
          <div class="bg-gray-700 px-2 py-1 rounded"><i class="fas fa-shield-alt mr-1"></i>${civilization.walls}</div>
          <div class="bg-gray-700 px-2 py-1 rounded"><i class="fas fa-tower-broadcast mr-1"></i>${civilization.archimedes_towers}</div>
        </div>
      </div>

      ${civilization.wonder ? `
        <div class="mt-3 bg-yellow-900 rounded-lg p-2">
          <h3 class="font-bold text-yellow-300 text-sm"><i class="fas fa-trophy mr-1"></i>Wonder</h3>
          <p class="text-xs">${civilization.wonder}</p>
        </div>
      ` : ''}
    </div>
  `;
}

// Render map (10x10 grid)
function renderMap() {
  const gridSize = 10;
  
  let mapHTML = `
    <div class="bg-gray-800 rounded-lg p-4">
      <h2 class="text-lg font-bold mb-3 border-b border-gray-700 pb-2">
        <i class="fas fa-map mr-2 text-green-400"></i>Your Territory
      </h2>
      <div class="grid grid-cols-10 gap-1 bg-gray-900 p-2 rounded" id="mapGrid">
  `;
  
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const key = `${x}_${y}`;
      const building = buildingMap[key];
      const icon = building ? getBuildingIcon(building) : '';
      const bgColor = building ? 'bg-green-900' : 'bg-gray-700';
      
      mapHTML += `
        <div class="map-cell ${bgColor} hover:bg-gray-600 aspect-square flex items-center justify-center text-2xl cursor-pointer rounded transition border border-gray-600" 
             data-x="${x}" data-y="${y}"
             title="${building || 'Empty'}">${icon}</div>
      `;
    }
  }
  
  mapHTML += `
      </div>
      <div class="mt-3 text-xs text-gray-400 text-center">
        Click a tile to place a building
      </div>
    </div>
  `;
  
  return mapHTML;
}

// Get building icon
function getBuildingIcon(building) {
  const icons = {
    'temple': '⛪',
    'amphitheater': '🎭',
    'wall': '🧱',
    'archimedes': '🗼',
    'house': '🏠'
  };
  return icons[building] || '🏛️';
}

// Render actions panel
function renderActionsPanel() {
  return `
    <div class="bg-gray-800 rounded-lg p-4">
      <h2 class="text-lg font-bold mb-3 border-b border-gray-700 pb-2">
        <i class="fas fa-hammer mr-2 text-yellow-400"></i>Actions
      </h2>
      
      ${simulation.paused ? `
        <div class="bg-yellow-900 border border-yellow-700 rounded-lg p-3 mb-3 text-sm">
          <i class="fas fa-pause-circle mr-1"></i>
          <span class="font-bold">Paused</span>
          <p class="text-xs text-yellow-200 mt-1">Wait for teacher to resume</p>
        </div>
      ` : civilization.conquered ? `
        <div class="bg-red-900 border border-red-700 rounded-lg p-3 text-sm">
          <p class="text-red-200">Cannot act after conquest</p>
        </div>
      ` : `
        <div class="space-y-2">
          <button onclick="showBuildMenu()" class="w-full bg-yellow-600 hover:bg-yellow-700 px-4 py-3 rounded-lg transition text-left text-sm">
            <i class="fas fa-hammer text-lg mr-2"></i>
            <div class="font-bold">Build Structure</div>
            <div class="text-xs opacity-80">Industry: ${civilization.industry_left}</div>
          </button>
          
          ${simulation.current_year >= -670 ? `
            <button onclick="alert('War system: Select target civilization')" class="w-full bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg transition text-left text-sm">
              <i class="fas fa-skull-crossbones text-lg mr-2"></i>
              <div class="font-bold">Declare War</div>
              <div class="text-xs opacity-80">Conquer others</div>
            </button>
          ` : ''}
          
          ${civilization.diplomacy >= 1 ? `
            <button onclick="alert('Alliance system coming soon')" class="w-full bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg transition text-left text-sm">
              <i class="fas fa-handshake text-lg mr-2"></i>
              <div class="font-bold">Form Alliance</div>
              <div class="text-xs opacity-80">Requires Diplomacy ≥ 1</div>
            </button>
          ` : ''}
        </div>
      `}
      
      <div class="mt-4 pt-4 border-t border-gray-700">
        <h3 class="font-bold mb-2 text-sm">Game Info</h3>
        <div class="space-y-1 text-xs text-gray-400">
          <p><i class="fas fa-info-circle mr-1"></i>Wait for teacher to advance</p>
          <p><i class="fas fa-sync mr-1"></i>Auto-growth each turn</p>
          <p><i class="fas fa-lightbulb mr-1"></i>Click tiles to build</p>
        </div>
      </div>
    </div>
  `;
}

// Setup map click handlers
function setupMapHandlers() {
  document.querySelectorAll('.map-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      const x = cell.dataset.x;
      const y = cell.dataset.y;
      const key = `${x}_${y}`;
      
      if (buildingMap[key]) {
        alert(`This tile already has: ${buildingMap[key]}`);
      } else {
        showBuildMenu(x, y);
      }
    });
  });
}

// Show build menu
let selectedTile = null;

function showBuildMenu(x, y) {
  selectedTile = x !== undefined ? { x, y } : null;
  
  // Count how many of each building type are already placed on map
  const placedBuildings = {};
  Object.values(buildingMap).forEach(building => {
    placedBuildings[building] = (placedBuildings[building] || 0) + 1;
  });
  
  // Calculate available buildings (owned but not yet placed)
  const availableHouses = civilization.houses - (placedBuildings['house'] || 0);
  const availableTemples = civilization.temples - (placedBuildings['temple'] || 0);
  const availableAmphitheaters = civilization.amphitheaters - (placedBuildings['amphitheater'] || 0);
  const availableWalls = civilization.walls - (placedBuildings['wall'] || 0);
  const availableArchimedes = civilization.archimedes_towers - (placedBuildings['archimedes'] || 0);
  
  const buildings = [
    { type: 'house', name: 'House', cost: 5, icon: '🏠', effect: '+5 Population Capacity', requirement: null, available: availableHouses },
    { type: 'temple', name: 'Temple', cost: 10, icon: '⛪', effect: '+2 Faith', requirement: null, available: availableTemples },
    { type: 'amphitheater', name: 'Amphitheater', cost: 10, icon: '🎭', effect: '+3 Culture, -1 Faith', requirement: null, available: availableAmphitheaters },
    { type: 'wall', name: 'Wall', cost: 10, icon: '🧱', effect: '+1 Defense', requirement: null, available: availableWalls },
    { type: 'archimedes', name: 'Archimedes Tower', cost: 20, icon: '🗼', effect: '+20 Defense', requirement: 'Science ≥ 30', available: availableArchimedes }
  ];
  
  const modalHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onclick="closeBuildMenu()">
      <div class="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 m-4" onclick="event.stopPropagation()">
        <h2 class="text-2xl font-bold text-white mb-4">
          <i class="fas fa-hammer mr-2 text-yellow-400"></i>Build Structure
        </h2>
        ${selectedTile ? `<p class="text-sm text-gray-400 mb-4">Position: (${selectedTile.x}, ${selectedTile.y})</p>` : ''}
        <p class="text-sm text-yellow-400 mb-4">Industry Available: ${civilization.industry_left}</p>
        
        <div class="space-y-3 mb-4">
          ${buildings.map(b => {
            // Can place if: have available building OR have enough industry to build new one
            const canPlaceExisting = b.available > 0;
            const canBuildNew = civilization.industry_left >= b.cost && 
                            (!b.requirement || (b.type === 'archimedes' && civilization.science >= 30));
            const canPlace = canPlaceExisting || canBuildNew;
            
            return `
              <button onclick="buildStructure('${b.type}', ${canPlaceExisting})" 
                      class="w-full bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg transition text-left ${!canPlace ? 'opacity-50 cursor-not-allowed' : ''}"
                      ${!canPlace ? 'disabled' : ''}>
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-lg">${b.icon} <span class="font-bold">${b.name}</span></div>
                    <div class="text-xs text-gray-400">${b.effect}</div>
                    ${b.available > 0 ? `<div class="text-xs text-green-400">Available to place: ${b.available}</div>` : ''}
                    ${b.requirement ? `<div class="text-xs text-yellow-400">${b.requirement}</div>` : ''}
                  </div>
                  <div class="text-yellow-400 font-bold">${canPlaceExisting ? 'FREE' : b.cost}</div>
                </div>
              </button>
            `;
          }).join('')}
        </div>
        
        <button onclick="closeBuildMenu()" class="w-full bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg transition">
          Close
        </button>
      </div>
    </div>
  `;
  
  const modalContainer = document.createElement('div');
  modalContainer.id = 'buildModal';
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer);
}

// Close build menu
function closeBuildMenu() {
  const modal = document.getElementById('buildModal');
  if (modal) {
    modal.remove();
  }
  selectedTile = null;
}

// Build structure
async function buildStructure(buildingType, isPlacingExisting) {
  if (!selectedTile) {
    alert('Please click on a map tile first!');
    return;
  }
  
  try {
    // If placing existing building, just update map
    if (isPlacingExisting) {
      // Add to map
      const key = `${selectedTile.x}_${selectedTile.y}`;
      buildingMap[key] = buildingType;
      
      // Save map data to database
      await axios.patch(`/api/student/civilization/${civilization.id}/map`, {
        map_data: JSON.stringify(buildingMap)
      });
      
      alert(`${buildingType} placed on map!`);
    } else {
      // Build new building (costs industry)
      const response = await axios.post('/api/game/build', {
        civId: civilization.id,
        building: buildingType
      });
      
      // Update civilization
      civilization = response.data.civilization;
      
      // Add to map
      const key = `${selectedTile.x}_${selectedTile.y}`;
      buildingMap[key] = buildingType;
      
      // Save map data
      await axios.patch(`/api/student/civilization/${civilization.id}/map`, {
        map_data: JSON.stringify(buildingMap)
      });
      
      alert(`${buildingType} built successfully!`);
    }
    
    closeBuildMenu();
    renderGame();
  } catch (error) {
    console.error('Build error:', error);
    alert(error.response?.data?.error || 'Failed to build structure');
  }
}

// Refresh game
async function refreshGame() {
  await loadGame();
}

// Format year
function formatYear(year) {
  if (year < 0) return `${Math.abs(year)} BCE`;
  return `${year} CE`;
}
