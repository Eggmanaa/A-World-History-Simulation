// Student Game Interface JavaScript

let currentStudent = null;
let civilization = null;
let simulation = null;
let selectedPreset = null;
let buildingMap = {}; // Store building positions: { x_y: 'building_type' }
let availableWonders = [];
let availableTenets = [];
let builtWonders = [];
let civilizationsInSim = [];

// Loading spinner utilities
function showLoading(message = 'Loading...') {
  let loader = document.getElementById('global-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    loader.innerHTML = `
      <div class="bg-gray-800 rounded-lg p-6 shadow-xl">
        <div class="flex items-center space-x-3">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span class="text-white font-semibold" id="loader-message">${message}</span>
        </div>
      </div>
    `;
    document.body.appendChild(loader);
  } else {
    loader.style.display = 'flex';
    document.getElementById('loader-message').textContent = message;
  }
}

function hideLoading() {
  const loader = document.getElementById('global-loader');
  if (loader) {
    loader.style.display = 'none';
  }
}

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
    showLoading('Loading your civilization...');
    
    // Load civilization
    const civResponse = await axios.get(`/api/student/civilization/${currentStudent.id}`);
    civilization = civResponse.data.civilization;
    
    // Load simulation
    const simResponse = await axios.get(`/api/student/simulation/${currentStudent.id}`);
    simulation = simResponse.data.simulation;
    
    if (!civilization) {
      hideLoading();
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
      
      // Load wonder data
      await loadWonderData();
      
      // Load religion data
      await loadReligionData();
      
      // Load all civilizations in simulation
      await loadAllCivilizations();
      
      hideLoading();
      renderGame();
    }
  } catch (error) {
    hideLoading();
    if (error.response?.status === 404) {
      showCivilizationSetup();
    } else {
      console.error('Failed to load game:', error);
      notifyError('Failed to load game');
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
              <div class="text-center cursor-pointer hover:bg-gray-700 px-3 py-2 rounded transition" onclick="showHistoricalContext()">
                <div class="text-xl font-bold text-yellow-400 flex items-center gap-2">
                  ${formatYear(simulation.current_year)}
                  <i class="fas fa-book text-sm text-blue-400" title="Learn about this period"></i>
                </div>
                <div class="text-xs text-gray-400">Current Year (Click for history)</div>
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
  const wonders = civilization.wonders || [];
  const cultureBuildings = civilization.culture_buildings || [];
  const culturalBonuses = civilization.cultural_bonuses || [];
  const achievements = civilization.achievements || [];
  const religionTenants = civilization.religion_tenants || [];
  
  return `
    <div class="bg-gray-800 rounded-lg p-4 sticky top-4 max-h-screen overflow-y-auto">
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

      ${wonders.length > 0 || cultureBuildings.length > 0 ? `
        <div class="mt-3 pt-3 border-t border-gray-700">
          <h3 class="font-bold mb-2 text-xs text-gray-400">Wonders Built (${wonders.length + cultureBuildings.length})</h3>
          <div class="flex flex-wrap gap-1">
            ${[...wonders, ...cultureBuildings].slice(0, 6).map(w => {
              const wonder = availableWonders.find(aw => aw.id === w);
              return wonder ? `<span class="text-lg" title="${wonder.displayName}">${wonder.icon}</span>` : '';
            }).join('')}
            ${(wonders.length + cultureBuildings.length) > 6 ? `<span class="text-xs text-gray-400">+${(wonders.length + cultureBuildings.length) - 6} more</span>` : ''}
          </div>
        </div>
      ` : ''}

      ${civilization.religion_name ? `
        <div class="mt-3 pt-3 border-t border-gray-700">
          <h3 class="font-bold mb-2 text-xs text-gray-400"><i class="fas fa-star mr-1 text-yellow-400"></i>Religion</h3>
          <div class="bg-yellow-900 border border-yellow-700 rounded p-2 text-xs">
            <p class="font-bold text-yellow-300">${civilization.religion_name}</p>
            ${religionTenants.length > 0 ? `
              <div class="mt-1 space-y-0.5">
                ${religionTenants.map(t => {
                  const tenet = availableTenets.find(at => at.id === t);
                  return tenet ? `<p class="text-gray-300">• ${tenet.name}</p>` : '';
                }).join('')}
              </div>
            ` : ''}
            <p class="text-gray-400 mt-1">Followers: ${civilization.religion_followers || 0}</p>
          </div>
        </div>
      ` : ''}

      ${culturalBonuses.length > 0 ? `
        <div class="mt-3 pt-3 border-t border-gray-700">
          <h3 class="font-bold mb-2 text-xs text-gray-400"><i class="fas fa-gem mr-1 text-pink-400"></i>Cultural Bonuses (${culturalBonuses.length})</h3>
          <div class="space-y-1 text-xs max-h-24 overflow-y-auto">
            ${culturalBonuses.slice(0, 5).map(b => `
              <div class="bg-pink-900 border border-pink-700 rounded px-2 py-1">
                ${b.replace(/_/g, ' ')}
              </div>
            `).join('')}
            ${culturalBonuses.length > 5 ? `<p class="text-gray-400 text-center">+${culturalBonuses.length - 5} more</p>` : ''}
          </div>
        </div>
      ` : ''}

      ${achievements.length > 0 ? `
        <div class="mt-3 pt-3 border-t border-gray-700">
          <h3 class="font-bold mb-2 text-xs text-gray-400"><i class="fas fa-medal mr-1 text-yellow-400"></i>Achievements (${achievements.length})</h3>
          <div class="flex flex-wrap gap-1">
            ${achievements.map(a => `<span class="text-lg" title="${a}">🏆</span>`).join('')}
          </div>
        </div>
      ` : ''}

      ${civilization.wonder ? `
        <div class="mt-3 bg-yellow-900 rounded-lg p-2">
          <h3 class="font-bold text-yellow-300 text-sm"><i class="fas fa-trophy mr-1"></i>Wonder</h3>
          <p class="text-xs">${civilization.wonder}</p>
        </div>
      ` : ''}
    </div>
  `;
}

// Render map (Hex Grid)
function renderMap() {
  // Get terrain data
  const terrainTiles = civilization.terrain_data || [];
  const waterResource = civilization.water_resource || 'lake';
  const isIsland = civilization.is_island || false;
  
  // Calculate terrain bonuses
  const terrainBonuses = calculateTotalTerrainBonuses(terrainTiles, isIsland);
  
  // Get water resource info
  const waterResourceInfo = getWaterResourceInfo(waterResource);
  
  let mapHTML = `
    <div class="bg-gray-800 rounded-lg p-4">
      <div class="flex justify-between items-start mb-3 border-b border-gray-700 pb-2">
        <div>
          <h2 class="text-lg font-bold">
            <i class="fas fa-map mr-2 text-green-400"></i>Your Territory
          </h2>
          <div class="text-xs text-gray-400 mt-1">
            ${waterResourceInfo.icon} ${waterResourceInfo.name}
          </div>
        </div>
        <div class="text-right text-xs">
          <div class="text-green-400">
            <i class="fas fa-shield-alt mr-1"></i>Defense: +${terrainBonuses.defense}
          </div>
          <div class="text-yellow-400">
            <i class="fas fa-industry mr-1"></i>Industry: +${terrainBonuses.industry}
          </div>
          ${isIsland ? '<div class="text-blue-400"><i class="fas fa-water mr-1"></i>Island: +7 def</div>' : ''}
        </div>
      </div>
      
      <!-- Hex Map Canvas -->
      <div id="hexMapContainer" class="bg-gray-900 rounded relative" style="height: 500px; width: 100%;">
        <!-- Canvas will be inserted here by HexMap class -->
      </div>
      
      <div class="mt-3 text-xs text-gray-400 text-center">
        Click a hex to place a building · Hover to see terrain bonuses
      </div>
      
      <!-- Terrain Legend -->
      <div class="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div class="bg-gray-900 rounded p-2">
          <span class="text-lg">⛰️</span> Mountains
          <div class="text-gray-400">+10 def, +4 ind</div>
        </div>
        <div class="bg-gray-900 rounded p-2">
          <span class="text-lg">🌲</span> Forest
          <div class="text-gray-400">+1 def, +3 ind</div>
        </div>
        <div class="bg-gray-900 rounded p-2">
          <span class="text-lg">🏜️</span> Desert
          <div class="text-gray-400">+4 defense</div>
        </div>
      </div>
    </div>
  `;
  
  return mapHTML;
}

// Get water resource display info
function getWaterResourceInfo(waterResource) {
  const info = {
    river: { name: 'River (Freshwater)', icon: '🌊', capacity: 15 },
    lake: { name: 'Lake (Freshwater)', icon: '💧', capacity: 10 },
    lake_brackish: { name: 'Lake (Brackish)', icon: '💧', capacity: 6 },
    marsh: { name: 'Marsh (Brackish)', icon: '💧', capacity: 7 },
    ocean: { name: 'Ocean (Saltwater)', icon: '🌊', capacity: 5 },
    none: { name: 'Wells', icon: '🚰', capacity: 4 }
  };
  
  return info[waterResource] || info.lake;
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
  const canFoundReligion = simulation.current_year >= -1000 && !civilization.religion_name;
  const canSpreadReligion = civilization.religion_name && civilization.religion_followers >= 0;
  
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
          
          <button onclick="showWonderMenu()" class="w-full bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg transition text-left text-sm">
            <i class="fas fa-trophy text-lg mr-2"></i>
            <div class="font-bold">Build Wonder</div>
            <div class="text-xs opacity-80">Great monuments</div>
          </button>
          
          ${canFoundReligion ? `
            <button onclick="showReligionFoundingMenu()" class="w-full bg-yellow-500 hover:bg-yellow-600 px-4 py-3 rounded-lg transition text-left text-sm">
              <i class="fas fa-star text-lg mr-2"></i>
              <div class="font-bold">Found Religion</div>
              <div class="text-xs opacity-80">After 1000 BCE</div>
            </button>
          ` : canSpreadReligion ? `
            <button onclick="showReligionSpreadMenu()" class="w-full bg-yellow-500 hover:bg-yellow-600 px-4 py-3 rounded-lg transition text-left text-sm">
              <i class="fas fa-hands-praying text-lg mr-2"></i>
              <div class="font-bold">Spread Religion</div>
              <div class="text-xs opacity-80">Convert others</div>
            </button>
          ` : ''}
          
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
// Global hex map instance
let hexMapInstance = null;

function setupMapHandlers() {
  // Initialize hex map
  const terrainTiles = civilization.terrain_data || [];
  
  if (terrainTiles.length === 0) {
    console.warn('No terrain data available');
    return;
  }
  
  // Create hex map instance
  hexMapInstance = new HexMap('hexMapContainer', terrainTiles);
  
  // Load existing buildings onto hex map
  if (buildingMap) {
    hexMapInstance.setBuildings(buildingMap);
  }
  
  // Set click handler
  hexMapInstance.onHexClick = (tile, coord) => {
    const key = `${coord.q},${coord.r},${coord.s}`;
    
    if (buildingMap[key]) {
      notifyInfo(`This hex already has: ${buildingMap[key]}`, 2000);
    } else {
      showBuildMenu(coord.q, coord.r, coord.s);
    }
  };
}

// Show build menu
let selectedTile = null;

function showBuildMenu(q, r, s) {
  selectedTile = q !== undefined ? { q, r, s } : null;
  
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
        ${selectedTile ? `<p class="text-sm text-gray-400 mb-4">Hex: (${selectedTile.q}, ${selectedTile.r}, ${selectedTile.s})</p>` : ''}
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
    alert('Please click on a hex first!');
    return;
  }
  
  try {
    // If placing existing building, just update map
    if (isPlacingExisting) {
      // Add to map using hex coordinates
      const key = `${selectedTile.q},${selectedTile.r},${selectedTile.s}`;
      buildingMap[key] = buildingType;
      
      // Update hex map display
      if (hexMapInstance) {
        hexMapInstance.placeBuilding(selectedTile.q, selectedTile.r, selectedTile.s, buildingType);
      }
      
      // Save map data to database
      await axios.post(`/api/student/civilization/${civilization.id}/map`, {
        map_data: JSON.stringify(buildingMap)
      });
      
      notifySuccess(`${buildingType.charAt(0).toUpperCase() + buildingType.slice(1)} placed on map!`, 3000);
    } else {
      // Build new building (costs industry)
      const response = await axios.post('/api/game/build', {
        civId: civilization.id,
        building: buildingType
      });
      
      // Update civilization
      civilization = response.data.civilization;
      
      // Add to map using hex coordinates
      const key = `${selectedTile.q},${selectedTile.r},${selectedTile.s}`;
      buildingMap[key] = buildingType;
      
      // Update hex map display
      if (hexMapInstance) {
        hexMapInstance.placeBuilding(selectedTile.q, selectedTile.r, selectedTile.s, buildingType);
      }
      
      // Save map data
      await axios.post(`/api/student/civilization/${civilization.id}/map`, {
        map_data: JSON.stringify(buildingMap)
      });
      
      notifySuccess(`${buildingType.charAt(0).toUpperCase() + buildingType.slice(1)} built successfully!`, 3000);
    }
    
    closeBuildMenu();
    selectedTile = null;
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

// Load wonder data
async function loadWonderData() {
  try {
    const response = await axios.get('/api/wonders/list');
    availableWonders = [...response.data.wonders, ...response.data.cultureBuildings];
    
    const simResponse = await axios.get(`/api/wonders/simulation/${simulation.id}`);
    builtWonders = simResponse.data.builtWonders || [];
  } catch (error) {
    console.error('Failed to load wonder data:', error);
  }
}

// Load religion data
async function loadReligionData() {
  try {
    const response = await axios.get('/api/religion/tenets');
    availableTenets = response.data.tenets || [];
  } catch (error) {
    console.error('Failed to load religion data:', error);
  }
}

// Load all civilizations in simulation
async function loadAllCivilizations() {
  try {
    const response = await axios.get(`/api/teacher/simulation/${simulation.id}/civilizations`);
    civilizationsInSim = response.data.civilizations || [];
  } catch (error) {
    console.error('Failed to load civilizations:', error);
  }
}

// Show wonder building menu
async function showWonderMenu() {
  // Reload wonder data to get latest
  await loadWonderData();
  
  const civWonders = civilization.wonders || [];
  const civCultureBuildings = civilization.culture_buildings || [];
  const civRegions = civilization.regions || [];
  
  // Separate wonders by category
  const ancientWonders = availableWonders.filter(w => 
    w.cost <= 150 && !w.cultureSpecific && w.unique
  );
  const classicalWonders = availableWonders.filter(w => 
    w.cost > 150 && w.cost <= 250 && !w.cultureSpecific && w.unique
  );
  const lateWonders = availableWonders.filter(w => 
    w.cost > 250 && !w.cultureSpecific && w.unique
  );
  const cultureBuildings = availableWonders.filter(w => 
    w.cultureSpecific && w.cultureSpecific.some(c => civRegions.includes(c))
  );
  
  const modalHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-2 sm:p-4" onclick="closeWonderMenu()">
      <div class="bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6" onclick="event.stopPropagation()">
        <h2 class="text-2xl font-bold text-white mb-4">
          <i class="fas fa-trophy mr-2 text-yellow-400"></i>Build Wonder
        </h2>
        <p class="text-sm text-yellow-400 mb-4">Industry Available: ${civilization.industry_left}</p>
        
        ${ancientWonders.length > 0 ? `
          <div class="mb-4">
            <h3 class="text-lg font-bold text-purple-400 mb-2">Ancient Wonders</h3>
            <div class="grid md:grid-cols-2 gap-3">
              ${ancientWonders.map(w => renderWonderCard(w, civWonders, builtWonders)).join('')}
            </div>
          </div>
        ` : ''}
        
        ${classicalWonders.length > 0 ? `
          <div class="mb-4">
            <h3 class="text-lg font-bold text-blue-400 mb-2">Classical Wonders</h3>
            <div class="grid md:grid-cols-2 gap-3">
              ${classicalWonders.map(w => renderWonderCard(w, civWonders, builtWonders)).join('')}
            </div>
          </div>
        ` : ''}
        
        ${lateWonders.length > 0 ? `
          <div class="mb-4">
            <h3 class="text-lg font-bold text-red-400 mb-2">Late Wonders</h3>
            <div class="grid md:grid-cols-2 gap-3">
              ${lateWonders.map(w => renderWonderCard(w, civWonders, builtWonders)).join('')}
            </div>
          </div>
        ` : ''}
        
        ${cultureBuildings.length > 0 ? `
          <div class="mb-4">
            <h3 class="text-lg font-bold text-pink-400 mb-2">Culture Buildings</h3>
            <div class="grid md:grid-cols-2 gap-3">
              ${cultureBuildings.map(w => renderWonderCard(w, civCultureBuildings, builtWonders, true)).join('')}
            </div>
          </div>
        ` : ''}
        
        <button onclick="closeWonderMenu()" class="w-full bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg transition mt-4">
          Close
        </button>
      </div>
    </div>
  `;
  
  const modalContainer = document.createElement('div');
  modalContainer.id = 'wonderModal';
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer);
}

