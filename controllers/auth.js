// Bring in everything we need for authentication
const express = require('express');
const router = express.Router(); // This handles our authentication routes
const bcrypt = require('bcrypt'); // For scrambling passwords so they're safe
const jwt = require('jsonwebtoken'); // For creating login tokens

// Get our User model so we can work with user data
const User = require('../models/user');

// How many times to hash the password (higher = more secure but slower)
const saltRounds = 12;

// SIGN UP ROUTE - Create a new user account
router.post('/sign-up', async (req, res) => {
  try {
    // Get the info they sent us
    const { username, password, name, location } = req.body;

    // Make sure they gave us the basics
    if (!username || !password) {
      return res.status(400).json({ err: 'Username and password are required.' });
    }

    // Password should be decent length for security
    if (password.length < 6) {
      return res.status(400).json({ err: 'Password must be at least 6 characters long.' });
    }

    // Check if someone already has that username
    const existingUser = await User.findOne({ username: username });
    if (existingUser) {
      return res.status(409).json({ err: 'Username already taken.' });
    }
    
    // Create the new user account
    const newUser = await User.create({
      username,
      hashedPassword: bcrypt.hashSync(password, saltRounds), // Scramble that password!
      name: name || '', // Use their name or empty string if they didn't provide one
      location: location || '', // Same with location
    });

    // Create a login token so they don't have to log in again right away
    const payload = { username: newUser.username, _id: newUser._id };
    const token = jwt.sign({ payload }, process.env.JWT_SECRET);

    // Send back their login token
    res.status(201).json({ token });
  } catch (err) {
    // Something went wrong - let them know and log it for us to debug
    console.log('Sign up error:', err.message);
    res.status(500).json({ err: err.message });
  }
});

// SIGN IN ROUTE - Log in an existing user
router.post('/sign-in', async (req, res) => {
  try {
    // Get their login info
    const { username, password } = req.body;

    // Make sure they gave us both pieces
    if (!username || !password) {
      return res.status(400).json({ err: 'Username and password are required.' });
    }

    // Look for their account
    const user = await User.findOne({ username: username });
    if (!user) {
      // Don't tell them specifically that the username doesn't exist - security thing
      return res.status(401).json({ err: 'Invalid credentials.' });
    }

    // Check if their password is right
    const isPasswordCorrect = bcrypt.compareSync(password, user.hashedPassword);
    if (!isPasswordCorrect) {
      // Same here - just say "invalid credentials" not "wrong password"
      return res.status(401).json({ err: 'Invalid credentials.' });
    }

    // They're legit! Give them a login token
    const payload = { username: user.username, _id: user._id };
    const token = jwt.sign({ payload }, process.env.JWT_SECRET);

    // Send back their token
    res.status(200).json({ token });
  } catch (err) {
    // Log any errors for debugging
    console.log('Sign in error:', err.message);
    res.status(500).json({ err: err.message });
  }
});

// Export these routes so server.js can use them
module.exports = router;
