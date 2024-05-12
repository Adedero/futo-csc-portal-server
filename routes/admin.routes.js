const express = require('express')
const router = express.Router()
const AdminController = require('../controllers/admin.controller')
const ensureAuth = require('../middleware/authentication')
const upload = require('../config/multer.config')

//GET ADMIN NAME AND EMAIL FOR HEADER
router.get('/admin-header', ensureAuth.admin, AdminController.getAdminNameAndEmail)

//GET ALL DETAILS FOR THE ADMIN DASHBOARD
router.get('/dashboard', ensureAuth.admin, AdminController.getDashboardDetails)


//SESSION APIs

//CREATE A NEW SESSION
router.post('/create-session', ensureAuth.admin, AdminController.createNewSession)

//CLASS APIs
//GET ALL CLASSES
router.get('/student-classes', ensureAuth.admin, AdminController.getAllClasses)

//CREATE A CLASS
router.post('/create-class', ensureAuth.admin, AdminController.createStudentClass)

//GET CLASS PROFILE
router.get('/class-profile/:id', ensureAuth.admin, AdminController.getClassProfile)

//Changes class advisor
router.put('/change-advisor', ensureAuth.admin, AdminController.changeClassAdvisor)

//Updates class details
router.put('/update-class/:id', ensureAuth.admin, AdminController.updateClassDetails)

//Adds a student to a class
router.post('/class-add-student', ensureAuth.admin, AdminController.addStudentFromClass)

//Uploads a class list to generate student accounts
router.post('/upload-classlist/:classId', ensureAuth.admin, upload.single('file'), AdminController.uploadClassList)

//Downloads class list
router.get('/download-classlist/:classId', ensureAuth.admin, AdminController.downloadClassList)

//Gets list of classes and staff for the main admin class page
router.get('/classes-and-staff', ensureAuth.admin, AdminController.getClassesAndStaff)

//Adds a class and assigns a class advisor
router.post('/add-class', ensureAuth.admin, AdminController.addClassAndAssignAdvisor)


//STAFF APIs
//GET ALL STAFF
router.get('/staff', ensureAuth.admin, AdminController.getAllStaff)

//ADD A STAFF
router.post('/add-staff', ensureAuth.admin, AdminController.createStaff)


//GET FULL DETAILS OF STAFF TO DISPLAY ON PROFILE
router.get('/staff/:id', ensureAuth.admin, AdminController.getStaffDetails)


//DELETE A STAFF
router.delete('/delete-staff/:id', ensureAuth.admin, AdminController.deleteStaff)

//CHANGE STAFF COURSES
router.put('/staff/course-change/:id', ensureAuth.admin, AdminController.changeStaffCourse)

//REMOVES ALL COURSES OF A STAFF
router.put('/remove-all-courses/:id', ensureAuth.admin, AdminController.removeAllCourses)

//GETS THE OGR OF RESULTS UPLOADED BY STAFF
router.get('/result-ogr', ensureAuth.admin, AdminController.getResultForOGR)

//RESETS STAFF LOGIN
router.put('/reset-staff-login/:id', ensureAuth.admin, AdminController.resetStaffLogin)





//STUDENT APIs
//CREATE A STUDENT
router.post('/add-student', ensureAuth.admin, AdminController.createStudent)

//DELETE A STUDENT
router.delete('/delete-student/:id', ensureAuth.admin, AdminController.deleteStudent)

//SEARCH STUDENT BY NAME OR REG NUMBER
router.get('/search-students', ensureAuth.admin, AdminController.searchStudentsByCriteria)

//GET ALL STUDENTS
router.get('/students', ensureAuth.admin, AdminController.getAllStudents)

//GET FULL DETAILS OF STUDENT TO DISPLAY ON PROFILE
router.get('/student/:id', ensureAuth.admin, AdminController.getStudentDetails)

//RESET STUDENT LOGIN
router.put('/reset-student-login/:id', ensureAuth.admin, AdminController.resetStudentLogin)

//GETS STUDENTS COURSE REG DETAILS FOR A SESSION
router.get('/student-course-registration-details', ensureAuth.admin, AdminController.getStudentCourseRegistrationDetails)




//COURSES APIs
//GET ALL COURSES
router.get('/courses', ensureAuth.admin, AdminController.getAllCourses)

//ADD A COURSE
router.post('/add-course', ensureAuth.admin, AdminController.createCourse)

//DELETE A COURSE
router.delete('/delete-course/:id', ensureAuth.admin, AdminController.deleteCourse)

//EDIT A COURSE
router.put('/edit-course/:id', ensureAuth.admin, AdminController.editCourse)


//SETTINGS API
//GET DETAILS FOR SETTINGS PAGE
router.get('/settings', ensureAuth.admin, AdminController.getSettingsDetails)

//CHANGES THE CURRENT SESSION
router.put('/change-current-session', ensureAuth.admin, AdminController.changeCurrentSession)

//CHANGES THE CURRENT SEMESTER
router.put('/change-current-semester', ensureAuth.admin, AdminController.changeCurrentSemester)

//Closes or opens course registration status
router.put('/change-course-reg-status', ensureAuth.admin, AdminController.changeCourseRegistrationStatus)

//Changes open sessions
router.put('/change-open-sessions', ensureAuth.admin, AdminController.changeOpenSessions)

//Changes open semesters
router.put('/change-open-semesters', ensureAuth.admin, AdminController.changeOpenSemesters)

//Changes open levels
router.put('/change-open-levels', ensureAuth.admin, AdminController.changeOpenLevels)



//ADVISORS
router.get('/advisors', ensureAuth.admin, AdminController.getAdvisors)

//UPLOAD PICTURE
router.put('/change-user-picture', ensureAuth.admin, AdminController.uploadPicture)

//UPDATE STUDENT NAME AND REG NUMBER
router.put('/update-name-and-reg-number', ensureAuth.admin, AdminController.updateNameAndRegNumber)

//UPDATE STFF DETAILS
router.put('/update-staff-details', ensureAuth.admin, AdminController.updateStaffDetails)


//HOD AND DEAN
router.get('/hod-dean', ensureAuth.admin, AdminController.getHodAndDean);

//CHANGE HOD
router.put('/change-hod', ensureAuth.admin, AdminController.changeHod);

//Reset HOD or dean login details
router.put('/reset-hod-dean-login', ensureAuth.admin, AdminController.resetHodAndDean)

//Create new dean
router.post('/change-dean', ensureAuth.admin, AdminController.changeDean)
module.exports = router