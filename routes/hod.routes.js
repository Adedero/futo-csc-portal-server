const express = require('express')
const router = express.Router()
const HODController = require('../controllers/hod.controller')
const ensureAuth = require('../middleware/authentication')

//GETS STAFF NAME AND EMAIL FOR THE HEADER
router.get('/hod-header', ensureAuth.hod, HODController.getHODNameAndEmail)

//GET ALL DETAILS FOR THE HOD DASHBOARD
router.get('/dashboard', ensureAuth.hod, HODController.getDashboardDetails)

//GETS ALL STAFF FOR THE HOD
router.get('/staff', ensureAuth.hod, HODController.getAllStaff)

//GETS DETAILS FOR THE STAFF PROFILE
router.get('/staff-profile/:id', ensureAuth.hod, HODController.getStaffProfile)

//CHANGES THE COURSES ASSIGNED TO A STAFF
router.put('/change-staff-courses/:id', ensureAuth.hod, HODController.changeStaffCourses)

//REMOVES ALL COURSES FOR A STAFF
router.put('/remove-staff-courses/:id', ensureAuth.hod, HODController.removeAllCourses)

//REMOVE A STAFF AS AN ADVISOR
router.put('/remove-staff-as-advisor/:id', ensureAuth.hod, HODController.removeStaffAsAdvisor)

//CREATES A NEW ADVISOR
router.put('/create-new-advisor/:id', ensureAuth.hod, HODController.createNewAdvisor)

//GETS PENDING RESULTS FOR HOD 
router.get('/pending-results', ensureAuth.hod, HODController.getPendingResults)

//VIEW RESULT OGR
router.get('/result-ogr', ensureAuth.hod, HODController.getResultOGR)

//APPROVE A RESULT
router.put('/approve-result/:id', ensureAuth.hod, HODController.approveResult)

//DISAPPROVE A RESULT
router.put('/disapprove-result/:id', ensureAuth.hod, HODController.disapproveResult)

//GETS COURSES AND THE LECTURERS TO DISPLAY
router.get('/staff-and-courses', ensureAuth.hod, HODController.getCourseAllocation)


//GET DETAILS FOR STAFF ACCOUNT
router.get('/account-details', ensureAuth.hod, HODController.getStaffAccount)

//CHANGE USERNAME
router.put('/change-username', ensureAuth.hod, HODController.changeUsername)

//UPLOAD PROFILE PICTURE
router.put('/upload-picture', ensureAuth.hod, HODController.uploadProfilePicture)

//UPDATES PROFILE INFORMATION
router.put('/update-profile', ensureAuth.hod, HODController.updateProfile)

//CHANGES PASSWORD
router.put('/change-password', ensureAuth.hod, HODController.changePassword);

module.exports = router