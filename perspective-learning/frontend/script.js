// Global variables
let dashboardData = null;
let learningPathsData = null;
let resourcesData = null;
let profileData = null;
let currentUser = null;

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', function() {
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
    document.getElementById('main-nav').classList.add('hidden');
    document.getElementById('app-content').classList.add('hidden');
    document.getElementById('auth-nav').classList.remove('hidden');
    showSection('login');
}

// Show main application
function showApp() {
    document.getElementById('auth-nav').classList.add('hidden');
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('signup-section').classList.add('hidden');
    document.getElementById('main-nav').classList.remove('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    
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
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('auth-message');
    
    // Show loading
    messageDiv.className = 'p-4 bg-blue-50 text-blue-700 rounded-lg';
    messageDiv.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Signing in...';
    messageDiv.classList.remove('hidden');
    
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
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
            
            messageDiv.className = 'p-4 bg-green-50 text-green-700 rounded-lg';
            messageDiv.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Login successful!';
            
            // Show main app
            showApp();
        } else {
            messageDiv.className = 'p-4 bg-red-50 text-red-700 rounded-lg';
            messageDiv.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i> ${data.error}`;
        }
    } catch (error) {
        messageDiv.className = 'p-4 bg-red-50 text-red-700 rounded-lg';
        messageDiv.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i> Network error. Please try again.';
    }
}

// Handle signup
async function handleSignup(e) {
    if (e) e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const messageDiv = document.getElementById('signup-message');
    
    // Basic validation
    if (password.length < 6) {
        messageDiv.className = 'p-4 bg-red-50 text-red-700 rounded-lg';
        messageDiv.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i> Password must be at least 6 characters long';
        messageDiv.classList.remove('hidden');
        return;
    }
    
    // Show loading
    messageDiv.className = 'p-4 bg-blue-50 text-blue-700 rounded-lg';
    messageDiv.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Creating account...';
    messageDiv.classList.remove('hidden');
    
    try {
        const response = await fetch('http://localhost:5000/api/auth/signup', {
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
            
            messageDiv.className = 'p-4 bg-green-50 text-green-700 rounded-lg';
            messageDiv.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Account created successfully!';
            
            // Show main app
            showApp();
        } else {
            messageDiv.className = 'p-4 bg-red-50 text-red-700 rounded-lg';
            messageDiv.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i> ${data.error}`;
        }
    } catch (error) {
        messageDiv.className = 'p-4 bg-red-50 text-red-700 rounded-lg';
        messageDiv.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i> Network error. Please try again.';
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
    }
}

// Initialize weekly progress chart
function initWeeklyChart(weeklyData) {
    const ctx = document.getElementById('weeklyChart');
    if (ctx) {
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
        const response = await fetch('http://localhost:5000/api/dashboard', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            // Token expired or invalid
            logout();
            return;
        }
        
        dashboardData = await response.json();
        
        // Update skills
        renderSkills(dashboardData.skills);
        
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
                </div>
            `;
        }
    }
}

// Render skills
function renderSkills(skills) {
    const container = document.getElementById('skills-container');
    if (container) {
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
        const response = await fetch('http://localhost:5000/api/learning-paths', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            logout();
            return;
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
                </div>
            `;
        }
    }
}

// Render learning paths
function renderLearningPaths(paths) {
    const container = document.getElementById('paths-container');
    if (container) {
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
                    ${path.modules.map(module => `
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
        const response = await fetch('http://localhost:5000/api/resources', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            logout();
            return;
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
        for (const [cat, items] of Object.entries(resourcesData)) {
            resourcesToShow.push(...items.map(item => ({...item, category: cat})));
        }
    } else if (resourcesData[category]) {
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
            <a href="${resource.url}" class="text-blue-600 text-sm hover:underline">View resource</a>
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
        const response = await fetch('http://localhost:5000/api/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            logout();
            return;
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
                </div>
            `;
        }
    }
}

// Render profile
function renderProfile(profile) {
    const container = document.getElementById('profile-container');
    if (container) {
        container.innerHTML = `
            <div id="notification-area"></div>
            <div class="bg-white p-6 rounded-lg shadow-sm">
                <div class="flex items-center mb-6">
                    <div class="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mr-4">
                        <i class="fas fa-user text-blue-600 text-2xl"></i>
                    </div>
                    <div>
                        <h3 class="text-2xl font-semibold">${profile.name}</h3>
                        <p class="text-gray-600">${profile.email}</p>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <h4 class="font-semibold mb-2">Learning Style</h4>
                        <p class="capitalize">${profile.learning_style}</p>
                    </div>
                    <div>
                        <h4 class="font-semibold mb-2">Member Since</h4>
                        <p>${profile.joined_date}</p>
                    </div>
                </div>
                
                <div class="mb-6">
                    <h4 class="font-semibold mb-2">Learning Goals</h4>
                    <div class="space-y-2">
                        ${profile.goals.map(goal => `
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
    const profile = profileData;
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
                        ${profile.goals.map((goal, index) => {
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
    const goals = document.querySelectorAll('#goals-container > div');
    if (goals.length > 1) {
        goals[index].remove();
    }
}

// Cancel editing
function cancelEdit() {
    renderProfile(profileData);
}

// Handle profile update - FIXED: Changed from POST to PUT
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('edit-name').value;
    const learningStyle = document.getElementById('edit-style').value;
    
    // Get goals from checkboxes and inputs
    const goals = [];
    document.querySelectorAll('#goals-container > div').forEach(goalDiv => {
        const checkbox = goalDiv.querySelector('.goal-checkbox');
        const input = goalDiv.querySelector('.goal-input');
        if (input.value.trim()) {
            const goalText = checkbox.checked ? `✓ ${input.value.trim()}` : input.value.trim();
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
        // Send update to backend - FIXED: Changed method to PUT
        const response = await fetch('http://localhost:5000/api/profile', {
            method: 'PUT', // Changed from POST to PUT
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
    
    const subjects = document.getElementById('subjects').value;
    const goals = document.getElementById('goals').value;
    const style = document.getElementById('style').value;
    
    // Show loading state
    document.getElementById('ai-recommendations').innerHTML = 
        '<div class="flex justify-center items-center h-40"><i class="fas fa-spinner fa-spin text-2xl text-blue-500"></i></div>';
    
    try {
        const token = localStorage.getItem('token');
        // Send request to backend API
        const response = await fetch('http://localhost:5000/api/recommend', {
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
        
        const data = await response.json();
        
        if (data.success) {
            // Format the response with line breaks
            const formattedResponse = data.recommendations.replace(/\n/g, '<br>');
            document.getElementById('ai-recommendations').innerHTML = `
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
        document.getElementById('ai-recommendations').innerHTML = `
            <div class="p-4 bg-red-50 rounded-lg text-red-700">
                <p>Unable to connect to the recommendation service. Please make sure the backend server is running on port 5000.</p>
                <p class="mt-2">Error: ${error.message}</p>
            </div>
        `;
    }
}