function renderWonderCard(wonder, ownedWonders, allBuiltWonders, isCultureBuilding = false) {
  const isOwned = ownedWonders.includes(wonder.id);
  const isBuiltByOther = wonder.unique && allBuiltWonders.includes(wonder.id) && !isOwned;
  const canAfford = civilization.industry_left >= wonder.cost;
  const canBuild = canAfford && !isBuiltByOther && !isOwned;
  
  // Check science requirement
  let scienceReq = true;
  if (wonder.requirements?.science) {
    scienceReq = civilization.science >= wonder.requirements.science;
  }
  
  const finalCanBuild = canBuild && scienceReq;
  
  return `
    <button onclick="buildWonder('${wonder.id}', ${isCultureBuilding})" 
            class="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition text-left ${!finalCanBuild ? 'opacity-50 cursor-not-allowed' : ''}"
            ${!finalCanBuild ? 'disabled' : ''}>
      <div class="flex items-start justify-between mb-2">
        <div>
          <div class="text-2xl mb-1">${wonder.icon}</div>
          <div class="font-bold text-white">${wonder.displayName}</div>
        </div>
        <div class="text-yellow-400 font-bold">${wonder.cost}</div>
      </div>
      <div class="text-xs text-gray-400 mb-2">${wonder.description}</div>
      ${Object.keys(wonder.effects).map(key => `
        <div class="text-xs text-green-400">+${wonder.effects[key]} ${key.replace(/_/g, ' ')}</div>
      `).join('')}
      ${isOwned ? '<div class="text-xs text-blue-400 mt-1">✓ Already built</div>' : ''}
      ${isBuiltByOther ? '<div class="text-xs text-red-400 mt-1">✗ Already built by another</div>' : ''}
      ${!scienceReq ? `<div class="text-xs text-yellow-400 mt-1">Requires Science ${wonder.requirements.science}</div>` : ''}
    </button>
  `;
}

