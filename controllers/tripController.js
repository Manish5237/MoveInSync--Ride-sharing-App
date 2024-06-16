const logger = require('../logger');
const User = require('../models/UserSchema');
const Trip = require('../models/tripSchema');
require('dotenv').config();
const geoFenceDistance = process.env.GEO_FENCE_DISTANCE;
const twilioAccSid = process.env.TWILIO_ACC_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

const deg2rad = (deg) => deg * (Math.PI / 180);

const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};


const createTrip = async (req, res) => {
  const {
    username,
    travelerCompanions,
    sourceLatitude,
    sourceLongitude,
    destinationLatitude,
    destinationLongitude } = req.body;

  try {

    const user = await User.findOne({ username });
    if (user.isTraveler) {
      return res.status(400).json(
        {
          message: 'You already have an ongoing trip',
          success: false,
          data: null
        });
    }

    if (travelerCompanions.length) {
      for (const companionUsername of travelerCompanions) {

        const companion = await User.findOne({ username: companionUsername });

        if (!companion) {
          return res.status(400).json(
            {
              message: `Travel companion ${companionUsername} doesn't exist.`,
              success: false,
              data: null
            });
        }
      }
    }

    const driverName = "Raj Yadav", driverPhoneNumber = "9997186212", cabNumber = "UP14 AC 5697";
    const currentLatitude = sourceLatitude, currentLongitude = sourceLongitude;
    const status = "ongoing";

    const tripOTP = Math.floor(100000 + Math.random() * 900000).toString();

    const newTrip = new Trip({
      username,
      driverName,
      driverPhoneNumber,
      cabNumber,
      travelerCompanions,
      status,
      tripOTP,
      sourceLatitude,
      sourceLongitude,
      destinationLatitude,
      destinationLongitude,
      currentLatitude,
      currentLongitude
    });

    const tripId = newTrip._id;
    const tripLink = `http://localhost:5000/api/trips/viewTrip/${tripId}`;
    const accountSid = twilioAccSid;
    const authToken = twilioAuthToken;

    const client = require('twilio')(accountSid, authToken);

    if (travelerCompanions.length) {
      for (const companionUsername of travelerCompanions) {

        const companion = await User.findOne({ username: companionUsername });

        companion.isTravelerCompanion = true;
        companion.travelerCompanionFor.push(tripId);

        await companion.save();
        try {

          const message = `Your friend ${username} has started a trip with us. View details: ${tripLink}`;
          await client.messages.create(
            {
              from: 'whatsapp:+14155238886',
              body: message,
              to: `whatsapp:+91${companion.phoneNo}`
            });
        }
        catch (error) {
          logger.error(`Details of trip ID ${tripId} could not be shared with ${companionUsername}.`)
        }
      }
      logger.info(`Details of trip ID ${tripId} shared successfully with travel companions.`);
    }
    await newTrip.save();

    logger.info(`Trip for ${username} with trip ID ${tripId} created successfully.`)

    res.status(201).json(
      {
        message: 'Trip created successfully',
        success: true,
        data: tripLink
      });
  }
  catch (error) {
    logger.error('Error creating trip:', error);
    res.status(500).json(
      {
        message: 'Internal Server Error',
        success: false,
        data: null
      });
  }
};


const viewTrip = async (req, res) => {

  const { tripId } = req.params;

  try {

    const trip = await Trip.findById(tripId);

    if (trip.status === 'completed') {
      return res.status(400).json(
        {
          message: 'This link has expired because the trip is completed',
          success: false,
          data: null
        });
    }

    return res.status(200).json({
      message: 'Trip details retrieved successfully',
      success: true,
      data: {
        driverName: trip.driverName,
        driverPhoneNumber: trip.driverPhoneNumber,
        cabNumber: trip.cabNumber,
        status: trip.status,
        sourceLatitude: trip.sourceLatitude,
        sourceLongitude: trip.sourceLongitude,
        destinationLatitude: trip.destinationLatitude,
        destinationLongitude: trip.destinationLongitude,
        currentLatitude: trip.currentLatitude,
        currentLongitude: trip.currentLongitude
      }
    });
  }
  catch (error) {
    logger.error('Error retrieving trip:', error);
    res.status(500).json(
      {
        message: 'Internal Server Error',
        success: false,
        data: null
      });
  }
};


const viewAllTrips = async (req, res) => {
  const { username } = req.body;

  try {
    const trips = await Trip.find({ username: username });

    res.status(200).json({
      message: 'Trips retrieved successfully', success: true, data: {
        trips: trips.map(trip => ({
          driverName: trip.driverName,
          driverPhoneNumber: trip.driverPhoneNumber,
          cabNumber: trip.cabNumber,
          status: trip.status,
          sourceLatitude: trip.sourceLatitude,
          sourceLongitude: trip.sourceLongitude,
          destinationLatitude: trip.destinationLatitude,
          destinationLongitude: trip.destinationLongitude
        }))
      }
    });
  } catch (error) {
    console.error('Error retrieving trips:', error);
    res.status(500).json({ message: 'Internal Server Error', success: false, data: null });
  }
};


