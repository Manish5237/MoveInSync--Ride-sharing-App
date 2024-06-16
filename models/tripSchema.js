const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  driverName: {
    type: String,
    required: true
  },
  driverPhoneNumber: {
    type: String,
    required: true
  },
  cabNumber: {
    type: String,
    required: true
  },
  travelerCompanions: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['ongoing', 'completed'],
    default: 'ongoing'
  },
  tripOTP: {
    type: String,
    required: true
  },
  sourceLatitude: {
    type: Number,
    required: true
  },
  sourceLongitude: {
    type: Number,
    required: true
  },
  destinationLatitude: {
    type: Number,
    required: true
  },
  destinationLongitude: {
    type: Number,
    required: true
  },
  currentLatitude: {
    type: Number,
    required: true
  },
  currentLongitude: {
    type: Number,
    required: true
  },
  feedbacks: {
    type: [
      {
        username: String,
        feedback: String
      }
    ],
    default: []
  }
});

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;
