const express = require('express')
const router = express.Router()
const AdvisorController = require('../controllers/advisor.controller')
const StaffController = require('../controllers/staff.controller')
const ensureAuth = require('../middleware/authentication')

//GETS STAFF NAME AND EMAIL FOR THE HEADER
router.get('/advisor-header', ensureAuth.advisor, AdvisorController.getAdvisorNameAndEmail)

//GETS THE DETAILS FOR THE ADVISOR DASHBOARD
router.get('/dashboard', ensureAuth.advisor, AdvisorController.getDashboardDetails)

//GETS THE LIST OF STUDENTS IN ADVISOR'S CLASS
router.get('/students', ensureAuth.advisor, AdvisorController.getClassStudents)

/* //SEARCH FOR A STUDENT IN CLASS
router.get('/getStudent', ensureAuth.advisor, AdvisorController.getStudent)
 */

//GETS DETAILS FOR STUDENT PROFILE IN ADVISOR VIEW
router.get('/student-profile/:id', ensureAuth.advisor, AdvisorController.getDetailsForStudentProfile)

//GETS STUDENTS COURSE REG DETAILS FOR A SESSION
router.get('/student-course-registration-details', ensureAuth.advisor, AdvisorController.getStudentCourseRegistrationDetails)

//GETS STUDENTS THAT REGISTERED FOR A COURSE SO AS TO INPUT THEIR RESULTS
router.get('/resgistered-students', ensureAuth.advisor, AdvisorController.getRegisteredStudents)

//SAVES THE RESULT TO THE DATABASE
router.post('/save-result', ensureAuth.advisor, StaffController.saveStudentResult)

//GETS UPLOADED RESULTS HISTORY
router.get('/uploaded-results-history', ensureAuth.advisor, StaffController.getUploadedResultsHistory)

//GETS SESSIONS AND COURSES SO THE ADVISOR CAN VIEW OR ADD RESULTS
router.get('/sessions-and-courses', ensureAuth.advisor, AdvisorController.getSessionsAndCourses)

//GETS THE RESULT TO POPULATE THE OGR
router.get('/result-ogr', ensureAuth.advisor, StaffController.getResultForOGR)

//CHECKS IF THE RESULT EXISTS FOR THE ADVISOR TO VIEW IT
router.get('/view-result', ensureAuth.advisor, AdvisorController.checkResultToView)

//GETS RESULTS WHEN 'ALL-COURSES' IS SELECTED
router.get('/view-results-all-courses', ensureAuth.advisor, AdvisorController.viewResultForAllCourses)

//GETS THE EXISTING RESULT TO EDIT
router.get('/result-to-edit', ensureAuth.advisor, AdvisorController.getResultToEdit)

//SAVES THE EDITED RESULT
router.put('/save-result-edit', ensureAuth.advisor, AdvisorController.saveEditedResult)

//CHECK IF TRANSCRIPT RESULTS EXISTS
router.get('/check-transcript-session', ensureAuth.advisor, AdvisorController.checkTranscriptSession)

//GET TRANSCRIPT
router.get('/student-transcript', ensureAuth.advisor, AdvisorController.studentTranscripts)


//GET DETAILS FOR ADVISOR ACCOUNT
router.get('/account-details', ensureAuth.advisor, AdvisorController.getStaffAccount)

//CHANGE USERNAME
router.put('/change-username', ensureAuth.advisor, AdvisorController.changeUsername)

//UPLOAD PROFILE PICTURE
router.put('/upload-picture', ensureAuth.advisor, AdvisorController.uploadProfilePicture)

//UPDATES PROFILE INFORMATION
router.put('/update-profile', ensureAuth.advisor, AdvisorController.updateProfile)

//CHANGES PASSWORD
router.put('/change-password', ensureAuth.advisor, AdvisorController.changePassword);

module.exports = router