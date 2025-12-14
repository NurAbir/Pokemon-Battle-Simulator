const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  id: Number,
  username: String,
  status: { type: String, enum: ['safe', 'suspicious'], default: 'safe' },
  activity: String,
  ping: Number,
  avatar: String,
  reportedBy: [String],
  reportData: {
    Wins: Number,
    Losses: Number,
    ELO: String,
    Playtime: String,
    Joined: Date
  }
});

module.exports = mongoose.model('User', UserSchema);
