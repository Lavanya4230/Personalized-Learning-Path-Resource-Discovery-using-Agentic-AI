// Global variables
let dashboardData = null;
let learningPathsData = null;
let resourcesData = null;
let profileData = null;
let currentUser = null;

// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000/api' 
    : 'https://your-backend-domain.herokuapp.com/api'; // Replace with your actual backend URL

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('App initialized. API Base URL:', API_BASE_URL);
    checkAuthStatus();
    
    // Set up event listeners for auth forms
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
});

// Check if user is authenticated
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

// Show authentication pages
function showAuth() {
    const mainNav = document.getElementById('main-nav');
    const appContent = document.getElementById('app-content');
    const authNav = document.getElementById('auth-nav');
    
    if (mainNav) mainNav.classList.add('hidden');
    if (appContent) appContent.classList.add('hidden');
    if (authNav) authNav.classList.remove('hidden');
    showSection('login');
}

// Show main application
function showApp() {
    const authNav = document.getElementById('auth-nav');
    const loginSection = document.getElementById('login-section');
    const signupSection = document.getElementById('signup-section');
    const mainNav = document.getElementById('main-nav');
    const appContent = document.getElementById('app-content');
    
    if (authNav) authNav.classList.add('hidden');
    if (loginSection) loginSection.classList.add('hidden');
    if (signupSection) signupSection.classList.add('hidden');
    if (mainNav) mainNav.classList.remove('hidden');
    if (appContent) appContent.classList.remove('hidden');
    
    // Initialize app
    initProgressChart();
    loadDashboard();
    
    // Set up event listeners
    const recommendationForm = document.getElementById('recommendation-form');
    if (recommendationForm) {
        recommendationForm.addEventListener('submit', handleRecommendationForm);
    }
    
    // Set up tab buttons for resources
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            renderResources(this.dataset.category);
        });
    });
}

// Show specific section
function showSection(sectionName) {
    // Hide all sections first
    const sections = ['login', 'signup', 'dashboard', 'learning-paths', 'resources', 'profile'];
    sections.forEach(section => {
        const element = document.getElementById(`${section}-section`);
        if (element) {
            element.classList.add('hidden');
        }
    });
    
    // Show selected section
    const selectedSection = document.getElementById(`${sectionName}-section`);
    if (selectedSection) {
        selectedSection.classList.remove('hidden');
    }
    
    // Load data if needed
    if (sectionName === 'learning-paths' && !learningPathsData) {
        loadLearningPaths();
    } else if (sectionName === 'resources' && !resourcesData) {
        loadResources();
    } else if (sectionName === 'profile' && !profileData) {
        loadProfile();
    }
}

