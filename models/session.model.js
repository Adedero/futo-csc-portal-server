const mongoose = require('mongoose')

const SessionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    startYear: {
        type: Number,
    },
    currentYear: {
        type: Number,
    },
    isCurrent: {
        type: Boolean,
        required: true,
        default: true
    }
})

SessionSchema.pre('save', async function (next) {
    if (this.isCurrent) {
        // If the current session is being set to true, update all other sessions to false
        await this.constructor.updateMany({ _id: { $ne: this._id } }, { $set: { isCurrent: false } });
    }
    next();
});



module.exports = mongoose.model('Session', SessionSchema)