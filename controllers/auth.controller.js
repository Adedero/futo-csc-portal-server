require('dotenv').config();

const User = require('../models/user.model');
const Staff = require('../models/staff.model');
const Student = require('../models/student.model');
const Dean = require('../models/dean.model');
const Admin = require('../models/admin.model');
const bcrypt = require('bcrypt');
const Token = require("../models/token.model");
const sendEmail = require("../utils/mailer");
const crypto = require("crypto");


const AuthController = {
    resetPassword: async(req, res) => {
        const { password, confirmPassword, userId, token } = req.body;
        if (!password ||!confirmPassword ||!userId ||!token) {
            return res.status(400).json({
                info: 'Bad request.',
                message: 'Failed to reset password. Please try again.'
            })
        }

        if (confirmPassword !== password) {
            return res.status(400).json({
                info: 'Bad request.',
                message: 'Passwords do not match.'
            })
        }

        try {
            const verifiedToken = await Token.findOne({ userId: userId, token: token });
            if (!verifiedToken) {
                return res.status(400).json({
                    info: 'Bad request.',
                    message: 'Expired or invalid token. Please request for a new token to continue your request.'
                })
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    info: 'Not found.',
                    message: 'The requested account does not exist. Please visit the administrator for help.'
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
            await user.save();

            return res.status(200).json({
                info: 'Success',
                message: 'Password changed'
            })
        } catch (error) {
            console.error(error);
            return res.status(500).json(error)
        }
    },

    verifyToken: async(req, res) => {
        const { userId, token } = req.query;
        if (!userId || !token) {
            return res.status(400).json({
                info: 'Bad request.',
                message: 'No user Id or token provided.'
            })
        }
        const validToken = await Token.findOne({ userId: userId, token: token });
        if (!validToken) {
            return res.status(400).json({
                info: 'Bad request.',
                message: 'Expired or invalid token.'
            })
        }
        return res.status(200).json({
            info: 'Success',
            message: 'Token successfully validated',
            token: validToken.token,
            userId: validToken.userId,
        })
    }, 

    mail: async(user) => {
        try {
            let id = user.userId.id
            let token = await Token.findOne({ userId: id });
            if (!token) {
                token = await new Token({
                    userId: id,
                    token: crypto.randomBytes(32).toString("hex"),
                }).save();
            }
            const text = `Your password reset token: ${token.token}`;
            await sendEmail(user.email, "Password reset", text);
        } catch (error) {
            console.error(error);
            return
        }
    }, 

    resendEmail: async(req, res) => {
        const { userId, email } = req.body;
        if (!userId || !email) {
            return res.status(400).json({
                info: 'Bad request.',
                message: 'No user Id or email provided.'
            })
        }
        try {
            let token = await Token.findOne({ userId: userId });
            if (!token) {
                token = await new Token({
                    userId: userId,
                    token: crypto.randomBytes(32).toString("hex"),
                }).save();
            }
            const text = `Your password reset token: ${token.token}`;
            await sendEmail(email, "Password reset", text);
            return res.status(200).json({
                info: 'Success',
                message: 'Email resent. Please check your email for your password reset token'
            })
        } catch (error) {
            console.error(error);
            return
        }
    },
    
    verifyIdentity: async (req, res) => {
        const identifier = req.query.identifier;

        try {
            const [user, admin, dean, staff, student] = await Promise.all([
                User.findOne({ username: identifier }).exec(),
                Admin.findOne({ staffId: identifier }).populate('userId').exec(),
                Dean.findOne({ staffId: identifier }).populate('userId').exec(),
                Staff.findOne({ staffId: identifier }).populate('userId').exec(),
                Student.findOne({ regNumber: identifier }).populate('userId').exec(),
            ])

            if (user) {
                const role = user.role;
                if (role === 'ADMIN') {
                    const admin = await Admin.findOne({ userId: user._id }).populate('userId');
                    if (!admin || !admin.email) {
                        return res.status(403).json({
                            info: 'Invalid email',
                            message: 'No email address was found for this account. Please contact a logged in administrator to complete your password recovery.'
                        })
                    }
                    AuthController.mail(admin);
                    return res.status(200).json({
                        userId: admin.userId._id,
                        username: admin.userId.username,
                        email: admin.email,
                        message: 'Please check your email for your password reset token.'
                    })
                }

                if (role === 'DEAN') {
                    const dean = await Dean.findOne({ userId: user._id }).populate('userId');
                    if (!dean || !dean.email) {
                        return res.status(403).json({
                            info: 'Invalid email',
                            message: 'No email address was found for this account. Please contact the administrator to complete your password recovery.'
                        })
                    }
                    AuthController.mail(dean);
                    return res.status(200).json({
                        userId: dean.userId._id,
                        username: dean.userId.username,
                        email: dean.email,
                        message: 'Please check your email for your password reset token.'
                    })
                }

                if (role === 'STAFF') {
                    const staff = await Staff.findOne({ userId: user._id }).populate('userId');
                    if (!staff || !staff.email) {
                        return res.status(403).json({
                            info: 'Invalid email',
                            message: 'No email address was found for this account. Please contact the administrator to complete your password recovery.'
                        })
                    }
                    AuthController.mail(staff);
                    return res.status(200).json({
                        userId: staff.userId._id,
                        username: staff.userId.username,
                        email: staff.email,
                        message: 'Please check your email for your password reset token.'
                    })
                }

                if (role === 'STUDENT') {
                    const student = await Student.findOne({ userId: user._id }).populate('userId');
                    if (!student || !student.email) {
                        return res.status(403).json({
                            info: 'Invalid email',
                            message: 'No email address was found for this account. Please contact the administrator to complete your password recovery.'
                        })
                    }
                    AuthController.mail(student);
                    return res.status(200).json({
                        userId: student.userId._id,
                        username: student.userId.username,
                        email: student.email,
                        message: 'Please check your email for your password reset token.'
                    })
                }
            }

            if (admin) {
                if (!admin.email) {
                    return res.status(403).json({
                        info: 'Invalid email',
                        message: 'No email address was found for this account. Please contact the administrator to complete your password recovery.'
                    })
                }
                AuthController.mail(admin);
                return res.status(200).json({
                    userId: admin.userId._id,
                    username: admin.userId.username,
                    email: admin.email,
                    message: 'Please check your email for your password reset token.'
                })
            }

            if (dean) {
                if (!dean.email) {
                    return res.status(403).json({
                        info: 'Invalid email',
                        message: 'No email address was found for this account. Please contact the administrator to complete your password recovery.'
                    })
                }
                AuthController.mail(dean);
                return res.status(200).json({
                    userId: dean.userId._id,
                    username: dean.userId.username,
                    email: dean.email,
                    message: 'Please check your email for your password reset token.'
                })
            }

            if (staff) {
                if (!staff.email) {
                    return res.status(403).json({
                        info: 'Invalid email',
                        message: 'No email address was found for this account. Please contact the administrator to complete your password recovery.'
                    })
                }
                AuthController.mail(staff);
                return res.status(200).json({
                    userId: staff.userId._id,
                    username: staff.userId.username,
                    email: staff.email,
                    message: 'Please check your email for your password reset token.'
                })
            }

            if (student) {
                if (!student.email) {
                    return res.status(403).json({
                        info: 'Invalid email',
                        message: 'No email address was found for this account. Please contact the administrator to complete your password recovery.'
                    })
                }
                AuthController.mail(student);
                return res.status(200).json({
                    userId: student.userId._id,
                    username: student.userId.username,
                    email: student.email,
                    message: 'Please check your email for your password reset token.'
                })
            }

            return res.status(404).json({
                info: 'Not found.',
                message: 'No account found for the given request. Please contact the administrator.'
            })
        } catch (error) {
            console.error(error);
            return res.status(500).json(error);
        }
    }
}

module.exports = AuthController