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
  // Friends list
  friends: [{
    type: String,
    ref: 'User'
  }],
  isOnline: {
    type: Boolean,
    default: false
  },
  // Socket ID for real-time communication
  socketId: {
    type: String,
    default: null
  },
  isBanned: {
    type: Boolean,
    default: false
  }
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