// Student Game Interface JavaScript

let currentStudent = null;
let civilization = null;
let simulation = null;

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
      <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-6">
          <i class="fas fa-flag mr-2 text-blue-600"></i>
          Create Your Civilization
        </h1>
        
        <form id="createCivForm" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Civilization Name</label>
            <input type="text" id="civName" required placeholder="e.g., The Roman Empire" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Choose a Preset or Create Custom</label>
            <select id="presetSelect" onchange="handlePresetChange()" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">Loading presets...</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Civilization Color</label>
            <input type="color" id="civColor" value="#3B82F6" class="w-full h-12 border rounded-lg">
          </div>
          
          <div class="flex gap-4">
            <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition font-bold">
              <i class="fas fa-check mr-2"></i>Create Civilization
            </button>
            <button type="button" onclick="logout()" class="bg-gray-200 hover:bg-gray-300 px-6 py-3 rounded-lg transition">
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
    
    const select = document.getElementById('presetSelect');
    select.innerHTML = `
      <option value="">Create Custom Civilization</option>
      ${presets.map(p => `
        <option value="${p.id}">${p.display_name} - ${p.regions.join(', ')}</option>
      `).join('')}
    `;
  } catch (error) {
    console.error('Failed to load presets:', error);
  }
}

// Handle preset change
function handlePresetChange() {
  // Could show preset details here
}