const updateLiveCoordinates = async (req, res) => {

  const { username, currentLatitude, currentLongitude } = req.body;
  const { tripId } = req.params

  try {

    const trip = await Trip.findOne({ username, status: 'ongoing' });
    if (!trip) {
      return res.status(404).json(
        {
          message: 'Ongoing trip not found for user',
          success: false,
          data: null
        });
    }

    trip.currentLatitude = currentLatitude;
    trip.currentLongitude = currentLongitude;

    var lat1 = parseFloat(trip.currentLatitude);
    var lon1 = parseFloat(trip.currentLongitude);
    var lat2 = parseFloat(trip.destinationLatitude);
    var lon2 = parseFloat(trip.destinationLongitude);

    const remainingDistance = getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2);

    if (remainingDistance < geoFenceDistance) {

      const message = `${username} is about to reach destination location and is only ${Math.round((remainingDistance + Number.EPSILON) * 1000)} meters away.`;
      const accountSid = twilioAccSid;
      const authToken = twilioAuthToken;
      const client = require('twilio')(accountSid, authToken);

      if (trip.travelerCompanions.length) {
        for (const companionUsername of trip.travelerCompanions) {
          const companion = await User.findOne({ username: companionUsername });
          await client.messages.create(
            {
              from: 'whatsapp:+14155238886',
              body: message,
              to: `whatsapp:+91${companion.phoneNo}`
            });
        }
      }
    }
    await trip.save();

    logger.info(`Updated live coordinates successfully for trip ID ${tripId}`)

    res.status(200).json(
      {
        message: 'Current location updated successfully',
        success: true,
        data: trip
      });
  }
  catch (error) {
    logger.error('Error updating live coordinates:', error);
    res.status(500).json(
      {
        message: 'Internal Server Error',
        success: false,
        data: null
      });
  }
};


const getTripCompletionOTP = async (req, res) => {

  const { tripId } = req.params;
  const { username } = req.body;

  try {

    const trip = await Trip.findById(tripId);
    const user = await User.findOne({ username });

    if (trip.status === 'completed') {
      return res.status(400).json(
        {
          message: 'This trip is already completed',
          success: false,
          data: null
        });
    }

    const tripOTP = trip.tripOTP;

    const message = `Your OTP for trip with trip ID ${tripId} is ${tripOTP}.`;
    const accountSid = twilioAccSid;
    const authToken = twilioAuthToken;
    const client = require('twilio')(accountSid, authToken);

    await client.messages.create(
      {
        from: 'whatsapp:+14155238886',
        body: message,
        to: `whatsapp:+91${user.phoneNo}`
      });

    return res.status(200).json(
      {
        message: 'Successfully fetched trip completion OTP',
        success: true,
        data:
        {
          tripOTP: tripOTP
        }
      });
  }
  catch (error) {
    logger.error('Error fetching trip completion OTP:', error);
    res.status(500).json(
      {
        message: 'Internal Server Error',
        success: false,
        data: null
      });
  }
};


const completeTrip = async (req, res) => {

  const { tripOTP, username } = req.body;
  const { tripId } = req.params;

  try {

    const trip = await Trip.findOne({ _id: tripId, status: 'ongoing' });
    if (!trip) {
      return res.status(404).json(
        {
          message: 'Ongoing trip not found for user',
          success: false,
          data: null
        });
    }

    const traveler = await User.findOne({ username: username });

    if (trip.tripOTP === tripOTP) {

      trip.status = 'completed';
      await trip.save();

      traveler.isTraveler = false;
      await traveler.save();

      const accountSid = twilioAccSid;
      const authToken = twilioAuthToken;
      const message = `Trip for ${username} has completed successfully. Thank for using MoveInSync services.`
      const client = require('twilio')(accountSid, authToken);

      if (trip.travelerCompanions.length) {
        for (const companionUsername of trip.travelerCompanions) {

          const companion = await User.findOne({ username: companionUsername });
          const index = companion.travelerCompanionFor.indexOf(tripId);

          if (index !== -1) {
            companion.travelerCompanionFor.splice(index, 1);
          }

          if (companion.travelerCompanionFor.length === 0) {
            companion.isTravelerCompanion = false;
          }

          await companion.save();

          await client.messages.create(
            {
              from: 'whatsapp:+14155238886',
              body: message,
              to: `whatsapp:+91${companion.phoneNo}`
            });
        }
      }

      logger.info(`Trip with ${username} completed successfully.`);
      return res.status(200).json(
        {
          message: 'Trip completed successfully',
          success: true,
          data: trip
        });
    }
    else {

      logger.error(`Invalid OTP for trip ID ${tripId}`)
      return res.status(401).json(
        {
          message: 'Invalid OTP',
          success: false,
          data: null
        });
    }
  }
  catch (error) {
    logger.error('Error completing trip:', error);
    res.status(500).json(
      {
        message: 'Internal Server Error',
        success: false,
        data: null
      });
  }
};



const addFeedbackToTrip = async (req, res) => {

  const { tripId } = req.params
  const { username, feedback } = req.body;
  try {

    const trip = await Trip.findById(tripId);

    trip.feedbacks.push({ username, feedback });

    await trip.save();
    
    logger.info(`Feedback added successfully to trip with trip ID ${tripId} by ${username}.`)

    return res.status(200).json(
      {
        message: 'Feedback added successfully',
        success: true,
        data: trip
      });
  }
  catch (error) {
    logger.error('Error adding feedback to trip:', error);
    res.status(500).json(
      {
        message: 'Internal Server Error',
        success: false,
        data: null
      });
  }
};


module.exports =
{
  createTrip,
  viewTrip,
  viewAllTrips,
  updateLiveCoordinates,
  addFeedbackToTrip,
  completeTrip,
  getTripCompletionOTP
};
