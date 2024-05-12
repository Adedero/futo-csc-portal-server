const mongoose = require('mongoose')

const RegisteredCourseSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    courses: [
        {
            code: {
                type: String,
                required: true,
            },
            title: {
                type: String,
                required: true,
            },
            isElective: {
                type: Boolean,
                required: true,
                default: false,
            },
            unit: {
                type: Number,
                required: true
            }  
        }
    ],
    studentClassId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentClass',
        required: true,
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
    year: {
        type: Number,
        required: true,
    },
    totalUnits: {
        type: Number,
        required: true,
    }
})

RegisteredCourseSchema.set('timestamps', true)

RegisteredCourseSchema.plugin(require('mongoose-autopopulate'))

module.exports = mongoose.model('RegisteredCourse', RegisteredCourseSchema)