const mongoose = require('mongoose')

const LevelSchema = new mongoose.Schema({
    name: {
        type: Number,
        required: true,
        unique: true
    },
    harmattanMinCreditUnits: {
        type: Number,
        required: true,
    },
    harmattanMaxCreditUnits: {
        type: Number,
        required: true,
    },
    rainMinCreditUnits: {
        type: Number,
        required: true,
    },
    rainMaxCreditUnits: {
        type: Number,
        required: true,
    },
    extendedCreditUnits: {
        type: Number,
        required: true,
    }
})

module.exports = mongoose.model('Level', LevelSchema)