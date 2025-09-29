// Everything we need for skill-related functionality
const express = require('express');
const router = express.Router(); // Handles all our skill routes

// Our database models
const Skill = require('../models/skill');
const User = require('../models/user');

// Check if user is logged in
const verifyToken = require('../middleware/verify-token');

// BROWSE ALL SKILLS - with search and filtering options
// This is the main route for finding skills across all users
router.get('/', verifyToken, async (req, res) => {
  try {
    // What are they searching for?
    const { search, category, skillLevel, type, location } = req.query;
    
    // Start with just active skills
    let query = { isActive: true };
    
    // If they typed something to search for, look in names and descriptions
    if (search) {
      query.$or = [
        { skillName: { $regex: search, $options: 'i' } },     // Search skill names (case insensitive)
        { description: { $regex: search, $options: 'i' } }   // Search descriptions too
      ];
    }
    
    // Add any filters they selected
    if (category) {
      query.category = category;
    }
    
    if (skillLevel) {
      query.skillLevel = skillLevel;
    }
    
    if (type) {
      query.type = type; // Either 'offered' or 'wanted'
    }

    // Find skills and include the user info (but not passwords!)
    let skills = await Skill.find(query)
      .populate('user', 'username name location')
      .sort({ createdAt: -1 }); // Newest first

    // If they want to filter by where someone lives, do that here
    // (We have to do this after getting the user data)
    if (location) {
      skills = skills.filter(skill => 
        skill.user.location && 
        skill.user.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    res.json(skills);
  } catch (err) {
    console.log('Get skills error:', err.message);
    res.status(500).json({ err: err.message });
  }
});

// GET MY SKILLS - just the skills belonging to the logged-in user
router.get('/my-skills', verifyToken, async (req, res) => {
  try {
    // Find only my active skills
    const skills = await Skill.find({ 
      user: req.user._id,
      isActive: true 
    }).sort({ createdAt: -1 }); // Newest first

    res.json(skills);
  } catch (err) {
    console.log('Get my skills error:', err.message);
    res.status(500).json({ err: err.message });
  }
});

// GET SOMEONE ELSE'S SKILLS - for viewing another user's profile
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    // Find skills for whoever they're looking at
    const skills = await Skill.find({ 
      user: req.params.userId,
      isActive: true 
    })
    .populate('user', 'username name location')
    .sort({ createdAt: -1 });

    res.json(skills);
  } catch (err) {
    console.log('Get user skills error:', err.message);
    res.status(500).json({ err: err.message });
  }
});

// CREATE A NEW SKILL - add something you can teach or want to learn
router.post('/', verifyToken, async (req, res) => {
  try {
    // Create the skill and connect it to whoever is posting it
    const skill = await Skill.create({
      ...req.body,           // Everything they filled out in the form
      user: req.user._id,    // Who's creating this skill
    });

    // Send back the skill with the user's name and info included
    const populatedSkill = await Skill.findById(skill._id)
      .populate('user', 'username name location');

    res.status(201).json(populatedSkill);
  } catch (err) {
    console.log('Create skill error:', err.message);
    res.status(500).json({ err: err.message });
  }
});

// UPDATE A SKILL - edit one of your existing skills
router.put('/:skillId', verifyToken, async (req, res) => {
  try {
    // Find the skill they want to change
    const skill = await Skill.findById(req.params.skillId);

    if (!skill) {
      return res.status(404).json({ err: 'Skill not found.' });
    }

    // Only the person who created it can change it
    if (skill.user.toString() !== req.user._id) {
      return res.status(403).json({ err: 'You can only edit your own skills.' });
    }

    // Apply the changes they made
    const updatedSkill = await Skill.findByIdAndUpdate(
      req.params.skillId,
      req.body,
      { new: true } // Give us back the updated version
    ).populate('user', 'username name location');

    res.json(updatedSkill);
  } catch (err) {
    console.log('Update skill error:', err.message);
    res.status(500).json({ err: err.message });
  }
});

