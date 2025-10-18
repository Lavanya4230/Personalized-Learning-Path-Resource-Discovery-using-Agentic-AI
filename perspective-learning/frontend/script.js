// -------------------------
// Global Variables
// -------------------------
const API_BASE_URL = window.location.origin.includes("localhost")
  ? "http://localhost:5000"
  : "https://personalized-learning-path-resource-i5j8.onrender.com";

let dashboardData = null;
let learningPathsData = null;
let resourcesData = null;
let profileData = null;
let currentUser = null;

// -------------------------
// Initialization
// -------------------------
document.addEventListener('DOMContentLoaded', function () {
    checkAuthStatus();

    // Auth form event listeners
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (signupForm) signupForm.addEventListener('submit', handleSignup);
});

// -------------------------
// Auth Check
// -------------------------
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
        try {
            currentUser = JSON.parse(userData);
            showApp();
        } catch (e) {
            console.error('Error parsing user data:', e);
            showAuth();
        }
    } else {
        showAuth();
    }
}

// -------------------------
// Show Auth / App
// -------------------------
function showAuth() {
    document.getElementById('main-nav').classList.add('hidden');
    document.getElementById('app-content').classList.add('hidden');
    document.getElementById('auth-nav').classList.remove('hidden');
    showSection('login');
}

function showApp() {
    document.getElementById('auth-nav').classList.add('hidden');
    document.getElementById('login-section')?.classList.add('hidden');
    document.getElementById('signup-section')?.classList.add('hidden');
    document.getElementById('main-nav').classList.remove('hidden');
    document.getElementById('app-content').classList.remove('hidden');

    initProgressChart();
    loadDashboard();

    // Recommendation form
    const recommendationForm = document.getElementById('recommendation-form');
    if (recommendationForm) recommendationForm.addEventListener('submit', handleRecommendationForm);

    // Resource tabs
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function () {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            renderResources(this.dataset.category);
        });
    });
}

// -------------------------
// Sections
// -------------------------
function showSection(sectionName) {
    const sections = ['login', 'signup', 'dashboard', 'learning-paths', 'resources', 'profile'];
    sections.forEach(section => {
        const el = document.getElementById(`${section}-section`);
        if (el) el.classList.add('hidden');
    });

    const selected = document.getElementById(`${sectionName}-section`);
    if (selected) selected.classList.remove('hidden');

    if (sectionName === 'learning-paths' && !learningPathsData) loadLearningPaths();
    if (sectionName === 'resources' && !resourcesData) loadResources();
    if (sectionName === 'profile' && !profileData) loadProfile();
}

// -------------------------
// Login / Signup
// -------------------------
async function handleLogin(e) {
    e?.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const msgDiv = document.getElementById('auth-message');
    msgDiv.className = 'p-4 bg-blue-50 text-blue-700 rounded-lg';
    msgDiv.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Signing in...';
    msgDiv.classList.remove('hidden');

    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            msgDiv.className = 'p-4 bg-green-50 text-green-700 rounded-lg';
            msgDiv.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Login successful!';
            showApp();
        } else {
            msgDiv.className = 'p-4 bg-red-50 text-red-700 rounded-lg';
            msgDiv.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i> ${data.error}`;
        }
    } catch (error) {
        msgDiv.className = 'p-4 bg-red-50 text-red-700 rounded-lg';
        msgDiv.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i> Network error.';
    }
}

async function handleSignup(e) {
    e?.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const msgDiv = document.getElementById('signup-message');

    if (password.length < 6) {
        msgDiv.className = 'p-4 bg-red-50 text-red-700 rounded-lg';
        msgDiv.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i> Password must be at least 6 characters';
        msgDiv.classList.remove('hidden');
        return;
    }

    msgDiv.className = 'p-4 bg-blue-50 text-blue-700 rounded-lg';
    msgDiv.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Creating account...';
    msgDiv.classList.remove('hidden');

    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();
        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            msgDiv.className = 'p-4 bg-green-50 text-green-700 rounded-lg';
            msgDiv.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Account created!';
            showApp();
        } else {
            msgDiv.className = 'p-4 bg-red-50 text-red-700 rounded-lg';
            msgDiv.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i> ${data.error}`;
        }
    } catch (error) {
        msgDiv.className = 'p-4 bg-red-50 text-red-700 rounded-lg';
        msgDiv.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i> Network error.';
    }
}

