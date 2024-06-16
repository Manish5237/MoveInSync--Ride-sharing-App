const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  phoneNo:{
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
  },
  isAdmin:{
    type: Boolean,
    default: false 
  },
  isTraveler:{
    type: Boolean,
    default: false 
  },
  isTravelerCompanion:{
    type: Boolean,
    default: false 
  },
  travelerCompanionFor: {
    type: [String],
    default: []
  },
  verificationOTP: {
    type: Number,
    default: null
  },
  isVerified:{
    type: Boolean,
    default: false 
  }
});

module.exports = mongoose.model('User', userSchema);
