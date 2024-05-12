const mongoose = require('mongoose')

const AdminSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        default: 'admin'
    },
    email: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    imageURL: {
        type: String,
    },
})

module.exports = mongoose.model('Admin', AdminSchema)