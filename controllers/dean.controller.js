const { startSession } = require('mongoose')

const getGradePoints = require('../utils/grade-points')

const Session = require('../models/session.model')
const Semester = require('../models/semester.model')
const Result = require('../models/result.model')
const ApprovedResult = require('../models/approved-result.model')
const Dean = require('../models/dean.model')
const bcrypt = require('bcrypt')
const User = require('../models/user.model')

const DeanController = {
    //GETS STAFF NAME AND EMAIL FOR THE HEADER
    getDeanNameAndEmail: async(req, res) => {

        try {
            const dean = await Dean.findOne({ userId: req.user.id })
            if (!dean) {
                return res.status(404).json({ info: 'Access denied', message: 'Please log in' })
            }
            return res.status(200).json({
                name: dean.name,
                email: dean.email,
                imageURL: dean.imageURL
            })
        } catch (error) {
            return res.status(500).json(error)
        }
    },

    //GETS ALL THE DETAILS FOR THE DASHBOARD
    getDashboardDetails: async(req, res) => {
        let dashboard = {}
        try {
            const dean = await Dean.findOne({ userId: req.user.id })

            const pendingResults = await Result.find({ isApprovedByHOD: true, isApprovedByDean: false })

            const currentSession = await Session.findOne({ isCurrent: true })
            const currentSemester = await Semester.findOne({ isCurrent: true })

            dashboard.dean = dean
            dashboard.pendingResults = pendingResults.length
            dashboard.currentSession = currentSession.name
            dashboard.currentSemester = currentSemester.name
            
            return res.status(200).json(dashboard)
        } catch (error) {
            console.log(error)
            return res.status(500).json(error)
        }
    },

    //Gets pending results created within the last 6 months
    getPendingResults: async(req, res) => {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        try {
            const results = await Result.find(
                {
                    isApprovedByHOD: true,

                    createdAt: {
                        $gte: sixMonthsAgo,
                        $lt: new Date()
                    }
                },
                { students: 0 }
            ).populate('staffId')

        const briefResults = results.map((result) => {
            return {
                _id: result._id,
                course: result.course.code,
                semester: result.semester,
                session: result.session,
                level: result.level,
                staff: result.staffId.name,
                isApprovedByHOD: result.isApprovedByHOD,
                isApprovedByDean: result.isApprovedByDean,
                updatedAt: result.updatedAt,
            }
        })

        return res.status(200).json(briefResults);
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    //Gets result to display the OGR
    getResultOGR: async(req, res) => {
        const resultId = req.query.resultId
        try {
            const result = await Result.findById(resultId)
            if (!result) {
                return res.status(404).json({ info: 'Not found.', message: 'No result with the requested id found.' })
            }
            return res.status(200).json(result)
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: error });
        }
    },

    //Approves a result
    approveResult: async(req, res) => {
        const mongoSession = await startSession()
        mongoSession.startTransaction()

        const resultId = req.params.id
        try {
            const result = await Result.findById(resultId)

            //GET THE STUDENT FROM THE RESULT
            for (let student of result.students) {
                let approvedResult = await ApprovedResult.findOne({
                    student: student.studentId,
                    year: student.year,
                    session: result.session,
                    semester: result.semester,
                    level: result.level,
                })
                if (approvedResult) {
                    let addedCourse = {
                        code: result.course.code,
                        title: result.course.title,
                        isElective: result.course.isElective,
                        hasPractical: result.course.hasPractical,
                        level: result.course.level,
                        unit: result.course.unit,
                        testScore: student.testScore,
                        labScore: student.labScore,
                        examScore: student.examScore,
                        totalScore: student.totalScore,
                        grade: student.grade,
                        remark: student.remark,
                        gradePoints: getGradePoints(student.grade, result.course.unit)
                    }
                   approvedResult.courses.push(addedCourse)

                   await approvedResult.save()

                } else {
                    let newApprovedResult = new ApprovedResult({
                        student: student.studentId,
                        session: result.session,
                        semester: result.semester,
                        level: result.level,
                        studentClassId: student.studentClassId,
                        year: student.year,
                        courses: [
                            {
                                code: result.course.code,
                                title: result.course.title,
                                isElective: result.course.isElective,
                                hasPractical: result.course.hasPractical,
                                level: result.course.level,
                                unit: result.course.unit,
                                testScore: student.testScore,
                                labScore: student.labScore,
                                examScore: student.examScore,
                                totalScore: student.totalScore,
                                grade: student.grade,
                                remark: student.remark,
                                gradePoints: getGradePoints(student.grade, result.course.unit)
                            }
                        ]
                    })
                    await newApprovedResult.save()
                }
                
            }

            result.isApprovedByDean = true;
            await result.save()
            
            await mongoSession.commitTransaction()
            mongoSession.endSession()
            return res.status(200).json({ success: true, message: 'Result now approved' })

        } catch (error) {
            await mongoSession.abortTransaction()
            mongoSession.endSession()
            console.error(error)
            return res.status(500).json({ error });
        }
    },

    //Disapprove a result
    disapproveResult: async(req, res) => {
        const mongoSession = await startSession()
        mongoSession.startTransaction()

        const resultId = req.params.id
        try {
            const result = await Result.findById(resultId)

            if(!result) {
                return res.status(404).json({ info: 'Not found.', message: 'No result with the requested id found.' })
            }

            for (let student of result.students) {
                let approvedResult = await ApprovedResult.findOne({
                    student: student.studentId,
                    session: result.session,
                    semester: result.semester,
                    level: result.level,
                });

                if (approvedResult) {
                    approvedResult.courses = approvedResult.courses.filter(course => course.code !== result.course.code);

                    if(approvedResult.courses.length) {
                        await approvedResult.save()
                    } else {
                        await ApprovedResult.findByIdAndDelete(approvedResult._id)
                    }
                }
            }

            result.isApprovedByDean = false
            await result.save()

            await mongoSession.commitTransaction()
            mongoSession.endSession()

            return res.status(200).json({ success: true, message: 'Result now disapproved' })
        } catch (error) {
            await mongoSession.abortTransaction()
            mongoSession.endSession()
            console.error(error)
            return res.status(500).json({ error: 'Internal server error' });
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
            const staff = await Dean.findOne({ userId: req.user.id });
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
            const staff = await Dean.findById(staffId);

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
            const staff = await Dean.findById(staffId);
            if (profile.email || profile.phoneNumber) {
                const existingStaff = await Dean.findOne({
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

            await Dean.findByIdAndUpdate(
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


module.exports = DeanController