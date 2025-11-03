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

// Render period details
function renderPeriodDetails(data) {
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
                <th class="px-4 py-2 text-center">Houses</th>
                <th class="px-4 py-2 text-center">Population</th>
                <th class="px-4 py-2 text-center">Martial</th>
                <th class="px-4 py-2 text-center">Defense</th>
                <th class="px-4 py-2 text-center">Culture</th>
                <th class="px-4 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              ${civs.map(civ => `
                <tr class="border-t ${civ.conquered ? 'bg-red-50 opacity-60' : 'hover:bg-gray-50'}">
                  <td class="px-4 py-2">
                    <div class="flex items-center">
                      <div class="w-4 h-4 rounded-full mr-2" style="background-color: ${civ.color}"></div>
                      <span class="font-semibold">${civ.name}</span>
                    </div>
                  </td>
                  <td class="px-4 py-2 text-center">${civ.houses}</td>
                  <td class="px-4 py-2 text-center">${civ.population}</td>
                  <td class="px-4 py-2 text-center">${civ.martial}</td>
                  <td class="px-4 py-2 text-center">${civ.defense}</td>
                  <td class="px-4 py-2 text-center">${civ.culture}</td>
                  <td class="px-4 py-2 text-center">
                    ${civ.conquered ? 
                      '<span class="text-red-600 font-bold"><i class="fas fa-skull mr-1"></i>Conquered</span>' : 
                      '<span class="text-green-600 font-bold"><i class="fas fa-check-circle mr-1"></i>Active</span>'
                    }
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
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
