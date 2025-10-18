from flask import Flask, request, jsonify, send_from_directory, redirect
from flask_cors import CORS
import os
from dotenv import load_dotenv
import json
from datetime import datetime, timedelta
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
import random

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__, static_folder='../frontend', static_url_path='')

# Enable CORS for all routes
CORS(app)

# Secret key for JWT
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')

# Check if OpenAI API key is available
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY or OPENAI_API_KEY == "your_openai_api_key_here":
    print("⚠  WARNING: OpenAI API key not found or using placeholder value")
    print("⚠  Running in demo mode without AI capabilities")
    AI_ENABLED = False
else:
    AI_ENABLED = True
    print("✅ OpenAI API key found, AI features enabled")

# User database (in production, use a real database)
users = {}

# Mock data templates
def generate_dashboard_data():
    """Generate dashboard data with realistic values"""
    # Generate random weekly progress (more realistic pattern)
    weekly_progress = []
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for day in days:
        # Weekdays have more study time, weekends less
        if day in ["Sat", "Sun"]:
            hours = round(random.uniform(0.5, 2.5), 1)
        else:
            hours = round(random.uniform(1.0, 4.0), 1)
        weekly_progress.append({"day": day, "hours": hours})
    
    # Calculate total hours from weekly progress
    total_hours = round(sum(day["hours"] for day in weekly_progress), 1)
    
    # Generate upcoming deadlines (all with at least 3 days remaining to avoid red styling)
    upcoming_deadlines = []
    today = datetime.now()
    for i in range(3):
        deadline_date = today + timedelta(days=random.randint(5, 14))  # Minimum 5 days to avoid urgent styling
        deadline = {
            "title": f"Assignment {i+1}",
            "course": f"Course {random.choice(['Python', 'Statistics', 'Machine Learning', 'Web Development', 'Data Science'])}",
            "due_date": deadline_date.strftime("%Y-%m-%d"),
            "days_left": (deadline_date - today).days,
            "priority": random.choice(["low", "medium"])  # Add priority field to control styling
        }
        upcoming_deadlines.append(deadline)
    
    # Sort deadlines by days left
    upcoming_deadlines.sort(key=lambda x: x["days_left"])
    
    # Generate skills with progress
    skills = [
        {"name": "Python", "level": random.randint(40, 75), "target": 90},
        {"name": "Statistics", "level": random.randint(30, 65), "target": 85},
        {"name": "Machine Learning", "level": random.randint(20, 55), "target": 80},
        {"name": "Data Visualization", "level": random.randint(25, 60), "target": 75},
        {"name": "Algorithms", "level": random.randint(35, 70), "target": 70},
        {"name": "JavaScript", "level": random.randint(20, 50), "target": 80},
        {"name": "React", "level": random.randint(15, 45), "target": 75}
    ]
    
    return {
        "total_hours": total_hours,
        "courses_completed": random.randint(1, 5),
        "current_streak": random.randint(0, 14),
        "weekly_goal": 15,
        "weekly_completed": round(total_hours, 1),
        "skills": skills,
        "weekly_progress": weekly_progress,
        "upcoming_deadlines": upcoming_deadlines
    }

