import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import type { Bindings } from './types'

// Import route handlers
import authRoutes from './routes/auth'
import teacherRoutes from './routes/teacher'
import studentRoutes from './routes/student'
import gameRoutes from './routes/game'
import wonderRoutes from './routes/wonders'
import religionRoutes from './routes/religion'

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files from public directory
app.use('/static/*', serveStatic({ root: './public' }))

// API Routes
app.route('/api/auth', authRoutes)
app.route('/api/teacher', teacherRoutes)
app.route('/api/student', studentRoutes)
app.route('/api/game', gameRoutes)
app.route('/api/wonders', wonderRoutes)
app.route('/api/religion', religionRoutes)

// Root route - Main landing page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Through History - World History Simulation</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          body {
            background-image: url('https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Pieter_Bruegel_the_Elder_-_The_Tower_of_Babel_%28Vienna%29_-_Google_Art_Project_-_edited.jpg/2560px-Pieter_Bruegel_the_Elder_-_The_Tower_of_Babel_%28Vienna%29_-_Google_Art_Project_-_edited.jpg');
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            min-height: 100vh;
            position: relative;
          }
          body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.3);
            pointer-events: none;
          }
          .card {
            background: rgba(255, 255, 255, 0.97);
            backdrop-filter: blur(10px);
            position: relative;
            z-index: 1;
          }
        </style>
    </head>
    <body class="flex items-center justify-center p-4">
        <div class="card rounded-xl shadow-2xl max-w-4xl w-full p-8">
            <div class="text-center mb-8">
                <h1 class="text-5xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-landmark mr-3"></i>
                    Through History
                </h1>
                <p class="text-xl text-gray-600">
                    A World History Simulation Game for High School Students
                </p>
                <p class="text-gray-500 mt-2">
                    Build civilizations, manage resources, and survive from 50,000 BCE to 362 CE
                </p>
            </div>
            
            <div class="grid md:grid-cols-2 gap-6 mt-8">
                <!-- Teacher Login -->
                <div class="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg border-2 border-red-200">
                    <h2 class="text-2xl font-bold text-red-900 mb-4">
                        <i class="fas fa-chalkboard-teacher mr-2"></i>
                        Teachers
                    </h2>
                    <p class="text-red-700 mb-4">
                        Create periods, manage students, and control the timeline
                    </p>
                    <button onclick="location.href='/teacher/login'" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition">
                        Teacher Login
                    </button>
                    <button onclick="location.href='/teacher/register'" class="w-full mt-2 bg-white hover:bg-gray-50 text-red-600 font-bold py-3 px-6 rounded-lg border-2 border-red-600 transition">
                        Register as Teacher
                    </button>
                </div>
                
                <!-- Student Login -->
                <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border-2 border-blue-200">
                    <h2 class="text-2xl font-bold text-blue-900 mb-4">
                        <i class="fas fa-user-graduate mr-2"></i>
                        Students
                    </h2>
                    <p class="text-blue-700 mb-4">
                        Build your civilization and compete with classmates
                    </p>
                    <button onclick="location.href='/student/login'" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition">
                        Student Login
                    </button>
                    <button onclick="location.href='/student/register'" class="w-full mt-2 bg-white hover:bg-gray-50 text-blue-600 font-bold py-3 px-6 rounded-lg border-2 border-blue-600 transition">
                        Join with Invite Code
                    </button>
                </div>
            </div>
            
            <div class="mt-8 pt-6 border-t border-gray-300">
                <h3 class="text-xl font-bold text-gray-800 mb-3">
                    <i class="fas fa-info-circle mr-2"></i>
                    About the Game
                </h3>
                <div class="grid md:grid-cols-3 gap-4 text-center">
                    <div>
                        <div class="text-3xl font-bold text-purple-600 mb-2">30,362</div>
                        <div class="text-sm text-gray-600">Years of History</div>
                    </div>
                    <div>
                        <div class="text-3xl font-bold text-purple-600 mb-2">18+</div>
                        <div class="text-sm text-gray-600">Historical Civilizations</div>
                    </div>
                    <div>
                        <div class="text-3xl font-bold text-purple-600 mb-2">∞</div>
                        <div class="text-sm text-gray-600">Strategic Possibilities</div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
  `)
})

// Teacher dashboard route
app.get('/teacher/dashboard', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Teacher Dashboard - Through History</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          body {
            background-image: url('https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Pieter_Bruegel_the_Elder_-_The_Tower_of_Babel_%28Vienna%29_-_Google_Art_Project_-_edited.jpg/2560px-Pieter_Bruegel_the_Elder_-_The_Tower_of_Babel_%28Vienna%29_-_Google_Art_Project_-_edited.jpg');
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            min-height: 100vh;
          }
          body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.4);
            pointer-events: none;
          }
          .dashboard-container {
            position: relative;
            z-index: 1;
          }
          .dashboard-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
          }
        </style>
    </head>
    <body>
        <div id="app" class="dashboard-container"></div>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/historical-contexts.js"></script>
        <script src="/static/hex-map.js"></script>
        <script src="/static/teacher-dashboard.js"></script>
    </body>
    </html>
  `)
})