async function buildWonder(wonderId, isCultureBuilding) {
  try {
    const response = await axios.post('/api/wonders/build', {
      civId: civilization.id,
      wonderId
    });
    
    civilization = response.data.civilization;
    const wonder = response.data.wonder;
    
    // Show notification with effects
    const effects = Object.entries(wonder.effects)
      .map(([key, value]) => `+${value} ${key.replace(/_/g, ' ')}`)
      .join(', ');
    notifyWonder(wonder.displayName, effects);
    
    closeWonderMenu();
    await loadGame();
  } catch (error) {
    console.error('Failed to build wonder:', error);
    notifyError(error.response?.data?.error || 'Failed to build wonder');
  }
}

function closeWonderMenu() {
  const modal = document.getElementById('wonderModal');
  if (modal) modal.remove();
}

// Show religion founding menu
async function showReligionFoundingMenu() {
  try {
    // Get faith leaderboard
    const leaderboardResponse = await axios.get(`/api/religion/leaderboard/${simulation.id}`);
    const leaderboard = leaderboardResponse.data.leaderboard || [];
    const canFound = leaderboardResponse.data.canFound || false;
    
    if (!canFound) {
      alert('Only the top 3 civilizations by faith can found a religion!');
      return;
    }
    
    // Get tenets
    const tenetsResponse = await axios.get('/api/religion/tenets');
    const allTenets = tenetsResponse.data.tenets || [];
    
    // Get already taken tenets
    const takenTenets = civilizationsInSim
      .filter(c => c.religion_name)
      .flatMap(c => c.religion_tenants || []);
    
    // Check if Israel (gets 3 tenets instead of 2)
    const isIsrael = (civilization.regions || []).includes('Israel');
    const maxTenets = isIsrael ? 3 : 2;
    
    const modalHTML = `
      <div class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-2 sm:p-4" onclick="closeReligionFoundingMenu()">
        <div class="bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
          <h2 class="text-2xl font-bold text-white mb-4">
            <i class="fas fa-star mr-2 text-yellow-400"></i>Found Religion
          </h2>
          
          <div class="mb-4">
            <h3 class="text-sm font-bold text-gray-400 mb-2">Faith Leaderboard (Top 3 Can Found)</h3>
            <div class="space-y-1">
              ${leaderboard.slice(0, 5).map((c, i) => `
                <div class="flex justify-between text-sm ${c.id === civilization.id ? 'bg-blue-900 text-blue-200' : 'text-gray-400'}  px-2 py-1 rounded">
                  <span>#${i + 1} ${c.name}</span>
                  <span>Faith: ${c.faith}</span>
                </div>
              `).join('')}
            </div>
          </div>
          
          <form id="foundReligionForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Religion Name</label>
              <input type="text" id="religionName" required
                     class="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-yellow-400 focus:outline-none"
                     placeholder="Enter religion name">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Select ${maxTenets} Tenet${maxTenets > 1 ? 's' : ''} ${isIsrael ? '(Israel Bonus: +1 Tenet)' : ''}
              </label>
              <div class="space-y-2 max-h-60 overflow-y-auto">
                ${allTenets.map(t => {
                  const isTaken = takenTenets.includes(t.id);
                  return `
                    <label class="flex items-start p-2 rounded-lg cursor-pointer ${isTaken ? 'bg-gray-900 opacity-50' : 'bg-gray-700 hover:bg-gray-600'}">
                      <input type="checkbox" name="tenets" value="${t.id}" 
                             class="mt-1 mr-2" ${isTaken ? 'disabled' : ''}>
                      <div class="flex-1">
                        <div class="font-bold text-white">${t.name}</div>
                        <div class="text-xs text-gray-400">${t.effect}</div>
                        ${isTaken ? '<div class="text-xs text-red-400">Already taken</div>' : ''}
                      </div>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>
            
            <div class="flex gap-3">
              <button type="submit" class="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition font-bold">
                Found Religion
              </button>
              <button type="button" onclick="closeReligionFoundingMenu()" 
                      class="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    const modalContainer = document.createElement('div');
    modalContainer.id = 'religionFoundingModal';
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    
    // Setup form handler
    document.getElementById('foundReligionForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await foundReligion(maxTenets);
    });
    
    // Limit checkbox selection
    const checkboxes = document.querySelectorAll('input[name="tenets"]');
    checkboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        const checked = document.querySelectorAll('input[name="tenets"]:checked');
        if (checked.length > maxTenets) {
          cb.checked = false;
          alert(`You can only select ${maxTenets} tenet${maxTenets > 1 ? 's' : ''}!`);
        }
      });
    });
    
  } catch (error) {
    console.error('Failed to load religion data:', error);
    alert('Failed to load religion data');
  }
}