user_data_templates = {
    "dashboard": generate_dashboard_data(),
    "learning_paths": {
        "python": {
            "title": "Python Developer Path",
            "description": "Become proficient in Python programming",
            "modules": [
                {"name": "Python Basics", "duration": "2 weeks", "completed": False},
                {"name": "Data Structures", "duration": "3 weeks", "completed": False},
                {"name": "Web Development with Django", "duration": "4 weeks", "completed": False},
                {"name": "Data Analysis with Pandas", "duration": "3 weeks", "completed": False},
                {"name": "Advanced Python Concepts", "duration": "3 weeks", "completed": False}
            ],
            "progress": 0
        },
        "data_science": {
            "title": "Data Science Path", 
            "description": "Master data analysis and visualization",
            "modules": [
                {"name": "Statistics Fundamentals", "duration": "2 weeks", "completed": False},
                {"name": "Data Visualization", "duration": "3 weeks", "completed": False},
                {"name": "Machine Learning Basics", "duration": "4 weeks", "completed": False},
                {"name": "Deep Learning", "duration": "4 weeks", "completed": False},
                {"name": "Data Engineering", "duration": "3 weeks", "completed": False}
            ],
            "progress": 0
        },
        "web_development": {
            "title": "Web Development Path",
            "description": "Become a full-stack web developer",
            "modules": [
                {"name": "HTML & CSS Fundamentals", "duration": "2 weeks", "completed": False},
                {"name": "JavaScript Basics", "duration": "3 weeks", "completed": False},
                {"name": "React Framework", "duration": "4 weeks", "completed": False},
                {"name": "Node.js & Express", "duration": "3 weeks", "completed": False},
                {"name": "Database Integration", "duration": "3 weeks", "completed": False}
            ],
            "progress": 0
        },
        "mobile_development": {
            "title": "Mobile Development Path",
            "description": "Build cross-platform mobile applications",
            "modules": [
                {"name": "React Native Fundamentals", "duration": "3 weeks", "completed": False},
                {"name": "Mobile UI Design", "duration": "2 weeks", "completed": False},
                {"name": "API Integration", "duration": "3 weeks", "completed": False},
                {"name": "App Deployment", "duration": "2 weeks", "completed": False}
            ],
            "progress": 0
        }
    },
    "resources": {
        "python": [
            {"type": "book", "title": "Fluent Python", "level": "Intermediate", "url": "https://www.oreilly.com/library/view/fluent-python/9781491946237/"},
            {"type": "book", "title": "Python Crash Course", "level": "Beginner", "url": "https://nostarch.com/pythoncrashcourse2e"},
            {"type": "course", "title": "Python for Everybody", "level": "Beginner", "url": "https://www.py4e.com/"},
            {"type": "course", "title": "Advanced Python", "level": "Advanced", "url": "https://realpython.com/learning-paths/advanced-python/"},
            {"type": "tutorial", "title": "Real Python Tutorials", "level": "All levels", "url": "https://realpython.com/"},
            {"type": "platform", "title": "Exercism Python Track", "level": "All levels", "url": "https://exercism.org/tracks/python"}
        ],
        "machine_learning": [
            {"type": "book", "title": "Hands-On Machine Learning", "level": "Intermediate", "url": "https://www.oreilly.com/library/view/hands-on-machine-learning/9781492032632/"},
            {"type": "book", "title": "Pattern Recognition and Machine Learning", "level": "Advanced", "url": "https://www.microsoft.com/en-us/research/people/cmbishop/prml-book/"},
            {"type": "course", "title": "Andrew Ng's ML Course", "level": "Beginner", "url": "https://www.coursera.org/learn/machine-learning"},
            {"type": "course", "title": "Fast.ai Practical Deep Learning", "level": "Intermediate", "url": "https://www.fast.ai/"},
            {"type": "platform", "title": "Kaggle Learn", "level": "All levels", "url": "https://www.kaggle.com/learn"},
            {"type": "platform", "title": "Google Machine Learning Crash Course", "level": "Beginner", "url": "https://developers.google.com/machine-learning/crash-course"}
        ],
        "web_development": [
            {"type": "book", "title": "Full Stack Python", "level": "Intermediate", "url": "https://www.fullstackpython.com/"},
            {"type": "book", "title": "You Don't Know JS", "level": "Intermediate", "url": "https://github.com/getify/You-Dont-Know-JS"},
            {"type": "course", "title": "Django for Beginners", "level": "Beginner", "url": "https://djangoforbeginners.com/"},
            {"type": "course", "title": "The Odin Project", "level": "All levels", "url": "https://www.theodinproject.com/"},
            {"type": "documentation", "title": "MDN Web Docs", "level": "All levels", "url": "https://developer.mozilla.org/"},
            {"type": "platform", "title": "FreeCodeCamp", "level": "Beginner", "url": "https://www.freecodecamp.org/"}
        ],
        "data_science": [
            {"type": "book", "title": "Python for Data Analysis", "level": "Intermediate", "url": "https://www.oreilly.com/library/view/python-for-data/9781491957653/"},
            {"type": "book", "title": "Storytelling with Data", "level": "Intermediate", "url": "https://www.storytellingwithdata.com/"},
            {"type": "course", "title": "Data Science Specialization", "level": "Intermediate", "url": "https://www.coursera.org/specializations/jhu-data-science"},
            {"type": "course", "title": "DataCamp Data Scientist Track", "level": "All levels", "url": "https://www.datacamp.com/tracks/data-scientist-with-python"},
            {"type": "platform", "title": "Kaggle", "level": "All levels", "url": "https://www.kaggle.com/"},
            {"type": "platform", "title": "Towards Data Science", "level": "All levels", "url": "https://towardsdatascience.com/"}
        ],
        "javascript": [
            {"type": "book", "title": "Eloquent JavaScript", "level": "Intermediate", "url": "https://eloquentjavascript.net/"},
            {"type": "book", "title": "JavaScript: The Good Parts", "level": "Intermediate", "url": "https://www.oreilly.com/library/view/javascript-the-good/9780596517748/"},
            {"type": "course", "title": "JavaScript30", "level": "Intermediate", "url": "https://javascript30.com/"},
            {"type": "course", "title": "Modern JavaScript From The Beginning", "level": "Beginner", "url": "https://www.udemy.com/course/modern-javascript/"},
            {"type": "platform", "title": "FreeCodeCamp JavaScript", "level": "Beginner", "url": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/"},
            {"type": "documentation", "title": "JavaScript MDN Docs", "level": "All levels", "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript"}
        ],
        "react": [
            {"type": "book", "title": "Fullstack React", "level": "Intermediate", "url": "https://www.fullstackreact.com/"},
            {"type": "course", "title": "React Official Tutorial", "level": "Beginner", "url": "https://reactjs.org/tutorial/tutorial.html"},
            {"type": "course", "title": "Epic React", "level": "Advanced", "url": "https://epicreact.dev/"},
            {"type": "platform", "title": "React Documentation", "level": "All levels", "url": "https://reactjs.org/docs/getting-started.html"},
            {"type": "platform", "title": "Next.js Learn", "level": "Intermediate", "url": "https://nextjs.org/learn"},
            {"type": "tutorial", "title": "React Patterns", "level": "Advanced", "url": "https://reactpatterns.com/"}
        ],
        "cloud_computing": [
            {"type": "course", "title": "AWS Cloud Practitioner", "level": "Beginner", "url": "https://aws.amazon.com/training/learn-about/cloud-practitioner/"},
            {"type": "course", "title": "Google Cloud Digital Leader", "level": "Beginner", "url": "https://cloud.google.com/training/digital-leader"},
            {"type": "course", "title": "Azure Fundamentals", "level": "Beginner", "url": "https://docs.microsoft.com/en-us/learn/certifications/azure-fundamentals/"},
            {"type": "platform", "title": "AWS Training", "level": "All levels", "url": "https://aws.amazon.com/training/"},
            {"type": "platform", "title": "Google Cloud Training", "level": "All levels", "url": "https://cloud.google.com/training"},
            {"type": "platform", "title": "Microsoft Learn", "level": "All levels", "url": "https://docs.microsoft.com/en-us/learn/"}
        ]
    }
}

# Authentication middleware
def token_required(f):
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing', 'success': False}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = users.get(data['email'])
            if not current_user:
                return jsonify({'error': 'User not found', 'success': False}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired', 'success': False}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token is invalid', 'success': False}), 401
        
        return f(current_user, *args, **kwargs)
    
    decorated.__name__ = f.__name__
    return decorated

