const mongoose = require('mongoose')

const StudentClassSchema = new mongoose.Schema({
    className: {
        type: String,
        required: true,
        unique: true
    },
    enrolmentYear: {
        type: Number,
        required: true
    },
    currentLevel: {
        type: Number,
        required: true,
    },
    advisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
    },
    isActive: {
        type: Boolean,
        required: true
    } //Has the class graduated?
})

StudentClassSchema.set('timestamps', true)

StudentClassSchema.plugin(require('mongoose-autopopulate'));

StudentClassSchema.pre('save', async function (next) {
    if (this.currentLevel === 0 || this.currentLevel > 500) {
        this.isActive = false
        if (this.currentLevel > 900) {
            this.currentLevel = 0
        }
    } else if(this.currentLevel > 0 && this.currentLevel <= 500) {
        this.isActive = true;
    }
    next();
});


module.exports = mongoose.model('StudentClass', StudentClassSchema);