async function foundReligion(maxTenets) {
  const religionName = document.getElementById('religionName').value.trim();
  const selectedTenets = Array.from(document.querySelectorAll('input[name="tenets"]:checked'))
    .map(cb => cb.value);
  
  if (!religionName) {
    notifyWarning('Please enter a religion name!');
    return;
  }
  
  if (selectedTenets.length !== maxTenets) {
    notifyWarning(`Please select exactly ${maxTenets} tenet${maxTenets > 1 ? 's' : ''}!`);
    return;
  }
  
  try {
    const response = await axios.post('/api/religion/found', {
      civId: civilization.id,
      religionName,
      tenetIds: selectedTenets
    });
    
    civilization = response.data.civilization;
    const tenetNames = selectedTenets.map(t => t.replace(/_/g, ' ')).join(', ');
    notifyReligion(`${religionName} founded with tenets: ${tenetNames}`, 8000, {
      title: `⭐ ${religionName} Founded!`
    });
    
    closeReligionFoundingMenu();
    await loadGame();
  } catch (error) {
    console.error('Failed to found religion:', error);
    notifyError(error.response?.data?.error || 'Failed to found religion');
  }
}

function closeReligionFoundingMenu() {
  const modal = document.getElementById('religionFoundingModal');
  if (modal) modal.remove();
}

