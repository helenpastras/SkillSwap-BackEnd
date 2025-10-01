// Everything we need for user-related routes
const express = require('express');
const router = express.Router(); // Handles our user routes

// Our data models
const User = require('../models/user');
const Skill = require('../models/skill');

// Middleware to check if someone is logged in
const verifyToken = require('../middleware/verify-token');

// GET ALL USERS - mainly for browsing who's on the platform
router.get('/', verifyToken, async (req, res) => {
  try {
    // Get all users but don't include passwords (obviously!)
    const users = await User.find({}, "username name location");

    res.json(users);
  } catch (err) {
    console.log('Get all users error:', err.message);
    res.status(500).json({ err: err.message });
  }
});

// GET ALL USERS skills for the SwapRequests- USer public view
router.get('/public/:userId', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId, '-hashedPassword');

    if (!user) {
      return res.status(404).json({ err: 'User not found.' });
    }

    const skills = await Skill.find({ 
      user: req.params.userId, 
      isActive: true 
    });

    const skillsOffered = skills.filter(skill => skill.type === 'offered');
    const skillsWanted = skills.filter(skill => skill.type === 'wanted');

    res.json({
      ...user.toObject(),
      skillsOffered,
      skillsWanted
    });
  } catch (err) {
    console.log('Get public user error:', err.message);
    res.status(500).json({ err: err.message });
  }
});

// GET SPECIFIC USER - but only if you're looking at your own profile
router.get('/:userId', verifyToken, async (req, res) => {
  try {
    // Security check: you can only see your own detailed info
    if (req.user._id !== req.params.userId) {
      return res.status(403).json({ err: "Unauthorized" });
    }

    // Find their account
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ err: 'User not found.' });
    }

    res.json({ user });
  } catch (err) {
    console.log('Get user by ID error:', err.message);
    res.status(500).json({ err: err.message });
  }
});

// GET MY COMPLETE PROFILE - includes all my skills organized nicely
router.get('/profile/me', verifyToken, async (req, res) => {
  try {
    // Get my user info (without password)
    const user = await User.findById(req.user._id, '-hashedPassword');
    
    if (!user) {
      return res.status(404).json({ err: 'User not found.' });
    }

    // Get all my active skills
    const skills = await Skill.find({ 
      user: req.user._id, 
      isActive: true 
    });

    // Split them up so the frontend can display them nicely
    const skillsOffered = skills.filter(skill => skill.type === 'offered');
    const skillsWanted = skills.filter(skill => skill.type === 'wanted');

    // Send everything back organized
    res.json({
      user,
      skillsOffered,
      skillsWanted,
    });
  } catch (err) {
    console.log('Get my profile error:', err.message);
    res.status(500).json({ err: err.message });
  }
});

// UPDATE MY PROFILE - change name, location, bio
router.put('/profile/me', verifyToken, async (req, res) => {
  try {
    // What do they want to update?
    const { name, location, bio } = req.body;

    // Update their info in the database
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name, location, bio },
      { 
        new: true,           // Give us back the updated version
        select: '-hashedPassword' // Don't include the password
      }
    );

    if (!updatedUser) {
      return res.status(404).json({ err: 'User not found.' });
    }

    res.json(updatedUser);
  } catch (err) {
    console.log('Update profile error:', err.message);
    res.status(500).json({ err: err.message });
  }
});

// GET SOMEONE ELSE'S PUBLIC PROFILE - for when you're browsing other users
router.get('/profile/:userId', verifyToken, async (req, res) => {
  try {
    // Get their basic info (no sensitive stuff)
    const user = await User.findById(req.params.userId, '-hashedPassword');
    
    if (!user) {
      return res.status(404).json({ err: 'User not found.' });
    }

    // Get their skills so you can see what they offer/want
    const skills = await Skill.find({ 
      user: req.params.userId, 
      isActive: true 
    });

    // Organize the skills for easy display
    const skillsOffered = skills.filter(skill => skill.type === 'offered');
    const skillsWanted = skills.filter(skill => skill.type === 'wanted');

    // Send back their public profile
    res.json({
      user,
      skillsOffered,
      skillsWanted,
    });
  } catch (err) {
    console.log('Get user profile error:', err.message);
    res.status(500).json({ err: err.message });
  }
});

// Export these routes for the main server to use
module.exports = router;
