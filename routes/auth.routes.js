const express = require('express')
const router = express.Router()
const passport = require('../config/passport.config')
const User = require('../models/user.model');
const AuthController = require('../controllers/auth.controller')
const bcrypt = require('bcrypt')


//Special route to  create a new user

router.post('/register', async (req, res) => {
    try {
        const existingUser = await User.findOne({ username: req.body.username })
        if (existingUser) {
            return res.status(400).json({ message: 'A user with that username already exists. Please login instead.' })
        }
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        const newUser = await User.create({
            username: req.body.username,
            password: hashedPassword,
            role: req.body.role
        })
        return res.status(200).json(newUser)
    } catch (error) {
        return res.status(500).json(error)
    }
})

router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return res.status(500).json({ message: 'Authentication failed', err })
        if (!user) return res.status(401).json({ message: 'Authentication failed', info })

        req.logIn(user, (err) => {
            if (err) return res.status(500).json({ message: 'Authentication failed', err })

            return res.status(200).json({ message: 'Authentication successful', user: { id: user._id, username: user.username, role: user.role } });

        });
    })(req, res, next);
})


router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed', error: err });
        }
        return res.status(200).json({ message: 'Logout successful' });
    });
})

//Verify identity for password reset
router.post('/verify-identity', AuthController.verifyIdentity);

//Resend email
router.post('/resend-email', AuthController.resendEmail);

//Verify token
router.get('/verify-token', AuthController.verifyToken);

//Reset password
router.put('/reset-password', AuthController.resetPassword);

module.exports = router