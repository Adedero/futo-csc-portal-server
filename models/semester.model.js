const mongoose = require('mongoose')

const SemesterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function (value) {
                return value === 'RAIN' || value === 'HARMATTAN';
            },
            message: 'Name should only be "RAIN" or "HARMATTAN"',
        },
    },
    isCurrent: {
        type: Boolean,
        required: true,
        default: false,
    }
})


SemesterSchema.pre('save', async function (next) {
    if (this.isCurrent) {
        // If the current semester is being set to true, update all other semesters to false
        await this.constructor.updateMany({ _id: { $ne: this._id } }, { $set: { isCurrent: false } });
    }
    next();
});


module.exports = mongoose.model('Semester', SemesterSchema)