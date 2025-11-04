// Teacher Dashboard JavaScript

let currentTeacher = null;
let periods = [];
let selectedPeriod = null;

// Check authentication
document.addEventListener('DOMContentLoaded', async () => {
  const teacherData = sessionStorage.getItem('teacher');
  if (!teacherData) {
    window.location.href = '/teacher/login';
    return;
  }
  
  currentTeacher = JSON.parse(teacherData);
  await loadDashboard();
});

// Logout
function logout() {
  sessionStorage.removeItem('teacher');
  window.location.href = '/';
}

// Load dashboard
async function loadDashboard() {
  renderHeader();
  await loadPeriods();
  renderPeriodsList();
}

// Render header
function renderHeader() {
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen bg-gray-100">
      <!-- Header -->
      <header class="bg-white shadow-md">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">
                <i class="fas fa-landmark mr-2 text-red-600"></i>
                Through History - Teacher Dashboard
              </h1>
              <p class="text-gray-600 mt-1">Welcome, ${currentTeacher.name || currentTeacher.email}</p>
            </div>
            <button onclick="logout()" class="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition">
              <i class="fas fa-sign-out-alt mr-2"></i>Logout
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Period Management Section -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-users mr-2"></i>Class Periods
            </h2>
            <button onclick="showCreatePeriodModal()" class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition">
              <i class="fas fa-plus mr-2"></i>Create New Period
            </button>
          </div>
          <div id="periodsList"></div>
        </div>

        <!-- Selected Period Details -->
        <div id="periodDetails"></div>
      </main>

      <!-- Modals -->
      <div id="modalContainer"></div>
    </div>
  `;
}

// Load periods
async function loadPeriods() {
  try {
    const response = await axios.get(`/api/teacher/periods/${currentTeacher.id}`);
    periods = response.data.periods || [];
  } catch (error) {
    console.error('Failed to load periods:', error);
    alert('Failed to load periods');
  }
}

// Render periods list
function renderPeriodsList() {
  const container = document.getElementById('periodsList');
  
  if (periods.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-folder-open text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-500 text-lg">No class periods yet. Create one to get started!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      ${periods.map(period => `
        <div class="border-2 ${selectedPeriod?.id === period.id ? 'border-red-500' : 'border-gray-200'} rounded-lg p-4 hover:shadow-lg transition cursor-pointer" onclick="selectPeriod('${period.id}')">
          <h3 class="text-xl font-bold text-gray-800 mb-2">${period.name}</h3>
          <div class="space-y-2 text-sm">
            <p class="text-gray-600">
              <i class="fas fa-key mr-2 text-yellow-600"></i>
              Invite Code: <span class="font-mono font-bold text-lg">${period.invite_code}</span>
            </p>
            <p class="text-gray-600">
              <i class="fas fa-user-graduate mr-2 text-blue-600"></i>
              Students: ${period.student_count || 0}
            </p>
            <p class="text-gray-600">
              <i class="fas fa-calendar mr-2 text-green-600"></i>
              Year: ${formatYear(period.current_year || -50000)}
            </p>
            <p class="text-gray-600">
              <i class="fas fa-${period.paused ? 'pause' : 'play'} mr-2"></i>
              Status: ${period.paused ? 'Paused' : 'Active'}
            </p>
          </div>
          <button onclick="event.stopPropagation(); viewPeriodDetails('${period.id}')" class="mt-4 w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition">
            View Details
          </button>
        </div>
      `).join('')}
    </div>
  `;
}

// Format year
function formatYear(year) {
  if (year < 0) {
    return `${Math.abs(year)} BCE`;
  }
  return `${year} CE`;
}

// Select period
function selectPeriod(periodId) {
  selectedPeriod = periods.find(p => p.id === periodId);
  renderPeriodsList();
}

// View period details
async function viewPeriodDetails(periodId) {
  selectedPeriod = periods.find(p => p.id === periodId);
  
  if (!selectedPeriod) return;
  
  // Load simulation overview
  try {
    const response = await axios.get(`/api/teacher/simulation/${selectedPeriod.simulation_id}/overview`);
    const data = response.data;
    
    renderPeriodDetails(data);
  } catch (error) {
    console.error('Failed to load period details:', error);
    alert('Failed to load period details');
  }
}

