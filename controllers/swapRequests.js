// Everything we need for skill swap requests
const express = require('express');
const router = express.Router(); // Handles all our swap request routes

// Our database models
const SwapRequest = require('../models/swapRequest');
const Skill = require('../models/skill');

// Check if user is logged in
const verifyToken = require('../middleware/verify-token');

// GET ALL MY SWAP REQUESTS - both ones I sent and ones I received
// This is like your inbox and outbox combined
router.get('/', verifyToken, async (req, res) => {
  try {
    // Find requests where I'm either asking for something OR someone is asking me
    const requests = await SwapRequest.find({
      $or: [
        { requester: req.user._id },      // Requests I sent to others
        { skillProvider: req.user._id }   // Requests others sent to me
      ]
    })
    .populate('requester', 'username name location')      // Who asked for the swap
    .populate('skillProvider', 'username name location')  // Who has the skill they want
    .populate('skillRequested')                           // What skill they want to learn
    .populate('skillOffered')                             // What skill they're offering in return
    .sort({ createdAt: -1 }); // Show newest first

    res.json(requests);
  } catch (err) {
    console.log('Get all swap requests error:', err.message);
    res.status(500).json({ err: err.message });
  }
});

// GET REQUESTS I RECEIVED - people asking to learn from me
// This is your "inbox" of people who want your skills
router.get('/received', verifyToken, async (req, res) => {
  try {
    // Find requests where I'm the one with the skill they want
    const requests = await SwapRequest.find({ skillProvider: req.user._id })
      .populate('requester', 'username name location')
      .populate('skillProvider', 'username name location')
      .populate('skillRequested')
      .populate('skillOffered')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.log('Get received requests error:', err.message);
    res.status(500).json({ err: err.message });
  }
});

// GET REQUESTS I SENT - ones I'm waiting to hear back about
// This is your "outbox" of requests you've made to others
router.get('/sent', verifyToken, async (req, res) => {
  try {
    // Find requests where I'm asking someone to teach me
    const requests = await SwapRequest.find({ requester: req.user._id })
      .populate('requester', 'username name location')
      .populate('skillProvider', 'username name location')
      .populate('skillRequested')
      .populate('skillOffered')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.log('Get sent requests error:', err.message);
    res.status(500).json({ err: err.message });
  }
});

// CREATE A NEW SWAP REQUEST - "I want to learn X and I'll teach you Y"
router.post('/', verifyToken, async (req, res) => {
  try {
    // Get what they want to swap
    const { skillRequestedId, skillOfferedId, comments, requestMessage } = req.body;

    // Make sure both skills actually exist
    const skillRequested = await Skill.findById(skillRequestedId);
    const skillOffered = await Skill.findById(skillOfferedId);

    if (!skillRequested || !skillOffered) {
      return res.status(404).json({ err: 'One or both skills not found.' });
    }

    // You can't ask yourself to trade skills! That would be weird.
    if (skillRequested.user.toString() === req.user._id) {
      return res.status(400).json({ err: 'Cannot create swap request with yourself.' });
    }

    // Make sure you actually own the skill you're offering
    if (skillOffered.user.toString() !== req.user._id) {
      return res.status(403).json({ err: 'You can only offer skills you own.' });
    }

    // Create the swap request
    const swapRequest = await SwapRequest.create({
      requester: req.user._id,              // That's me - I'm asking
      skillProvider: skillRequested.user,   // The person who has what I want
      skillRequested: skillRequestedId,     // What I want to learn
      skillOffered: skillOfferedId,         // What I'm offering in return
      comments,                             // Any extra notes
      requestMessage,                       // My personal message to them
    });

    // Send back the complete request with all the details filled in
    const populatedRequest = await SwapRequest.findById(swapRequest._id)
      .populate('requester', 'username name location')
      .populate('skillProvider', 'username name location')
      .populate('skillRequested')
      .populate('skillOffered');

    res.status(201).json(populatedRequest);
  } catch (err) {
    console.log('Create swap request error:', err.message);
    res.status(500).json({ err: err.message });
  }
});