// Handle login
async function handleLogin(e) {
    if (e) e.preventDefault();
    
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    const messageDiv = document.getElementById('auth-message');
    
    if (!email || !password) {
        if (messageDiv) {
            messageDiv.className = 'p-4 bg-red-50 text-red-700 rounded-lg';
            messageDiv.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i> Please fill in all fields';
            messageDiv.classList.remove('hidden');
        }
        return;
    }
    
    // Show loading
    if (messageDiv) {
        messageDiv.className = 'p-4 bg-blue-50 text-blue-700 rounded-lg';
        messageDiv.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Signing in...';
        messageDiv.classList.remove('hidden');
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            
            if (messageDiv) {
                messageDiv.className = 'p-4 bg-green-50 text-green-700 rounded-lg';
                messageDiv.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Login successful!';
            }
            
            // Show main app
            showApp();
        } else {
            if (messageDiv) {
                messageDiv.className = 'p-4 bg-red-50 text-red-700 rounded-lg';
                messageDiv.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i> ${data.error || 'Login failed'}`;
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        if (messageDiv) {
            messageDiv.className = 'p-4 bg-red-50 text-red-700 rounded-lg';
            messageDiv.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i> Network error. Please check if backend is running.';
        }
    }
}

// Handle signup
async function handleSignup(e) {
    if (e) e.preventDefault();
    
    const name = document.getElementById('name')?.value;
    const email = document.getElementById('signup-email')?.value;
    const password = document.getElementById('signup-password')?.value;
    const messageDiv = document.getElementById('signup-message');
    
    // Basic validation
    if (!name || !email || !password) {
        if (messageDiv) {
            messageDiv.className = 'p-4 bg-red-50 text-red-700 rounded-lg';
            messageDiv.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i> Please fill in all fields';
            messageDiv.classList.remove('hidden');
        }
        return;
    }
    
    if (password.length < 6) {
        if (messageDiv) {
            messageDiv.className = 'p-4 bg-red-50 text-red-700 rounded-lg';
            messageDiv.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i> Password must be at least 6 characters long';
            messageDiv.classList.remove('hidden');
        }
        return;
    }
    
    // Show loading
    if (messageDiv) {
        messageDiv.className = 'p-4 bg-blue-50 text-blue-700 rounded-lg';
        messageDiv.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Creating account...';
        messageDiv.classList.remove('hidden');
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                email: email,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            
            if (messageDiv) {
                messageDiv.className = 'p-4 bg-green-50 text-green-700 rounded-lg';
                messageDiv.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Account created successfully!';
            }
            
            // Show main app
            showApp();
        } else {
            if (messageDiv) {
                messageDiv.className = 'p-4 bg-red-50 text-red-700 rounded-lg';
                messageDiv.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i> ${data.error || 'Signup failed'}`;
            }
        }
    } catch (error) {
        console.error('Signup error:', error);
        if (messageDiv) {
            messageDiv.className = 'p-4 bg-red-50 text-red-700 rounded-lg';
            messageDiv.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i> Network error. Please check if backend is running.';
        }
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    showAuth();
}