// Store current simulation data globally for tabs
let currentSimulationData = null;

// Render period details
function renderPeriodDetails(data) {
  currentSimulationData = data; // Store for tab switching
  const container = document.getElementById('periodDetails');
  const sim = data.simulation;
  const civs = data.civilizations || [];
  
  container.innerHTML = `
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800">
          <i class="fas fa-gamepad mr-2"></i>${selectedPeriod.name} - Game Control
        </h2>
        <button onclick="closePeriodDetails()" class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-times text-2xl"></i>
        </button>
      </div>

      <!-- Timeline Controls -->
      <div class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-6">
        <h3 class="text-xl font-bold text-gray-800 mb-4">Timeline Control</h3>
        <div class="flex items-center justify-between">
          <div class="text-center">
            <div class="text-4xl font-bold text-purple-600">${formatYear(sim.current_year)}</div>
            <div class="text-sm text-gray-600">Current Year</div>
          </div>
          <div class="text-center">
            <div class="text-4xl font-bold text-blue-600">${sim.timeline_index} / 26</div>
            <div class="text-sm text-gray-600">Event Progress</div>
          </div>
        </div>
        
        <div class="flex gap-4 mt-6">
          <button onclick="advanceTimeline('${sim.id}')" class="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition font-bold">
            <i class="fas fa-forward mr-2"></i>Advance Timeline
          </button>
          <button onclick="goBack('${sim.id}')" class="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg transition font-bold">
            <i class="fas fa-backward mr-2"></i>Go Back
          </button>
          <button onclick="togglePause('${sim.id}', ${!sim.paused})" class="flex-1 bg-${sim.paused ? 'blue' : 'orange'}-600 hover:bg-${sim.paused ? 'blue' : 'orange'}-700 text-white px-6 py-3 rounded-lg transition font-bold">
            <i class="fas fa-${sim.paused ? 'play' : 'pause'} mr-2"></i>${sim.paused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>

      <!-- Civilizations Overview -->
      <div class="mb-6">
        <h3 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-globe mr-2"></i>Civilizations (${civs.length})
        </h3>
        <div class="overflow-x-auto">
          <table class="min-w-full bg-white border border-gray-200">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-4 py-2 text-left">Civilization</th>
                <th class="px-4 py-2 text-center">Pop.</th>
                <th class="px-4 py-2 text-center">🏠</th>
                <th class="px-4 py-2 text-center">⛪</th>
                <th class="px-4 py-2 text-center">🎭</th>
                <th class="px-4 py-2 text-center">🧱</th>
                <th class="px-4 py-2 text-center">🗼</th>
                <th class="px-4 py-2 text-center">Wonders</th>
                <th class="px-4 py-2 text-center">Religion</th>
                <th class="px-4 py-2 text-center">Faith</th>
                <th class="px-4 py-2 text-center">Science</th>
                <th class="px-4 py-2 text-center">Martial</th>
                <th class="px-4 py-2 text-center">Defense</th>
                <th class="px-4 py-2 text-center">Achievements</th>
                <th class="px-4 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              ${civs.map(civ => {
                const wonders = civ.wonders || [];
                const cultureBuildings = civ.culture_buildings || [];
                const totalWonders = wonders.length + cultureBuildings.length;
                const achievements = civ.achievements || [];
                
                return `
                <tr class="border-t ${civ.conquered ? 'bg-red-50 opacity-60' : 'hover:bg-gray-50'} cursor-pointer" onclick="showCivilizationDetails('${civ.id}')">
                  <td class="px-4 py-2">
                    <div class="flex items-center">
                      <div class="w-4 h-4 rounded-full mr-2" style="background-color: ${civ.color}"></div>
                      <span class="font-semibold">${civ.name}</span>
                      <i class="fas fa-info-circle ml-2 text-gray-400 text-sm" title="Click for details"></i>
                    </div>
                  </td>
                  <td class="px-4 py-2 text-center">${civ.population}</td>
                  <td class="px-4 py-2 text-center" title="Houses">${civ.houses}</td>
                  <td class="px-4 py-2 text-center" title="Temples">${civ.temples}</td>
                  <td class="px-4 py-2 text-center" title="Amphitheaters">${civ.amphitheaters}</td>
                  <td class="px-4 py-2 text-center" title="Walls">${civ.walls}</td>
                  <td class="px-4 py-2 text-center" title="Archimedes Towers">${civ.archimedes_towers}</td>
                  <td class="px-4 py-2 text-center" title="${totalWonders} Wonders">
                    ${totalWonders > 0 ? `<span class="font-bold text-purple-600">🏛️ ${totalWonders}</span>` : '-'}
                  </td>
                  <td class="px-4 py-2 text-center" title="${civ.religion_name || 'None'}">
                    ${civ.religion_name ? `<span class="text-yellow-600">⭐</span>` : '-'}
                  </td>
                  <td class="px-4 py-2 text-center">${civ.faith}</td>
                  <td class="px-4 py-2 text-center">${civ.science}</td>
                  <td class="px-4 py-2 text-center">${civ.martial}</td>
                  <td class="px-4 py-2 text-center">${civ.defense}</td>
                  <td class="px-4 py-2 text-center" title="${achievements.length} Achievements">
                    ${achievements.length > 0 ? `<span class="font-bold text-yellow-500">🏆 ${achievements.length}</span>` : '-'}
                  </td>
                  <td class="px-4 py-2 text-center">
                    ${civ.conquered ? 
                      '<span class="text-red-600 font-bold"><i class="fas fa-skull mr-1"></i>Conquered</span>' : 
                      '<span class="text-green-600 font-bold"><i class="fas fa-check-circle mr-1"></i>Active</span>'
                    }
                  </td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Detailed Tabs -->
      <div class="mb-6">
        <div class="border-b border-gray-200 mb-4">
          <nav class="flex gap-4">
            <button onclick="showTab('wonders')" id="tab-wonders" class="tab-button px-4 py-2 font-semibold border-b-2 border-transparent hover:border-purple-500 transition">
              <i class="fas fa-trophy mr-2"></i>Wonders
            </button>
            <button onclick="showTab('religions')" id="tab-religions" class="tab-button px-4 py-2 font-semibold border-b-2 border-transparent hover:border-yellow-500 transition">
              <i class="fas fa-star mr-2"></i>Religions
            </button>
            <button onclick="showTab('achievements')" id="tab-achievements" class="tab-button px-4 py-2 font-semibold border-b-2 border-transparent hover:border-yellow-500 transition">
              <i class="fas fa-medal mr-2"></i>Achievements
            </button>
            <button onclick="showTab('bonuses')" id="tab-bonuses" class="tab-button px-4 py-2 font-semibold border-b-2 border-transparent hover:border-pink-500 transition">
              <i class="fas fa-gem mr-2"></i>Cultural Bonuses
            </button>
          </nav>
        </div>
        <div id="tab-content">
          ${renderWondersTab(civs)}
        </div>
      </div>
    </div>
  `;
}

// Tab switching
function showTab(tabName) {
  if (!currentSimulationData) return;
  
  // Update tab buttons
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('border-purple-500', 'border-yellow-500', 'border-pink-500', 'text-gray-900');
    btn.classList.add('border-transparent', 'text-gray-600');
  });
  
  const activeTab = document.getElementById(`tab-${tabName}`);
  activeTab.classList.remove('border-transparent', 'text-gray-600');
  activeTab.classList.add('text-gray-900');
  
  if (tabName === 'wonders') {
    activeTab.classList.add('border-purple-500');
  } else if (tabName === 'religions') {
    activeTab.classList.add('border-yellow-500');
  } else if (tabName === 'achievements') {
    activeTab.classList.add('border-yellow-500');
  } else if (tabName === 'bonuses') {
    activeTab.classList.add('border-pink-500');
  }
  
  const container = document.getElementById('tab-content');
  const civs = currentSimulationData.civilizations || [];
  
  if (tabName === 'wonders') {
    container.innerHTML = renderWondersTab(civs);
  } else if (tabName === 'religions') {
    container.innerHTML = renderReligionsTab(civs);
  } else if (tabName === 'achievements') {
    container.innerHTML = renderAchievementsTab(civs);
  } else if (tabName === 'bonuses') {
    container.innerHTML = renderBonusesTab(civs);
  }
}

// Render religions tab
function renderReligionsTab(civs) {
  const religions = civs.filter(civ => civ.religion_name);
  
  if (religions.length === 0) {
    return '<div class="text-center py-8 text-gray-500">No religions have been founded yet</div>';
  }
  
  return `
    <div class="grid md:grid-cols-2 gap-4">
      ${religions.map(civ => {
        const tenets = civ.religion_tenants || [];
        return `
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center">
                <div class="w-4 h-4 rounded-full mr-2" style="background-color: ${civ.color}"></div>
                <div>
                  <h4 class="font-bold text-gray-800">${civ.religion_name}</h4>
                  <p class="text-sm text-gray-600">Founded by ${civ.name}</p>
                </div>
              </div>
              <div class="text-2xl">⭐</div>
            </div>
            <div class="mb-3">
              <p class="text-sm font-semibold text-gray-700 mb-1">Tenets:</p>
              <div class="space-y-1">
                ${tenets.map(t => `
                  <div class="text-sm text-gray-600 bg-yellow-100 px-2 py-1 rounded">
                    • ${t.replace(/_/g, ' ')}
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="flex justify-between text-sm text-gray-600">
              <span><i class="fas fa-users mr-1"></i>Followers: ${civ.religion_followers || 0}</span>
              <span><i class="fas fa-pray mr-1"></i>Faith: ${civ.faith}</span>
            </div>
          </div>
        `}).join('')}
    </div>
  `;
}

// Render achievements tab
function renderAchievementsTab(civs) {
  const achievementData = [
    { id: 'glory_to_rome', name: 'Glory to Rome', description: 'Conquer 10 civilizations', icon: '⚔️' },
    { id: 'test_of_time', name: 'Test of Time', description: 'Survive 20 battles', icon: '🛡️' },
    { id: 'ozymandias', name: 'Ozymandias', description: 'First civilization defeated', icon: '💀' },
    { id: 'cultural_victory', name: 'Cultural Victory', description: 'Highest culture at game end', icon: '🎭' },
    { id: 'scientific_achievement', name: 'Scientific Achievement', description: 'Reach science level 30', icon: '🔬' },
    { id: 'religious_dominance', name: 'Religious Dominance', description: 'Convert 5+ civilizations', icon: '⭐' },
    { id: 'economic_powerhouse', name: 'Economic Powerhouse', description: 'Have 200+ industry', icon: '💰' },
    { id: 'military_supremacy', name: 'Military Supremacy', description: '100+ martial', icon: '⚔️' }
  ];
  
  const achievementsByCiv = {};
  civs.forEach(civ => {
    const achievements = civ.achievements || [];
    if (achievements.length > 0) {
      achievementsByCiv[civ.name] = {
        color: civ.color,
        achievements: achievements
      };
    }
  });
  
  if (Object.keys(achievementsByCiv).length === 0) {
    return '<div class="text-center py-8 text-gray-500">No achievements earned yet</div>';
  }
  
  return `
    <div class="space-y-4">
      ${achievementData.map(achievement => {
        const earners = Object.entries(achievementsByCiv).filter(([_, data]) => 
          data.achievements.includes(achievement.id)
        );
        
        if (earners.length === 0) return '';
        
        return `
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div class="flex items-center mb-3">
              <span class="text-3xl mr-3">${achievement.icon}</span>
              <div>
                <h4 class="font-bold text-gray-800">${achievement.name}</h4>
                <p class="text-sm text-gray-600">${achievement.description}</p>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              ${earners.map(([civName, data]) => `
                <div class="flex items-center bg-white px-3 py-1 rounded border border-yellow-300">
                  <div class="w-3 h-3 rounded-full mr-2" style="background-color: ${data.color}"></div>
                  <span class="text-sm font-semibold">${civName}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `}).join('')}
    </div>
  `;
}

// Render cultural bonuses tab
function renderBonusesTab(civs) {
  const bonusesByCiv = {};
  
  civs.forEach(civ => {
    const bonuses = civ.cultural_bonuses || [];
    if (bonuses.length > 0) {
      bonusesByCiv[civ.name] = {
        color: civ.color,
        bonuses: bonuses
      };
    }
  });
  
  if (Object.keys(bonusesByCiv).length === 0) {
    return '<div class="text-center py-8 text-gray-500">No cultural bonuses unlocked yet</div>';
  }
  
  return `
    <div class="grid md:grid-cols-2 gap-4">
      ${Object.entries(bonusesByCiv).map(([civName, data]) => `
        <div class="bg-pink-50 border border-pink-200 rounded-lg p-4">
          <div class="flex items-center mb-3">
            <div class="w-4 h-4 rounded-full mr-2" style="background-color: ${data.color}"></div>
            <h4 class="font-bold text-gray-800">${civName}</h4>
          </div>
          <div class="space-y-1">
            ${data.bonuses.map(b => `
              <div class="bg-pink-100 text-pink-800 px-2 py-1 rounded text-sm">
                <i class="fas fa-gem mr-1"></i>${b.replace(/_/g, ' ')}
              </div>
            `).join('')}
          </div>
          <div class="mt-2 text-sm text-gray-600">
            Total: ${data.bonuses.length} bonus${data.bonuses.length > 1 ? 'es' : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Render wonders tab
function renderWondersTab(civs) {
  const wondersByCiv = {};
  
  civs.forEach(civ => {
    const wonders = civ.wonders || [];
    const cultureBuildings = civ.culture_buildings || [];
    const allWonders = [...wonders, ...cultureBuildings];
    
    if (allWonders.length > 0) {
      wondersByCiv[civ.name] = {
        color: civ.color,
        wonders: allWonders
      };
    }
  });
  
  if (Object.keys(wondersByCiv).length === 0) {
    return '<div class="text-center py-8 text-gray-500">No wonders have been built yet</div>';
  }
  
  return `
    <div class="grid md:grid-cols-2 gap-4">
      ${Object.entries(wondersByCiv).map(([civName, data]) => `
        <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div class="flex items-center mb-3">
            <div class="w-4 h-4 rounded-full mr-2" style="background-color: ${data.color}"></div>
            <h4 class="font-bold text-gray-800">${civName}</h4>
          </div>
          <div class="flex flex-wrap gap-2">
            ${data.wonders.map(w => `
              <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm" title="${w}">
                🏛️ ${w.replace(/_/g, ' ')}
              </span>
            `).join('')}
          </div>
          <div class="mt-2 text-sm text-gray-600">
            Total: ${data.wonders.length} wonder${data.wonders.length > 1 ? 's' : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Close period details
function closePeriodDetails() {
  document.getElementById('periodDetails').innerHTML = '';
  selectedPeriod = null;
  renderPeriodsList();
}

// Advance timeline
async function advanceTimeline(simulationId) {
  if (!confirm('Advance to the next historical event?')) return;
  
  try {
    const response = await axios.post(`/api/teacher/simulation/${simulationId}/advance`);
    const event = response.data.event;
    
    alert(`Timeline Advanced!\n\nYear: ${formatYear(event.year)}\n\n${event.data.description || 'Historical event occurred'}`);
    
    // Reload period details
    await viewPeriodDetails(selectedPeriod.id);
  } catch (error) {
    console.error('Failed to advance timeline:', error);
    alert(error.response?.data?.error || 'Failed to advance timeline');
  }
}

// Go back
async function goBack(simulationId) {
  if (!confirm('Go back one event? This will undo the last advancement.')) return;
  
  try {
    const response = await axios.post(`/api/teacher/simulation/${simulationId}/back`);
    alert(`Went back to ${formatYear(response.data.new_year)}`);
    
    // Reload period details
    await viewPeriodDetails(selectedPeriod.id);
  } catch (error) {
    console.error('Failed to go back:', error);
    alert(error.response?.data?.error || 'Failed to go back');
  }
}

// Toggle pause
async function togglePause(simulationId, paused) {
  try {
    await axios.post(`/api/teacher/simulation/${simulationId}/pause`, { paused });
    alert(paused ? 'Simulation paused' : 'Simulation resumed');
    
    // Reload period details
    await viewPeriodDetails(selectedPeriod.id);
  } catch (error) {
    console.error('Failed to toggle pause:', error);
    alert('Failed to toggle pause');
  }
}

// Show create period modal
function showCreatePeriodModal() {
  const modal = document.getElementById('modalContainer');
  modal.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeModal()">
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-8" onclick="event.stopPropagation()">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">Create New Period</h2>
        <form id="createPeriodForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Period Name</label>
            <input type="text" id="periodName" required placeholder="e.g., Period 3 - World History" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
          </div>
          <div class="flex gap-4">
            <button type="submit" class="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition">
              Create Period
            </button>
            <button type="button" onclick="closeModal()" class="flex-1 bg-gray-200 hover:bg-gray-300 px-6 py-2 rounded-lg transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.getElementById('createPeriodForm').addEventListener('submit', createPeriod);
}

// Create period
async function createPeriod(e) {
  e.preventDefault();
  
  const name = document.getElementById('periodName').value;
  
  try {
    const response = await axios.post('/api/teacher/periods', {
      teacherId: currentTeacher.id,
      name
    });
    
    alert(`Period created!\n\nInvite Code: ${response.data.period.invite_code}\n\nShare this code with your students.`);
    
    closeModal();
    await loadPeriods();
    renderPeriodsList();
  } catch (error) {
    console.error('Failed to create period:', error);
    alert(error.response?.data?.error || 'Failed to create period');
  }
}

// Close modal
function closeModal() {
  document.getElementById('modalContainer').innerHTML = '';
}

// Show civilization details modal
async function showCivilizationDetails(civId) {
  // Find civilization in current data
  if (!currentSimulationData) return;
  
  const civ = currentSimulationData.civilizations.find(c => c.id === civId);
  if (!civ) return;
  
  // Get student info
  let studentInfo = null;
  try {
    const response = await axios.get(`/api/teacher/periods/${selectedPeriod.id}/students`);
    const students = response.data.students || [];
    studentInfo = students.find(s => s.civ_id === civId);
  } catch (error) {
    console.error('Failed to load student info:', error);
  }
  
  // Parse arrays
  const regions = civ.regions || [];
  const traits = civ.traits || [];
  const wonders = civ.wonders || [];
  const cultureBuildings = civ.culture_buildings || [];
  const allWonders = [...wonders, ...cultureBuildings];
  const culturalBonuses = civ.cultural_bonuses || [];
  const achievements = civ.achievements || [];
  const religionTenets = civ.religion_tenants || [];
  
  // Achievement metadata
  const achievementData = {
    'glory_to_rome': { name: 'Glory to Rome', description: 'Conquer 10 civilizations', icon: '⚔️' },
    'test_of_time': { name: 'Test of Time', description: 'Survive 20 battles', icon: '🛡️' },
    'ozymandias': { name: 'Ozymandias', description: 'First civilization defeated', icon: '💀' },
    'cultural_victory': { name: 'Cultural Victory', description: 'Highest culture at game end', icon: '🎭' },
    'scientific_achievement': { name: 'Scientific Achievement', description: 'Reach science level 30', icon: '🔬' },
    'religious_dominance': { name: 'Religious Dominance', description: 'Convert 5+ civilizations', icon: '⭐' },
    'economic_powerhouse': { name: 'Economic Powerhouse', description: 'Have 200+ industry', icon: '💰' },
    'military_supremacy': { name: 'Military Supremacy', description: '100+ martial', icon: '⚔️' }
  };
  
  // Format cultural stage
  const stageDisplay = (civ.cultural_stage || 'barbarism').replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  // Format timestamp
  const lastUpdated = new Date(civ.updated_at).toLocaleString();
  
  const modal = document.getElementById('modalContainer');
  modal.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onclick="closeModal()">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
        <!-- Header -->
        <div class="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-xl z-10">
          <div class="flex justify-between items-start">
            <div class="flex items-center">
              <div class="w-8 h-8 rounded-full mr-3" style="background-color: ${civ.color}"></div>
              <div>
                <h2 class="text-3xl font-bold">${civ.name}</h2>
                ${studentInfo ? `
                  <p class="text-red-100 mt-1">
                    <i class="fas fa-user-graduate mr-2"></i>Student: ${studentInfo.name} (${studentInfo.email})
                  </p>
                ` : ''}
              </div>
            </div>
            <button onclick="closeModal()" class="text-white hover:text-red-200 transition">
              <i class="fas fa-times text-3xl"></i>
            </button>
          </div>
        </div>
        
        <!-- Content -->
        <div class="p-6 space-y-6">
          <!-- Basic Info Section -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <i class="fas fa-info-circle mr-2 text-blue-600"></i>Basic Information
            </h3>
            <div class="grid md:grid-cols-3 gap-4">
              <div>
                <p class="text-sm text-gray-600">Cultural Stage</p>
                <p class="font-bold text-gray-800">${stageDisplay}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Regions</p>
                <p class="font-bold text-gray-800">${regions.length > 0 ? regions.map(r => r.replace(/_/g, ' ')).join(', ') : 'None'}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Traits</p>
                <p class="font-bold text-gray-800">${traits.length > 0 ? traits.map(t => t.replace(/_/g, ' ')).join(', ') : 'None'}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Advance Count</p>
                <p class="font-bold text-gray-800">${civ.advance_count || 0}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Status</p>
                <p class="font-bold ${civ.conquered ? 'text-red-600' : 'text-green-600'}">
                  ${civ.conquered ? '<i class="fas fa-skull mr-1"></i>Conquered' : '<i class="fas fa-check-circle mr-1"></i>Active'}
                </p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Last Updated</p>
                <p class="font-bold text-gray-800 text-xs">${lastUpdated}</p>
              </div>
            </div>
          </div>

          <!-- Population & Resources Section -->
          <div class="bg-green-50 rounded-lg p-4">
            <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <i class="fas fa-users mr-2 text-green-600"></i>Population & Resources
            </h3>
            <div class="grid md:grid-cols-4 gap-4">
              <div>
                <p class="text-sm text-gray-600">Population</p>
                <p class="font-bold text-gray-800 text-2xl">${civ.population}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Houses</p>
                <p class="font-bold text-gray-800 text-2xl">${civ.houses}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Fertility</p>
                <p class="font-bold text-gray-800 text-2xl">${civ.fertility}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Population Capacity</p>
                <p class="font-bold text-gray-800 text-2xl">${civ.population_capacity}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Industry (Total)</p>
                <p class="font-bold text-gray-800 text-2xl">${civ.industry}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Industry (Remaining)</p>
                <p class="font-bold text-gray-800 text-2xl">${civ.industry_left}</p>
              </div>
            </div>
          </div>

          <!-- Military Section -->
          <div class="bg-red-50 rounded-lg p-4">
            <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <i class="fas fa-shield-alt mr-2 text-red-600"></i>Military Power
            </h3>
            <div class="grid md:grid-cols-4 gap-4">
              <div>
                <p class="text-sm text-gray-600">Martial</p>
                <p class="font-bold text-gray-800 text-2xl">${civ.martial}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Defense</p>
                <p class="font-bold text-gray-800 text-2xl">${civ.defense}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Maps Conquered</p>
                <p class="font-bold text-gray-800 text-2xl">${civ.maps_conquered || 0}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Battles Survived</p>
                <p class="font-bold text-gray-800 text-2xl">${civ.battles_survived || 0}</p>
              </div>
            </div>
          </div>

          <!-- Cultural & Scientific Section -->
          <div class="bg-purple-50 rounded-lg p-4">
            <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <i class="fas fa-book mr-2 text-purple-600"></i>Cultural & Scientific Progress
            </h3>
            <div class="grid md:grid-cols-4 gap-4">
              <div>
                <p class="text-sm text-gray-600">Culture</p>
                <p class="font-bold text-gray-800 text-2xl">${civ.culture}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Science</p>
                <p class="font-bold text-gray-800 text-2xl">${civ.science}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Faith</p>
                <p class="font-bold text-gray-800 text-2xl">${civ.faith}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Diplomacy</p>
                <p class="font-bold text-gray-800 text-2xl">${civ.diplomacy}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Writing System</p>
                <p class="font-bold text-gray-800">${civ.writing ? civ.writing.replace(/_/g, ' ') : 'None'}</p>
              </div>
            </div>
          </div>

          <!-- Buildings Section -->
          <div class="bg-blue-50 rounded-lg p-4">
            <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <i class="fas fa-building mr-2 text-blue-600"></i>Buildings
            </h3>
            <div class="grid md:grid-cols-4 gap-4">
              <div class="text-center">
                <div class="text-3xl mb-2">⛪</div>
                <p class="text-sm text-gray-600">Temples</p>
                <p class="font-bold text-gray-800 text-xl">${civ.temples}</p>
              </div>
              <div class="text-center">
                <div class="text-3xl mb-2">🎭</div>
                <p class="text-sm text-gray-600">Amphitheaters</p>
                <p class="font-bold text-gray-800 text-xl">${civ.amphitheaters}</p>
              </div>
              <div class="text-center">
                <div class="text-3xl mb-2">🧱</div>
                <p class="text-sm text-gray-600">Walls</p>
                <p class="font-bold text-gray-800 text-xl">${civ.walls}</p>
              </div>
              <div class="text-center">
                <div class="text-3xl mb-2">🗼</div>
                <p class="text-sm text-gray-600">Archimedes Towers</p>
                <p class="font-bold text-gray-800 text-xl">${civ.archimedes_towers}</p>
              </div>
            </div>
          </div>

          <!-- Wonders Section -->
          <div class="bg-purple-50 rounded-lg p-4">
            <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <i class="fas fa-trophy mr-2 text-purple-600"></i>Wonders & Culture Buildings
            </h3>
            ${allWonders.length > 0 ? `
              <div class="flex flex-wrap gap-2">
                ${allWonders.map(w => `
                  <span class="bg-purple-100 text-purple-800 px-3 py-2 rounded-lg text-sm font-semibold">
                    🏛️ ${w.replace(/_/g, ' ')}
                  </span>
                `).join('')}
              </div>
            ` : '<p class="text-gray-500 text-center py-4">No wonders built yet</p>'}
          </div>

          <!-- Religion Section -->
          ${civ.religion_name ? `
            <div class="bg-yellow-50 rounded-lg p-4">
              <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <i class="fas fa-star mr-2 text-yellow-600"></i>Religion
              </h3>
              <div class="space-y-3">
                <div>
                  <p class="text-sm text-gray-600">Religion Name</p>
                  <p class="font-bold text-gray-800 text-xl">⭐ ${civ.religion_name}</p>
                </div>
                ${religionTenets.length > 0 ? `
                  <div>
                    <p class="text-sm text-gray-600 mb-2">Tenets</p>
                    <div class="flex flex-wrap gap-2">
                      ${religionTenets.map(t => `
                        <span class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm">
                          ${t.replace(/_/g, ' ')}
                        </span>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}
                <div class="grid md:grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm text-gray-600">Followers</p>
                    <p class="font-bold text-gray-800 text-xl">${civ.religion_followers || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Cultural Bonuses Section -->
          ${culturalBonuses.length > 0 ? `
            <div class="bg-pink-50 rounded-lg p-4">
              <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <i class="fas fa-gem mr-2 text-pink-600"></i>Cultural Bonuses (${culturalBonuses.length})
              </h3>
              <div class="flex flex-wrap gap-2">
                ${culturalBonuses.map(b => `
                  <span class="bg-pink-100 text-pink-800 px-3 py-1 rounded text-sm">
                    <i class="fas fa-gem mr-1"></i>${b.replace(/_/g, ' ')}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Achievements Section -->
          ${achievements.length > 0 ? `
            <div class="bg-yellow-50 rounded-lg p-4">
              <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <i class="fas fa-medal mr-2 text-yellow-600"></i>Achievements (${achievements.length})
              </h3>
              <div class="grid md:grid-cols-2 gap-3">
                ${achievements.map(a => {
                  const meta = achievementData[a] || { name: a, description: '', icon: '🏆' };
                  return `
                    <div class="bg-yellow-100 border border-yellow-300 rounded-lg p-3 flex items-center">
                      <span class="text-3xl mr-3">${meta.icon}</span>
                      <div>
                        <p class="font-bold text-gray-800">${meta.name}</p>
                        <p class="text-sm text-gray-600">${meta.description}</p>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div class="sticky bottom-0 bg-gray-100 p-4 rounded-b-xl border-t">
          <button onclick="closeModal()" class="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition font-bold">
            Close
          </button>
        </div>
      </div>
    </div>
  `;
}