// Create civilization
async function createCivilization(e) {
  e.preventDefault();
  
  const name = document.getElementById('civName').value;
  const presetId = document.getElementById('presetSelect').value;
  const color = document.getElementById('civColor').value;
  
  try {
    const response = await axios.post('/api/student/civilization', {
      studentId: currentStudent.id,
      name,
      presetId: presetId || null,
      color
    });
    
    civilization = response.data.civilization;
    alert(`Civilization "${name}" created! Good luck!`);
    
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
        <div class="max-w-7xl mx-auto px-4 py-4">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-2xl font-bold">
                <span class="w-4 h-4 inline-block rounded-full mr-2" style="background-color: ${civilization.color}"></span>
                ${civilization.name}
              </h1>
              <p class="text-gray-400 text-sm">${currentStudent.name} • ${currentStudent.period_name}</p>
            </div>
            <div class="flex items-center gap-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-yellow-400">${formatYear(simulation.current_year)}</div>
                <div class="text-xs text-gray-400">Current Year</div>
              </div>
              <button onclick="logout()" class="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition">
                <i class="fas fa-sign-out-alt"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 py-6">
        <div class="grid lg:grid-cols-3 gap-6">
          <!-- Stats Panel -->
          <div class="lg:col-span-1">
            <div class="bg-gray-800 rounded-lg p-6 sticky top-6">
              <h2 class="text-xl font-bold mb-4 border-b border-gray-700 pb-2">
                <i class="fas fa-chart-bar mr-2 text-blue-400"></i>Civilization Stats
              </h2>
              
              ${civilization.conquered ? `
                <div class="bg-red-900 border border-red-700 rounded-lg p-4 mb-4">
                  <i class="fas fa-skull text-2xl mb-2"></i>
                  <p class="font-bold">Conquered!</p>
                  <p class="text-sm text-red-200">Your civilization has fallen.</p>
                </div>
              ` : ''}
              
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-gray-400"><i class="fas fa-home mr-2"></i>Houses:</span>
                  <span class="font-bold">${civilization.houses}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400"><i class="fas fa-users mr-2"></i>Population:</span>
                  <span class="font-bold">${civilization.population}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400"><i class="fas fa-box mr-2"></i>Capacity:</span>
                  <span class="font-bold">${civilization.population_capacity}</span>
                </div>
                <hr class="border-gray-700">
                <div class="flex justify-between">
                  <span class="text-gray-400"><i class="fas fa-seedling mr-2 text-green-400"></i>Fertility:</span>
                  <span class="font-bold text-green-400">${civilization.fertility}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400"><i class="fas fa-industry mr-2 text-yellow-400"></i>Industry:</span>
                  <span class="font-bold text-yellow-400">${civilization.industry} (${civilization.industry_left} left)</span>
                </div>
                <hr class="border-gray-700">
                <div class="flex justify-between">
                  <span class="text-gray-400"><i class="fas fa-fist-raised mr-2 text-red-400"></i>Martial:</span>
                  <span class="font-bold text-red-400">${civilization.martial}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400"><i class="fas fa-shield-alt mr-2 text-blue-400"></i>Defense:</span>
                  <span class="font-bold text-blue-400">${civilization.defense}</span>
                </div>
                <hr class="border-gray-700">
                <div class="flex justify-between">
                  <span class="text-gray-400"><i class="fas fa-flask mr-2 text-purple-400"></i>Science:</span>
                  <span class="font-bold text-purple-400">${civilization.science}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400"><i class="fas fa-theater-masks mr-2 text-pink-400"></i>Culture:</span>
                  <span class="font-bold text-pink-400">${civilization.culture}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400"><i class="fas fa-pray mr-2 text-yellow-300"></i>Faith:</span>
                  <span class="font-bold text-yellow-300">${civilization.faith}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400"><i class="fas fa-handshake mr-2 text-green-300"></i>Diplomacy:</span>
                  <span class="font-bold text-green-300">${civilization.diplomacy}</span>
                </div>
              </div>

              <div class="mt-6 pt-4 border-t border-gray-700">
                <h3 class="font-bold mb-2 text-sm text-gray-400">Cultural Stage</h3>
                <div class="bg-purple-900 rounded px-3 py-2 text-center font-bold capitalize">
                  ${civilization.cultural_stage}
                </div>
              </div>

              <div class="mt-4">
                <h3 class="font-bold mb-2 text-sm text-gray-400">Buildings</h3>
                <div class="grid grid-cols-2 gap-2 text-sm">
                  <div><i class="fas fa-church mr-1"></i>Temples: ${civilization.temples}</div>
                  <div><i class="fas fa-theater-masks mr-1"></i>Amphitheaters: ${civilization.amphitheaters}</div>
                  <div><i class="fas fa-shield-alt mr-1"></i>Walls: ${civilization.walls}</div>
                  <div><i class="fas fa-tower-broadcast mr-1"></i>Archimedes: ${civilization.archimedes_towers}</div>
                </div>
              </div>

              ${civilization.wonder ? `
                <div class="mt-4 bg-yellow-900 rounded-lg p-3">
                  <h3 class="font-bold text-yellow-300 mb-1"><i class="fas fa-trophy mr-2"></i>Wonder</h3>
                  <p class="text-sm">${civilization.wonder}</p>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Actions Panel -->
          <div class="lg:col-span-2">
            <div class="bg-gray-800 rounded-lg p-6 mb-6">
              <h2 class="text-xl font-bold mb-4">
                <i class="fas fa-hammer mr-2 text-yellow-400"></i>Actions
              </h2>
              
              ${simulation.paused ? `
                <div class="bg-yellow-900 border border-yellow-700 rounded-lg p-4 mb-4">
                  <i class="fas fa-pause-circle mr-2"></i>
                  <span class="font-bold">Simulation Paused</span>
                  <p class="text-sm text-yellow-200">Wait for your teacher to resume the game.</p>
                </div>
              ` : civilization.conquered ? `
                <div class="bg-red-900 border border-red-700 rounded-lg p-4">
                  <p class="text-red-200">You cannot take actions after being conquered.</p>
                </div>
              ` : `
                <div class="grid md:grid-cols-2 gap-4">
                  <button onclick="showBuildMenu()" class="bg-yellow-600 hover:bg-yellow-700 px-6 py-4 rounded-lg transition text-left">
                    <i class="fas fa-hammer text-2xl mb-2"></i>
                    <div class="font-bold">Build Structure</div>
                    <div class="text-sm opacity-80">Cost: 10-20 Industry</div>
                  </button>
                  
                  ${simulation.current_year >= -670 ? `
                    <button onclick="alert('War system coming soon!')" class="bg-red-600 hover:bg-red-700 px-6 py-4 rounded-lg transition text-left">
                      <i class="fas fa-skull-crossbones text-2xl mb-2"></i>
                      <div class="font-bold">Declare War</div>
                      <div class="text-sm opacity-80">Conquer others</div>
                    </button>
                  ` : ''}
                  
                  ${civilization.diplomacy >= 1 ? `
                    <button onclick="alert('Alliance system coming soon!')" class="bg-green-600 hover:bg-green-700 px-6 py-4 rounded-lg transition text-left">
                      <i class="fas fa-handshake text-2xl mb-2"></i>
                      <div class="font-bold">Form Alliance</div>
                      <div class="text-sm opacity-80">Requires Diplomacy ≥ 1</div>
                    </button>
                  ` : ''}
                  
                  ${simulation.current_year >= -1000 && !civilization.religion_name ? `
                    <button onclick="alert('Religion system coming soon!')" class="bg-purple-600 hover:bg-purple-700 px-6 py-4 rounded-lg transition text-left">
                      <i class="fas fa-pray text-2xl mb-2"></i>
                      <div class="font-bold">Found Religion</div>
                      <div class="text-sm opacity-80">+5 Faith bonus</div>
                    </button>
                  ` : ''}
                </div>
              `}
            </div>

            <!-- Info Panel -->
            <div class="bg-gray-800 rounded-lg p-6">
              <h2 class="text-xl font-bold mb-4">
                <i class="fas fa-info-circle mr-2 text-blue-400"></i>Game Information
              </h2>
              <div class="space-y-3 text-sm">
                <p><strong>Teacher:</strong> Wait for your teacher to advance the timeline</p>
                <p><strong>Growth Phase:</strong> Happens automatically each turn</p>
                <p><strong>Current Status:</strong> ${simulation.paused ? 'Paused' : 'Active'}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;
}

// Format year
function formatYear(year) {
  if (year < 0) return `${Math.abs(year)} BCE`;
  return `${year} CE`;
}

// Show build menu
function showBuildMenu() {
  alert('Building system:\n\n• Temple (10 Industry): +2 Faith\n• Wall (10 Industry): +1 Defense\n• Archimedes Tower (20 Industry, Science ≥ 30): +20 Defense\n\nFull interface coming soon!');
}