# Serve frontend - MAIN PAGE
@app.route('/')
def serve_frontend():
    return send_from_directory(app.static_folder, 'index.html')

# Serve auth pages
@app.route('/auth/login')
def serve_login_page():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/auth/signup')
def serve_signup_page():
    return send_from_directory(app.static_folder, 'index.html')

# Serve other pages
@app.route('/dashboard')
def serve_dashboard_page():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/learning-paths')
def serve_learning_paths_page():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/resources')
def serve_resources_page():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/profile')
def serve_profile_page():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/recommendations')
def serve_recommendations_page():
    return send_from_directory(app.static_folder, 'index.html')

# Resource redirect endpoint
@app.route('/api/resource/redirect')
@token_required
def redirect_to_resource(current_user):
    title = request.args.get('title')
    category = request.args.get('category')
    
    if not title or not category:
        return jsonify({"error": "Title and category are required", "success": False}), 400
    
    # Find the resource URL
    resource_url = None
    if category in user_data_templates["resources"]:
        for resource in user_data_templates["resources"][category]:
            if resource["title"] == title:
                resource_url = resource["url"]
                break
    
    if not resource_url:
        return jsonify({"error": "Resource not found", "success": False}), 404
    
    # Redirect to the resource URL
    return redirect(resource_url)

