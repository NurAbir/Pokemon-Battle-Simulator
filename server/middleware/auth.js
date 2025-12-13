const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findOne({ userId: decoded.userId }).select('-password');
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = async (req, res, next) => {
  const Admin = require('../models/Admin');
  const adminUser = await Admin.findOne({ userId: req.user.userId });
  
  if (!adminUser) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  next();
};

module.exports = { protect, admin };