const mongoose = require('mongoose')

const SummaryResultSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    studentClassId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentClass',
        required: true,
    },
    summary: [
        {
            level: {
                type: Number
            },
            semester: {
                type: String
            },
            TGP: {
                type: Number
            },
            TNU: {
                type: Number
            },
            GPA: {
                type: Number
            }
        }
    ]
})

SummaryResultSchema.set('timestamps', true)

module.exports = mongoose.model('SummaryResult', SummaryResultSchema)