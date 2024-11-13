const { Router } = require('express');
const studentAuthController = require('../controllers/studentAuthController');
const router = Router();
const auth = require('../middleware/StudentAuth');
const StudentAuth = require('../middleware/StudentAuth');

router.post('/login',studentAuthController.login);
router.get('/login',studentAuthController.loginPage);
router.get('/dashboard',StudentAuth,studentAuthController.studentDashboard)
router.get('/courseRegister',StudentAuth ,studentAuthController.courseRegister)
router.post('/registerCourse',StudentAuth,studentAuthController.registerCourse)
router.get('/logout',StudentAuth,studentAuthController.logout)
router.get('/courses',auth,studentAuthController.getStudentCourses)
module.exports=router;