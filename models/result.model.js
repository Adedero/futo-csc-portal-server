const mongoose = require('mongoose')

const ResultSchema = new mongoose.Schema({
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: true,
    },
    course: {
        code: {
            type: String,
        },
        title: {
            type: String,
        },
        unit: {
            type: Number,
        },
        level: {
            type: Number,
        },
        isElective: {
            type: Boolean,
        },
        hasPractical: {
            type: Boolean,
        },
        schoolOfferingCourse: {
            type: String,
        }
    },
    session: {
        type: String,
        required: true,
    },
    semester: {
        type: String,
        required: true,
    },
    level: {
        type: Number,
        required: true,
    },
    isApprovedByHOD: {
        type: Boolean,
        required: true,
        default: false
    },
    isApprovedByDean: {
        type: Boolean,
        required: true,
        default: false
    },
    students: [
        {   
            studentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Student',
            },
            studentClassId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'StudentClass',
            },
            regNumber: {
                type: String,
            },
            name: {
                type: String
            },
            testScore: {
                type: Number,
            },
            labScore: {
                type: Number
            },
            examScore: {
                type: Number,
            },
            totalScore: {
                type: Number,
            },
            grade: {
                type: String,
            },
            remark: {
                type: String,
            },
            year: {
                type: Number
            }
        }
    ]
})

ResultSchema.set('timestamps', true)

//ResultSchema.plugin(require('mongoose-autopopulate'))

module.exports = mongoose.model('Result', ResultSchema)