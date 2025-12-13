const User = require('../models/User');
const Statistics = require('../models/Statistics');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const generateId = require('../utils/generateId');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Store reset codes
const resetCodes = {};

// Generate JWT
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

// Signup (from HEAD)
const signup = async (req, res) => {
    try {
        const { username, email, password, confirmPassword, favoritePokemon } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match!' });
        }

        // Check if email already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Check if username already exists
        user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Create new user with userId
        user = new User({
            userId: generateId('user'),
            username,
            email,
            password,
            favoritePokemon
        });

        await user.save();

        // Create initial statistics
        await Statistics.create({
            statId: generateId('stat'),
            userId: user.userId
        });

        const token = generateToken(user.userId);

        res.status(201).json({ 
            success: true,
            message: 'User created successfully', 
            token,
            user: { 
                userId: user.userId,
                id: user._id, 
                username: user.username, 
                email: user.email,
                avatar: user.avatar,
                bio: user.bio,
                eloRating: user.eloRating,
                favoritePokemon: user.favoritePokemon
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Register (from Lumi-Clone branch)
const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user with userId
        const user = await User.create({
            userId: generateId('user'),
            username,
            email,
            password,
            favoritePokemon: 'Pikachu' // Default value for register endpoint
        });

        // Create initial statistics
        await Statistics.create({
            statId: generateId('stat'),
            userId: user.userId
        });

        // Generate token
        const token = generateToken(user.userId);

        res.status(201).json({
            success: true,
            token,
            user: {
                userId: user.userId,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                bio: user.bio,
                eloRating: user.eloRating
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Login (merged from both)
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'No account found. Please sign up.' });
        }

        // Try both password comparison methods for compatibility
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Password is incorrect.' });
        }

        // Update online status
        user.isOnline = true;
        await user.save();

        const token = generateToken(user.userId);

        res.json({ 
            success: true,
            message: 'Login successful',
            token,
            user: { 
                userId: user.userId,
                id: user._id, 
                username: user.username, 
                email: user.email,
                avatar: user.avatar,
                bio: user.bio,
                eloRating: user.eloRating
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Logout (from Lumi-Clone branch)
const logout = async (req, res) => {
    try {
        req.user.isOnline = false;
        await req.user.save();
        
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Forgot Password (from HEAD)
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Email not found' });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        resetCodes[email] = { code, createdAt: Date.now() };

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Code - Pokemon Login',
            html: `<h2>Password Reset Request</h2><p>Your code: <strong>${code}</strong></p><p>Expires in 10 minutes</p>`
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: 'Code sent to email' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Verify Code (from HEAD)
const verifyCode = async (req, res) => {
    try {
        const { email, code, favoritePokemon } = req.body;

        if (!resetCodes[email]) {
            return res.status(400).json({ error: 'Code expired or not found' });
        }

        const { code: storedCode, createdAt } = resetCodes[email];
        const isExpired = Date.now() - createdAt > 10 * 60 * 1000;

        if (isExpired) {
            delete resetCodes[email];
            return res.status(400).json({ error: 'Code expired' });
        }

        if (storedCode !== code) {
            return res.status(400).json({ error: 'Invalid code' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        if (user.favoritePokemon && favoritePokemon && 
            user.favoritePokemon.toLowerCase() !== favoritePokemon.toLowerCase()) {
            return res.status(400).json({ error: 'Favorite Pokemon does not match' });
        }

        res.json({ message: 'Code verified successfully' });
    } catch (error) {
        console.error('Verify code error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Reset Password (from HEAD)
const resetPassword = async (req, res) => {
    try {
        const { email, password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        user.password = password;
        await user.save();

        delete resetCodes[email];

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    signup,
    register,
    login,
    logout,
    forgotPassword,
    verifyCode,
    resetPassword
};