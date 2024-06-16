const express = require('express');
const router = express.Router();
const {
    isLoggedIn } = require('../middleware/middlewares');

const {
    addUser,
    verifyUser,
    loginUser,
    forgetPassword,
    resetPassword,
    updatePassword } = require('../controllers/authController');

// For adding a normal user
router.post('/register', (req, res, next) => {
    req.body.isAdmin = false;
    next();
}, addUser);

// For adding an admin
router.post('/registerAdmin', (req, res, next) => {
    req.body.isAdmin = true;
    next();
}, addUser);

router.get('/login', loginUser);
router.post('/verify', verifyUser);

router.post('/forgetPassword', forgetPassword);
router.post('/resetPassword', resetPassword);
router.post('/updatePassword', isLoggedIn, updatePassword);

module.exports = router;
