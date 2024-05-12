const { startSession } = require('mongoose')

const User = require('../models/user.model')
const Staff = require('../models/staff.model')
const Session = require('../models/session.model')
const Semester = require('../models/semester.model')
const Result = require('../models/result.model')
const Course = require('../models/course.model')
const StudentClass = require('../models/student-class.model')
const Student = require('../models/student.model')
const bcrypt = require('bcrypt')

const HODController = {
    //GETS STAFF NAME AND EMAIL FOR THE HEADER
    getHODNameAndEmail: async(req, res) => {

        try {
            const staff = await Staff.findOne({ userId: req.user.id })
            if (!staff) {
                return res.status(404).json({ info: 'Access denied', message: 'Please log in' })
            }
            if (!staff.isHOD) {
                return res.status(400).json({ info: 'Access denied', message: 'No HOD account found' })
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

    //GETS ALL THE DETAILS FOR THE DASHBOARD
    getDashboardDetails: async(req, res) => {
        let dashboard = {}
        try {
            const [ HOD, staffs, pendingResults, students, currentSession, currentSemester ] = await Promise.all([
                Staff.findOne({ userId: req.user.id, isHOD: true }).exec(),
                Staff.find().populate('classId').exec(),
                Result.find({ isApprovedByHOD: false }).exec(),
                Student.find().exec(),
                Session.findOne({ isCurrent: true }).exec(),
                Semester.findOne({ isCurrent: true }).exec(),
            ])
            const advisors = staffs.filter(staff => staff.isAdvisor)
            dashboard.HOD = HOD
            dashboard.advisors = advisors
            dashboard.staffs = staffs.length
            dashboard.pendingResults = pendingResults.length
            dashboard.students = students.length
            dashboard.currentSession = currentSession.name
            dashboard.currentSemester = currentSemester.name
            
            return res.status(200).json(dashboard)
        } catch (error) {
            console.log(error)
            return res.status(500).json(error)
        }
    },

    //GETS ALL STAFF FOR THE H.O.D
    getAllStaff: async(req, res) => {
        try {
            const staffs = await Staff.find(
                { isHOD: false },
                { courses: 0, staffId: 1, name: 1, imageURL: 1, isAdvisor: 1 }
            )
            return res.status(200).json(staffs)
        } catch (error) {
            return res.status(500).json(error)
        }
    },

    //GETS ALL THE DETAILS FOR THE STAFF PROFILE
    getStaffProfile: async(req, res) => {
        try {
            const staff = await Staff.findById(req.params.id).populate('classId')
            if (!staff) {
                return res.status(404).json({ info: 'Not found.', message: 'No staff with the requested id found.' })
            }
            //const courses = await Course.find({ schoolOfferingCourse: 'SICT' })
            const courses = await Course.find(
                {},
                { code: 1 }
            )
            const classes = await StudentClass.find({ isActive: true })
            return res.status(200).json({
                staff: staff,
                courses: courses,
                classes: classes
            })
        } catch (error) {
            return res.status(500).json({ error: 'Internal Server Error' })
        }
    },

    //CHANGES THE COURSES ASSIGNED TO A STAFF
    changeStaffCourses: async(req, res) => {
        const staffId = req.params.id
        try {
            const updatedStaff = await Staff.findByIdAndUpdate(staffId, { $set: { courses: req.body.courses } }, { new: true})

            if (!updatedStaff) {
                return res.status(400).json({ info: 'Not found', message: `Could not find the staff with ID ${staffId}.` })
            }
            return res.status(200).json({ success: true, message: "Staff courses updated successfully", newCourses: updatedStaff.courses })
        } catch (error) {
            return res.status(500).json({ error: error})
        }
    },

    //Remove all courses of a staff
    removeAllCourses: async(req, res) => {
        const staffId = req.params.id
        try {
            await Staff.findByIdAndUpdate(staffId, { $set: { courses: [] } })
            return res.status(200).json({ success: true, message: "All courses removed" })
        } catch (error) {
            return res.status(500).json({ error: error})
        }
    },

    //Removes a staff as an advisor
    removeStaffAsAdvisor: async(req, res) => {
        const staffId = req.params.id
        try {        
            const staff = await Staff.findByIdAndUpdate(
                staffId,
                { $set: { isAdvisor: false, classId: null } },
                { new: true }
            )
            await StudentClass.findOneAndUpdate(
                { advisor: staffId },
                { $set: { advisor: null } }
            )
            await User.findByIdAndUpdate(
                staff.userId,
                { $set: { role: 'STAFF' } }
            )
            return res.status(200).json({
                success: true,
                message: "Staff removed as an advisor",
            })
        } catch (error) {
            return res.status(500).json({ 'Internal Server Error': error})
        }
    },

    //Creates a new advisor and assigns them a class
    createNewAdvisor: async(req, res) => {
        /*
            process:
            1) First, check if a staff already an advisor to the class
            2) If true, set isAdvisor to false, and remove classId from staff
            3) Then, Set staff.isAdvisor = true for new advisor
            4) Set staff.classId to id of class
            5) Update advisor for class
        */
        const staffId = req.params.id
        const classId = req.body.classId

        const session = await startSession()
        session.startTransaction()

        try {            
            const studentClass = await StudentClass.findById(classId)
            //Find the old class advisor and change their details
            const oldAdvisor = await Staff.findOne({ classId: studentClass._id })
            if (oldAdvisor) {
                oldAdvisor.isAdvisor = false
                oldAdvisor.classId = null
                await oldAdvisor.save()

                await User.findByIdAndUpdate(
                    oldAdvisor.userId,
                    { $set: { role: 'STAFF' } }
                )

                studentClass.advisor = null
            }

            const newAdvisor = await Staff.findById(staffId)

            if (newAdvisor.isAdvisor) {
                //Update their former class by removing them as advisor
                await StudentClass.findOneAndUpdate(
                    { advisor: newAdvisor._id },
                    { $set: { advisor: null } }
                )
            }

            newAdvisor.classId = studentClass._id
            newAdvisor.isAdvisor = true

            await newAdvisor.save()

            await User.findByIdAndUpdate(
                newAdvisor.userId,
                { $set: { role: 'ADVISOR' } }
            )

            studentClass.advisor = newAdvisor._id

            await studentClass.save()

            await session.commitTransaction()
            session.endSession()

            return res.status(200).json({
                success: true,
                newAdvisor: newAdvisor,
            })
            
        } catch (error) {
            await session.abortTransaction()
            session.endSession()
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
        const resultId = req.params.id
        try {
            await Result.findByIdAndUpdate(
                resultId,
                { $set: { isApprovedByHOD: true } },
                { new: true }
            )
            return res.status(200).json({ success: true, message: 'Result now approved' })
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    //Disapprove a result
    disapproveResult: async(req, res) => {
        const resultId = req.params.id
        try {
            const result = await Result.findById(resultId)

            if(result && result.isApprovedByDean) {
                return res.status(400).json({
                    info: 'Approved by Dean',
                    message: 'Result has already been approved by the Dean. To disapprove, the Dean must first withraw approval.'
                })
            }
            await Result.findByIdAndUpdate(
                resultId,
                { $set: { isApprovedByHOD: false } },
                { new: true }
            )
            return res.status(200).json({ success: true, message: 'Result now disapproved' })
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    //Gets course allocation details
    getCourseAllocation: async(req, res) => {
        try {
            let [currentSession, currentSemester, staffs] = await Promise.all([
                Session.findOne({ isCurrent: true }).lean(),
                Semester.findOne({ isCurrent: true }).lean(),
                Staff.find({ courses: { $exists: true, $ne: [] } }, { name: 1, courses: 1 }).populate('courses').lean()
            ]);

            if (!currentSession || !currentSemester) {
                return res.status(400).json({
                    info: 'Missing details',
                    message: 'Could not find current session and semester'
                });
            }

            staffs.forEach((staff) => {
                staff.courses = staff.courses.map((course) => {
                    return {
                        code: course.code,
                        title: course.title,
                        level: course.level,
                    }
                })
            })
        
            return res.status(200).json({
                currentSession,
                currentSemester,
                staffs
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error });
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
            const staff = await Staff.findOne({ userId: req.user.id, isHOD: true });
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


module.exports = HODController