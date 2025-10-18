// =======================
// BASE API URL
// =======================
const API_BASE_URL = window.location.origin.includes("localhost")
  ? "http://localhost:5000"
  : "https://personalized-learning-path-resource-i5j8.onrender.com";

// =======================
// GLOBAL VARIABLES
// =======================
let dashboardData = null;
let learningPathsData = null;
let resourcesData = null;
let profileData = null;
let currentUser = null;

// =======================
// PAGE LOAD
// =======================
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();

    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (signupForm) signupForm.addEventListener('submit', handleSignup);
});

// =======================
// AUTHENTICATION
// =======================
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
    } else showAuth();
}

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

    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            renderResources(this.dataset.category);
        });
    });
}

// =======================
// PAGE NAVIGATION
// =======================
function showSection(sectionName) {
    const sections = ['login','signup','dashboard','learning-paths','resources','profile','recommendations'];
    sections.forEach(sec => document.getElementById(`${sec}-section`)?.classList.add('hidden'));
    document.getElementById(`${sectionName}-section`)?.classList.remove('hidden');

    if(sectionName === 'learning-paths' && !learningPathsData) loadLearningPaths();
    if(sectionName === 'resources' && !resourcesData) loadResources();
    if(sectionName === 'profile' && !profileData) loadProfile();
}

// =======================
// LOGIN & SIGNUP
// =======================
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('auth-message');
    messageDiv.className = 'p-4 bg-blue-50 text-blue-700 rounded-lg';
    messageDiv.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Signing in...';
    messageDiv.classList.remove('hidden');

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password})
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            showApp();
        } else {
            messageDiv.className = 'p-4 bg-red-50 text-red-700 rounded-lg';
            messageDiv.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i> ${data.message || 'Login failed'}`;
        }
    } catch(err) {
        messageDiv.className = 'p-4 bg-red-50 text-red-700 rounded-lg';
        messageDiv.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i> Network error';
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const messageDiv = document.getElementById('signup-message');
    if(password.length < 6){
        messageDiv.className = 'p-4 bg-red-50 text-red-700 rounded-lg';
        messageDiv.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i> Password must be 6+ chars';
        messageDiv.classList.remove('hidden');
        return;
    }
    messageDiv.className = 'p-4 bg-blue-50 text-blue-700 rounded-lg';
    messageDiv.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Creating account...';
    messageDiv.classList.remove('hidden');

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({name,email,password})
        });
        const data = await response.json();
        if(response.ok){
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            showApp();
        } else {
            messageDiv.className = 'p-4 bg-red-50 text-red-700 rounded-lg';
            messageDiv.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i> ${data.message || 'Signup failed'}`;
        }
    } catch(err){
        messageDiv.className = 'p-4 bg-red-50 text-red-700 rounded-lg';
        messageDiv.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i> Network error';
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    showAuth();
}

// =======================
// DASHBOARD
// =======================
async function loadDashboard() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/dashboard`, {
            headers: {'Authorization': `Bearer ${token}`}
        });
        if(response.status === 401){ logout(); return; }
        dashboardData = await response.json();
        renderSkills(dashboardData.skills);
        renderDeadlines(dashboardData.upcoming_deadlines || []);
        if(dashboardData.weekly_progress) initWeeklyChart(dashboardData.weekly_progress);
    } catch(err){ console.error(err); }
}

function renderSkills(skills){
    const container = document.getElementById('skills-container');
    if(!container) return;
    container.innerHTML = skills.map(skill => `
        <div class="bg-gray-50 p-4 rounded-lg">
            <div class="flex justify-between mb-2">
                <span class="font-semibold">${skill.name}</span>
                <span>${skill.level}% / ${skill.target}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5">
                <div class="bg-blue-600 h-2.5 rounded-full" style="width:${skill.level}%"></div>
            </div>
        </div>
    `).join('');
}

function renderDeadlines(deadlines){
    const container = document.getElementById('deadlines-container');
    if(!container) return;
    if(deadlines.length === 0){
        container.innerHTML = `<div class="text-center text-gray-500 py-8"><i class="fas fa-calendar-check text-3xl mb-2"></i><p>No upcoming deadlines</p></div>`;
        return;
    }
    container.innerHTML = deadlines.map(dl => `
        <div class="border-l-4 border-red-500 pl-4 py-2 bg-red-50">
            <h4 class="font-semibold">${dl.assignment}</h4>
            <p class="text-sm text-gray-600">${dl.course}</p>
            <div class="mt-1 text-sm text-red-600"><i class="fas fa-clock mr-1"></i> Due: ${dl.deadline}</div>
        </div>
    `).join('');
}

// =======================
// LEARNING PATHS
// =======================
async function loadLearningPaths(){
    try{
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/learning-paths`,{
            headers:{'Authorization':`Bearer ${token}`}
        });
        if(response.status===401){logout(); return;}
        learningPathsData = await response.json();
        renderLearningPaths(learningPathsData);
    }catch(err){console.error(err);}
}

