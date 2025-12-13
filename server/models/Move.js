const mongoose = require('mongoose');

const moveSchema = new mongoose.Schema({
  moveId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  power: {
    type: Number,
    required: true
  },
  accuracy: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  category: {
    type: String,
    enum: ['physical', 'special', 'status'],
    required: true
  }
}, { timestamps: true });

// Get details
moveSchema.methods.getDetails = async function() {
  return {
    id: this.moveId,
    name: this.name,
    type: this.type,
    power: this.power,
    accuracy: this.accuracy,
    category: this.category
  };
};

module.exports = mongoose.model('Move', moveSchema);
