const express = require('express')
const router = express.Router()
const DeanController = require('../controllers/dean.controller')
const ensureAuth = require('../middleware/authentication')

//GETS STAFF NAME AND EMAIL FOR THE HEADER
router.get('/dean-header', ensureAuth.dean, DeanController.getDeanNameAndEmail)

//GET ALL DETAILS FOR THE dean DASHBOARD
router.get('/dashboard', ensureAuth.dean, DeanController.getDashboardDetails)

//GETS PENDING RESULTS FOR dean 
router.get('/pending-results', ensureAuth.dean, DeanController.getPendingResults)

//VIEW RESULT OGR
router.get('/result-ogr', ensureAuth.dean, DeanController.getResultOGR)

//APPROVE A RESULT
router.put('/approve-result/:id', ensureAuth.dean, DeanController.approveResult)

//DISAPPROVE A RESULT
router.put('/disapprove-result/:id', ensureAuth.dean, DeanController.disapproveResult)


//GET DETAILS FOR STAFF ACCOUNT
router.get('/account-details', ensureAuth.dean, DeanController.getStaffAccount)

//CHANGE USERNAME
router.put('/change-username', ensureAuth.dean, DeanController.changeUsername)

//UPLOAD PROFILE PICTURE
router.put('/upload-picture', ensureAuth.dean, DeanController.uploadProfilePicture)

//UPDATES PROFILE INFORMATION
router.put('/update-profile', ensureAuth.dean, DeanController.updateProfile)

//CHANGES PASSWORD
router.put('/change-password', ensureAuth.dean, DeanController.changePassword);


module.exports = router