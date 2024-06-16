const express = require('express');
const router = express.Router();
const {
    isLoggedIn,
    authorizeUser,
    authorizeTraveler,
    validateTrip } = require('../middleware/middlewares');
    
const {
    createTrip,
    viewTrip,
    viewAllTrips,
    updateLiveCoordinates,
    addFeedbackToTrip,
    completeTrip,
    getTripCompletionOTP } = require('../controllers/tripController');

router.post('/createTrip', isLoggedIn, createTrip);
router.get('/viewTrip/:tripId', isLoggedIn, validateTrip, authorizeUser, viewTrip);
router.post('/updateLiveCoordinates/:tripId', isLoggedIn, validateTrip, authorizeTraveler, updateLiveCoordinates);
router.get('/getTripCompletionOTP/:tripId', isLoggedIn, validateTrip, authorizeTraveler, getTripCompletionOTP);
router.post('/completeTrip/:tripId', isLoggedIn, validateTrip, authorizeTraveler, completeTrip);
router.post('/addFeedbackToTrip/:tripId', isLoggedIn, validateTrip, authorizeUser, addFeedbackToTrip);
router.get('/viewAllTrips', isLoggedIn, viewAllTrips);
module.exports = router;