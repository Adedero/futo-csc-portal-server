const mongoose = require('mongoose')

const CourseRegStatusSchema = new mongoose.Schema({
    name: {
        type: String,
        default: 'courseRegistrationStatus'
    },
    isOpen: {
        type: Boolean,
        required: true,
    },
    openSession: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Session',
        required: true,
        autopopulate: true,
    },
    openSemester: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Semester',
        required: true,
        autopopulate: true,
    },
    openLevel: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Level',
        required: true,
        autopopulate: true,
    }
})

CourseRegStatusSchema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('CourseRegStatus', CourseRegStatusSchema)