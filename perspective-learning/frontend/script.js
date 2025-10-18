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

    const recommendationForm = document.getElementById('recommendation-form');
    if (recommendationForm) recommendationForm.addEventListener('submit', handleRecommendationForm);

    // Resource tabs
    document.getElementById('resources-tabs')?.addEventListener('click', e => {
        if (e.target.classList.contains('tab-button')) {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            renderResources(e.target.dataset.category);
        }
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

// -------------------------
// Recommendations
// -------------------------
async function handleRecommendationForm(e) {
    e.preventDefault();
    const msgDiv = document.getElementById('recommendation-message');
    msgDiv.className = 'p-2 bg-blue-50 text-blue-700 rounded';
    msgDiv.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Generating recommendations...';
    msgDiv.classList.remove('hidden');

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_BASE_URL}/api/recommendations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: currentUser?.id })
        });

        if (res.status === 401) { logout(); return; }
        if (res.status === 404) { msgDiv.innerHTML = 'Recommendations not found.'; return; }

        const data = await res.json();
        if (data.success && data.recommendations) {
            msgDiv.className = 'p-2 bg-green-50 text-green-700 rounded';
            msgDiv.innerHTML = data.recommendations.map(r => `<div>${r}</div>`).join('');
        } else {
            msgDiv.className = 'p-2 bg-red-50 text-red-700 rounded';
            msgDiv.innerHTML = 'No recommendations available.';
        }
    } catch (err) {
        console.error('Recommendations error:', err);
        msgDiv.className = 'p-2 bg-red-50 text-red-700 rounded';
        msgDiv.innerHTML = 'Network error.';
    }
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

        // Create tabs dynamically
        const tabsContainer = document.getElementById('resources-tabs');
        if (tabsContainer) {
            tabsContainer.innerHTML = '';
            const categories = Object.keys(resourcesData);
            categories.forEach((cat, idx) => {
                const btn = document.createElement('button');
                btn.className = `tab-button ${idx === 0 ? 'active' : ''}`;
                btn.dataset.category = cat;
                btn.innerText = cat;
                tabsContainer.appendChild(btn);
            });
        }

        renderResources(Object.keys(resourcesData)[0]);
    } catch (err) {
        console.error('Resources error:', err);
        document.getElementById('resources-container').innerHTML = `<div class="p-4 bg-red-50 text-red-700">Error loading resources.</div>`;
    }
}

function renderResources(category) {
    const container = document.getElementById('resources-container');
    if (!container || !resourcesData) return;

    const items = resourcesData[category] || [];

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
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, max: 100 } }
        }
    });
}