# Auth Routes
@app.route('/api/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        print("Signup request data:", data)
        
        if not data:
            return jsonify({"error": "No data provided", "success": False}), 400
        
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        name = data.get('name', '').strip()
        
        if not email or not password or not name:
            return jsonify({"error": "Email, password, and name are required", "success": False}), 400
        
        # Validate email format
        if '@' not in email or '.' not in email:
            return jsonify({"error": "Please enter a valid email address", "success": False}), 400
        
        # Validate password length
        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters long", "success": False}), 400
        
        if email in users:
            return jsonify({"error": "User already exists with this email", "success": False}), 409
        
        # Create new user
        users[email] = {
            "id": len(users) + 1,
            "name": name,
            "email": email,
            "password": generate_password_hash(password),
            "joined_date": datetime.now().strftime("%Y-%m-%d"),
            "learning_style": "visual",
            "goals": ["Set your first learning goal"],
            "interests": []
        }
        
        print(f"User created: {email}")
        print(f"Total users: {len(users)}")
        
        # Generate JWT token
        token_payload = {
            'email': email,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }
        token = jwt.encode(token_payload, app.config['SECRET_KEY'], algorithm="HS256")
        
        return jsonify({
            "message": "User created successfully",
            "success": True,
            "token": token,
            "user": {
                "name": name,
                "email": email
            }
        })
        
    except Exception as e:
        print("Error in signup:", str(e))
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": "Internal server error. Please try again later.",
            "success": False
        }), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        print("Login request data:", data)
        
        if not data:
            return jsonify({"error": "No data provided", "success": False}), 400
        
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        
        if not email or not password:
            return jsonify({"error": "Email and password are required", "success": False}), 400
        
        user = users.get(email)
        if not user:
            return jsonify({
                "error": "Email not registered. Please create an account first.", 
                "success": False,
                "suggestion": "signup"
            }), 404
        
        if not check_password_hash(user['password'], password):
            return jsonify({"error": "Invalid password", "success": False}), 401
        
        # Generate JWT token
        token_payload = {
            'email': email,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }
        token = jwt.encode(token_payload, app.config['SECRET_KEY'], algorithm="HS256")
        
        print(f"User logged in: {email}")
        
        return jsonify({
            "message": "Login successful",
            "success": True,
            "token": token,
            "user": {
                "name": user['name'],
                "email": user['email']
            }
        })
        
    except Exception as e:
        print("Error in login:", str(e))
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": "Internal server error. Please try again later.",
            "success": False
        }), 500

# Protected API Routes
@app.route('/api/dashboard')
@token_required
def get_dashboard(current_user):
    # Return personalized dashboard data for the current user
    # Generate fresh data each time to simulate updates
    dashboard_data = generate_dashboard_data()
    return jsonify(dashboard_data)

@app.route('/api/learning-paths')
@token_required
def get_learning_paths(current_user):
    return jsonify(user_data_templates["learning_paths"])

@app.route('/api/resources')
@token_required
def get_resources(current_user):
    category = request.args.get('category', 'all')
    if category == 'all':
        return jsonify(user_data_templates["resources"])
    elif category in user_data_templates["resources"]:
        return jsonify({category: user_data_templates["resources"][category]})
    else:
        return jsonify({"error": "Category not found"}), 404

