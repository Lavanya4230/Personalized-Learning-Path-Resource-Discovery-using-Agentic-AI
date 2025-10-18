// ✅ Base API URL (auto-switches between local and deployed)
const API_BASE_URL = window.location.origin.includes("localhost")
  ? "http://localhost:5000"
  : ""; // when deployed, '' means same domain

// ---------- SIGN UP ----------
async function signupUser(event) {
  event.preventDefault();

  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await response.json();
  if (response.ok) {
    alert("Signup successful!");
    window.location.href = "login.html";
  } else {
    alert(data.message || "Signup failed!");
  }
}

// ---------- LOGIN ----------
async function loginUser(event) {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (response.ok) {
    localStorage.setItem("token", data.access_token);
    window.location.href = "dashboard.html";
  } else {
    alert(data.message || "Login failed!");
  }
}

// ---------- DASHBOARD ----------
async function loadDashboard() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const response = await fetch(`${API_BASE_URL}/api/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  if (response.ok) {
    document.getElementById("welcomeText").innerText = `Welcome, ${data.name}!`;
  } else {
    alert("Session expired. Please log in again.");
    localStorage.removeItem("token");
    window.location.href = "login.html";
  }
}

// ---------- LEARNING PATHS ----------
async function fetchLearningPaths() {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}/api/learning-paths`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  if (response.ok) {
    displayLearningPaths(data);
  } else {
    alert("Failed to load learning paths!");
  }
}

// ---------- RESOURCES ----------
async function fetchResources() {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}/api/resources`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  if (response.ok) {
    displayResources(data);
  } else {
    alert("Failed to load resources!");
  }
}

// ---------- PROFILE ----------
async function loadProfile() {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}/api/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  if (response.ok) {
    document.getElementById("profileName").innerText = data.name;
    document.getElementById("profileEmail").innerText = data.email;
  } else {
    alert("Failed to load profile!");
  }
}

// ---------- RECOMMENDATIONS ----------
async function getRecommendations() {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}/api/recommend`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  if (response.ok) {
    displayRecommendations(data);
  } else {
    alert("Failed to get recommendations!");
  }
}

// ---------- HELPER DISPLAY FUNCTIONS ----------
function displayLearningPaths(paths) {
  const container = document.getElementById("learningPaths");
  container.innerHTML = paths.map(p => `<li>${p.title}</li>`).join("");
}

function displayResources(resources) {
  const container = document.getElementById("resources");
  container.innerHTML = resources.map(r => `<li>${r.name}</li>`).join("");
}

function displayRecommendations(recommendations) {
  const container = document.getElementById("recommendations");
  container.innerHTML = recommendations.map(r => `<li>${r}</li>`).join("");
}
