const express = require('express');
const router = express.Router();

const {
    isLoggedIn,
    isAdmin,
    validateTrip
} = require('../middleware/middlewares');

const {
    viewAllTrips,
    viewAllTripsOfUser,
    viewAllFeedbacks,
    viewFeedbackForUser,
    viewFeedbackForTrip } = require('../controllers/adminController');


router.get('/viewAllTrips', isLoggedIn, isAdmin, viewAllTrips);
router.post('/viewAllTripsOfUser', isLoggedIn, isAdmin, viewAllTripsOfUser);
router.get('/viewAllFeedbacks', isLoggedIn, isAdmin, viewAllFeedbacks);
router.post('/viewFeedbackForUser', isLoggedIn, isAdmin, viewFeedbackForUser);
router.get('/viewFeedbackForTrip/:tripID', isLoggedIn, isAdmin, validateTrip, viewFeedbackForTrip);

module.exports = router;
