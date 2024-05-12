const express = require('express')
const router = express.Router()
const StudentController = require('../controllers/student.controller')
const ensureAuth = require('../middleware/authentication')

//GET STUDENT NAME AND EMAIL FOR THE HEADER
router.get('/student-header', ensureAuth.student, StudentController.getStudentNameAndEmail)

//GET STUDENT DASHBOARD DETAILS
router.get('/dashboard', ensureAuth.student, StudentController.getDashboardDetails)


//GET COURSE REGISTRATION STATUS
router.get('/course-registration-status', ensureAuth.student, StudentController.getCourseRegistrationStatus)

//GET COURSES TO REGISTER
router.get('/courses-to-register', ensureAuth.student, StudentController.getCoursesToRegister)

//REGISTERED COURSES
router.post('/register-courses', ensureAuth.student, StudentController.registerCourses)

//GETS REGISTERED COURSES DETAILS
router.get('/course-registration-details/:id', ensureAuth.student, StudentController.getCourseRegistrationDetails)

//GETS COURSES FROM A PARTICULAR LEVEL FOR THE STUDENT TO BORROW
router.get('/borrow-courses', ensureAuth.student, StudentController.getCoursesToBorrow)

//GETS STUDENT'S RESULTS
router.get('/results', ensureAuth.student, StudentController.getListOfResults)

//GET A SINGLE STUDENT RESULT
router.get('/single-result', ensureAuth.student, StudentController.getSingleResult)

//GET DETAILS FOR STUDENT ACCOUNT
router.get('/account-details', ensureAuth.student, StudentController.getStudentAccount)

//CHANGE USERNAME
router.put('/change-username', ensureAuth.student, StudentController.changeUsername)

//UPLOAD PROFILE PICTURE
router.put('/upload-picture', ensureAuth.student, StudentController.uploadProfilePicture)

//UPDATES PROFILE INFORMATION
router.put('/update-profile', ensureAuth.student, StudentController.updateProfile)

//CHANGES PASSWORD
router.put('/change-password', ensureAuth.student, StudentController.changePassword);

module.exports = router