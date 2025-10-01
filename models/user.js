// We need mongoose to talk to MongoDB
const mongoose = require('mongoose');

// Here's how we define what a user looks like in our database
// Think of this as a template that every user must follow
const userSchema = new mongoose.Schema({
  // Username for logging in - has to be unique so no duplicates!
  username: {
    type: String,
    required: true,
    unique: true, // MongoDB won't let two users have the same username
  },
  
  // We never store actual passwords - only the hashed version for security
  hashedPassword: {
    type: String,
    required: true,
  },
  
  // Their actual name (optional - they can add this later if they want)
  name: {
    type: String,
  },
  
  // Where they're located - helpful for finding local skill swaps
  location: {
    type: String,
  },
  
  // A little bio about themselves (also optional)
  bio: {
    type: String,
  },   
  skillsOffered: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill'
  }],
  skillsWanted: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill'
  }]
}, {
  // This automatically adds createdAt and updatedAt fields - pretty handy!
  timestamps: true,
});

// This is important! When we send user data back to the frontend,
// we never want to accidentally include the password
userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    // Remove the password before sending data anywhere
    delete returnedObject.hashedPassword;
  }
});

// This creates our User model that we can use throughout the app
module.exports = mongoose.model('User', userSchema);
