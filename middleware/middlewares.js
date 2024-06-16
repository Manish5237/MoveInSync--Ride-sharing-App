require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;
const jwt = require("jsonwebtoken");
const User = require("../models/UserSchema");
const Trip = require("../models/tripSchema");
const logger = require('../logger');



const isLoggedIn = async (req, res, next) => {

  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(403).send(
        {
          message: "Login is required.",
          success: false,
        });
    }

    const decodedToken = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ _id: decodedToken.id });

    if (!user) {
      return res.status(403).send(
        {
          message: "User not found.",
          success: false,
        });
    }

    if (!user.isVerified) {
      return res.status(401).send(
        {
          message: "User not verified. Please verify your account.",
          success: false,
        });
    }

    const username = user.username
    req.body.email = user.email;
    req.body.username = username;
    req.body.isAdmin = user.isAdmin;

    logger.error(`Authentication successful for  : ${username}`);

    next();

  }
  catch (error) {
    logger.error('Failed authenticating user with error : ', error);

    return res.status(403).send(
      {
        message: "Authentication failed",
        success: false,
      });
  }
};

const isAdmin = (req, res, next) => {

  try {
    if (!req.body.isAdmin) {
      return res.status(401).send(
        {
          message: "You don't have the required permissions.",
          success: false,
        });
    }
    next();
  }
  catch (error) {
    logger.error('Failed checking admin : ', error);

    return res.status(403).send(
      {
        message: "Authentication failed",
        success: false,
      });
  }
};

const validateTrip = async (req, res, next) => {

  const { tripId } = req.params;

  try {

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json(
        {
          message: 'Trip not found',
          success: false,
          data: null
        });
    }

    next();
  }
  catch (error) {
    logger.error('Error validating trip id', error);
    return res.status(500).json(
      {
        message: 'Internal Server Error',
        success: false,
        data: null
      });
  }
};

const authorizeUser = async (req, res, next) => {
  const { username } = req.body;
  const { tripId } = req.params;

  try {

    const trip = await Trip.findById(tripId);

    if (!(trip.username === username || trip.travelerCompanions.includes(username))) {
      return res.status(403).json(
        {
          message: 'You are not authorized to perform this action',
          success: false,
          data: null
        });
    }

    next();
  }
  catch (error) {
    logger.error(`Error autorizing ${username} for ${tripId}`, error);
    res.status(500).json(
      {
        message: 'Internal Server Error',
        success: false,
        data: null
      });
  }
};


const authorizeTraveler = async (req, res, next) => {
  const { username } = req.body;
  const { tripId } = req.params;

  try {

    const trip = await Trip.findById(tripId);

    if (!(trip.username === username)) {
      return res.status(403).json(
        {
          message: 'You are not authorized to perform this action',
          success: false,
          data: null
        });
    }

    next();
  }
  catch (error) {
    logger.error(`Error autorizing user for ${tripId}`, error);
    res.status(500).json(
      {
        message: 'Internal Server Error',
        success: false,
        data: null
      });
  }
};

module.exports = { isLoggedIn, validateTrip, authorizeUser, authorizeTraveler, isAdmin }