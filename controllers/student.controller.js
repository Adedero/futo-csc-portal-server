const Student = require('../models/student.model')
const Staff = require('../models/staff.model')
const Session = require('../models/session.model')
const Semester = require('../models/semester.model')
const Course = require('../models/course.model')
const CourseRegStatus = require('../models/course-reg-status.model')
const Level = require('../models/level.model')
const RegisteredCourse = require('../models/registered-course.model')
const ApprovedResult = require('../models/approved-result.model')
const User = require('../models/user.model')
const bcrypt = require('bcrypt')


const StudentController = {
    getStudentNameAndEmail: async (req, res) => {
        try {
            const student = await Student.findOne({ userId: req.user.id })
            if (!student) {
                return res.status(404).json({ info: 'Access denied', message: 'Please log in' })
            }
            return res.status(200).json({
                name: student.name,
                email: student.email,
                imageURL: student.imageURL
            })
        } catch (error) {
            return res.status(500).json(error)
        }
    },

    //GET DASHBOARD DETAILS
    getDashboardDetails: async (req, res) => {
        let dashboard = {}

        try {
            const student = await Student.findOne({ userId: req.user.id })

            if (!student) {
                return res.status(404).json({ info: 'Access denied', message: 'Please log in' })
            }

            const advisor = await Staff.findOne({
                isAdvisor: true,
                classId: student.classId._id
            })

            const currentSession = await Session.findOne({ isCurrent: true })

            const currentSemester = await Semester.findOne({ isCurrent: true })

            
            const registeredCourses = await RegisteredCourse.find({ student: student._id })
            let totalCourses = 0
            registeredCourses.forEach(record => {
                totalCourses += record.courses.length
            })

            const results = await ApprovedResult.find(
                { student: student._id },
                { session: 1, semester: 1, level: 1, totalUnits: 1, totalGradePoints: 1, GPA: 1 }
                )
            let TNU = 0
            let TGP = 0
            results.forEach(result => {
                TNU += result.totalUnits;
                TGP += result.totalGradePoints;
            })
            let GPA = 0

            if (TNU && TGP) {
                GPA = TGP / TNU
            }
            //GET OTHER DETAILS ONCE AVAILABLE

            dashboard = {
                registeredCourses: totalCourses,
                totalResults: results.length,
                results: results,
                GPA: GPA,
                student: student,
                advisor: advisor.name,
                currentSession: currentSession,
                currentSemester: currentSemester,
            }

            return res.status(200).json(dashboard)

        } catch (error) {
            return res.status(500).json(error)
        }
    },

    //GET COURSE REGISTRATION STATUS AND COURSE REGISTRATION HISTORY

    getCourseRegistrationStatus: async (req, res) => {
        const userId = req.user.id

        try {
            const student = await Student.findOne({ userId: userId })

            if (!student) {
                return res.status(404).json({ info: 'Access denied', message: 'Please log in' })
            }

            const studentClass = student.classId
            const courseRegStatus = await CourseRegStatus.findOne({ name: "courseRegistrationStatus" })
            const courseRegHistory = await RegisteredCourse.find(
                { student: student._id },
                { session: 1, semester: 1, level: 1 }
            )

            const currentSemester = await Semester.findOne({ isCurrent: true })

            const semesterCourses = await Course.find({
                semester: currentSemester.name,
                level: student.classId.currentLevel
            })


            const details = {
                studentClass: studentClass,
                courseRegStatus: courseRegStatus,
                history: courseRegHistory,
                semesterCourses: semesterCourses
            }

            return res.status(200).json(details)
        } catch (error) {
            return res.status(500).json(error)
        }
    },

    //GET COURSES TO REGISTER
    getCoursesToRegister: async (req, res) => {
        const userId = req.user.id
        const sessionId = req.query.sessionId
        const semester = req.query.semester
        const level = req.query.level

        try {
            const student = await Student.findOne({ userId: userId })

            const currentSession = await Session.findOne({ isCurrent: true })

            const year = 1 + currentSession.startYear - student.classId.enrolmentYear

            const courseRegStatus = await CourseRegStatus.findOne({ name: "courseRegistrationStatus" })
            const session = await Session.findById(sessionId)

            const isSessionAvailable = courseRegStatus.openSession.some((item) => item.name === session.name)
            const isSemesterAvailable = courseRegStatus.openSemester.some((item) => item.name === semester)
            const isLevelAvailable = courseRegStatus.openLevel.some((item) => item.name == level) || student.classId.currentLevel == level

            if (!isSessionAvailable) {
                return res.status(400).json({ info: 'Not Available', message: 'Course registration is not available for the chosen session' })
            }
            if (!isSemesterAvailable) {
                return res.status(400).json({ info: 'Not Available', message: 'Course registration is not available for the chosen semester' })
            }
            if (!isLevelAvailable) {
                return res.status(400).json({ info: 'Not Available', message: 'Course registration is not available for the chosen level' })
            }

            const courses = await Course.find({ semester: semester, level: level })
            const levelDetails = await Level.findOne({ name: level })

            return res.status(200).json({ courses: courses, session: session, level: levelDetails, year: year })
        } catch (error) {
            return res.status(500).json(error)
        }
    },

    //REGISTER COURSES
    registerCourses: async (req, res) => {
        const userId = req.user.id;

        try {
            const student = await Student.findOne({ userId: userId });

            if (!student) {
                return res.status(404).json({ success: false, info: 'Access denied', message: 'Please log in' });
            }

            const existingCourseReg = await RegisteredCourse.findOne({
                student: student._id,
                session: req.body.session,
                semester: req.body.semester,
                level: req.body.level,
                year: req.body.year,
            });

            if (existingCourseReg) {
                const updatedCourseReg = await RegisteredCourse.findByIdAndUpdate(existingCourseReg._id, req.body, { new: true });
                return res.status(200).json({ success: true, courseReg: updatedCourseReg });
            }

            const registeredCourses = await RegisteredCourse.create({
                student: student._id,
                courses: req.body.courses,
                studentClassId: student.classId._id,
                session: req.body.session,
                semester: req.body.semester,
                level: req.body.level,
                year: req.body.year,
                totalUnits: req.body.totalUnits,
            })

            return res.status(200).json({ success: true, courseReg: registeredCourses });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    },

    //GETS THE COURSE REGISTRATION DETAILS TO DISPLAY AND PRINT
    getCourseRegistrationDetails: async (req, res) => {

        const courseRegId = req.params.id

        try {
            const courseRegDetails = await RegisteredCourse.findById(courseRegId).populate('student')

            if (!courseRegDetails) {
                return res.status(404).json({ info: 'Not found', message: 'Could not find details of registered courses' })
            }
            return res.status(200).json(courseRegDetails)
        } catch (error) {
            return res.status(500).json(error)
        }
    },

    //GETS COURSES FROM A PARTICULAR LEVEL FOR THE STUDENT TO BORROW
    getCoursesToBorrow: async (req, res) => {
        const { level, semester } = req.query
        console.log(semester)
        console.log(level)
        try {
            const courses = await Course.find({ level: level, semester: semester })
            if (!courses.length) {
                return res.status(404).json({ info: 'Not found', message: 'Cannot find any courses for this level' })
            }
            return res.status(200).json(courses)
        } catch (error) {
            return res.status(500).json(error)
        }
    },

    //GETS LIST OF RESULTS FOR STUDENT
    getListOfResults: async (req, res) => {
        try {
            const student = await Student.findOne({ userId: req.user.id })
            let results = await ApprovedResult.find({ student: student._id }).lean()
            if (!results.length) {
                return res.status(404).json({
                    info: 'Not found',
                    message: 'No approved results found'
                })
            }
            results = results.map(result => {
                return {
                    _id: result._id,
                    session: result.session,
                    semester: result.semester,
                    level: result.level,
                    courses: result.courses.length,
                    GPA: result.GPA,
                    timestamp: result.updatedAt
                }
            })
            return res.status(200).json(results)
        } catch (error) {
            console.error(error)
            return res.status(500).json(error)
        }
    },

    //GETS A SINGLE RESULT FOR THE STUDENT TO VIEW
    getSingleResult: async (req, res) => {
        const resultId = req.query.id;
        try {
            const result = await ApprovedResult.findById(resultId).populate('student');
            if (!result) {
                return res.status(404).json({
                    info: 'Not found',
                    message: 'No approved results found'
                });
            }
            return res.status(200).json(result);
        } catch (error) {
            console.error(error);
            return res.status(500).json(error);
        }
    },

    //GETS STUDENT ACCOUNT DETAILS
    getStudentAccount: async (req, res) => {
        try {
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({
                    info: 'Not found',
                    message: 'No user found'
                })
            }
            const student = await Student.findOne({ userId: req.user.id });
            return res.status(200).json({
                username: user.username,
                student: student
            })
        } catch (error) {
            console.error(error);
            return res.status(500).json(error);
        }
    },

    //CHANGE USERNAME
    changeUsername: async (req, res) => {
        let username = req.query.username.trim();

        try {
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({
                    info: 'Not found',
                    message: 'No user found'
                })
            }
            const existingUser = await User.findOne({ username: username });
            if (existingUser) {
                return res.status(400).json({
                    info: 'Bad Request',
                    message: 'Username already exists'
                })
            }
            user.username = username;
            await user.save();
            return res.status(200).json({ username: user.username })
        } catch (error) {
            console.error(error);
            return res.status(500).json(error);
        }
    },

    uploadProfilePicture: async (req, res) => {

        const studentId = req.body.studentId;
        const url = req.body.url;


        if (!studentId || !url) {
            return res.status(404).json({
                info: 'Not found',
                message: 'No student ID or image URL provided'
            })
        }

        try {
            const student = await Student.findById(studentId);

            if (!student) {
                return res.status(404).json({
                    info: 'Not found',
                    message: 'No student found'
                })
            }

            student.imageURL = url;
            await student.save();

            return res.status(200).json({ imageURL: url })
        } catch (error) {
            console.error(error);
            return res.status(500).json(error);
        }
    },

    //Updates the profile information
    updateProfile: async (req, res) => {
        const studentId = req.query.studentId;
        const profile = req.body.profile;

        if (!studentId || !profile) {
            return res.status(404).json({
                info: 'Not found',
                message: 'No student ID or profile provided'
            })
        }

        try {
            const student = await Student.findById(studentId);
            if (profile.email || profile.phoneNumber) {
                const existingStudent = await Student.findOne({
                    $or: [
                        { email: profile.email },
                        { phoneNumber: profile.phoneNumber }
                    ],
                    _id: { $ne: student._id } // Exclude the current student
                });

                if (existingStudent) {
                    return res.status(400).json({
                        info: 'Bad Request',
                        message: 'A user with this email or phone number already exists'
                    })
                }
            }

            await Student.findByIdAndUpdate(
                studentId,
                { $set: profile },
                { new: true }
            )
            return res.status(200).json({
                info: 'Success',
                message: 'Profile updated'
            })
        } catch (error) {
            console.error(error);
            return res.status(500).json(error);
        }
    },

    //Changes Password
    changePassword: async (req, res) => {
        const password = req.body.password;
        console.log(password)
        let oldPassword = password.old.trim();
        let newPassword = password.newP.trim();
        let confirmPassword = password.confirm.trim();

        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                info: 'Bad request',
                message: 'No password provided'
            })
        }

        if (confirmPassword !== newPassword) {
            return res.status(400).json({
                info: 'Bad request',
                message: 'Passwords do not match'
            })
        }
        try {
            const user = await User.findById(req.user.id)
            if (!user) {
                return res.status(404).json({
                    info: 'Not found',
                    message: 'No user found'
                })
            }
            const validPassword = await bcrypt.compare(oldPassword, user.password)
            if (!validPassword) {
                return res.status(400).json({
                    info: 'Failed',
                    message: 'Wrong password'
                })
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10)
            user.password = hashedPassword
            await user.save();
            return res.status(200).json({
                info: 'Success',
                message: 'Password changed'
            })
        } catch (error) {
            console.error(error)
            return res.status(500).json(error)
        }
    },
}
module.exports = StudentController