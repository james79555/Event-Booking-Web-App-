const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router(); 

router.get('/register', userController.showRegistrationForm);
router.post('/register', userController.processRegistration);
router.get('/login', userController.showLoginForm);
router.post('/login', userController.processLogin);
router.get('/profile', userController.showProfile);

module.exports = router;