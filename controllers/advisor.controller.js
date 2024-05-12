const Staff = require('../models/staff.model')
const Session = require('../models/session.model')
const Semester = require('../models/semester.model')
const Student = require('../models/student.model')
const Course = require('../models/course.model')
const Result = require('../models/result.model')
const RegisteredCourse = require('../models/registered-course.model')
const ApprovedResult = require('../models/approved-result.model')
const User = require('../models/user.model')
const bcrypt = require('bcrypt')

const AdvisorController = {
    //Gets the name and email of the advisor for the header
    getAdvisorNameAndEmail: async (req, res) => {
        try {
            const advisor = await Staff.findOne({ userId: req.user.id })
            if (!advisor) {
                return res.status(404).json({ info: 'Access denied', message: 'Please log in' })
            }
            return res.status(200).json({
                name: advisor.name,
                email: advisor.email,
                imageURL: advisor.imageURL
            })
        } catch (error) {
            return res.status(500).json(error)
        }
    },


    //Gets staff dashboard details
    getDashboardDetails: async (req, res) => {
        let dashboard = {}

        try {
            const advisor = await Staff.findOne({ userId: req.user.id }).populate('classId');
            const currentSession = await Session.findOne({ isCurrent: true });
            const currentSemester = await Semester.findOne({ isCurrent: true });
            const students = await Student.find({ classId: advisor.classId._id });
            const results = await ApprovedResult.find(
                { studentClassId: advisor.classId._id },
                { student: 1, totalUnits: 1, totalGradePoints: 1, GPA: 1, }
            ).populate('student', 'name regNumber imageURL -classId')

            const topResults = results.reduce((acc, result) => {
                const existingStudentResult = acc.findIndex(r => r.studentId.toString() === result.student._id.toString());
                if (existingStudentResult !== -1) {
                    acc[existingStudentResult].TGP += result.totalGradePoints || 0;
                    acc[existingStudentResult].TNU += result.totalUnits || 0;
                    acc[existingStudentResult].CGPA = acc[existingStudentResult].TGP / acc[existingStudentResult].TNU;
                } else {
                    acc.push({
                        studentId: result.student._id.toString(),
                        name: result.student.name,
                        regNumber: result.student.regNumber,
                        TNU: result.totalUnits || 0,
                        TGP: result.totalGradePoints || 0,
                        CGPA: result.GPA || 0,
                        imageURL: result.student.imageURL || null
                    })
                }
                
                return acc;
            }, []).sort((a, b) => b.CGPA - a.CGPA).slice(0, 5)

            dashboard = {
                advisor: advisor,
                students: students.length,
                currentSession: currentSession,
                currentSemester: currentSemester,
                topStudents: topResults
            }
            return res.status(200).json(dashboard)

        } catch (error) {
            return res.status(500).json(error)
        }
    },

    //Gets students in advisor's class
    getClassStudents: async (req, res) => {
        try {
            const advisor = await Staff.findOne({
                userId: req.user.id,
                isAdvisor: true,
            })

            const students = await Student.find(
                {
                    classId: advisor.classId
                },
                {
                    name: 1,
                    regNumber: 1,
                    imageURL: 1,
                    classId: 0
                })
            return res.status(200).json(students)
        } catch (error) {
            return res.status(500).json(error)
        }
    },

    //Search and retrieve some students
   /*  getStudent: async (req, res) => {
        const { classId, value } = req.query;
        if (!classId || !value) {
            return res.status(400).json({ info: 'Invalid input', message: 'Please enter a name or registration number' })
        }
        try {
            const students = await Student.find({
                classId: classId,
                $or: [
                    { name: { $regex: value, $options: 'i' } },
                    { regNumber: { $regex: value, $options: 'i' } }
                ]
            }, { name: 1, regNumber: 1, classId: 0 })
            return res.status(200).json(students)
        } catch (error) {
            console.error(error)
            return res.status(500).json(error)
        }
    }, */

    //Gets all the details needed in the student profile in the advisor page
    getDetailsForStudentProfile: async (req, res) => {
        const studentId = req.params.id

        try {
            const student = await Student.findById(
                studentId,
                { isAllowed27units: 0, userId: 0 }
            )
            if (!student) {
                return res.status(404).json({
                    info: 'Not found',
                    message: `Could not find the student with ID ${studentId}.`
                })
            }
            const registeredCourses = await RegisteredCourse.find({ student: studentId })
            const results = await ApprovedResult.find({ student: studentId })


            let failedCourses = []
            let CGPA = 0, TGP = 0, TNU = 0

            results.forEach(result => {
                TGP += result.totalGradePoints;
                TNU += result.totalUnits;

                result.courses.forEach(course => {
                    if (course.grade === 'F') {
                        failedCourses.push({
                            code: course.code,
                            title: course.title,
                            grade: course.grade
                        })
                    }
                })
            })

            CGPA = TNU !== 0? TGP / TNU : 0

            const outstandingCourses = failedCourses.filter(courseA => !failedCourses.some(courseB => courseA.code === courseB.code && courseB.grade !== 'F'));

            return res.status(200).json({
                student: student,
                registeredCourses: registeredCourses,
                CGPA: CGPA,
                outstandingCourses: outstandingCourses
            })
        } catch (error) {
            return res.status(500).json(error)
        }
    },

    //GETS COURSE REG DETAILS OF A STUDENT BY SESSION
    getStudentCourseRegistrationDetails: async (req, res) => {
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

    //GETS SESSIONS AND COURSES SO THAT THE ADVISOR CAN ADD OR VIEW RESULTS
    getSessionsAndCourses: async (req, res) => {
        try {
            const sessions = await Session.find()
            const courses = await Course.find(
                {},
                { code: 1, semester: 1, level: 1 }
            )
            const advisor = await Staff.findOne(
                { userId: req.user.id },
                { courses: 0, staffId: 1, classId: 1 }
            )
            return res.status(200).json({
                sessions: sessions,
                courses: courses,
                advisor: advisor
            })
        } catch (error) {
            return res.status(500).json(error)
        }
    },

    //Gets registered students to add their results
    getRegisteredStudents: async (req, res) => {
        const { staffId, session, semester, level, course, scoped } = req.query
        const courseCode = course.split('-').join(' ')
        try {
            const advisor = await Staff.findOne(
                { userId: req.user.id },
                { classId: 1, courses: 0 }
            );
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

            let registeredStudents
            if (scoped == true) {
                registeredStudents = await RegisteredCourse.find({
                    session: session,
                    semester: semester,
                    level: level,
                    studentClassId: advisor.classId
                }).populate('student')
            } else {
                registeredStudents = await RegisteredCourse.find({
                    session: session,
                    semester: semester,
                    level: level,
                }).populate('student')
            }

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

    //CHECKS IF THE RESULT EXISTS FOR THE ADVISOR TO VIEW IT
    /*  checkResultToView: async (req, res) => {
         try {
             let advisor = await Staff.findOne(
                 { userId: req.user.id },
                 { classId: 1, courses: 0 }
             );
 
             let result = await Result.findOne({
                 session: req.query.session,
                 semester: req.query.semester,
                 level: req.query.level,
                 'course.code': req.query.course,
             });
 
             if (!result) {
                 return res.status(404).json({
                     info: 'Not found',
                     message: `Could not find any results for the given query.`,
                 });
             }
 
             let resultArray = [];
             let arraySize = result.students.length
             for (let index = 0; index < arraySize; index++) {
                 if (result.students[index].studentClassId.equals(advisor.classId)) {       
                     resultArray.push(result.students[index]);
                 }
             }
             if (!resultArray.length) {
                 return res.status(404).json({
                     info: 'Not found',
                     message: 'No results found for students from this class',
                 });
             }
 
             result.students = resultArray
 
             return res.status(200).json({
                 record: result,
                 advisorId: advisor._id
             });
         } catch (error) {
             console.error(error);
             return res.status(500).json({
                 error: 'Internal Server Error',
                 message: 'An unexpected error occurred.',
             });
         }
     }, */

    //CHECKS APPROVED RESULTS TO VIEW IF THE EXIST
    checkResultToView: async (req, res) => {
        try {
            let advisor = await Staff.findOne(
                { userId: req.user.id },
                { classId: 1, courses: 0 }
            );
            let results = await ApprovedResult.find({
                session: req.query.session,
                semester: req.query.semester,
                level: req.query.level,
                studentClassId: advisor.classId
            }).populate('student').lean()

            if (!results.length) {
                return res.status(404).json({
                    info: 'Not found',
                    message: `Could not find any results for the given query.`,
                });
            }

            let approvalDate = results[0].createdAt
            let courseDetails;
            results = results.map(result => {
                const matchingCourse = result.courses.find(course => course.code === req.query.course);

                if (matchingCourse) {
                    courseDetails = {
                        code: matchingCourse.code,
                        title: matchingCourse.title,
                        isElective: matchingCourse.isElective,
                        hasPractical: matchingCourse.hasPractical,
                        level: matchingCourse.level,
                        unit: matchingCourse.unit
                    }
                    return {
                        name: result.student.name,
                        regNumber: result.student.regNumber,
                        // Copy existing properties
                        testScore: matchingCourse.testScore,
                        labScore: matchingCourse.testScore,
                        examScore: matchingCourse.examScore,
                        totalScore: matchingCourse.totalScore,
                        grade: matchingCourse.grade,
                        remark: matchingCourse.remark  // Replace courses array with the matching course
                    };
                } else {
                    return []
                }
            });

            if (!results.length) {
                return res.status(404).json({
                    info: 'Not found',
                    message: 'No result found for this course'
                })
            }

            const record = {
                approvalDate: approvalDate,
                course: courseDetails,
                results: results
            }

            return res.status(200).json(record);
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: 'Internal Server Error',
                message: 'An unexpected error occurred.',
            });
        }
    },

    //VIEWS RESULTS FOR ALL COURSES 
    viewResultForAllCourses: async (req, res) => {

        try {
            //Get the current results
            let currentResults = await ApprovedResult.find({
                studentClassId: req.query.classId,
                session: req.query.session,
                level: req.query.level,
                semester: req.query.semester
            }).populate('student')

            if (!currentResults.length) {
                return res.status(404).json({
                    info: 'Not found',
                    message: 'No results found for the given query'
                })
            }

            //Get all the courses as a unique set
            let allCourses = new Set();

            currentResults.forEach(result => {
                result.courses.forEach(({ code, unit }) => {
                    allCourses.add(JSON.stringify({ code, unit }));
                });
            });

            // Convert the Set back to an array of objects
            const uniqueCoursesArray = Array.from(allCourses).map(courseString => JSON.parse(courseString));


            // GET PREVIOUS RESULTS
            let result1 = []
            let result2 = []
            if (req.query.semester === 'RAIN') {
                result1 = await ApprovedResult.find({
                    studentClassId: req.query.classId,
                    session: req.query.session,
                    level: req.query.level,
                    semester: { $ne: req.query.semester }

                }, { courses: 0, session: 0, semester: 0, year: 0, level: 0 })
            }

            result2 = await ApprovedResult.find({
                studentClassId: req.query.classId,
                level: { $lt: req.query.level }

            }, { courses: 0, session: 0, semester: 0, year: 0, level: 0 })

            let previousResults = [...result1, ...result2]

            //console.log(previousResults)

            previousResults = previousResults.reduce((acc, result) => {
                let existingResultIndex = acc.findIndex(r => r.studentId.toString() === result.student.toString());

                if (existingResultIndex !== -1) {
                    // If the student's result is already in the accumulator array
                    acc[existingResultIndex].previousTotalUnits += result.totalUnits || 0;
                    acc[existingResultIndex].previousTotalGradePoints += result.totalGradePoints || 0;
                    acc[existingResultIndex].previousGPA = acc[existingResultIndex].previousTotalGradePoints / acc[existingResultIndex].previousTotalUnits

                } else {
                    // If the student's result is not yet in the accumulator array
                    let studentCummulativeResult = {
                        studentId: result.student.toString(),
                        previousTotalUnits: result.totalUnits || 0,
                        previousTotalGradePoints: result.totalGradePoints || 0,
                        previousGPA: result.GPA || 0
                    };

                    acc.push(studentCummulativeResult);
                }

                return acc;
            }, []);

            //If any previous results, calculate and add the previous and cummulative to the current results

            if (previousResults.length) {
                //Join the previous results to the current one and calculate the cummulative
                let modifiedResults = [];

                // Iterate over currentResults
                currentResults.forEach(result => {
                    let modifiedResult = { ...result._doc }; // Create a copy of the result object

                    // Find previous result for the current student
                    const previousResult = previousResults.find(r => r.studentId.toString() === result.student._id.toString());

                    // If previous result exists, modify the current result
                    if (previousResult) {
                        modifiedResult.previousTNU = previousResult.previousTotalUnits;
                        modifiedResult.previousTGP = previousResult.previousTotalGradePoints;
                        modifiedResult.previousGPA = previousResult.previousGPA;
                        modifiedResult.cumTNU = previousResult.previousTotalUnits + result.totalUnits;
                        modifiedResult.cumTGP = previousResult.previousTotalGradePoints + result.totalGradePoints;
                        modifiedResult.cumGPA = modifiedResult.cumTNU !== 0 ? modifiedResult.cumTGP / modifiedResult.cumTNU : 0; // Avoid division by zero
                    }

                    // Push the modified result into the new array
                    modifiedResults.push(modifiedResult);
                });

                return res.status(200).json({
                    success: true,
                    previousResultsAvailable: true,
                    courses: uniqueCoursesArray,
                    records: modifiedResults,
                })

            } else {
                //Send the current results as it is
                return res.status(200).json({
                    success: true,
                    previousResultsAvailable: false,
                    courses: uniqueCoursesArray,
                    records: currentResults,
                });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json(error);
        }
    },

    //Gets an existing resul to edit
    getResultToEdit: async (req, res) => {
        const resultId = req.query.resultId
        try {
            const existingResult = await Result.findById(resultId).lean()

            if (!existingResult) {
                return res.status(404).json({
                    info: 'Not found',
                    message: 'Cannot find result to edit.'
                })
            }

            if (existingResult.isApprovedByHOD || existingResult.isApprovedByDean) {
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
    saveEditedResult: async (req, res) => {
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
        } catch (error) {
            return res.status(500).json(error)
        }
    },

    //Checks the transcript session if the results exosrs
    checkTranscriptSession: async (req, res) => {
        try {
            const results = await ApprovedResult.find({
                student: req.query.studentId,
            })

            if (!results.length) {
                return res.status(404).json({
                    info: 'Not found',
                    message: 'No results found for this student.'
                })
            }
            return res.status(200).json({
                success: true,
                message: "Results found",
            })

        } catch (error) {
            console.error(error)
            return res.status(500).json(error)
        }
    },

    //Get student's transcript
    studentTranscripts: async (req, res) => {
        const { session, studentId } = req.query
        try {
            const student = await Student.findById(studentId)
            const r = await ApprovedResult.find({
                student: studentId
            })
            //reduce the attributes of the courses
            const results = r.map(result => {
                let reducedCourses = result.courses.map(course => {
                    return {
                        code: course.code,
                        title: course.title,
                        unit: course.unit,
                        grade: course.grade,
                        gradePoints: course.gradePoints,
                    };
                });

                // Return a new object with the reduced courses
                return {
                    ...result._doc,
                    courses: reducedCourses
                };
            });

            const groupedResults = results.reduce((acc, result) => {
                // Check if any existing result matches the session
                const existingGroup = acc.find(group => group[0]?.session === result.session);

                // if the results have the same session, join them together
                if (existingGroup) {
                    existingGroup.push(result);
                } else {
                    // Otherwise, create a new group for the session
                    acc.push([result]);
                }

                return acc;
            }, []);

            return res.status(200).json({
                results: groupedResults,
                student: student
            })
        } catch (error) {
            console.error(error)
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

module.exports = AdvisorController