const mongoose = require('mongoose')

const DeanSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    staffId: {
        type: String,
        required: true,
        unique: true
    },
    school: {
        acronymn: {
            type: String,
            required: true,
            default: 'SICT'
        },
        fullName: {
            type: String,
            required: true,
            default: 'School of Information and Communication Technology'
        }
    },
    name: {
        type: String,
    },
    sex: {
        type: String,
    },
    title: {
        type: String
    },
    email: {
        type: String,
    },
    address: {
        type: String,
    },
    phoneNumber: {
        type: String,
    },
    imageURL: {
        type: String,
    }
})



module.exports = mongoose.model('Dean', DeanSchema)