const mongoose = require('mongoose')

const ApprovedResultSchema = new mongoose.Schema({
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
            hasPractical: {
                type: Boolean,
                required: true,
                default: false
            },
            level: {
                type: Number,
                required: true,
            },
            unit: {
                type: Number,
                required: true
            },
            testScore: {
                type: Number,  
            },
            labScore: {
                type: Number,
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
            gradePoints: {
                type: Number
            },
            remark: {
                type: String,
            },
            schoolOfferingCourse: {
                type: String,
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
    },
    totalGradePoints: {
        type: Number,
        default: 0,
    },
    totalUnits: {
        type: Number,
        default: 0,
    },
    GPA: {
        type: Number,
    },
})

ApprovedResultSchema.pre('save', function (next) {
    // Calculate totalGradePoints and totalUnits before saving
    const courses = this.courses || [];

    const calculatedValues = courses.reduce(
        (acc, course) => {
            if (course.unit) {
                acc.totalGradePoints += course.gradePoints;
                acc.totalUnits += course.unit;
            }
            return acc;
        },
        { totalGradePoints: 0, totalUnits: 0 }
    );

    this.totalGradePoints = calculatedValues.totalGradePoints;
    this.totalUnits = calculatedValues.totalUnits;

    // Calculate GPA
    if (this.totalUnits !== 0) {
        this.GPA = this.totalGradePoints / this.totalUnits;
    } else {
        this.GPA = null; // Handle the case where totalUnits is zero to avoid division by zero
    }

    next();
});

ApprovedResultSchema.set('timestamps', true)

module.exports = mongoose.model('ApprovedResult', ApprovedResultSchema)