// Student game interface route
app.get('/student/game', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>My Civilization - Through History</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-900 text-white">
        <div id="app"></div>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/historical-contexts.js"></script>
        <script src="/static/notifications.js"></script>
        <script src="/static/hex-map.js"></script>
        <script src="/static/student-game.js"></script>
    </body>
    </html>
  `)
})

// Teacher registration page
app.get('/teacher/register', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Teacher Registration - Through History</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body {
            background-image: url('https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Pieter_Bruegel_the_Elder_-_The_Tower_of_Babel_%28Vienna%29_-_Google_Art_Project_-_edited.jpg/2560px-Pieter_Bruegel_the_Elder_-_The_Tower_of_Babel_%28Vienna%29_-_Google_Art_Project_-_edited.jpg');
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
          }
          body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.3);
            pointer-events: none;
          }
        </style>
    </head>
    <body class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-xl shadow-lg max-w-md w-full p-8 relative z-10">
            <h1 class="text-3xl font-bold text-gray-800 mb-6">Teacher Registration</h1>
            <form id="registerForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input type="text" id="name" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input type="email" id="email" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <input type="password" id="password" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
                </div>
                <button type="submit" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition">
                    Register
                </button>
            </form>
            <p class="text-center mt-4 text-sm text-gray-600">
                Already have an account? <a href="/teacher/login" class="text-red-600 hover:underline">Login here</a>
            </p>
            <a href="/" class="block text-center mt-4 text-sm text-gray-600 hover:underline">← Back to Home</a>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/auth.js"></script>
    </body>
    </html>
  `)
})

// Student registration page
app.get('/student/register', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Student Registration - Through History</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body {
            background-image: url('https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Pieter_Bruegel_the_Elder_-_The_Tower_of_Babel_%28Vienna%29_-_Google_Art_Project_-_edited.jpg/2560px-Pieter_Bruegel_the_Elder_-_The_Tower_of_Babel_%28Vienna%29_-_Google_Art_Project_-_edited.jpg');
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
          }
          body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.3);
            pointer-events: none;
          }
        </style>
    </head>
    <body class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-xl shadow-lg max-w-md w-full p-8 relative z-10">
            <h1 class="text-3xl font-bold text-gray-800 mb-6">Student Registration</h1>
            <form id="registerForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input type="text" id="name" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input type="email" id="email" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <input type="password" id="password" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Invite Code (from teacher)</label>
                    <input type="text" id="inviteCode" required maxlength="6" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase" placeholder="ABC123">
                </div>
                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition">
                    Join Class
                </button>
            </form>
            <p class="text-center mt-4 text-sm text-gray-600">
                Already have an account? <a href="/student/login" class="text-blue-600 hover:underline">Login here</a>
            </p>
            <a href="/" class="block text-center mt-4 text-sm text-gray-600 hover:underline">← Back to Home</a>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/auth.js"></script>
    </body>
    </html>
  `)
})

// Login pages
app.get('/teacher/login', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Teacher Login - Through History</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body {
            background-image: url('https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Pieter_Bruegel_the_Elder_-_The_Tower_of_Babel_%28Vienna%29_-_Google_Art_Project_-_edited.jpg/2560px-Pieter_Bruegel_the_Elder_-_The_Tower_of_Babel_%28Vienna%29_-_Google_Art_Project_-_edited.jpg');
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
          }
          body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.3);
            pointer-events: none;
          }
        </style>
    </head>
    <body class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-xl shadow-lg max-w-md w-full p-8 relative z-10">
            <h1 class="text-3xl font-bold text-gray-800 mb-6">Teacher Login</h1>
            <form id="loginForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input type="email" id="email" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <input type="password" id="password" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
                </div>
                <button type="submit" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition">
                    Login
                </button>
            </form>
            <p class="text-center mt-4 text-sm text-gray-600">
                Don't have an account? <a href="/teacher/register" class="text-red-600 hover:underline">Register here</a>
            </p>
            <a href="/" class="block text-center mt-4 text-sm text-gray-600 hover:underline">← Back to Home</a>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/auth.js"></script>
    </body>
    </html>
  `)
})

app.get('/student/login', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Student Login - Through History</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body {
            background-image: url('https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Pieter_Bruegel_the_Elder_-_The_Tower_of_Babel_%28Vienna%29_-_Google_Art_Project_-_edited.jpg/2560px-Pieter_Bruegel_the_Elder_-_The_Tower_of_Babel_%28Vienna%29_-_Google_Art_Project_-_edited.jpg');
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
          }
          body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.3);
            pointer-events: none;
          }
        </style>
    </head>
    <body class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-xl shadow-lg max-w-md w-full p-8 relative z-10">
            <h1 class="text-3xl font-bold text-gray-800 mb-6">Student Login</h1>
            <form id="loginForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input type="email" id="email" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <input type="password" id="password" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition">
                    Login
                </button>
            </form>
            <p class="text-center mt-4 text-sm text-gray-600">
                Don't have an account? <a href="/student/register" class="text-blue-600 hover:underline">Join with invite code</a>
            </p>
            <a href="/" class="block text-center mt-4 text-sm text-gray-600 hover:underline">← Back to Home</a>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/auth.js"></script>
    </body>
    </html>
  `)
})

export default app