@app.route('/api/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    return jsonify({
        "name": current_user['name'],
        "email": current_user['email'],
        "joined_date": current_user['joined_date'],
        "learning_style": current_user['learning_style'],
        "goals": current_user['goals'],
        "interests": current_user.get('interests', [])
    })

@app.route('/api/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided", 'success': False}), 400
        
        # Update profile fields if they exist in the request
        if 'name' in data:
            users[current_user['email']]['name'] = data['name']
        if 'learning_style' in data:
            users[current_user['email']]['learning_style'] = data['learning_style']
        if 'goals' in data:
            if isinstance(data['goals'], list):
                users[current_user['email']]['goals'] = data['goals']
        if 'interests' in data:
            if isinstance(data['interests'], list):
                users[current_user['email']]['interests'] = data['interests']  # Fixed typo here
        
        return jsonify({
            "message": "Profile updated successfully", 
            "profile": {
                "name": users[current_user['email']]['name'],
                "email": users[current_user['email']]['email'],
                "joined_date": users[current_user['email']]['joined_date'],
                "learning_style": users[current_user['email']]['learning_style'],
                "goals": users[current_user['email']]['goals'],
                "interests": users[current_user['email']].get('interests', [])
            },
            "success": True
        })
        
    except Exception as e:
        print("Error updating profile:", str(e))
        return jsonify({
            "error": "Internal server error. Please try again later.",
            "success": False
        }), 500

@app.route('/api/profile/password', methods=['PUT'])
@token_required
def update_password(current_user):
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided", "success": False}), 400
        
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({"error": "Current and new password are required", "success": False}), 400
        
        # Verify current password
        if not check_password_hash(current_user['password'], current_password):
            return jsonify({"error": "Current password is incorrect", "success": False}), 401
        
        # Validate new password length
        if len(new_password) < 6:
            return jsonify({"error": "New password must be at least 6 characters long", "success": False}), 400
        
        # Update password
        users[current_user['email']]['password'] = generate_password_hash(new_password)
        
        return jsonify({
            "message": "Password updated successfully",
            "success": True
        })
        
    except Exception as e:
        print("Error updating password:", str(e))
        return jsonify({
            "error": "Internal server error. Please try again later.",
            "success": False
        }), 500

# AI Recommendation API - Return string format for frontend compatibility
@app.route('/api/recommend', methods=['POST'])
@token_required
def get_recommendations(current_user):
    try:
        data = request.get_json()
        print("Recommendation request data:", data)
        
        if not data:
            return jsonify({"error": "No data provided", "success": False}), 400
            
        user_interests = data.get('interests', '').lower()
        learning_goals = data.get('goals', '')
        learning_style = data.get('style', '')
        
        # Save interests to user profile
        if user_interests:
            interests_list = [interest.strip() for interest in user_interests.split(',') if interest.strip()]
            users[current_user['email']]['interests'] = interests_list
        
        # Generate recommendations as a string (for frontend compatibility)
        recommendations = ""
        if "python" in user_interests:
            data_path = user_data_templates["learning_paths"]["python"]
            recommendations = f"""
            Learning Path: {data_path['title']}
            
            Modules:
            1. {data_path['modules'][0]['name']} ({data_path['modules'][0]['duration']})
            2. {data_path['modules'][1]['name']} ({data_path['modules'][1]['duration']})
            3. {data_path['modules'][2]['name']} ({data_path['modules'][2]['duration']})
            4. {data_path['modules'][3]['name']} ({data_path['modules'][3]['duration']})
            5. {data_path['modules'][4]['name']} ({data_path['modules'][4]['duration']})
            
            Recommended Resources:
            - 'Fluent Python' Book
            - 'Python Crash Course' Book
            - 'Python for Everybody' Course
            - Real Python Tutorials
            - Exercism Python Track
            
            Learning Tips for {learning_style} learners:
            - Focus on practical examples
            - Practice coding daily
            - Build small projects
            - Contribute to open source
            """
        elif "machine" in user_interests or "ml" in user_interests or "ai" in user_interests:
            data_path = user_data_templates["learning_paths"]["data_science"]
            recommendations = f"""
            Learning Path: {data_path['title']}
            
            Modules:
            1. {data_path['modules'][0]['name']} ({data_path['modules'][0]['duration']})
            2. {data_path['modules'][1]['name']} ({data_path['modules'][1]['duration']})
            3. {data_path['modules'][2]['name']} ({data_path['modules'][2]['duration']})
            4. {data_path['modules'][3]['name']} ({data_path['modules'][3]['duration']})
            5. {data_path['modules'][4]['name']} ({data_path['modules'][4]['duration']})
            
            Recommended Resources:
            - 'Hands-On Machine Learning' Book
            - 'Pattern Recognition and Machine Learning' Book
            - Andrew Ng's ML Course
            - Fast.ai Practical Deep Learning
            - Kaggle Learn Platform
            
            Learning Tips for {learning_style} learners:
            - Focus on mathematical foundations
            - Work with real datasets
            - Understand model evaluation
            - Participate in Kaggle competitions
            """
        elif "web" in user_interests or "javascript" in user_interests:
            data_path = user_data_templates["learning_paths"]["web_development"]
            recommendations = f"""
            Learning Path: {data_path['title']}
            
            Modules:
            1. {data_path['modules'][0]['name']} ({data_path['modules'][0]['duration']})
            2. {data_path['modules'][1]['name']} ({data_path['modules'][1]['duration']})
            3. {data_path['modules'][2]['name']} ({data_path['modules'][2]['duration']})
            4. {data_path['modules'][3]['name']} ({data_path['modules'][3]['duration']})
            5. {data_path['modules'][4]['name']} ({data_path['modules'][4]['duration']})
            
            Recommended Resources:
            - 'Full Stack Python' Book
            - 'You Don't Know JS' Book
            - The Odin Project
            - FreeCodeCamp
            - MDN Web Docs
            
            Learning Tips for {learning_style} learners:
            - Build portfolio projects
            - Learn browser developer tools
            - Practice responsive design
            - Understand HTTP protocols
            """
        else:
            recommendations = f"""
            Based on your interest in {user_interests} and goal of {learning_goals}, I recommend:
            
            Learning Path: {user_interests.title()} Fundamentals
            
            Modules:
            1. Introduction to {user_interests} (2 weeks)
            2. Core Concepts and Techniques (3 weeks)
            3. Practical Applications (4 weeks)
            4. Advanced Topics (3 weeks)
            5. Real-world Project (4 weeks)
            
            Recommended Resources:
            - '{user_interests.title()} for Beginners' book
            - Online video tutorial series
            - Interactive coding exercises
            - Community forums and discussions
            
            Learning Tips for {learning_style} learners:
            - Focus on practical examples
            - Take detailed notes
            - Review concepts regularly
            - Join online communities
            - Build projects to apply knowledge
            """
        
        return jsonify({
            "recommendations": recommendations,
            "success": True,
            "ai_generated": False
        })
        
    except Exception as e:
        print("Error in recommendations:", str(e))
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": "Failed to generate recommendations. Please try again.",
            "success": False
        }), 500

# Health check API
@app.route('/api/health')
def health_check():
    return jsonify({
        "status": "healthy", 
        "service": "Perspective Learning API",
        "ai_enabled": AI_ENABLED,
        "users_count": len(users)
    })

# Debug endpoint to see all users (remove in production)
@app.route('/api/debug/users')
def debug_users():
    return jsonify({
        "users": users,
        "count": len(users)
    })

if __name__ == '__main__':
    print("Starting Perspective Learning API Server...")
    print(f"Secret key: {app.config['SECRET_KEY']}")
    print(f"AI Enabled: {AI_ENABLED}")
    if AI_ENABLED:
        print(f"OpenAI API Key: {OPENAI_API_KEY[:10]}...")  # Show first 10 chars only
    app.run(debug=True, port=5000, host='0.0.0.0')