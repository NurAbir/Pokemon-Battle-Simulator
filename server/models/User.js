const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  favoritePokemon: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    default: ''
  },
  eloRating: {
    type: Number,
    default: 1000
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  status: { type: String, enum: ['safe', 'suspicious', 'battling'], default: 'safe' },
  activity: String,
  reportedBy: [String],
  isBanned: {
    type: Boolean,
    default: false
  },
isAdmin: {
    type: Boolean,
    default: false
  },
  // Friends list - array of userId strings
  friends: [{
    type: String,
    ref: 'User'
  }]
}, { timestamps: true });

// Hash password before saving - NO NEXT NEEDED
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Alias method for compatibility (matchPassword = comparePassword)
userSchema.methods.matchPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);