// DELETE A SKILL - remove one you don't want to offer/want anymore
// We don't actually delete it from the database (that could break things)
router.delete('/:skillId', verifyToken, async (req, res) => {
  try {
    // Find the skill they want to remove
    const skill = await Skill.findById(req.params.skillId);

    if (!skill) {
      return res.status(404).json({ err: 'Skill not found.' });
    }

    // Only the owner can delete their own skill
    if (skill.user.toString() !== req.user._id) {
      return res.status(403).json({ err: 'You can only delete your own skills.' });
    }

    // "Soft delete" - just mark it as inactive so it doesn't show up
    // This way if someone already requested a swap with this skill, we don't break things
    await Skill.findByIdAndUpdate(
      req.params.skillId,
      { isActive: false },
      { new: true }
    );

    res.json({ message: 'Skill deleted successfully.' });
  } catch (err) {
    console.log('Delete skill error:', err.message);
    res.status(500).json({ err: err.message });
  }
});

// BROWSE USERS - see all users with their skills organized nicely
// This is perfect for a "Browse People" page where you see user cards
router.get('/browse-users', verifyToken, async (req, res) => {
  try {
    // What are they looking for?
    const { search, category, skillLevel, location } = req.query;
    
    // Start by getting all users (just the basic info)
    let users = await User.find({}, 'username name location');
    
    // If they want to filter by where people live, do that first
    if (location) {
      users = users.filter(user => 
        user.location && 
        user.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    // Now for each user, get their skills and apply any search filters
    const usersWithSkills = await Promise.all(
      users.map(async (user) => {
        // Build the search for this user's skills
        let skillQuery = { 
          user: user._id, 
          isActive: true 
        };
        
        // Apply their search filters
        if (search) {
          skillQuery.$or = [
            { skillName: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ];
        }
        
        if (category) {
          skillQuery.category = category;
        }
        
        if (skillLevel) {
          skillQuery.skillLevel = skillLevel;
        }
        
        // Get all this user's skills that match the search
        const skills = await Skill.find(skillQuery);
        
        // Split them into what they offer vs what they want
        // This makes it easier for the frontend to display
        const skillsOffered = skills.filter(skill => skill.type === 'offered');
        const skillsWanted = skills.filter(skill => skill.type === 'wanted');
        
        return {
          ...user.toObject(), // Convert to regular JavaScript object
          skillsOffered,
          skillsWanted,
        };
      })
    );

    // Only show users who actually have skills matching the search
    const activeUsers = usersWithSkills.filter(user => 
      user.skillsOffered.length > 0 || user.skillsWanted.length > 0
    );

    res.json(activeUsers);
  } catch (err) {
    console.log('Browse users error:', err.message);
    res.status(500).json({ err: err.message });
  }
});

// ADVANCED SEARCH - for when you want really specific results
// This gives you more organized data than the basic search
router.get('/search', verifyToken, async (req, res) => {
  try {
    // Get all the possible search criteria they might use
    const { 
      q,           // What they typed in the search box
      category,    // What type of skill (coding, music, etc.)
      skillLevel,  // Beginner, intermediate, advanced
      type,        // Are they offering it or wanting to learn it?
      location,    // Where they live
      timeFrame    // How much time they can commit
    } = req.query;
    
    // Start with the basics - only active skills
    let query = { isActive: true };
    
    // If they typed something, search in skill names and descriptions
    if (q) {
      query.$or = [
        { skillName: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }
    
    // Add each filter they selected
    if (category) query.category = category;
    if (skillLevel) query.skillLevel = skillLevel;
    if (type) query.type = type;
    if (timeFrame) query.timeFrame = timeFrame;

    // Find all skills that match what they're looking for
    let skills = await Skill.find(query)
      .populate('user', 'username name location')
      .sort({ createdAt: -1 }); // Newest first

    // Filter by where people live (we have to do this after getting user data)
    if (location) {
      skills = skills.filter(skill => 
        skill.user.location && 
        skill.user.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    // Organize the results to make it easy for the frontend
    const results = {
      offered: skills.filter(skill => skill.type === 'offered'),
      wanted: skills.filter(skill => skill.type === 'wanted'),
      total: skills.length
    };

    res.json(results);
  } catch (err) {
    console.log('Advanced search error:', err.message);
    res.status(500).json({ err: err.message });
  }
});

// Send this router back to server.js so it can use all these routes
module.exports = router;