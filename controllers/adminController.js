const Trip = require('../models/tripSchema');
const User = require('../models/UserSchema');
const logger = require('../logger');


const viewAllTripsOfUser = async (req, res) => {

  const { username } = req.body;

  try {

    const user = await User.findOne({ username });

    if(!user){
      return res.status(400).json(
      { message: 'There is no user with such username', 
        success: false, 
        data: null 
      });
    }

    const trips = await Trip.find({ 'username': username });

    logger.info(`Trips for ${username} retrieved successfully`);

    return res.status(200).json(
    { 
      message: `Trips for ${username} retrieved successfully`, 
      success: true, 
      data: trips 
    });
  }
  catch (error) {

    logger.error(`Error retrieving Trips for ${username} :`, error);
    return res.status(500).json(
    { 
      message: 'Internal Server Error', 
      success: false, 
      data: null 
    });
  }
};

const viewAllTrips = async (req, res) => {

  try {

    const trips = await Trip.find();

    logger.info(`Successfully retrieved all the trips`);

    return res.status(200).json(
    { 
      message: 'Trips retrieved successfully', 
      success: true, 
      data: trips 
    });
  } 
  catch (error) {

    logger.error('Error retrieving all Trips:', error);
    return res.status(500).json(
    { message: 'Internal Server Error', 
      success: false, 
      data: null 
    });
  }
};


const viewFeedbackForUser = async (req, res) => {

  const { username } = req.body;

  try {

    const user = await User.findOne({ username });

    if(!user){
      return res.status(400).json(
      { message: 'There is no user with such username', 
        success: false, 
        data: null 
      });
    }

    // const trips = await Trip.find(
    //   { 'feedbacks.username': username },
    //   { 'feedbacks': 1 } // This projection returns the feedbacks array
    // );

    const feedbacks = await Trip.aggregate([

      { $match: { 'feedbacks.username': username } },

      { $unwind: '$feedbacks' },

      { $match: { 'feedbacks.username': username } },

      {
        $group: {
          _id: '$_id',
          feedbacks: { $push: '$feedbacks' }
        }
      }
    ]);

    // Extract the feedbacks given by the specified username
    // const feedbacks = trips.flatMap(trip => trip.feedbacks.filter(feedback => feedback.username === username));

    const extractedFeedbacks = feedbacks.map(trip => trip.feedbacks).flat();

    logger.info(`Feedbacks of ${username} retrieved successfully`);

    return res.status(200).json(
    { 
      message: 'Feedback retrieved successfully', 
      success: true, 
      data: extractedFeedbacks 
    });

  } 
  catch (error) {

    logger.error('Error retrieving feedback:', error);
    res.status(500).json(
    { message: 'Internal Server Error', 
      success: false, 
      data: null 
    });
  }
};

const viewAllFeedbacks = async (req, res) => {

  try {
    const feedbacks = await Trip.aggregate([

      { $unwind: '$feedbacks' },

      {
        $group: {
          _id: '$_id',
          feedbacks: { $push: '$feedbacks' }
        }
      }
    ]);

    const extractedFeedbacks = feedbacks.map(trip => trip.feedbacks).flat();

    logger.info(`All feedbacks retrieved successfully`)

    res.status(200).json(
    { message: 'All feedbacks retrieved successfully', 
      success: true, 
      data: extractedFeedbacks 
    });

  } 
  catch (error) {

    logger.error('Error retrieving all feedbacks:', error);
    res.status(500).json(
    { message: 'Internal Server Error', 
      success: false, 
      data: null 
    });
  }
};

const viewFeedbackForTrip = async (req, res) => {

  const { tripID } = req.params;

  try {

    const trip = await Trip.findById(tripID);

    if (!trip) {
      return res.status(404).json(
      { message: 'Trip not found', 
        success: false, 
        data: null 
      });
    }
    logger.info(`Feedbacks for trip Id ${tripID} retrieved successfully`);
    return res.status(200).json(
    { 
      message: 'Feedback for trip retrieved successfully', 
      success: true, data: 
      trip.feedbacks 
    });

  } 
  catch (error) {

    logger.error('Error fetching feedbacks:', error);
    res.status(500).json(
    { 
      message: 'Internal Server Error', 
      success: false,
      data: null 
    });
  }
}

module.exports = {
  viewAllTripsOfUser,
  viewFeedbackForUser,
  viewAllTrips,
  viewAllFeedbacks,
  viewFeedbackForTrip
};
