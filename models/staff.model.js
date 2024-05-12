const mongoose = require('mongoose')

const StaffSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    courses: {
        type: [ mongoose.Schema.Types.ObjectId ],
        ref: 'Course',
        required: true,
        default: [],
        autopopulate: true
    },
    staffId: {
        type: String,
        required: true,
        unique: true
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentClass',
    },
    isHOD: {
        type: Boolean,
        required: true,
        default: false,
    },
    isAdvisor: {
        type: Boolean,
        required: true,
        default: false,
    },
    name: {
        type: String,
    },
    title: {
        type: String
    },
    email: {
        type: String,
    },
    phoneNumber: {
        type: String,
    },
    imageURL: {
        type: String,
    },
    sex: {
        type: String,
    },
    address: {
        type: String,
    }
})

StaffSchema.pre('save', async function (next) {
    if (this.isHOD) {
        // If the current staff member is being set as HOD, update all other staff members to not be HOD
        await this.constructor.updateMany({ _id: { $ne: this._id } }, { $set: { isHOD: false } });
    }
    next();
});

StaffSchema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('Staff', StaffSchema)