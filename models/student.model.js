const mongoose = require('mongoose')

const StudentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentClass',
        required: true,
        autopopulate: true
    },
    regNumber: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
    },
    email: {
        type: String,
    },
    phoneNumber: {
        type: String,
    },
    entryMode: {
        type: String,
    },
    dateOfBirth: {
        type: String,
    },
    sex: {
        type: String,
    },
    nationality: {
        type: String,
    },
    stateOfOrigin: {
        type: String,
    },
    imageURL: {
        type: String,
    },
    isAllowed27units: [
        {
            session: {
                type: String,
            },
            semester: {
                type: String,
            },
            isAllowed: {
                type: Boolean,
            }
        }
    ]
})

StudentSchema.plugin(require('mongoose-autopopulate'));


module.exports = mongoose.model('Student', StudentSchema)