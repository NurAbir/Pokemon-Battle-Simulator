const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  itemId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  effect: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Get details
itemSchema.methods.getDetails = async function() {
  return {
    id: this.itemId,
    name: this.name,
    description: this.description,
    effect: this.effect
  };
};

module.exports = mongoose.model('Item', itemSchema);