function renderLearningPaths(paths){
    const container = document.getElementById('paths-container');
    if(!container) return;
    container.innerHTML = Object.entries(paths).map(([k,p]) => `
        <div class="learning-path-card bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
            <h3 class="text-xl font-semibold mb-2">${p.title}</h3>
            <p class="text-gray-600 mb-4">${p.description}</p>
            <div class="mb-4">
                <div class="flex justify-between mb-1">
                    <span class="text-sm font-medium">Progress</span>
                    <span class="text-sm font-medium">${p.progress}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-blue-600 h-2 rounded-full" style="width:${p.progress}%"></div>
                </div>
            </div>
            <div class="space-y-2">
                ${p.modules.map(m=>`
                    <div class="flex items-center">
                        <span class="${m.completed?'text-green-500':'text-gray-400'} mr-2">
                            <i class="fas ${m.completed?'fa-check-circle':'fa-circle'}"></i>
                        </span>
                        <span class="${m.completed?'text-gray-500 line-through':'text-gray-700'}">${m.name} <span class="text-sm text-gray-400">(${m.duration})</span></span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// =======================
// RESOURCES
// =======================
async function loadResources(){
    try{
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/resources`,{
            headers:{'Authorization':`Bearer ${token}`}
        });
        if(response.status===401){logout(); return;}
        resourcesData = await response.json();
        renderResources('all');
    }catch(err){console.error(err);}
}

function renderResources(category){
    const container = document.getElementById('resources-container');
    if(!container || !resourcesData) return;

    let list=[];
    if(category==='all'){
        for(const [cat, items] of Object.entries(resourcesData)){
            list.push(...items.map(it=>({...it, category:cat})));
        }
    }else if(resourcesData[category]) list=resourcesData[category].map(it=>({...it, category}));

    if(list.length===0){
        container.innerHTML=`<div class="col-span-3 text-center text-gray-500 py-8"><i class="fas fa-book-open text-3xl mb-2"></i><p>No resources found</p></div>`;
        return;
    }

    container.innerHTML=list.map(r=>`
        <div class="resource-item bg-white p-4 rounded-lg shadow-sm border-l-4 border-${getResourceColor(r.type)}-500">
            <div class="flex items-start mb-3">
                <div class="bg-${getResourceColor(r.type)}-100 p-2 rounded-lg mr-3">
                    <i class="${getResourceIcon(r.type)} text-${getResourceColor(r.type)}-600"></i>
                </div>
                <div>
                    <h4 class="font-semibold">${r.title}</h4>
                    <p class="text-sm text-gray-600 capitalize">${r.type} • ${r.level}</p>
                    <span class="text-xs text-gray-400 capitalize">${r.category.replace('_',' ')}</span>
                </div>
            </div>
            <a href="${API_BASE_URL}${r.url}" class="text-blue-600 text-sm hover:underline" target="_blank">View resource</a>
        </div>
    `).join('');
}

function getResourceIcon(type){
    const icons={book:'fas fa-book',course:'fas fa-video',tutorial:'fas fa-graduation-cap',platform:'fas fa-globe',documentation:'fas fa-file-alt'};
    return icons[type]||'fas fa-link';
}

function getResourceColor(type){
    const colors={book:'yellow',course:'red',tutorial:'green',platform:'purple',documentation:'blue'};
    return colors[type]||'gray';
}

// =======================
// PROFILE
// =======================
async function loadProfile(){
    try{
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/profile`,{
            headers:{'Authorization':`Bearer ${token}`}
        });
        if(response.status===401){logout(); return;}
        profileData = await response.json();
        renderProfile(profileData);
    }catch(err){console.error(err);}
}

function renderProfile(data){
    if(!data) return;
    document.getElementById('profile-name').value = data.name;
    document.getElementById('profile-email').value = data.email;
    const goalsContainer = document.getElementById('profile-goals');
    goalsContainer.innerHTML = data.goals.map((g,i)=>`
        <div class="flex items-center mb-2">
            <span class="flex-1">${g}</span>
            <button class="text-red-500" onclick="removeGoal(${i})"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');
}

function addGoal() {
    const goalInput = document.getElementById('new-goal');
    if(goalInput.value.trim() === '') return;
    profileData.goals.push(goalInput.value.trim());
    goalInput.value = '';
    renderProfile(profileData);
}

function removeGoal(index){
    profileData.goals.splice(index,1);
    renderProfile(profileData);
}

async function saveProfile(){
    const token = localStorage.getItem('token');
    const name = document.getElementById('profile-name').value;
    const email = document.getElementById('profile-email').value;
    try{
        const response = await fetch(`${API_BASE_URL}/api/profile`,{
            method:'PUT',
            headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
            body:JSON.stringify({name,email,goals:profileData.goals})
        });
        if(response.ok){
            alert('Profile updated successfully');
        }else alert('Failed to update profile');
    }catch(err){console.error(err);}
}

// =======================
// RECOMMENDATIONS
// =======================
async function handleRecommendationForm(e){
    e.preventDefault();
    const subjects = document.getElementById('subjects').value;
    const goals = document.getElementById('goals').value;
    const style = document.getElementById('style').value;
    const container = document.getElementById('ai-recommendations');
    container.innerHTML = '<div class="flex justify-center items-center h-40"><i class="fas fa-spinner fa-spin text-2xl text-blue-500"></i></div>';

    try{
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/recommend`,{
            method:'POST',
            headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
            body:JSON.stringify({interests:subjects, goals:goals, style:style})
        });
        if(response.status===401){logout(); return;}
        const data = await response.json();
        if(response.ok){
            const formatted = data.recommendations.replace(/\n/g,'<br>');
            container.innerHTML=`<div class="p-4 bg-blue-50 rounded-lg"><h5 class="font-semibold mb-2">Your Personalized Learning Path</h5><p>${formatted}</p>${data.ai_generated?'<p class="text-sm text-gray-500 mt-2"><i class="fas fa-robot mr-1"></i>AI-generated recommendation</p>':''}</div>`;
        }else container.innerHTML=`<div class="p-4 bg-red-50 rounded-lg text-red-700"><p>${data.error||'Failed to get recommendations'}</p></div>`;
    }catch(err){
        container.innerHTML=`<div class="p-4 bg-red-50 rounded-lg text-red-700"><p>Unable to connect. ${err.message}</p></div>`;
    }
}

// =======================
// CHARTS
// =======================
function initProgressChart(){ /* radar chart init code here */ }
function initWeeklyChart(data){ /* weekly chart init code here */ }
