const mongoose = require('mongoose')

const CourseSchema = new mongoose.Schema({
    semester: {
        type: String,
        required: true,
    },
    isElective: {
        type: Boolean,
        required: true,
        default: false,
    },
    hasPractical: {
        type: Boolean,
        required: true,
        default: false
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    level: {
        type: Number,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    unit: {
        type: Number,
        required: true,
        default: 2,
    },
    description: {
        type: String,
        required: true,
        default: 'A Computer Science course'
    },
    schoolOfferingCourse: {
        type: String,
    }
})

module.exports = mongoose.model('Course', CourseSchema)