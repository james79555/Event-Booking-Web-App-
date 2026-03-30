const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router(); 

router.get('/register', userController.showRegistrationForm);
router.post('/register', userController.processRegistration);
router.get('/login', userController.showLoginForm);
router.post('/login', userController.processLogin);
router.get('/profile', userController.showProfile);
router.post('/profile/email', userController.updateEmail);
router.post('/profile/name', userController.updateName);
router.post('/profile/password', userController.updatePassword);
router.post('/profile/delete', userController.deleteAccount);


module.exports = router;