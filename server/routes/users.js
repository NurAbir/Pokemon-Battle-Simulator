/* routes/users.js */
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// --- 1. GET Random User (Must be defined BEFORE /:id routes) ---
router.get('/random', async (req, res) => {
  try {
    // MongoDB's $sample operator picks a random document efficiently
    const randomUser = await User.aggregate([{ $sample: { size: 1 } }]);
    
    if (!randomUser || randomUser.length === 0) {
      return res.status(404).json({ message: "No users found in database" });
    }

    // Aggregate returns an array, send the first item
    res.json(randomUser[0]); 
  } catch (err) {
    console.error("Random fetch error:", err);
    res.status(500).json({ message: err.message });
  }
});

// --- 2. GET All Users ---
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- 3. POST Report User ---
router.post('/:id/report', async (req, res) => {
  try {
    const { id } = req.params; 
    const { reportedBy } = req.body;

    let user;
    
    // 1. Check if the ID looks like a valid MongoDB ObjectId (the long hex string)
    if (id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
        // If it looks like an ObjectId, query by the default MongoDB _id
        user = await User.findById(id); 
    } else {
        // Fallback: Query by the custom 'id: Number' field
        user = await User.findOne({ id: parseInt(id) });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found in DB' });
    }

    // Add report logic
    user.reportedBy.push(reportedBy || "Anonymous");
    user.status = 'suspicious'; // Auto-flag as suspicious
    
    await user.save();
    
    res.json({ success: true, user });
  } catch (err) {
    console.error("Report error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 4. POST Dismiss Report / Set Status Safe (NEW) ---
router.post('/:id/dismiss', async (req, res) => {
  try {
    const { id } = req.params;
    // Find user by MongoDB _id and update status to 'safe' and clear reports
    const user = await User.findByIdAndUpdate(
      id,
      { $set: { status: 'safe', reportedBy: [] } },
      { new: true } // Return the updated document
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Dismiss failed:", err);
    res.status(500).json({ message: err.message });
  }
});

// --- 5. DELETE User (Ban) (NEW) ---
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let user;
    
    // FIX: Add logic to search by either MongoDB _id (string) or custom numerical id (number)
    if (id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
        // Option 1: Delete by MongoDB _id (string)
        user = await User.findByIdAndDelete(id); 
    } else {
        // Option 2: Delete by the custom 'id: Number' field
        user = await User.findOneAndDelete({ id: parseInt(id) });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found or already banned" });
    }

    res.json({ message: "User banned successfully", user });
  } catch (err) {
    console.error("User ban failed:", err);
    // Gracefully handle internal errors
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;