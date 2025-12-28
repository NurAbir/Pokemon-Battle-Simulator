const mongoose = require('mongoose');

const abilitySchema = new mongoose.Schema({
  abilityId: {
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
  }
}, { timestamps: true });

// Get details
abilitySchema.methods.getDetails = async function() {
  return {
    id: this.abilityId,
    name: this.name,
    description: this.description
  };
};

module.exports = mongoose.model('Ability', abilitySchema);