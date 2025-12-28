const mongoose = require('mongoose');

const friendRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  fromUserId: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  toUserId: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  }
}, { 
  timestamps: true 
});

// Compound index to prevent duplicate requests
friendRequestSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });

// Check if request is pending
friendRequestSchema.methods.isPending = function() {
  return this.status === 'pending';
};

// Accept friend request
friendRequestSchema.methods.accept = async function() {
  this.status = 'accepted';
  return this.save();
};

// Reject friend request
friendRequestSchema.methods.reject = async function() {
  this.status = 'rejected';
  return this.save();
};

// Static: find pending request between two users (either direction)
friendRequestSchema.statics.findPendingBetween = async function(userId1, userId2) {
  return this.findOne({
    $or: [
      { fromUserId: userId1, toUserId: userId2, status: 'pending' },
      { fromUserId: userId2, toUserId: userId1, status: 'pending' }
    ]
  });
};

// Static: check if request exists between users
friendRequestSchema.statics.existsBetween = async function(userId1, userId2) {
  const request = await this.findOne({
    $or: [
      { fromUserId: userId1, toUserId: userId2 },
      { fromUserId: userId2, toUserId: userId1 }
    ],
    status: { $in: ['pending', 'accepted'] }
  });
  return !!request;
};

module.exports = mongoose.model('FriendRequest', friendRequestSchema);