// Initialize progress chart
function initProgressChart() {
    const ctx = document.getElementById('progressChart');
    if (ctx) {
        // Check if Chart is available
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded');
            return;
        }
        
        try {
            const progressChart = new Chart(ctx.getContext('2d'), {
                type: 'radar',
                data: {
                    labels: ['Python', 'Statistics', 'ML Fundamentals', 'Data Visualization', 'Algorithms'],
                    datasets: [{
                        label: 'Current Skills',
                        data: [75, 60, 45, 50, 40],
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
                    }]
                },
                options: {
                    scales: {
                        r: {
                            angleLines: {
                                display: true
                            },
                            suggestedMin: 0,
                            suggestedMax: 100
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error initializing progress chart:', error);
        }
    }
}

// Initialize weekly progress chart
function initWeeklyChart(weeklyData) {
    const ctx = document.getElementById('weeklyChart');
    if (ctx && typeof Chart !== 'undefined') {
        try {
            const days = weeklyData.map(item => item.day);
            const hours = weeklyData.map(item => item.hours);
            
            const weeklyChart = new Chart(ctx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: days,
                    datasets: [{
                        label: 'Hours Studied',
                        data: hours,
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Hours'
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error initializing weekly chart:', error);
        }
    }
}

// Scroll to recommendations section
function scrollToRecommendations() {
    const section = document.getElementById('recommendations-section');
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Load dashboard data
async function loadDashboard() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showAuth();
            return;
        }

        const response = await fetch(`${API_BASE_URL}/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            // Token expired or invalid
            logout();
            return;
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        dashboardData = await response.json();
        
        // Update skills
        renderSkills(dashboardData.skills || []);
        
        // Update deadlines
        renderDeadlines(dashboardData.upcoming_deadlines || []);
        
        // Initialize weekly chart
        if (dashboardData.weekly_progress) {
            initWeeklyChart(dashboardData.weekly_progress);
        }
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        const container = document.getElementById('skills-container');
        if (container) {
            container.innerHTML = `
                <div class="col-span-2 p-4 bg-red-50 rounded-lg text-red-700">
                    <p>Error loading dashboard data. Please make sure the backend server is running.</p>
                    <p class="text-sm mt-1">API URL: ${API_BASE_URL}</p>
                </div>
            `;
        }
    }
}

// Render skills
function renderSkills(skills) {
    const container = document.getElementById('skills-container');
    if (container) {
        if (skills.length === 0) {
            container.innerHTML = `
                <div class="col-span-2 p-4 bg-yellow-50 rounded-lg text-yellow-700">
                    <p>No skills data available</p>
                </div>
            `;
            return;
        }
        
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
}

// Render deadlines
function renderDeadlines(deadlines) {
    const container = document.getElementById('deadlines-container');
    if (container) {
        if (deadlines.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-calendar-check text-3xl mb-2"></i>
                    <p>No upcoming deadlines</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = deadlines.map(deadline => `
            <div class="border-l-4 border-red-500 pl-4 py-2 bg-red-50">
                <h4 class="font-semibold">${deadline.assignment}</h4>
                <p class="text-sm text-gray-600">${deadline.course}</p>
                <div class="mt-1 text-sm text-red-600">
                    <i class="fas fa-clock mr-1"></i> Due: ${deadline.deadline}
                </div>
            </div>
        `).join('');
    }
}

// Load learning paths
async function loadLearningPaths() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showAuth();
            return;
        }

        const response = await fetch(`${API_BASE_URL}/learning-paths`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        learningPathsData = await response.json();
        renderLearningPaths(learningPathsData);
    } catch (error) {
        console.error('Error loading learning paths:', error);
        const container = document.getElementById('paths-container');
        if (container) {
            container.innerHTML = `
                <div class="col-span-2 p-4 bg-red-50 rounded-lg text-red-700">
                    <p>Error loading learning paths. Please make sure the backend server is running.</p>
                    <p class="text-sm mt-1">API URL: ${API_BASE_URL}</p>
                </div>
            `;
        }
    }
}

// Render learning paths
function renderLearningPaths(paths) {
    const container = document.getElementById('paths-container');
    if (container) {
        if (!paths || Object.keys(paths).length === 0) {
            container.innerHTML = `
                <div class="col-span-2 p-4 bg-yellow-50 rounded-lg text-yellow-700">
                    <p>No learning paths available</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = Object.entries(paths).map(([key, path]) => `
            <div class="learning-path-card bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                <h3 class="text-xl font-semibold mb-2">${path.title}</h3>
                <p class="text-gray-600 mb-4">${path.description}</p>
                
                <div class="mb-4">
                    <div class="flex justify-between mb-1">
                        <span class="text-sm font-medium">Progress</span>
                        <span class="text-sm font-medium">${path.progress}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-blue-600 h-2 rounded-full" style="width: ${path.progress}%"></div>
                    </div>
                </div>
                
                <div class="space-y-2">
                    ${(path.modules || []).map(module => `
                        <div class="flex items-center">
                            <span class="${module.completed ? 'text-green-500' : 'text-gray-400'} mr-2">
                                <i class="fas ${module.completed ? 'fa-check-circle' : 'fa-circle'}"></i>
                            </span>
                            <span class="${module.completed ? 'text-gray-500 line-through' : 'text-gray-700'}">
                                ${module.name} <span class="text-sm text-gray-400">(${module.duration})</span>
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }
}

// Load resources
async function loadResources() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showAuth();
            return;
        }

        const response = await fetch(`${API_BASE_URL}/resources`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        resourcesData = await response.json();
        renderResources('all');
    } catch (error) {
        console.error('Error loading resources:', error);
        const container = document.getElementById('resources-container');
        if (container) {
            container.innerHTML = `
                <div class="col-span-3 p-4 bg-red-50 rounded-lg text-red-700">
                    <p>Error loading resources. Please make sure the backend server is running.</p>
                    <p class="text-sm mt-1">API URL: ${API_BASE_URL}</p>
                </div>
            `;
        }
    }
}

// Render resources
function renderResources(category) {
    const container = document.getElementById('resources-container');
    if (!container) return;
    
    let resourcesToShow = [];
    
    if (category === 'all') {
        for (const [cat, items] of Object.entries(resourcesData || {})) {
            resourcesToShow.push(...(items || []).map(item => ({...item, category: cat})));
        }
    } else if (resourcesData && resourcesData[category]) {
        resourcesToShow = resourcesData[category].map(item => ({...item, category: category}));
    }
    
    if (resourcesToShow.length === 0) {
        container.innerHTML = `
            <div class="col-span-3 text-center text-gray-500 py-8">
                <i class="fas fa-book-open text-3xl mb-2"></i>
                <p>No resources found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = resourcesToShow.map(resource => `
        <div class="resource-item bg-white p-4 rounded-lg shadow-sm border-l-4 border-${getResourceColor(resource.type)}-500">
            <div class="flex items-start mb-3">
                <div class="bg-${getResourceColor(resource.type)}-100 p-2 rounded-lg mr-3">
                    <i class="${getResourceIcon(resource.type)} text-${getResourceColor(resource.type)}-600"></i>
                </div>
                <div>
                    <h4 class="font-semibold">${resource.title}</h4>
                    <p class="text-sm text-gray-600 capitalize">${resource.type} • ${resource.level}</p>
                    <span class="text-xs text-gray-400 capitalize">${resource.category.replace('_', ' ')}</span>
                </div>
            </div>
            <a href="${resource.url}" target="_blank" class="text-blue-600 text-sm hover:underline">View resource</a>
        </div>
    `).join('');
}

// Get resource icon
function getResourceIcon(type) {
    const icons = {
        'book': 'fas fa-book',
        'course': 'fas fa-video',
        'tutorial': 'fas fa-graduation-cap',
        'platform': 'fas fa-globe',
        'documentation': 'fas fa-file-alt'
    };
    return icons[type] || 'fas fa-link';
}

// Get resource color
function getResourceColor(type) {
    const colors = {
        'book': 'yellow',
        'course': 'red',
        'tutorial': 'green',
        'platform': 'purple',
        'documentation': 'blue'
    };
    return colors[type] || 'gray';
}

// Load profile
async function loadProfile() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showAuth();
            return;
        }

        const response = await fetch(`${API_BASE_URL}/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        profileData = await response.json();
        renderProfile(profileData);
    } catch (error) {
        console.error('Error loading profile:', error);
        const container = document.getElementById('profile-container');
        if (container) {
            container.innerHTML = `
                <div class="p-4 bg-red-50 rounded-lg text-red-700">
                    <p>Error loading profile. Please make sure the backend server is running.</p>
                    <p class="text-sm mt-1">API URL: ${API_BASE_URL}</p>
                </div>
            `;
        }
    }
}

// Render profile
function renderProfile(profile) {
    const container = document.getElementById('profile-container');
    if (container) {
        if (!profile) {
            container.innerHTML = `
                <div class="p-4 bg-yellow-50 rounded-lg text-yellow-700">
                    <p>No profile data available</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div id="notification-area"></div>
            <div class="bg-white p-6 rounded-lg shadow-sm">
                <div class="flex items-center mb-6">
                    <div class="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mr-4">
                        <i class="fas fa-user text-blue-600 text-2xl"></i>
                    </div>
                    <div>
                        <h3 class="text-2xl font-semibold">${profile.name || 'User'}</h3>
                        <p class="text-gray-600">${profile.email || 'No email'}</p>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <h4 class="font-semibold mb-2">Learning Style</h4>
                        <p class="capitalize">${profile.learning_style || 'Not specified'}</p>
                    </div>
                    <div>
                        <h4 class="font-semibold mb-2">Member Since</h4>
                        <p>${profile.joined_date || 'Unknown'}</p>
                    </div>
                </div>
                
                <div class="mb-6">
                    <h4 class="font-semibold mb-2">Learning Goals</h4>
                    <div class="space-y-2">
                        ${(profile.goals || ['No goals set']).map(goal => `
                            <div class="flex items-center">
                                <span class="${goal.startsWith('✓') ? 'text-green-500' : 'text-gray-400'} mr-2">
                                    <i class="fas ${goal.startsWith('✓') ? 'fa-check-circle' : 'fa-circle'}"></i>
                                </span>
                                <span class="${goal.startsWith('✓') ? 'text-gray-600' : 'text-gray-800'}">
                                    ${goal.replace('✓ ', '')}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <button onclick="editProfile()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                    <i class="fas fa-edit mr-2"></i>Edit Profile
                </button>
            </div>
        `;
    }
}

// Edit profile functionality
function editProfile() {
    const profile = profileData || {
        name: currentUser?.name || 'User',
        email: currentUser?.email || '',
        learning_style: 'visual',
        goals: ['New learning goal']
    };
    
    const editForm = `
        <div class="bg-white p-6 rounded-lg shadow-sm">
            <h3 class="text-2xl font-semibold mb-6">Edit Profile</h3>
            
            <form id="profile-edit-form">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label class="block text-gray-700 mb-2" for="edit-name">Full Name</label>
                        <input type="text" id="edit-name" value="${profile.name}" 
                               class="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" required>
                    </div>
                    <div>
                        <label class="block text-gray-700 mb-2" for="edit-email">Email</label>
                        <input type="email" id="edit-email" value="${profile.email}" 
                               class="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" required disabled>
                        <p class="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                </div>
                
                <div class="mb-6">
                    <label class="block text-gray-700 mb-2" for="edit-style">Learning Style</label>
                    <select id="edit-style" class="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500">
                        <option value="visual" ${profile.learning_style === 'visual' ? 'selected' : ''}>Visual</option>
                        <option value="auditory" ${profile.learning_style === 'auditory' ? 'selected' : ''}>Auditory</option>
                        <option value="reading" ${profile.learning_style === 'reading' ? 'selected' : ''}>Reading/Writing</option>
                        <option value="kinesthetic" ${profile.learning_style === 'kinesthetic' ? 'selected' : ''}>Hands-on/Kinesthetic</option>
                    </select>
                </div>
                
                <div class="mb-6">
                    <label class="block text-gray-700 mb-2">Learning Goals</label>
                    <div class="space-y-2" id="goals-container">
                        ${(profile.goals || []).map((goal, index) => {
                            const goalText = goal.startsWith('✓ ') ? goal.substring(2) : goal;
                            const isCompleted = goal.startsWith('✓ ');
                            return `
                                <div class="flex items-center">
                                    <input type="checkbox" id="goal-${index}" ${isCompleted ? 'checked' : ''} 
                                           class="mr-2 goal-checkbox">
                                    <input type="text" value="${goalText}" 
                                           class="flex-1 px-3 py-1 border rounded goal-input">
                                    <button type="button" onclick="removeGoal(${index})" class="ml-2 text-red-500">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <button type="button" onclick="addNewGoal()" class="mt-2 text-blue-600 text-sm">
                        <i class="fas fa-plus mr-1"></i> Add New Goal
                    </button>
                </div>
                
                <div class="flex space-x-4">
                    <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                        Save Changes
                    </button>
                    <button type="button" onclick="cancelEdit()" class="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.getElementById('profile-container').innerHTML = editForm;
    
    // Add form submission handler
    document.getElementById('profile-edit-form').addEventListener('submit', handleProfileUpdate);
}

// Add new goal field
function addNewGoal() {
    const container = document.getElementById('goals-container');
    if (!container) return;
    
    const newIndex = container.children.length;
    const newGoal = `
        <div class="flex items-center">
            <input type="checkbox" id="goal-${newIndex}" class="mr-2 goal-checkbox">
            <input type="text" placeholder="Enter new goal" 
                   class="flex-1 px-3 py-1 border rounded goal-input">
            <button type="button" onclick="removeGoal(${newIndex})" class="ml-2 text-red-500">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', newGoal);
}

// Remove goal field
function removeGoal(index) {
    const container = document.getElementById('goals-container');
    if (!container) return;
    
    const goals = container.querySelectorAll('div');
    if (goals.length > 1) {
        goals[index].remove();
        // Re-index remaining goals
        const remainingGoals = container.querySelectorAll('div');
        remainingGoals.forEach((goalDiv, newIndex) => {
            const checkbox = goalDiv.querySelector('.goal-checkbox');
            const removeBtn = goalDiv.querySelector('button');
            if (checkbox) checkbox.id = `goal-${newIndex}`;
            if (removeBtn) removeBtn.setAttribute('onclick', `removeGoal(${newIndex})`);
        });
    }
}

// Cancel editing
function cancelEdit() {
    renderProfile(profileData);
}

// Handle profile update
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('edit-name')?.value;
    const learningStyle = document.getElementById('edit-style')?.value;
    
    // Get goals from checkboxes and inputs
    const goals = [];
    const goalElements = document.querySelectorAll('#goals-container > div');
    goalElements.forEach(goalDiv => {
        const checkbox = goalDiv.querySelector('.goal-checkbox');
        const input = goalDiv.querySelector('.goal-input');
        if (input && input.value.trim()) {
            const goalText = checkbox && checkbox.checked ? `✓ ${input.value.trim()}` : input.value.trim();
            goals.push(goalText);
        }
    });
    
    // Ensure we have at least one goal
    if (goals.length === 0) {
        goals.push('New learning goal');
    }
    
    try {
        // Show loading
        document.getElementById('profile-container').innerHTML = `
            <div class="flex justify-center items-center h-48">
                <i class="fas fa-spinner fa-spin text-2xl text-blue-500"></i>
                <span class="ml-2">Saving changes...</span>
            </div>
        `;
        
        const token = localStorage.getItem('token');
        if (!token) {
            logout();
            return;
        }

        // Send update to backend
        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: name,
                learning_style: learningStyle,
                goals: goals
            })
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Update local data and re-render
            profileData = result.profile;
            renderProfile(profileData);
            
            // Show success message
            showNotification('Profile updated successfully!', 'success');
        } else {
            throw new Error(result.error || 'Failed to update profile');
        }
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification(`Error updating profile: ${error.message}`, 'error');
        renderProfile(profileData);
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notification if any
    const existingNotification = document.getElementById('profile-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const bgColor = type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 
                     type === 'error' ? 'bg-red-100 border-red-400 text-red-700' :
                     'bg-blue-100 border-blue-400 text-blue-700';
    
    const notification = `
        <div id="profile-notification" class="${bgColor} border px-4 py-3 rounded relative mb-4">
            <span class="block sm:inline">${message}</span>
            <button onclick="this.parentElement.remove()" class="absolute top-0 right-0 px-4 py-3">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    const container = document.getElementById('profile-container');
    if (container) {
        container.insertAdjacentHTML('afterbegin', notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            const notif = document.getElementById('profile-notification');
            if (notif) notif.remove();
        }, 5000);
    }
}

// Handle recommendation form submission
async function handleRecommendationForm(e) {
    e.preventDefault();
    
    const subjects = document.getElementById('subjects')?.value;
    const goals = document.getElementById('goals')?.value;
    const style = document.getElementById('style')?.value;
    
    if (!subjects || !goals || !style) {
        alert('Please fill in all fields');
        return;
    }
    
    const recommendationsContainer = document.getElementById('ai-recommendations');
    if (!recommendationsContainer) return;
    
    // Show loading state
    recommendationsContainer.innerHTML = 
        '<div class="flex justify-center items-center h-40"><i class="fas fa-spinner fa-spin text-2xl text-blue-500"></i></div>';
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            logout();
            return;
        }

        // Send request to backend API
        const response = await fetch(`${API_BASE_URL}/recommend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                interests: subjects,
                goals: goals,
                style: style
            })
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Format the response with line breaks
            const formattedResponse = data.recommendations.replace(/\n/g, '<br>');
            recommendationsContainer.innerHTML = `
                <div class="p-4 bg-blue-50 rounded-lg">
                    <h5 class="font-semibold mb-2">Your Personalized Learning Path</h5>
                    <p>${formattedResponse}</p>
                    ${data.ai_generated ? '<p class="text-sm text-gray-500 mt-2"><i class="fas fa-robot mr-1"></i>AI-generated recommendation</p>' : ''}
                </div>
            `;
        } else {
            throw new Error(data.error || 'Failed to get recommendations');
        }
    } catch (error) {
        console.error('Error:', error);
        recommendationsContainer.innerHTML = `
            <div class="p-4 bg-red-50 rounded-lg text-red-700">
                <p>Unable to connect to the recommendation service. Please make sure the backend server is running.</p>
                <p class="mt-2 text-sm">API URL: ${API_BASE_URL}</p>
                <p class="mt-1 text-sm">Error: ${error.message}</p>
            </div>
        `;
    }
}

// Add this function to handle demo data when backend is not available
function loadDemoData() {
    console.log('Loading demo data...');
    
    // Demo dashboard data
    dashboardData = {
        skills: [
            { name: 'Python', level: 75, target: 100 },
            { name: 'Statistics', level: 60, target: 100 },
            { name: 'ML Fundamentals', level: 45, target: 100 },
            { name: 'Data Visualization', level: 50, target: 100 },
            { name: 'Algorithms', level: 40, target: 100 }
        ],
        upcoming_deadlines: [
            { assignment: 'Final Project', course: 'Machine Learning', deadline: '2024-01-15' },
            { assignment: 'Quiz 3', course: 'Statistics', deadline: '2024-01-10' }
        ],
        weekly_progress: [
            { day: 'Mon', hours: 2 },
            { day: 'Tue', hours: 3 },
            { day: 'Wed', hours: 1 },
            { day: 'Thu', hours: 4 },
            { day: 'Fri', hours: 2 },
            { day: 'Sat', hours: 3 },
            { day: 'Sun', hours: 1 }
        ]
    };
    
    // Demo learning paths
    learningPathsData = {
        path1: {
            title: 'Machine Learning Fundamentals',
            description: 'Learn the basics of machine learning and AI',
            progress: 60,
            modules: [
                { name: 'Introduction to ML', duration: '2 hours', completed: true },
                { name: 'Linear Regression', duration: '3 hours', completed: true },
                { name: 'Classification', duration: '4 hours', completed: false },
                { name: 'Neural Networks', duration: '5 hours', completed: false }
            ]
        },
        path2: {
            title: 'Data Science with Python',
            description: 'Master data analysis and visualization',
            progress: 30,
            modules: [
                { name: 'Pandas Basics', duration: '2 hours', completed: true },
                { name: 'Data Cleaning', duration: '3 hours', completed: false },
                { name: 'Matplotlib & Seaborn', duration: '4 hours', completed: false },
                { name: 'Advanced Visualization', duration: '3 hours', completed: false }
            ]
        }
    };
    
    // Demo resources
    resourcesData = {
        courses: [
            { title: 'Python for Data Science', type: 'course', level: 'beginner', url: '#' },
            { title: 'Machine Learning A-Z', type: 'course', level: 'intermediate', url: '#' }
        ],
        books: [
            { title: 'Hands-On Machine Learning', type: 'book', level: 'intermediate', url: '#' },
            { title: 'Python Data Science Handbook', type: 'book', level: 'advanced', url: '#' }
        ],
        tutorials: [
            { title: 'Scikit-learn Tutorial', type: 'tutorial', level: 'beginner', url: '#' },
            { title: 'TensorFlow Guide', type: 'tutorial', level: 'intermediate', url: '#' }
        ]
    };
    
    // Demo profile
    profileData = {
        name: currentUser?.name || 'Demo User',
        email: currentUser?.email || 'demo@example.com',
        learning_style: 'visual',
        joined_date: '2024-01-01',
        goals: [
            '✓ Complete ML fundamentals',
            'Learn deep learning',
            'Build 3 projects'
        ]
    };
}

// Update the API_BASE_URL configuration to handle different environments
const getApiBaseUrl = () => {
    // If we're in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }
    
    // If you have a specific backend domain for production, use it here
    // For example, if your backend is deployed on Heroku:
    // return 'https://your-app-name.herokuapp.com/api';
    
    // If you don't have a backend deployed yet, we'll use demo data
    return null;
};

const API_BASE_URL = getApiBaseUrl();

// Modify your fetch functions to use demo data when API is not available
async function fetchWithFallback(url, options = {}) {
    if (!API_BASE_URL) {
        console.warn('No API URL configured, using demo data');
        loadDemoData();
        return { success: true, usingDemoData: true };
    }
    
    try {
        const fullUrl = `${API_BASE_URL}${url}`;
        const response = await fetch(fullUrl, options);
        
        if (response.status === 401) {
            logout();
            return { success: false, error: 'Unauthorized' };
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`API call failed for ${url}:`, error);
        
        // If we're in production and the API call fails, load demo data
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            console.warn('API call failed, loading demo data');
            loadDemoData();
            return { success: true, usingDemoData: true };
        }
        
        throw error;
    }
}