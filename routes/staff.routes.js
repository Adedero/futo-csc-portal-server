const express = require('express')
const router = express.Router()
const StaffController = require('../controllers/staff.controller')
const ensureAuth = require('../middleware/authentication')

//GETS STAFF NAME AND EMAIL FOR THE HEADER
router.get('/staff-header', ensureAuth.staff, StaffController.getStaffNameAndEmail)

//GETS THE DETAILS FOR THE STAFF DASHBOARD
router.get('/dashboard', ensureAuth.staff, StaffController.getDashboardDetails)

//GETS UPLOADED RESULTS HISTORY
router.get('/uploaded-results-history', ensureAuth.staff, StaffController.getUploadedResultsHistory)

//GETS STUDENTS THAT REGISTERED FOR A COURSE SO AS TO INPUT THEIR RESULTS
router.get('/resgistered-students', ensureAuth.staff, StaffController.getRegisteredStudents)

//SAVES THE RESULT TO THE DATABASE
router.post('/save-result', ensureAuth.staff, StaffController.saveStudentResult)

//GETS THE RESULT TO POPULATE THE OGR
router.get('/result-ogr', ensureAuth.staff, StaffController.getResultForOGR)

//GETS THE EXISTING RESULT TO EDIT
router.get('/result-to-edit', ensureAuth.staff, StaffController.getResultToEdit)

//SAVES THE EDITED RESULT
router.put('/save-result-edit', ensureAuth.staff, StaffController.saveEditedResult)

//GET DETAILS FOR STAFF ACCOUNT
router.get('/account-details', ensureAuth.staff, StaffController.getStaffAccount)

//CHANGE USERNAME
router.put('/change-username', ensureAuth.staff, StaffController.changeUsername)

//UPLOAD PROFILE PICTURE
router.put('/upload-picture', ensureAuth.staff, StaffController.uploadProfilePicture)

//UPDATES PROFILE INFORMATION
router.put('/update-profile', ensureAuth.staff, StaffController.updateProfile)

//CHANGES PASSWORD
router.put('/change-password', ensureAuth.staff, StaffController.changePassword);

module.exports = router