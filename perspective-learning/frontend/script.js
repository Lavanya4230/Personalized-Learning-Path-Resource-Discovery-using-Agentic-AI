// ✅ Base API URL (auto-switches between local and deployed)
const API_BASE_URL = window.location.origin.includes("localhost")
  ? "http://localhost:5000"
  : "https://personalized-learning-path-resource-i5j8.onrender.com";

// ---------- SIGN UP ----------
async function signupUser(event) {
  event.preventDefault();
  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await response.json();
    if (response.ok) {
      alert("Signup successful!");
      window.location.href = "/auth/login"; // SPA-friendly
    } else {
      alert(data.error || "Signup failed!");
    }
  } catch (err) {
    alert("Network error. Please try again.");
  }
}

// ---------- LOGIN ----------
async function loginUser(event) {
  event.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (response.ok) {
      localStorage.setItem("token", data.token || data.access_token);
      window.location.href = "/dashboard";
    } else {
      alert(data.error || "Login failed!");
    }
  } catch (err) {
    alert("Network error. Please try again.");
  }
}

// ---------- DASHBOARD ----------
async function loadDashboard() {
  const token = localStorage.getItem("token");
  if (!token) return (window.location.href = "/auth/login");

  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (response.ok) {
      document.getElementById("welcomeText").innerText = `Welcome!`;
    } else {
      alert("Session expired. Logging out.");
      localStorage.removeItem("token");
      window.location.href = "/auth/login";
    }
  } catch (err) {
    alert("Failed to load dashboard.");
  }
}

// ---------- LEARNING PATHS ----------
async function fetchLearningPaths() {
  const token = localStorage.getItem("token");
  if (!token) return (window.location.href = "/auth/login");

  try {
    const response = await fetch(`${API_BASE_URL}/api/learning-paths`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (response.ok) displayLearningPaths(data);
    else alert("Failed to load learning paths!");
  } catch (err) {
    alert("Network error while loading learning paths.");
  }
}

// ---------- RESOURCES ----------
async function fetchResources() {
  const token = localStorage.getItem("token");
  if (!token) return (window.location.href = "/auth/login");

  try {
    const response = await fetch(`${API_BASE_URL}/api/resources`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (response.ok) displayResources(data);
    else alert("Failed to load resources!");
  } catch (err) {
    alert("Network error while loading resources.");
  }
}

// ---------- PROFILE ----------
async function loadProfile() {
  const token = localStorage.getItem("token");
  if (!token) return (window.location.href = "/auth/login");

  try {
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (response.ok) {
      document.getElementById("profileName").innerText = data.name;
      document.getElementById("profileEmail").innerText = data.email;
    } else alert("Failed to load profile!");
  } catch (err) {
    alert("Network error while loading profile.");
  }
}

// ---------- RECOMMENDATIONS ----------
async function getRecommendations() {
  const token = localStorage.getItem("token");
  if (!token) return (window.location.href = "/auth/login");

  try {
    const response = await fetch(`${API_BASE_URL}/api/recommend`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ interests: "", goals: "", style: "" }),
    });
    const data = await response.json();
    if (response.ok) displayRecommendations(data.recommendations);
    else alert("Failed to get recommendations!");
  } catch (err) {
    alert("Network error while fetching recommendations.");
  }
}

// ---------- HELPER DISPLAY FUNCTIONS ----------
function displayLearningPaths(paths) {
  const container = document.getElementById("learningPaths");
  if (!container) return;
  container.innerHTML = Object.values(paths)
    .map(p => `<li><strong>${p.title}</strong>: ${p.description}</li>`)
    .join("");
}

function displayResources(resources) {
  const container = document.getElementById("resources");
  if (!container) return;
  let html = "";
  Object.keys(resources).forEach(cat => {
    html += `<h4>${cat}</h4><ul>`;
    resources[cat].forEach(r => {
      html += `<li>${r.title || r.name} (${r.type || "resource"})</li>`;
    });
    html += "</ul>";
  });
  container.innerHTML = html;
}

function displayRecommendations(recommendations) {
  const container = document.getElementById("recommendations");
  if (!container) return;
  if (typeof recommendations === "string") {
    container.innerHTML = `<pre>${recommendations}</pre>`;
  } else {
    container.innerHTML = recommendations.map(r => `<li>${r}</li>`).join("");
  }
}
