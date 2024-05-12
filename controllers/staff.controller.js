const Staff = require('../models/staff.model')
const Session = require('../models/session.model')
const Semester = require('../models/semester.model')
const Course = require('../models/course.model')
const Result = require('../models/result.model')
const RegisteredCourse = require('../models/registered-course.model')
const User = require('../models/user.model');
const bcrypt = require('bcrypt')
//Gets the name and email of the staff for the header
const StaffController = {
    getStaffNameAndEmail: async(req, res) => {
        try {
            const staff = await Staff.findOne({ userId: req.user.id })
            if (!staff) {
                return res.status(404).json({ info: 'Access denied', message: 'Please log in' })
            }
            return res.status(200).json({
                name: staff.name,
                email: staff.email,
                imageURL: staff.imageURL
            })
        } catch (error) {
            return res.status(500).json(error)
        }
    },

    //Gets staff dashboard details
    getDashboardDetails: async(req, res) => {
        let dashboard = {}

        try {
            const staff = await Staff.findOne({ userId: req.user.id })
            const currentSession = await Session.findOne({ isCurrent: true })
            const currentSemester = await Semester.findOne({ isCurrent: true })
            const results = await Result.find({ staffId: staff._id })
            //GET OTHER DETAILS ONCE AVAILABLE

            dashboard = {
                staff: staff,
                currentSession: currentSession,
                currentSemester: currentSemester,
                results: results.length
            }
            return res.status(200).json(dashboard)
            
        } catch (error) {
            return res.status(500).json(error)
        }
    },

    //Gets uploaded results history
    getUploadedResultsHistory: async(req, res) => {
        const userId = req.user.id
        try {
            const staff = await Staff.findOne({ userId: userId })
            if (!staff) {
                return res.status(404).json({ info: 'Access denied', message: 'Please log in' })
            }

            const uploadedResults = await Result.find({ staffId: staff._id })
            const sessions = await Session.find()

            return res.status(200).json({
                staff: staff,
                uploadedResults: uploadedResults,
                sessions: sessions
            })
        } catch (error) {
            console.error(error)
            return res.status(500).json(error)
        }
    },

    //Gets all students that registered for a course so as to input their results
    getRegisteredStudents: async(req, res) => {
        const { staffId, session, semester, level, course } = req.query
        const courseCode = course.split('-').join(' ')
        try {
            //Checks if the result to be created already exists
            const existingResult = await Result.findOne({
                staffId: staffId,
                session: session,
                semester: semester,
                level: level,
                'course.code': courseCode
            })
            //Returns the result
            if (existingResult) {
                return res.status(200).json({
                    info: 'Existing result',
                    message: 'The result you are trying to create already exists',
                })
            }

            const registeredStudents = await RegisteredCourse.find({
                session: session,
                semester: semester,
                level: level
            }).populate('student')

            const registeredStudentsForCourse = registeredStudents.filter((record) => {
                return record.courses.some((course) => course.code === courseCode)
            })

            const records = registeredStudentsForCourse.map((record) => {
                return {
                    _id: record.student._id,
                    name: record.student.name,
                    regNumber: record.student.regNumber,
                    year: record.year,
                    classId: {
                        _id: record.student.classId._id
                    }
                }
            })

            const course = await Course.findOne({ code: courseCode })

            return res.status(200).json({ records: records, course: course })

        } catch (error) {
            console.error(error)
            return res.status(500).json(error)
        }
    },
    
    //Saves the entered result
    saveStudentResult: async(req, res) => {
        if (!req.body) {
            return res.status(400).json({
                info: 'Bad request.',
                message: 'No body found with request.'
            })
        }
        try {
            const existingResult = await Result.findOne({
                staffId: req.body.staffId,
                session: req.body.session,
                semester: req.body.semester,
                level: req.body.level,
                course: req.body.course,
            })

            if(existingResult) {
                return res.status(400).json({
                    info: 'Existing result',
                    message: 'Result already saved. Try editing instead'
                })
            }
            const newResult = await Result.create({
                staffId: req.body.staffId,
                session: req.body.session,
                semester: req.body.semester,
                level: req.body.level,
                course: req.body.course,
                isApprovedByHOD: false,
                isApprovedByDead: false,
                students: req.body.students
            })
            return res.status(200).json({
                success: true,
                message: "Result saved successfully",
                result: newResult
            })
        } catch(error) {
            return res.status(500).json(error)
        }
    },

    //Gets the result to populate the OGR
    getResultForOGR: async(req, res) => {
        const { staffId, session, semester, level, course } = req.query
        const courseCode = course.split('-').join(' ')
        try {
            //Checks if the result to be created already exists
            const result = await Result.findOne({
                staffId: staffId,
                session: session,
                semester: semester,
                level: level,
                'course.code': courseCode
            })
            //Returns the result
            if (!result) {
                return res.status(404).json({
                    info: 'Not found',
                    message: 'The result you are does not exist',
                })
            }
            return res.status(200).json(result)

        } catch (error) {
            console.error(error)
            return res.status(500).json(error)
        }
    },

    //Gets an existing resul to edit
    getResultToEdit: async(req, res) => {
        const resultId = req.query.resultId
        try {
            const existingResult = await Result.findById(resultId).lean()
            
            if(!existingResult) {
                return res.status(404).json({
                    info: 'Not found',
                    message: 'Cannot find result to edit.'
                })
            }

            if(existingResult.isApprovedByHOD || existingResult.isApprovedByDean) {
                return res.status(400).json({
                    info: 'Not allowed',
                    message: 'This result has already been approved and can no longer be edited.'
                })
            }
            existingResult.students.sort((a, b) => a.name.localeCompare(b.name))
            return res.status(200).json(existingResult)
        } catch (error) {
            console.error(error)
            return res.status(500).json(error)
        }
    },

    //Saves the edited result
    saveEditedResult: async(req, res) => {
        const result = req.body
        if (!result) {
            return res.status(400).json({
                info: 'Bad request.',
                message: 'No body found with request.'
            })
        }
        try {
            const editedResult = await Result.findByIdAndUpdate(
                result._id,
                { $set: { students: result.students } }
            )
            return res.status(200).json({
                success: true,
                message: "Result saved successfully",
            })
        } catch(error) {
            return res.status(500).json(error)
        }
    },


    //GETS ADVISOR ACCOUNT DETAILS
    getStaffAccount: async (req, res) => {
        try {
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({
                    info: 'Not found',
                    message: 'No user found'
                })
            }
            const staff = await Staff.findOne({ userId: req.user.id });
            return res.status(200).json({
                username: user.username,
                staff: staff
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

        const staffId = req.body.staffId;
        const url = req.body.url;

        if (!staffId || !url) {
            return res.status(404).json({
                info: 'Not found',
                message: 'No staff ID or image URL provided'
            })
        }

        try {
            const staff = await Staff.findById(staffId);

            if (!staff) {
                return res.status(404).json({
                    info: 'Not found',
                    message: 'No staff found'
                })
            }

            staff.imageURL = url;
            await staff.save();

            return res.status(200).json({ imageURL: url })
        } catch (error) {
            console.error(error);
            return res.status(500).json(error);
        }
    },

    //Updates the profile information
    updateProfile: async (req, res) => {
        const staffId = req.query.staffId;
        const profile = req.body.profile;

        if (!staffId || !profile) {
            return res.status(404).json({
                info: 'Not found',
                message: 'No staff ID or profile provided'
            })
        }

        try {
            const staff = await Staff.findById(staffId);
            if (profile.email || profile.phoneNumber) {
                const existingStaff = await Staff.findOne({
                    $or: [
                        { email: profile.email },
                        { phoneNumber: profile.phoneNumber }
                    ],
                    _id: { $ne: staff._id } // Exclude the current student
                });

                if (existingStaff) {
                    return res.status(400).json({
                        info: 'Bad Request',
                        message: 'A user with this email or phone number already exists'
                    })
                }
            }

            await Staff.findByIdAndUpdate(
                staffId,
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

module.exports = StaffController