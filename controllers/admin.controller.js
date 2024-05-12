const { startSession } = require('mongoose')

const User = require('../models/user.model')
const StudentClass = require('../models/student-class.model')
const Student = require('../models/student.model')
const Course = require('../models/course.model')
const Staff = require('../models/staff.model')
const Session = require('../models/session.model')
const Semester = require('../models/semester.model')
const CourseRegStatus = require('../models/course-reg-status.model')
const Admin = require('../models/admin.model')
const RegisteredCourse = require('../models/registered-course.model')
const ClassList = require('../models/class-list.model')
const Result = require('../models/result.model')
const Level = require('../models/level.model')
const bcrypt = require('bcrypt')
const ApprovedResult = require('../models/approved-result.model')
const Dean = require('../models/dean.model');

const excelToJson = require('convert-excel-to-json');
const normalizeName = require('../utils/normalize-name')
const xlsx = require('xlsx')

const AdminController = {
    //CLASS APIs
    
    //GET ADMIN NAME AND EMAIL FOR THE HEADER
    getAdminNameAndEmail: async(req, res) => {
        try {
            const admin = await Admin.findOne({ userId: req.user.id })
            if (!admin) {
                return res.status(404).json({ info: 'Access denied', message: 'Please log in' })
            }
            return res.status(200).json({
                name: admin.name,
                email: admin.email
            })
        } catch (error) {
            return res.status(500).json(error)
        }
    },

    //GET DETAILS FOR ADMIN DASHBOARD
    getDashboardDetails: async(req, res) => {
        let dashboard = {}
        try {
            const admin = await Admin.findOne({ userId: req.user.id })
            if (!admin) {
                return res.status(400).json({ info: 'Access denied', message: 'Please log in' })
            }
            const classes = await StudentClass.find()
            const students = await Student.find()
            const courses = await Course.find()
            const staffs = await Staff.find()
            let advisors = staffs.filter((staff) => staff.isAdvisor)
            let HOD = staffs.find((staff) => staff.isHOD)


            const currentSession = await Session.findOne({ isCurrent: true })
            
            const currentSemester = await Semester.findOne({ isCurrent: true })

            const courseReg = await CourseRegStatus.find()

            const courseRegStatus = courseReg[0].isOpen

            dashboard.admin = admin
            dashboard.classes = classes.length
            dashboard.students = students.length
            dashboard.courses = courses.length
            dashboard.staffs = staffs.length
            dashboard.advisors = advisors.length
            dashboard.hod = HOD.name
            dashboard.currentSession = currentSession.name
            dashboard.currentSemester = currentSemester.name
            dashboard.courseRegStatus = courseRegStatus
            
            return res.status(200).json(dashboard)
        } catch (error) {
            console.log(error)
            return res.status(500).json(error)
        }
    },

    //STAFF APIs
    //GET ALL STAFF
    getAllStaff: async(req, res) => {
        try {
            const staff = await Staff.find()
            return res.status(200).json(staff)
        } catch (error) {
            return res.status(500).json(error)
        }
    },

    //Create staff
    createStaff: async(req, res) => {
        const session = await startSession()
        try {
            const existingStaff = await Staff.findOne({ userId: req.body.staffId })

            if (existingStaff) {
                return res.status(400).json({ info: 'Duplicate user', message: 'A staff with this ID already exists.' })
            }

            //Check for duplicate email
            
            if (req.body.email) {
                const existingStaffEmail = await Staff.findOne({ email: req.body.email })
                if (existingStaffEmail) {
                    return res.status(400).json({ info: 'Duplicate user', message: 'A staff with this email already exists.' })
                }
            }

            //Check for duplicate phone number 

            if (req.body.phoneNumber) {
                const existingStaffPhone = await Staff.findOne({ phoneNumber: req.body.phoneNumber })
                if (existingStaffPhone) {
                    return res.status(400).json({ info: 'Duplicate user', message: 'A staff with this phone number already exists.' })
                }
            }

            //Then, create a new user
            
            if (!req.body.username) {
                return res.status(400).json({ info: 'Invalid input', message: 'Username cannot be null or undefined.' });
            }

            const existingUser = await User.findOne({ username: req.body.username })
            if (existingUser) {
                return res.status(400).json({ info: 'Duplicate user', message: 'A staff with this username already exists.' })
            }

            session.startTransaction()

            const hashedPassword = await bcrypt.hash(req.body.password, 10)

            const newUser = await User.create({
                username: req.body.username,
                password: hashedPassword,
                role: req.body.role.toUpperCase()
            })

            const newStaff = await Staff.create({
                userId: newUser._id,
                courses: req.body.courses,
                staffId: req.body.staffId,
                isAdvisor: false,
                isHOD: false,
                name: req.body.name,
                title: req.body.title,
                email: req.body.email,
                phoneNumber: req.body.phoneNumber
            })

            await session.commitTransaction()
            session.endSession()

            return res.status(200).json({ success: true, message: "Staff added successfully", staff: newStaff });

        } catch (error) {
            await session.abortTransaction()
            session.endSession()
            
            console.error(error);
            return res.status(500).json(error)
        }
    },
    //Get staff details for profile
    getStaffDetails: async(req, res) => {
        const staffId = req.params.id

        try {
            const staff = await Staff.findById(staffId).populate('classId')
            const results = await Result.find({ staffId: staffId })
            const username = await User.findById(staff.userId, { username: 1 })
            return res.status(200).json({
                staff: staff,
                resultsUploaded: results,
                username: username
            })
        } catch (error) {
            return res.status(500).json(error)
        }
    },

    deleteStaff: async(req, res) => {
        const userId = req.params.id
        try {
            const deletedUser = await User.findByIdAndDelete(userId)
            const deletedStaff = await Staff.findOneAndDelete({ userId: userId})
            return res.status(200).json({ success: true, message: "Staff deleted successfully", staff: deletedStaff })
        } catch (error) {
            return res.status(500).json({ error: error})
        }
    },

    //Change course(s) of a staff
    changeStaffCourse: async(req, res) => {
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

    //Gets result to create OGR
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

    //Resets staff login to their staffId
    resetStaffLogin: async(req, res) => {
        const staffId = req.params.id
        try {
            const staff = await Staff.findById(staffId).populate('userId')
    
            if (!staff) {
                return res.status(400).json({ info: 'Not found', message: `Could not find the staff with ID ${staffId}.` })
            }

            const hashedPassword = await bcrypt.hash(staff.staffId, 10)

            const updatedUser = await User.findByIdAndUpdate(
                staff.userId._id,
                { $set: { username: staff.staffId, password: hashedPassword } },
                { new: true}
            )

            return res.status(200).json({ success: true, message: 'Login details reset successfully', username: updatedUser.username })
        } catch (error) {
            return res.status(500).json(error)
        }
    },



    //Create-student
    createStudent: async(req, res) => {
        const session = await startSession()
        try {
            //First confirm the class actually exists
            const studentClass = await StudentClass.findOne({ className: req.body.className })

            if (!studentClass) {
                return res.status(400).json({ info: 'Not found', message: `Could not find the student class named ${req.body.className}.` })
            }

            //Check if the student exists
            const existingStudent = await Student.findOne({ regNumber: req.params.regNumber })
            if (existingStudent) {
                return res.status(400).json({ info: 'Duplicate user', message: 'A student with this regNumber already exists.' })
            }

            //Check for duplicate email
            
            if (req.body.email) {
                const existingStudentEmail = await Student.findOne({ email: req.body.email })
                if (existingStudentEmail) {
                    return res.status(400).json({ info: 'Duplicate user', message: 'A student with this email already exists.' })
                }
            }

            //Check for duplicate phone number 

            if (req.body.phoneNumber) {
                const existingStudentPhone = await Student.findOne({ phoneNumber: req.body.phoneNumber })
                if (existingStudentPhone) {
                    return res.status(400).json({ info: 'Duplicate user', message: 'A student with this phone number already exists.' })
                }
            }

            //Then, create a new user
            
            if (!req.body.username) {
                return res.status(400).json({ info: 'Invalid input', message: 'Username cannot be null or undefined.' });
            }

            const existingUser = await User.findOne({ username: req.body.username })
            if (existingUser) {
                return res.status(400).json({ info: 'Duplicate user', message: 'A student with this username already exists.' })
            }

            const hashedPassword = await bcrypt.hash(req.body.password, 10)

            session.startTransaction()

            const newUser = await User.create({
                username: req.body.username,
                password: hashedPassword,
                role: req.body.role.toUpperCase()
            })
            
            const { regNumber, entryMode, name, email, phoneNumber, dateOfBirth, nationality, sex, stateOfOrigin } = req.body
            const newStudent = await Student.create({
                userId: newUser._id,
                classId: studentClass._id,
                regNumber: regNumber,
                entryMode: entryMode,
                name: name,
                email: email,
                phoneNumber: phoneNumber,
                dateOfBirth: dateOfBirth,
                nationality: nationality,
                sex: sex,
                stateOfOrigin: stateOfOrigin
            })

            await session.commitTransaction()
            session.endSession()

            return res.status(200).json({ success: true, message: "Student added successfully", student: newStudent });
          
        } catch (error) {
            await session.abortTransaction()
            session.endSession()
            console.error(error);
            return res.status(500).json(error)
        }
    },

    searchStudentsByCriteria: async(req, res) => {
        const criteria = req.query.criteria
        let searchCriteria = ['Name', 'Reg. Number']

        if (!searchCriteria.includes(criteria)) {
            return res.status(400).json({ info: 'Invalid input', message: 'Search criteria must be either "Name" or "Reg. Number"' })
        }

        if (criteria === searchCriteria[0]) {
            const students = await Student.find({
                name: { $regex: req.query.value, $options: 'i' } // Case-insensitive search
            });
            return res.status(200).json(students)

        } else if (criteria === searchCriteria[1]) {
            const students = await Student.find({ regNumber: req.query.value })
            return res.status(200).json(students)
        }
    },

    //Delete student
    deleteStudent: async(req, res) => {
        const userId = req.params.id
        try {
            const deletedUser = await User.findByIdAndDelete(userId)
            const deletedStudent = await Student.findOneAndDelete({ userId: userId})
            const deletedRegistrations = await RegisteredCourse.findOneAndDelete({ student: deletedStudent._id })
            return res.status(200).json({ success: true, message: "Student deleted successfully", student: deletedStudent })
        } catch (error) {
            return res.status(500).json({ error: error})
        }
    },

    //Resets student username and password to the regNumber
    resetStudentLogin: async(req, res) => {
        const studentId = req.params.id
        try {
            const student = await Student.findById(studentId).populate('userId')
    
            if (!student) {
                return res.status(400).json({ info: 'Not found', message: `Could not find the student with ID ${studentId}.` })
            }

            const hashedPassword = await bcrypt.hash(student.regNumber, 10)

            const updatedUser = await User.findByIdAndUpdate(
                student.userId._id,
                { $set: { username: student.regNumber, password: hashedPassword } },
                { new: true}
            )

            return res.status(200).json({ success: true, message: 'Login details reset successfully', username: updatedUser.username })
        } catch (error) {
            return res.status(500).json(error)
        }
    },



    //Get all students
    getAllStudents: async(req, res) => {
        let skipAmount = req.query.skip
        let limitAmount = req.query.limit
        try {
            const students = await Student.find().sort({ name: 1 }).skip(skipAmount).limit(limitAmount)
            console.log(students.length)
            return res.status(200).json(students)
        } catch (error) {
            return res.status(500).json(error)
        }
    },

     //GETS STUDENT'S DETAILS TO DISPLAY ON PROFILE
    //LATER , FIND A WAY TO GET STUDENT CGPA TO ADD
    getStudentDetails: async(req, res) => {
        const studentId = req.params.id

        try {
            const student = await Student.findById(studentId)
            const advisor = await Staff.findOne({ isAdvisor: true, classId: student.classId })
            const registeredCourses = await RegisteredCourse.find({ student: studentId })
            const username = await User.findById(student.userId, { username: 1 })

            const results = await ApprovedResult.find({ student: studentId })

            let CGPA = 0, TGP = 0, TNU = 0

            results.forEach(result => {
                TGP += result.totalGradePoints;
                TNU += result.totalUnits;
            })

            CGPA = TNU !== 0 ? TGP / TNU : 0

            return res.status(200).json({
                student: student,
                username: username,
                advisor: advisor,
                registeredCourses: registeredCourses,
                CGPA: CGPA
            })
        } catch (error) {
            return res.status(500).json(error)
        }
    },

    //GETS COURSE REG DETAILS OF A STUDENT BY SESSION
    getStudentCourseRegistrationDetails: async(req, res) => {
        const studentId = req.query.studentId
        const session = req.query.session
        
        try {
            const courseRegDetails = await RegisteredCourse.find({
                student: studentId,
                session: session
            }).populate('student')
            
            if (!courseRegDetails) {
                return res.status(404).json({ info: 'Not found', message: 'Could not find details of registered courses' })
            }
            return res.status(200).json(courseRegDetails)
        } catch (error) {
            return res.status(500).json(error)
        }
    },

    //GET ALL STUDENT CLASSES
    getAllClasses: async(req, res) => {
        try {
            const classes = await StudentClass.find()
            return res.status(200).json(classes)
        } catch (error) {
            return res.status(500).json(error)
        }
    },

    createStudentClass: async(req, res) => {
        try {
            const existingClass = await StudentClass.findOne({ className: req.body.className })
            if (existingClass) {
                return res.status(400).json({ message: 'A class with that name already exists. Please use a different name.'})
            }

            const newClass = await StudentClass.create({
                className: req.body.className,
                enrolmentYear: req.body.enrolmentYear,
                currentLevel: req.body.currentLevel,
                createdAt: Date.now(),
            })

            return res.status(200).json(newClass)
        } catch (error) {
            return res.status(500).json(error)
        }
    },


    //@COURSES ROUTES
    //GET ALL COURSES
    getAllCourses: async(req, res) => {
        try {
            const courses = await Course.find()
            return res.status(200).json(courses)
        } catch (error) {
            return res.status(500).json(error)
        }
    },

    //ADD A COURSE
    createCourse: async(req, res) => {
        try {
            const existingCourse = await Course.findOne({ code: req.body.code })
            if (existingCourse) {
                return res.status(400).json({ info: 'Duplicate course', message: 'A course with this course code already exists.'})
            }

            const newCourse = await Course.create({
                semester: req.body.semester,
                schoolOfferingCourse: req.body.schoolOfferingCourse,
                isElective: req.body.isElective,
                hasPractical: req.body.hasPractical,
                code: req.body.code,
                level: req.body.level,
                title: req.body.title,
                unit: req.body.unit,
                description: req.body.description
            })

            return res.status(200).json({ success: true, message: "Course added successfully", course: newCourse });

        } catch (error) {
            return res.status(500).json(error)
        }
    },

    editCourse: async(req, res) => {
        try {
        // Check for duplicate course code excluding the current course being edited
            const existingCourse = await Course.findOne({ code: req.body.code, _id: { $ne: req.params.id } });

            if (existingCourse) {
                return res.status(400).json({
                    info: 'Duplicate course',
                    message: 'A course with this course code already exists.',
                });
            }

            // Update the course using findByIdAndUpdate
            const updatedCourse = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });

            return res.status(200).json({
                success: true,
                message: 'Course updated successfully',
                course: updatedCourse,
            });
        } catch (error) {
            return res.status(500).json(error);
        }
    },

    //DELETE A COURSE
    deleteCourse: async(req, res) => {
        //There might be need to also delete this course from the staff document
        const courseId = req.params.id
        try {
            const deletedCourse = await Course.findByIdAndDelete(courseId)
            return res.status(200).json({ success: true, message: "Course deleted successfully", course: deletedCourse })
        } catch (error) {
            return res.status(500).json({ error: error})
        }
    },


    //CLASSES APIs
    //Gets list of classes and staff for admin classes main page
    getClassesAndStaff: async(req, res) => {
        try {
            const staff = await Staff.find(
                {},
                { name: 1, isAdvisor: 1, courses: 0 })
            const studentClasses = await StudentClass.find().populate('advisor')
            /* const studentClasses = await StudentClass.aggregate([
                {
                    $lookup: {
                    from: 'Staff', // Assuming 'staff' is the name of the collection containing advisors
                    localField: 'advisor', // Field in StudentClass
                    foreignField: '_id', // Field in the 'staff' collection
                    as: 'advisorData'
                    }
                },
                {
                    $unwind: '$advisorData'
                },
                {
                    $project: {
                    'advisorData.name': 1,
                    'advisorData.courses': 0,
                    // Add more fields to include or exclude as needed
                    }
                }
            ]); */

            return res.status(200).json({ staff: staff, studentClasses: studentClasses })
        } catch (error) {
            return res.status(500).json(error)
        }
    },


    //Adds a new class and assigns a class advisor
    addClassAndAssignAdvisor: async(req, res) => {
        const session = await startSession()
        try {
            const existingClass = await StudentClass.findOne({
                $or: [
                    { className: req.body.className },
                    { currentLevel: req.body.currentLevel }
                ]
            })

            if (existingClass && existingClass.currentLevel != 0) {
                return res.status(400).json({ 
                    info: 'Duplicate record.',
                    message: `A class named ${ existingClass.className } or currently in ${ existingClass.currentLevel } already exists.`
                })
            }

            session.startTransaction()

            if (!req.body.staffId || req.body.staffId === null) {
                const newClass = await StudentClass.create({
                    className: req.body.className,
                    enrolmentYear: req.body.enrolmentYear,
                    currentLevel: req.body.currentLevel,
                    isActive: req.body.isActive,
                    advisor: null,
                })

                await session.commitTransaction()
                session.endSession()

                return res.status(200).json({
                    success: true,
                    message: 'Student class created successfully',
                    newClass: newClass
                })
            }

            const staff = await Staff.findById(req.body.staffId)
            //Checks if the staff is an advisor. If truem remove then from the class document
            if (staff.isAdvisor) {
                //Updates their former class by removing the advisor
                await StudentClass.findOneAndUpdate(
                    { advisor: staff._id },
                    { $set: { advisor: null } }
                )
            } else {
                //Updates their user role
                await User.findByIdAndUpdate(
                    staff.userId,
                    { $set: { role: 'ADVISOR' } },
                )
            }

            //Create a new class 
            const newClass = await StudentClass.create({
                className: req.body.className,
                enrolmentYear: req.body.enrolmentYear,
                currentLevel: req.body.currentLevel,
                isActive: req.body.isActive,
                advisor: staff._id,
            })
            //Update the selected advisor to have the correct classId and isadvisor = true
            const updatedAdvisor = await Staff.findByIdAndUpdate(
                staff._id,
                { $set: { classId: newClass._id, isAdvisor: true } },
                { new: true }
            )
        
            await session.commitTransaction()
            session.endSession()

            return res.status(200).json({
                success: true,
                message: 'Student class created successfully',
                newClass: newClass
            })
        } catch (error) {
            await session.abortTransaction()
            session.endSession()
            return res.status(500).json(error)
        }
    },

    //Get class profile
    getClassProfile: async(req, res) => {
        try {
            const studentClass = await StudentClass.findById(req.params.id).populate('advisor')
            const students = await Student.find(
                { classId: req.params.id },
                { classId: 0, name: 1, regNumber: 1, imageURL: 1 }
            )
            const staff = await Staff.find(
                {},
                { name: 1, staffId: 1, isAdvisor: 1, courses: 0 }
            )
            //In future all include the image url
            return res.status(200).json({
                studentClass: studentClass,
                students: students,
                staff: staff
            })
        } catch (error) {
            return res.status(500).json(error)
        }
    },

    //Changes the class advisor from the class profile
    changeClassAdvisor: async(req, res) => {
        const session = await startSession()
        session.startTransaction()

        try {            
            const studentClass = await StudentClass.findById(req.body.classId)
            //Find the old class advisor and change their details
            const oldAdvisor = await Staff.findOne({ classId: studentClass._id })
            if (oldAdvisor) {
                 const updatedOldAdvisor = await Staff.findOneAndUpdate(
                    { classId: req.body.classId },
                    { $set: { classId: null, isAdvisor: false } }
                )

                await User.findByIdAndUpdate(
                    oldAdvisor.userId,
                    { $set: { role: 'STAFF' } }
                )
            }

            const newAdvisor = await Staff.findById(req.body.staffId)

            if (newAdvisor.isAdvisor) {
                //Update their former class by removing them as advisor
                await StudentClass.findOneAndUpdate(
                    { advisor: newAdvisor._id },
                    { $set: { advisor: null } }
                )
            }

            const newUpdatedAdvisor = await Staff.findByIdAndUpdate(
                newAdvisor._id,
                { $set: { classId: studentClass._id, isAdvisor: true } },
                { new: true }
            )

            await User.findByIdAndUpdate(
                newUpdatedAdvisor.userId,
                { $set: { role: 'ADVISOR' } }
            )

            const updatedStudentClass = await StudentClass.findByIdAndUpdate(
                req.body.classId,
                { $set: { advisor: newAdvisor._id } },
            )

            await session.commitTransaction()
            session.endSession()

            return res.status(200).json({
                success: true,
                message: 'Class advisor changed successfully',
                newAdvisor: newUpdatedAdvisor,
            })
            
        } catch (error) {
            await session.abortTransaction()
            session.endSession()
            return res.status(500).json(error)
        }          
    },

    //Updates class details
    updateClassDetails: async(req, res) => {

        try {
            // Check for duplicate class names or current levels
            const existingClass = await StudentClass.findOne({
                $or: [
                    { className: req.body.className },
                    { currentLevel: req.body.currentLevel },
                ],
                _id: { $ne: req.params.id }, // Exclude the current class being updated
            });

            // If a duplicate class is found, return a 400 response
            if (existingClass && existingClass.currentLevel != 0) {
                return res.status(400).json({
                    info: 'Duplicate class.',
                    message: `A class named ${existingClass.className} or currently in ${existingClass.currentLevel} already exists.`,
                });
            }

            const updatedClass = await StudentClass.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true }
            );

            await updatedClass.save()

            return res.status(200).json({
                success: true,
                message: 'Class updated successfully',
                updatedClass: updatedClass,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json(error);
        }
    },

    //Adds a student from the class profile
    addStudentFromClass: async(req, res) => {
        const session = await startSession()
        try {
            
            //Check if the student already exists
            const existingStudent = await Student.findOne({ regNumber: req.body.regNumber })
            if (existingStudent) {
                return res.status(400).json({ info: 'Duplicate user', message: 'A student with this regNumber already exists.' })
            }

            //Check for duplicate email
            
            if (req.body.email !== '' && req.body.email !== null) {
                const existingStudentEmail = await Student.findOne({ email: req.body.email })
                if (existingStudentEmail) {
                    return res.status(400).json({ info: 'Duplicate user', message: 'A student with this email already exists.' })
                }
            }

            //Check for duplicate phone number 

            if (req.body.phoneNumber !== '' && req.body.phoneNumber !== null) {
                const existingStudentPhone = await Student.findOne({ phoneNumber: req.body.phoneNumber })
                if (existingStudentPhone) {
                    return res.status(400).json({ info: 'Duplicate user', message: 'A student with this phone number already exists.' })
                }
            }

            //Then, create a new user
            
            if (!req.body.username) {
                return res.status(400).json({ info: 'Invalid input', message: 'Username cannot be null or undefined.' });
            }

            const existingUser = await User.findOne({ username: req.body.username })
            if (existingUser) {
                return res.status(400).json({ info: 'Duplicate user', message: 'A student with this username already exists.' })
            }

            const hashedPassword = await bcrypt.hash(req.body.password, 10)

            session.startTransaction()

            const newUser = await User.create({
                username: req.body.username,
                password: hashedPassword,
                role: req.body.role.toUpperCase()
            })
            

            const newStudent = await Student.create({
                userId: newUser._id,
                classId: req.body.classId,
                regNumber: req.body.regNumber,
                entryMode: req.body.entryMode,
                name: req.body.name,
                email: req.body.email,
                phoneNumber: req.body.phoneNumber
            })

            await session.commitTransaction()
            session.endSession()

            return res.status(200).json({ success: true, message: "Student added successfully", newStudent: newStudent });
          
        } catch (error) {
            await session.abortTransaction()
            session.endSession()
            console.error(error);
            return res.status(500).json(error)
        }
    },

    //Uploads class list to generate student accounts and save class list
    uploadClassList: async(req, res) => {

        if (!req.file) {
            return res.status(400).json({ info: 'Invalid input', message: 'No file uploaded.' });
        }
        const session = await startSession()

        const classId = req.params.classId

        let result = excelToJson({
            source: req.file.buffer,
            header: {
                rows: 1
            },
            sheets: ['Sheet1'],
            columnToKey: {
                A: 'serialNumber',
                B: 'fullName',
                C: 'regNumber'
            }
        });

        let classList = result.Sheet1.map((student) => {
            return {
                name: normalizeName(student.fullName),
                regNumber: student.regNumber.toString()
            }
        })

        try {
            session.startTransaction();

            //Save the excelfile to the database first
            const existingClassList = await ClassList.findOne({ classId: classId })

            if (existingClassList) {
                const updatedClassList = await ClassList.findOneAndUpdate(
                    { classId: classId },
                    { $set: { data: req.file.buffer } },
                    { new: true }
                )
            } else {
                const newClassList = await ClassList.create({
                    classId: classId,
                    filename: `classlist-${classId}`,
                    data: req.file.buffer
                })
            }

            let duplicateStudents = [];
            let addedStudents = [];

            for (const student of classList) {

                const existingStudent = await Student.findOne({ regNumber: student.regNumber });

                if (existingStudent) {
                    duplicateStudents.push(student);
                    continue;
                }

                const existingUser = await User.findOne({ username: student.regNumber });

                if (existingUser) {
                    duplicateStudents.push(student);
                    continue;
                }

                let hashedPassword;
                try {
                    hashedPassword = await bcrypt.hash(student.regNumber, 10);
                } catch (hashError) {
                    console.error('Error hashing password:', hashError);
                    continue;
                }

                let newUser;
                try {
                    newUser = await User.create({
                        username: student.regNumber,
                        password: hashedPassword,
                        role: 'STUDENT',
                    });
                } catch (userCreationError) {
                    console.error('Error creating user:', userCreationError);
                    continue;
                }

                try {
                    const newStudent = await Student.create({
                        userId: newUser._id,
                        classId: classId,
                        regNumber: student.regNumber,
                        name: student.name,
                    });

                    addedStudents.push(newStudent)

                } catch (studentCreationError) {
                    console.error('Error creating student:', studentCreationError);
                    continue;
                }
            }

            await session.commitTransaction();
            session.endSession();

            return res.status(200).json({
                success: true,
                message: 'Students uploaded to class successfully',
                addedStudents: addedStudents,
                duplicates: duplicateStudents,
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error('Transaction error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

    },

    //Downloads class list
    downloadClassList: async(req, res) => {
        if(!req.params.classId) {
            return res.status(404).json({ info: 'Invalid input', message: 'No class ID provided.' });
        }

        try {
            const classList = await ClassList.findOne({ classId: req.params.classId })

            if(!classList || !classList.data) {
                return res.status(404).json({ info: 'Not found', message: 'Class list not found.' });
            }

            const workbook = xlsx.read(classList.data, { type: 'buffer' });

            const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });

            // Set headers for file download
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=classlist.xlsx`);
            
            return res.status(200).send(excelBuffer)
            
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },


    //SETTINGS APIs
    //Get details for the settings page
    getSettingsDetails: async(req, res) => {
        try {
            const courseRegStatus = await CourseRegStatus.findOne({ name: 'courseRegistrationStatus' })
            const sessions = await Session.find()
            const semesters = await Semester.find()
            const levels = await Level.find()
            return res.status(200).json({
                courseRegStatus: courseRegStatus,
                sessions: sessions,
                semesters: semesters,
                levels: levels
            })
        } catch (error) {
            return res.status(500).json(error)
        }
    },

    //Changes the current session
    changeCurrentSession: async(req, res) => {
        const session = await startSession()

        if(!req.body) {
            return res.status(400).json({ info: 'Invalid input', message: 'No session ID provided.' });
        }
        
        try {
            session.startTransaction()

            const sessionToMakeCurrentId = req.body.sessionId;
            const newCurrentSession = await Session.findById(sessionToMakeCurrentId);
            newCurrentSession.isCurrent = true;
            await newCurrentSession.save();

            await CourseRegStatus.findOneAndUpdate(
                { name: 'courseRegistrationStatus' },
                { $set: { openSession: [newCurrentSession._id] } }
            )

            if (req.body.moveClassesUp === true) {
                const studentClasses = await StudentClass.find();

                for (const studentClass of studentClasses) {
                    studentClass.currentLevel += 100;
                    await studentClass.save(); // Save each document individually
                }
            }
            await session.commitTransaction()
            session.endSession()
            return res.status(200).json({ success: true, message: 'Current session changed successfully' })
        } catch (error) {
            await session.abortTransaction()
            session.endSession()
            return res.status(500).send(error)
        }
    },

    //Changes the current semester
    changeCurrentSemester: async(req, res) => {
        if(!req.body) {
            return res.status(400).json({ info: 'Invalid input', message: 'No session ID provided.' });
        }

        try {
            const semester = await Semester.findById(req.body.semesterId)
            semester.isCurrent = true;
            await semester.save();
            await CourseRegStatus.findOneAndUpdate(
                { name: 'courseRegistrationStatus' },
                { $set: { openSemester: [semester._id] } }
            )
            return res.status(200).json({ success: true, message: 'Current semester changed successfully' })
        } catch (error) {
            return res.status(500).send(error)
        }
    },

    //Closes or opens course registration
    changeCourseRegistrationStatus: async(req, res)  => {
        if(!req.body) {
            return res.status(400).json({ info: 'Invalid input', message: 'No status provided.' });
        }

        try {
            if (req.body.status === true) {
                const courseRegStatus = await CourseRegStatus.findOneAndUpdate(
                    { name: 'courseRegistrationStatus' },
                    { $set: { isOpen: true } },
                    { new: true }
                )
            } 

            if (req.body.status === false) {
                const courseRegStatus = await CourseRegStatus.findOneAndUpdate(
                    { name: 'courseRegistrationStatus' },
                    { $set: { isOpen: req.body.status } },
                    { new: false }
                )
            }
            return res.status(200).json({ success: true, message: 'Course registration status changed successfully' })
        } catch (error) {
            return res.status(500).send(error)
        }
    },

    //Changes open sessions
    changeOpenSessions: async(req, res) => {
        if(!req.body) {
            return res.status(400).json({ info: 'Invalid input', message: 'No open sessions provided.' });
        }

        try {
            await CourseRegStatus.findOneAndUpdate(
                { name: 'courseRegistrationStatus' },
                { $set: { openSession: req.body.sessionIds} },
                { new: true }
            )
            return res.status(200).json({ success: true, message: 'Open sessions changed successfully' })
        } catch (error) {
            return res.status(500).send(error)
        }
        
    },

    //Changes open semesters
    changeOpenSemesters: async(req, res) => {
        if(!req.body) {
            return res.status(400).json({ info: 'Invalid input', message: 'No open semesters provided.' });
        }

        try {
            await CourseRegStatus.findOneAndUpdate(
                { name: 'courseRegistrationStatus' },
                { $set: { openSemester: req.body.semesterIds} },
                { new: true }
            )
            return res.status(200).json({ success: true, message: 'Open semesters changed successfully' })
        } catch (error) {
            return res.status(500).send(error)
        }
        
    },

    //Changes open levels
    changeOpenLevels: async(req, res) => {
        if(!req.body) {
            return res.status(400).json({ info: 'Invalid input', message: 'No open levels provided.' });
        }

        try {
            await CourseRegStatus.findOneAndUpdate(
                { name: 'courseRegistrationStatus' },
                { $set: { openLevel: req.body.levelIds } },
                { new: true }
            )
            return res.status(200).json({ success: true, message: 'Open levels changed successfully' })
        } catch (error) {
            return res.status(500).send(error)
        }
        
    },

    //Creates a new session
    createNewSession: async(req, res) => {
        if(!req.body) {
            return res.status(400).json({ info: 'Invalid input', message: 'No session details provided.' });
        }
        try {
            const existingSession = await Session.findOne({ name: req.body.name })
            if (existingSession) {
                return res.status(400).json({ info: 'Duplicate record', message: 'A session with this name already exists.' })
            }
            await Session.create({
                name: req.body.name,
                startYear: req.body.startYear,
                currentYear: req.body.currentYear,
                isCurrent: false
            })
            return res.status(200).json({ success: true, message: 'Session created successfully' })
        } catch (error) {
            return res.status(500).json(error)
        }
    },

    //Gets all advisors 
    getAdvisors: async(req, res) => {
        try {
            const advisors = await Staff.find(
                { isAdvisor: true },
                { name: 1, classId: 1, imageURL: 1, courses: 0 }
            ).populate('classId');

            return res.status(200).json(advisors);
        } catch (error) {
            console.error(error);
            return res.status(500).json(error)
        }
    },

    //Upload picture for user
    uploadPicture: async(req, res) => {
        const { role, id, url } = req.body;

        if (!role || !id || !url) {
            return res.status(404).json({
                info: 'Not found',
                message: 'No user ID or image URL provided'
            })
        }

        try {
            if (role === 'STUDENT') {
                const student = await Student.findById(id)
                if (!student) {
                    return res.status(404).json({
                        info: 'Not found',
                        message: 'No student found'
                    })
                }

                student.imageURL = url;
                await student.save();
            }
            return res.status(200).json({ imageURL: url })
        } catch (error) {
            console.error(error);
            return res.status(500).json(error);
        }
    },

    //update student name and reg Number
    updateNameAndRegNumber: async(req, res) => {
        const { studentId, name, regNumber } = req.body;
        if (!studentId || !name || !regNumber) {
            return res.status(400).json({
                info: 'Bad request',
                message: 'No student ID, name or regNumber provided'
            })
        }

        try {
            const student = await Student.findById(studentId);
            if (!student) {
                return res.status(404).json({
                    info: 'Not found',
                    message: "Failed to complete request. This student's account may have been deleted."
                })
            }
            student.name = name.trim();
            student.regNumber = regNumber;
            await student.save();
            return res.status(200).json({ success: true, message: 'Student name and registration number updated successfully' })
        } catch(error) {
            console.error(error);
            return res.status(500).json(error);
        }
    },

    updateStaffDetails: async(req, res) => {
        console.log(req.body)
        const { id, title, name, staffId } = req.body;
        if (!id || !staffId || !name || !title) {
            return res.status(400).json({
                info: 'Bad request',
                message: 'No staff ID, name, role or class ID provided'
            })
        }

        try {
            const staff = await Staff.findById(id);
            if (!staff) {
                return res.status(404).json({
                    info: 'Not found',
                    message: "Failed to complete request. This staff's account may have been deleted."
                })
            }
            staff.name = name;
            staff.title = title;
            staff.staffId = staffId;
            await staff.save();
            return res.status(200).json({ success: true, message: 'Staff details updated successfully' })
        } catch (error) {
            console.error(error);
            return res.status(500).json(error);
        }
    },

    //Gets details for hod and dean page
    getHodAndDean: async(req, res) => {
        try {
            const [ hod, dean, staff ] = await Promise.all([
                await Staff.findOne({ isHOD: true }),
                await Dean.findOne(),
                await Staff.find({ isHOD: false}, { name: 1, courses: 0 }).sort({ name: 1 })
            ])
            return res.status(200).json({ hod, dean, staff });
        } catch (error) {
            console.error(error);
            return res.status(500).json(error);
        }
    },

    //Change HOD
    changeHod: async(req, res) => {
        if (!req.body) {
            return res.status(400).json({
                info: 'Bad request',
                message: 'No HOD ID provided'
            })
        }
        const { newHod, oldHodUserId } = req.body;
        try {

            const staffToMakeHod = await Staff.findById(newHod._id);
            const newHodUser = await User.findById(staffToMakeHod.userId);
            const oldHodUser = await User.findById(oldHodUserId);

            oldHodUser.role = 'STAFF';
            newHodUser.role = 'HOD';
            staffToMakeHod.isHOD = true;
            
            await staffToMakeHod.save();
            await newHodUser.save();
            await oldHodUser.save();

            const staffs  = await Staff.find({ isHOD: false }, { name: 1, courses: 0 }).sort({ name: 1 });

            return res.status(200).json({
                hod: staffToMakeHod,
                staffs: staffs
            })
            
        } catch (error) {
            console.error(error);
            return res.status(500).json(error);
        }
    },

    resetHodAndDean: async(req, res) => {
        const { userId, password } = req.body;
        if (!userId ||!password) {
            return res.status(400).json({
                info: 'Bad request',
                message: 'No user ID or password provided'
            })
        }

        try {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    info: 'Not found',
                    message: "Failed to complete request. This user's account may have been deleted."
                })
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            user.username = password;
            user.password = hashedPassword;
            await user.save();
            return res.status(200).json({ success: true, message: 'Login details reset successfully' });
        } catch (error) {
            console.error(error);
            return res.status(500).json(error);
        }
    },

    //Change Dean
    changeDean: async(req, res) => {
        if (!req.body) {
            return res.status(400).json({
                info: 'Bad request',
                message: 'No Dean details provided'
            })
        }
        try {
            await Dean.deleteMany({});
            const dean = await Dean.create(req.body);
            return res.status(200).json({ success: true, message: 'Dean changed successfully', dean });
        } catch (error) {
            console.error(error);
            return res.status(500).json(error);
        }
    },
}

module.exports = AdminController