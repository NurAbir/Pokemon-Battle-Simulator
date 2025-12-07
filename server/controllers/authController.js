const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
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

const signup = async (req, res) => {
    try {
        const { username, email, password, confirmPassword, favoritePokemon } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match!' });
        }

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        user = new User({
            username,
            email,
            password,
            favoritePokemon
        });

        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ 
            message: 'User created successfully', 
            token,
            user: { id: user._id, username: user.username, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'No account found. Please sign up.' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Password is incorrect.' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ 
            message: 'Login successful',
            token,
            user: { id: user._id, username: user.username, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

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
        res.status(500).json({ error: error.message });
    }
};

const verifyCode = async (req, res) => {
    try {
        const { email, code, favoritePokemon } = req.body;

        if (!resetCodes[email]) {
            return res.status(400).json({ error: 'Code expired' });
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
        if (user.favoritePokemon.toLowerCase() !== favoritePokemon.toLowerCase()) {
            return res.status(400).json({ error: 'Favorite Pokemon does not match' });
        }

        res.json({ message: 'Code verified' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        const user = await User.findOne({ email });
        user.password = password;
        await user.save();

        delete resetCodes[email];

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    signup,
    login,
    forgotPassword,
    verifyCode,
    resetPassword
};