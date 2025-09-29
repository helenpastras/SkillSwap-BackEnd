// ==============================================
// SKILLSWAP BACKEND SERVER
// ==============================================
// This is the main server file that starts our SkillSwap backend API
// It connects to MongoDB, sets up middleware, and handles all our routes

// Load environment variables from .env file (like database URL, JWT secret)
const dotenv = require('dotenv');
dotenv.config();

// Import required packages
const express = require('express');        // Web framework for Node.js
const app = express();                     // Create our Express application
const mongoose = require('mongoose');      // MongoDB object modeling tool
const cors = require('cors');              // Enable Cross-Origin Resource Sharing
const logger = require('morgan');          // HTTP request logger

// ==============================================
// IMPORT OUR ROUTE HANDLERS
// ==============================================
const authRouter = require('./controllers/auth');              // Authentication routes (sign up, sign in)
const usersRouter = require('./controllers/users');            // User profile routes
const skillsRouter = require('./controllers/skills');          // Skill management routes
const swapRequestsRouter = require('./controllers/swapRequests'); // Skill swap request routes

// ==============================================
// CONNECT TO MONGODB DATABASE
// ==============================================
console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI);

// Event listeners for database connection
mongoose.connection.on('connected', () => {
  console.log(`✅ Connected to MongoDB ${mongoose.connection.name}.`);
});

mongoose.connection.on('error', (err) => {
  console.log('❌ MongoDB connection error:', err);
});

// ==============================================
// MIDDLEWARE SETUP
// ==============================================
// Middleware runs before our routes and handles common tasks

// Enable CORS - allows our frontend to make requests to this backend
app.use(cors());

// Parse JSON request bodies - converts JSON strings to JavaScript objects
app.use(express.json());

// Log HTTP requests in development format
app.use(logger('dev'));

// ==============================================
// ROUTE SETUP
// ==============================================
// Connect our route handlers to specific URL paths

// Root route - just to verify the server is running
app.get('/', (req, res) => {
  res.json({
    message: '🎉 Welcome to the SkillSwap API!',
    status: 'Server is running successfully',
    endpoints: {
      authentication: '/auth (POST /auth/sign-up, POST /auth/sign-in)',
      users: '/users (GET /users/profile/me, PUT /users/profile/me)',
      skills: '/skills (GET /skills, POST /skills, GET /skills/my-skills)',
      swapRequests: '/swap-requests (GET /swap-requests, POST /swap-requests)'
    },
    documentation: 'All routes require authentication except /auth routes'
  });
});

app.use('/auth', authRouter);                    // Authentication: /auth/sign-up, /auth/sign-in
app.use('/users', usersRouter);                  // Users: /users/profile/me, etc.
app.use('/skills', skillsRouter);                // Skills: /skills, /skills/my-skills, etc.
app.use('/swap-requests', swapRequestsRouter);   // Swap Requests: /swap-requests, /swap-requests/accept, etc.

// ==============================================
// START THE SERVER
// ==============================================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 The SkillSwap backend server is running on port ${PORT}!`);
  console.log(`📖 API Documentation:`);
  console.log(`   Authentication: http://localhost:${PORT}/auth`);
  console.log(`   Users: http://localhost:${PORT}/users`);
  console.log(`   Skills: http://localhost:${PORT}/skills`);
  console.log(`   Swap Requests: http://localhost:${PORT}/swap-requests`);
});