// -------------------------
// Logout
// -------------------------
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    showAuth();
}

// -------------------------
// Dashboard
// -------------------------
async function loadDashboard() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) { logout(); return; }

        dashboardData = await res.json();
        renderSkills(dashboardData.skills);
        renderDeadlines(dashboardData.upcoming_deadlines || []);
        if (dashboardData.weekly_progress) initWeeklyChart(dashboardData.weekly_progress);
    } catch (err) {
        console.error('Dashboard error:', err);
        document.getElementById('skills-container').innerHTML = `<div class="p-4 bg-red-50 text-red-700">Error loading dashboard.</div>`;
    }
}

function renderSkills(skills) {
    const container = document.getElementById('skills-container');
    if (!container || !skills) return;
    container.innerHTML = skills.map(skill => `
        <div class="bg-gray-50 p-4 rounded-lg">
            <div class="flex justify-between mb-2">
                <span class="font-semibold">${skill.name}</span>
                <span>${skill.level}% / ${skill.target}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5">
                <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${skill.level}%"></div>
            </div>
        </div>
    `).join('');
}

function renderDeadlines(deadlines) {
    const container = document.getElementById('deadlines-container');
    if (!container) return;

    if (!deadlines.length) {
        container.innerHTML = `<div class="text-center text-gray-500 py-8"><i class="fas fa-calendar-check text-3xl mb-2"></i><p>No upcoming deadlines</p></div>`;
        return;
    }

    container.innerHTML = deadlines.map(d => `
        <div class="border-l-4 border-red-500 pl-4 py-2 bg-red-50">
            <h4 class="font-semibold">${d.assignment}</h4>
            <p class="text-sm text-gray-600">${d.course}</p>
            <div class="mt-1 text-sm text-red-600">
                <i class="fas fa-clock mr-1"></i> Due: ${d.deadline}
            </div>
        </div>
    `).join('');
}

// -------------------------
// Learning Paths
// -------------------------
async function loadLearningPaths() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/learning-paths`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) { logout(); return; }

        learningPathsData = await res.json();
        renderLearningPaths(learningPathsData);
    } catch (err) {
        console.error('Learning paths error:', err);
        document.getElementById('paths-container').innerHTML = `<div class="p-4 bg-red-50 text-red-700">Error loading learning paths.</div>`;
    }
}

function renderLearningPaths(paths) {
    const container = document.getElementById('paths-container');
    if (!container || !paths) return;

    // Support both arrays and object
    let pathArray = Array.isArray(paths) ? paths : Object.values(paths);

    container.innerHTML = pathArray.map(path => `
        <div class="learning-path-card bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
            <h3 class="text-xl font-semibold mb-2">${path.title}</h3>
            <p class="text-gray-600 mb-4">${path.description || ''}</p>
            <div class="mb-4">
                <div class="flex justify-between mb-1">
                    <span class="text-sm font-medium">Progress</span>
                    <span class="text-sm font-medium">${path.progress || 0}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-blue-600 h-2 rounded-full" style="width: ${path.progress || 0}%"></div>
                </div>
            </div>
            <div class="space-y-2">
                ${(path.modules || []).map(mod => `
                    <div class="flex items-center">
                        <span class="${mod.completed ? 'text-green-500' : 'text-gray-400'} mr-2">
                            <i class="fas ${mod.completed ? 'fa-check-circle' : 'fa-circle'}"></i>
                        </span>
                        <span class="${mod.completed ? 'text-gray-500 line-through' : 'text-gray-700'}">
                            ${mod.name} <span class="text-sm text-gray-400">(${mod.duration || 'N/A'})</span>
                        </span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// -------------------------
// Resources
// -------------------------
async function loadResources() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/resources`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) { logout(); return; }

        resourcesData = await res.json();
        // Render first category by default
        const firstCategory = Object.keys(resourcesData || {})[0] || 'All';
        renderResources(firstCategory);
    } catch (err) {
        console.error('Resources error:', err);
        document.getElementById('resources-container').innerHTML = `<div class="p-4 bg-red-50 text-red-700">Error loading resources.</div>`;
    }
}

