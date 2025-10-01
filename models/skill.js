// We need mongoose to interact with our database
const mongoose = require('mongoose');

// This defines what a skill looks like in our database
// Skills can be things people offer OR things they want to learn
const skillSchema = new mongoose.Schema({
  // Every skill belongs to a user - this connects them
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // This tells MongoDB it's connected to a User
    required: true,
  },
  
  // What's the actual skill? Like "Guitar lessons" or "Web development"
  skillName: {
    type: String,
    required: true,
  },
  
  // We organize skills into categories to make browsing easier
  category: {
    type: String,
    required: true,
    enum: [ // Only these categories are allowed
      'Technology', 'Arts & Crafts', 'Music', 'Languages', 'Sports & Fitness',
      'Cooking', 'Business', 'Writing', 'Photography', 'Gardening',
      'Repair & Maintenance', 'Teaching', 'Health & Wellness', 'Other'
    ],
  },
  
  // How good is someone at this skill?
  skillLevel: {
    type: String,
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
  },
  
  // How much time would this skill exchange take?
  timeFrame: {
    type: String,
    enum: ['','1-2 hours', '3-5 hours', '1 day', '2-3 days', '1 week', '2+ weeks', 'Ongoing'],
  },
  
  // More details about what this skill involves
  description: {
    type: String,
  },
  
  // Is this something they can teach or something they want to learn?
  type: {
    type: String,
    required: true,
    enum: ['offered', 'wanted'],
  },
  
  // Instead of deleting skills, we just mark them as inactive
  // This way if someone has a pending swap request, it won't break
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  // Track when skills are created and updated
  timestamps: true,
});

// Create the Skill model that we'll use in our controllers
module.exports = mongoose.model('Skill', skillSchema);