// Show religion spreading menu
async function showReligionSpreadMenu() {
  // Reload civilization data
  await loadAllCivilizations();
  
  const targets = civilizationsInSim.filter(c => 
    c.id !== civilization.id && 
    !c.conquered &&
    c.religion_name !== civilization.religion_name
  );
  
  if (targets.length === 0) {
    alert('No valid targets to spread religion to!');
    return;
  }
  
  const modalHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onclick="closeReligionSpreadMenu()">
      <div class="bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6" onclick="event.stopPropagation()">
        <h2 class="text-2xl font-bold text-white mb-4">
          <i class="fas fa-hands-praying mr-2 text-yellow-400"></i>Spread Religion
        </h2>
        
        <p class="text-sm text-gray-300 mb-4">
          Spread <span class="text-yellow-400 font-bold">${civilization.religion_name}</span> to another civilization.
          You must have higher faith than the target.
        </p>
        
        <div class="space-y-2 mb-4">
          ${targets.map(t => `
            <button onclick="spreadReligion('${t.id}')" 
                    class="w-full bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition text-left">
              <div class="flex justify-between items-center">
                <div>
                  <div class="font-bold text-white">${t.name}</div>
                  <div class="text-xs text-gray-400">
                    ${t.religion_name ? `Follows: ${t.religion_name}` : 'No religion'}
                  </div>
                </div>
                <div class="text-sm">
                  <div class="text-gray-400">Faith: ${t.faith}</div>
                  <div class="${civilization.faith > t.faith ? 'text-green-400' : 'text-red-400'}">
                    ${civilization.faith > t.faith ? '✓ Can spread' : '✗ Too strong'}
                  </div>
                </div>
              </div>
            </button>
          `).join('')}
        </div>
        
        <button onclick="closeReligionSpreadMenu()" class="w-full bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg transition">
          Cancel
        </button>
      </div>
    </div>
  `;
  
  const modalContainer = document.createElement('div');
  modalContainer.id = 'religionSpreadModal';
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer);
}

async function spreadReligion(targetId) {
  try {
    const response = await axios.post('/api/religion/spread', {
      founderId: civilization.id,
      targetId
    });
    
    notifyReligion(response.data.message || 'Religion spread successfully!', 6000, {
      title: `⭐ ${civilization.religion_name} Spreads`
    });
    
    closeReligionSpreadMenu();
    await loadGame();
  } catch (error) {
    console.error('Failed to spread religion:', error);
    notifyError(error.response?.data?.error || 'Failed to spread religion');
  }
}

function closeReligionSpreadMenu() {
  const modal = document.getElementById('religionSpreadModal');
  if (modal) modal.remove();
}

// ========================================
// HISTORICAL CONTEXT SYSTEM
// ========================================
// Historical context data is loaded from /static/historical-contexts.js

function showHistoricalContext() {
  const yearKey = String(simulation.current_year);
  const context = HISTORICAL_CONTEXTS[yearKey];
  
  if (!context) {
    notifyInfo('No historical context available for this year yet.', 3000);
    return;
  }
  
  const modal = document.createElement('div');
  modal.id = 'historicalContextModal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
  modal.onclick = (e) => { if (e.target === modal) closeHistoricalContext(); };
  
  modal.innerHTML = `
    <div class="bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
      <!-- Header -->
      <div class="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl z-10">
        <div class="flex justify-between items-start">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <i class="fas fa-book-open text-3xl"></i>
              <h2 class="text-3xl font-bold">${context.title}</h2>
            </div>
            <p class="text-blue-100 text-lg">${formatYear(simulation.current_year)}</p>
          </div>
          <button onclick="closeHistoricalContext()" class="text-white hover:text-blue-200 transition">
            <i class="fas fa-times text-3xl"></i>
          </button>
        </div>
      </div>
      
      <!-- Content -->
      <div class="p-6 space-y-6 text-gray-100">
        <!-- What Happened -->
        <div class="bg-gray-700 rounded-lg p-5">
          <h3 class="text-xl font-bold text-yellow-400 mb-3 flex items-center">
            <i class="fas fa-scroll mr-2"></i>What Happened
          </h3>
          <p class="text-gray-200 leading-relaxed">${context.description}</p>
        </div>
        
        <!-- Why It Matters -->
        <div class="bg-blue-900 bg-opacity-30 rounded-lg p-5 border-l-4 border-blue-500">
          <h3 class="text-xl font-bold text-blue-400 mb-3 flex items-center">
            <i class="fas fa-lightbulb mr-2"></i>Why It Matters
          </h3>
          <p class="text-gray-200 leading-relaxed">${context.whyItMatters}</p>
        </div>
        
        <!-- Real World Impact -->
        <div class="bg-purple-900 bg-opacity-30 rounded-lg p-5 border-l-4 border-purple-500">
          <h3 class="text-xl font-bold text-purple-400 mb-3 flex items-center">
            <i class="fas fa-globe mr-2"></i>Real World Impact
          </h3>
          <p class="text-gray-200 leading-relaxed">${context.realWorldImpact}</p>
        </div>
        
        ${context.primarySources ? `
          <div class="bg-green-900 bg-opacity-30 rounded-lg p-5 border-l-4 border-green-500">
            <h3 class="text-xl font-bold text-green-400 mb-3 flex items-center">
              <i class="fas fa-quote-left mr-2"></i>Primary Sources
            </h3>
            <ul class="space-y-2">
              ${context.primarySources.map(source => `
                <li class="text-gray-200 italic">"${source}"</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${context.keyFigures ? `
          <div class="bg-yellow-900 bg-opacity-30 rounded-lg p-5 border-l-4 border-yellow-500">
            <h3 class="text-xl font-bold text-yellow-400 mb-3 flex items-center">
              <i class="fas fa-users mr-2"></i>Key Figures
            </h3>
            <div class="flex flex-wrap gap-2">
              ${context.keyFigures.map(figure => `
                <span class="bg-yellow-800 bg-opacity-50 text-yellow-200 px-3 py-1 rounded-full text-sm">
                  ${figure}
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        <!-- Modern Connection -->
        <div class="bg-gradient-to-r from-pink-900 to-red-900 bg-opacity-30 rounded-lg p-5 border-l-4 border-pink-500">
          <h3 class="text-xl font-bold text-pink-400 mb-3 flex items-center">
            <i class="fas fa-link mr-2"></i>Connection to Today
          </h3>
          <p class="text-gray-200 leading-relaxed">${context.modernConnection}</p>
        </div>
        
        <!-- Discussion Prompt -->
        <div class="bg-gray-700 rounded-lg p-5 border-2 border-dashed border-gray-500">
          <h3 class="text-lg font-bold text-gray-300 mb-3 flex items-center">
            <i class="fas fa-comments mr-2"></i>Think About It
          </h3>
          <p class="text-gray-300 italic">How might your civilization's choices in this simulation compare to what actually happened in history? What would you do differently?</p>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="sticky bottom-0 bg-gray-700 p-4 rounded-b-xl border-t border-gray-600 flex justify-between items-center">
        <div class="text-sm text-gray-400">
          <i class="fas fa-info-circle mr-1"></i>
          Historical content for educational purposes
        </div>
        <button onclick="closeHistoricalContext()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-bold">
          Close
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Show notification that historical context is available
  notifyInfo('📖 Historical context loaded! Learn about this period.', 5000, {
    title: context.title
  });
}

function closeHistoricalContext() {
  const modal = document.getElementById('historicalContextModal');
  if (modal) modal.remove();
}