// ACCEPT A SWAP REQUEST - "Yes, I'll teach you!"
// Only the person who received the request can accept it
router.put('/:requestId/accept', verifyToken, async (req, res) => {
  try {
    const { responseMessage } = req.body; // Optional message when saying yes
    
    // Find the request they want to accept
    const swapRequest = await SwapRequest.findById(req.params.requestId);

    if (!swapRequest) {
      return res.status(404).json({ err: 'Swap request not found.' });
    }

    // Only the person who received the request can accept it
    if (swapRequest.skillProvider.toString() !== req.user._id) {
      return res.status(403).json({ err: 'You can only accept requests sent to you.' });
    }

    // Can't accept something that's already been answered
    if (swapRequest.status !== 'pending') {
      return res.status(400).json({ err: 'This request has already been answered.' });
    }

    // Mark it as accepted and save any message they want to send
    const updatedRequest = await SwapRequest.findByIdAndUpdate(
      req.params.requestId,
      { 
        status: 'accepted',
        responseMessage // Their reply message
      },
      { new: true } // Give us back the updated version
    )
    .populate('requester', 'username name location')
    .populate('skillProvider', 'username name location')
    .populate('skillRequested')
    .populate('skillOffered');

    res.json(updatedRequest);
  } catch (err) {
    console.log('Accept request error:', err.message);
    res.status(500).json({ err: err.message });
  }
});

// DECLINE A SWAP REQUEST - "Sorry, not interested"
// Only the person who received the request can decline it
router.put('/:requestId/decline', verifyToken, async (req, res) => {
  try {
    const { responseMessage } = req.body; // Optional message when saying no
    
    // Find the request they want to decline
    const swapRequest = await SwapRequest.findById(req.params.requestId);

    if (!swapRequest) {
      return res.status(404).json({ err: 'Swap request not found.' });
    }

    // Only the person who received the request can decline it
    if (swapRequest.skillProvider.toString() !== req.user._id) {
      return res.status(403).json({ err: 'You can only decline requests sent to you.' });
    }

    // Can't decline something that's already been answered
    if (swapRequest.status !== 'pending') {
      return res.status(400).json({ err: 'This request has already been answered.' });
    }

    // Mark it as declined and save any message they want to send
    const updatedRequest = await SwapRequest.findByIdAndUpdate(
      req.params.requestId,
      { 
        status: 'declined',
        responseMessage // Their reply message
      },
      { new: true } // Give us back the updated version
    )
    .populate('requester', 'username name location')
    .populate('skillProvider', 'username name location')
    .populate('skillRequested')
    .populate('skillOffered');

    res.json(updatedRequest);
  } catch (err) {
    console.log('Decline request error:', err.message);
    res.status(500).json({ err: err.message });
  }
});

// UPDATE SWAP STATUS - track progress from "accepted" to "completed"
// Both people in the swap can update this
router.put('/:requestId/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    // Find the swap they want to update
    const swapRequest = await SwapRequest.findById(req.params.requestId);

    if (!swapRequest) {
      return res.status(404).json({ err: 'Swap request not found.' });
    }

    // Only the people involved in this swap can update it
    if (swapRequest.requester.toString() !== req.user._id && 
        swapRequest.skillProvider.toString() !== req.user._id) {
      return res.status(403).json({ err: 'You can only update swaps you\'re part of.' });
    }

    // Make sure they're using a valid status
    const validStatuses = ['in-progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ err: 'Invalid status. Use "in-progress" or "completed".' });
    }

    // You can't start something that hasn't been accepted yet
    if (swapRequest.status !== 'accepted' && status === 'in-progress') {
      return res.status(400).json({ err: 'Can\'t start until both people have agreed to the swap.' });
    }

    // Update the status
    const updatedRequest = await SwapRequest.findByIdAndUpdate(
      req.params.requestId,
      { status },
      { new: true }
    )
    .populate('requester', 'username name location')
    .populate('skillProvider', 'username name location')
    .populate('skillRequested')
    .populate('skillOffered');

    res.json(updatedRequest);
  } catch (err) {
    console.log('Update request status error:', err.message);
    res.status(500).json({ err: err.message });
  }
});

// Send this router back to server.js so it can use all these routes
module.exports = router;