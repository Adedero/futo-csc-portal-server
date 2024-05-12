const mongoose = require('mongoose')

const ClassListSchema = new mongoose.Schema({
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentClass',
        required: true,
    },
    filename: {
        type: String,
    },
    data: {
        type: Buffer
    }
})

module.exports = mongoose.model('ClassList', ClassListSchema)