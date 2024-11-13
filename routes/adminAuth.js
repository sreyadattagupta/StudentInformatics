const { Router } = require('express');
const adminAuthController = require('../controllers/adminAuthController');
const router = Router();
const auth = require('../middleware/auth');

router.post('/register', adminAuthController.signup);
router.post('/login', adminAuthController.login);
router.get('/user',auth, adminAuthController.get_user);
router.get('/logout',auth,adminAuthController.logout);
router.get('/dashboard',auth,adminAuthController.dashboard);
router.get('/students',auth,adminAuthController.viewStudents);
// router.get('/teachers',auth,adminAuthController.viewTeachers);
router.get('/addStudent',auth,adminAuthController.addStudent)
router.post('/addStudents',auth,adminAuthController.addStudents)

router.get('/addCourse',auth,adminAuthController.addCourse)
router.post('/addCourses',auth,adminAuthController.addCourses)
router.get('/courses',auth,adminAuthController.viewCourses)
router.get('/reset',auth,adminAuthController.reset)
router.post('/updateStudent',auth,adminAuthController.updateStudent)
router.get('/update',auth,adminAuthController.sendUpdateStudent)
module.exports = router;
 