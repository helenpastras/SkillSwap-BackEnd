// We need mongoose to work with the database
const mongoose = require('mongoose');

// This represents when someone wants to trade skills with another person
// Like "I'll teach you guitar if you teach me Spanish"
const swapRequestSchema = new mongoose.Schema({
  // Who's asking for the skill swap?
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Links to the person making the request
    required: true,
  },
  
  // Who has the skill they want to learn?
  skillProvider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Links to the person who can teach the skill
    required: true,
  },
  
  // What skill do they want to learn?
  skillRequested: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill', // Links to the specific skill they want
    required: true,
  },
  
  // What skill are they offering in return?
  skillOffered: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill', // Links to the skill they're willing to teach
    required: true,
  },
  
  // Where is this swap request in the process?
  status: {
    type: String,
    required: true,
    enum: [
      'pending',     // Just sent, waiting for an answer
      'accepted',    // They said yes!
      'declined',    // They said no
      'in-progress', // They're currently doing the skill swap
      'completed'    // All done!
    ],
    default: 'pending', // New requests start as pending
  },
  
  // Any extra notes about the swap
  comments: {
    type: String,
    required: false,
  },
  
  // What the requester said when they made the request
  requestMessage: {
    type: String,
    required: false,
  },
  
  // What the skill provider said when they responded
  responseMessage: {
    type: String,
    required: false,
  },
}, {
  // Keep track of when requests are made and updated
  timestamps: true,
});

// Create the SwapRequest model for use in our app
module.exports = mongoose.model('SwapRequest', swapRequestSchema);