function renderResources(category) {
    const container = document.getElementById('resources-container');
    if (!container || !resourcesData) return;

    let items = [];

    if (Array.isArray(resourcesData)) {
        items = resourcesData;
    } else if (resourcesData[category]) {
        items = resourcesData[category];
    }

    if (!items.length) {
        container.innerHTML = `<div class="text-center text-gray-500 py-8"><i class="fas fa-book-open text-3xl mb-2"></i><p>No resources found for ${category}</p></div>`;
        return;
    }

    container.innerHTML = items.map(res => `
        <div class="resource-card bg-white p-4 rounded-lg shadow mb-3">
            <h4 class="font-semibold mb-1">${res.title}</h4>
            <p class="text-gray-600 mb-2">${res.description || ''}</p>
            <a href="${res.url}" target="_blank" class="text-blue-600 hover:underline">View Resource</a>
        </div>
    `).join('');
}

// -------------------------
// Profile
// -------------------------
async function loadProfile() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) { logout(); return; }

        profileData = await res.json();
        renderProfile(profileData);
    } catch (err) {
        console.error('Profile error:', err);
    }
}

function renderProfile(profile) {
    const container = document.getElementById('profile-container');
    if (!container || !profile) return;

    container.innerHTML = `
        <h3 class="text-xl font-semibold mb-2">Profile</h3>
        <form id="profile-update-form">
            <div class="mb-2">
                <label class="block text-gray-700">Name</label>
                <input type="text" id="profile-name" value="${profile.name}" class="border p-2 rounded w-full"/>
            </div>
            <div class="mb-2">
                <label class="block text-gray-700">Email</label>
                <input type="email" id="profile-email" value="${profile.email}" class="border p-2 rounded w-full" disabled/>
            </div>
            <div class="mb-2">
                <label class="block text-gray-700">Password (leave blank to keep unchanged)</label>
                <input type="password" id="profile-password" placeholder="New Password" class="border p-2 rounded w-full"/>
            </div>
            <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Update Profile</button>
        </form>
        <div id="profile-msg" class="hidden mt-2 p-2 rounded"></div>
    `;

    document.getElementById('profile-update-form').addEventListener('submit', handleProfileUpdate);
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    const msgDiv = document.getElementById('profile-msg');
    msgDiv.classList.remove('hidden');
    msgDiv.className = 'p-2 bg-blue-50 text-blue-700 rounded';
    msgDiv.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Updating...';

    const name = document.getElementById('profile-name').value;
    const password = document.getElementById('profile-password').value;
    const bodyData = { name };
    if (password) bodyData.password = password;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyData)
        });

        const data = await res.json();
        if (data.success) {
            msgDiv.className = 'p-2 bg-green-50 text-green-700 rounded';
            msgDiv.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Profile updated!';
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
        } else {
            msgDiv.className = 'p-2 bg-red-50 text-red-700 rounded';
            msgDiv.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i> ${data.error}`;
        }
    } catch (err) {
        console.error('Profile update error:', err);
        msgDiv.className = 'p-2 bg-red-50 text-red-700 rounded';
        msgDiv.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i> Network error.';
    }
}

// -------------------------
// Charts
// -------------------------
let weeklyChart = null;
function initWeeklyChart(weeklyData) {
    const ctx = document.getElementById('weekly-progress-chart');
    if (!ctx || !weeklyData) return;

    if (weeklyChart) weeklyChart.destroy();

    weeklyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: weeklyData.map(d => d.week),
            datasets: [{
                label: 'Progress %',
                data: weeklyData.map(d => d.progress),
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2,
                tension: 0.3,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, max: 100 }
            }
        }
    });
}
