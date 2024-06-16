const bcrypt = require('bcrypt');
require('dotenv').config();
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const User = require('../models/UserSchema');
const jwt = require('jsonwebtoken');
const logger = require('../logger');
const JWT_SECRET = process.env.JWT_SECRET;
const mailingEmail = process.env.MAILING_EMAIL;
const mailingEmailPassword = process.env.MAILING_EMAIL_PASSWORD;

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const addUser = [
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').isLength({ min: 6 }).matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one digit'),
  body('username').notEmpty().withMessage('Username is required'),
  body('phoneNo').matches(/^\+?[0-9]{0,3}[0-9]{10}$/).withMessage('Invalid phone number format'),
  handleValidationErrors,
  async (req, res) => {

    const { email, password, username, phoneNo, isAdmin } = req.body;

    try {

      const userWithUsername = await User.findOne({ username });
      if (userWithUsername) {
        return res.status(400).json(
          {
            message: 'User with this Username already exists. Please change your username if you are registering for first time.',
            success: false,
            data: null
          });
      }

      const userWithPhoneNo = await User.findOne({ phoneNo });
      if (userWithPhoneNo) {
        return res.status(400).json(
          {
            message: 'User with this PhoneNo already exists. Please change your phone number.',
            success: false,
            data: null
          });
      }

      const userWithEmail = await User.findOne({ email });

      if (userWithEmail) {

        if (userWithEmail.isVerified) {
          return res.status(400).json(
            {
              message: 'User with this email already exists',
              success: false,
              data: null
            });
        }
        else {
          return res.status(200).json(
            {
              message: 'Your account is not verified yet. Verification OTP is sent your registered email.',
              success: true,
              data: null
            });
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const verificationOTP = Math.floor(100000 + Math.random() * 900000).toString();

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: mailingEmail,
          pass: mailingEmailPassword,
        },
      });
      const mailOptions = {
        from: mailingEmail,
        to: email,
        subject: 'Account Verification',
        text: `Thank you for registering with MoveInSync services. Please use ${verificationOTP} OTP to validate your account.`,
      };
      try {
        await transporter.sendMail(mailOptions);
      }
      catch (error) {

        logger.error('Error sending email:', error);
        res.status(500).json(
          {
            message: 'Email not sent. Please contact the developers.',
            success: false,
            data: null
          });
      }

      const newUser = new User({ email, password: hashedPassword, username, phoneNo, verificationOTP, isAdmin });
      await newUser.save();

      logger.info(`User with ${username} added successfully.`);

      res.status(201).json(
        {
          message: "User created successfully. Please verify your account. An OTP is sent to your registered email ID.",
          success: true,
          data: null
        });
    }
    catch (error) {

      logger.error('Error adding user: ', error);
      res.status(500).json(
        {
          message: 'Internal Server Error',
          success: false,
          data: null
        });
    }
  }
];

const verifyUser = [

  body('email').isEmail().withMessage('Invalid email format'),
  body('verificationOTP').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
  async (req, res) => {

    const { email, verificationOTP } = req.body;

    try {

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json(
          {
            message: 'Please enter correct email ID',
            success: false,
            data: null
          });
      }

      if (user.isVerified) {
        return res.status(201).json(
          {
            message: 'Account already verified',
            success: true,
            data: null
          });
      }

      if (user.verificationOTP !== verificationOTP) {
        return res.status(400).json(
          {
            message: 'Invalid OTP. Please enter correct OTP',
            success: true,
            data: null
          });
      }

      const updatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

      await User.updateOne({ email: email }, { verificationOTP: updatedOTP, isVerified: true });

      logger.info(`User with ${username} verified.`);

      return res.status(200).json(
        {
          message: 'Account verified successfully',
          success: true,
          data: null
        });

    }
    catch (error) {

      logger.error('Error verifying user:', error);
      res.status(500).json(
        {
          message: 'Internal Server Error',
          success: false,
          data: null
        });
    }
  }
];

const loginUser = [
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
  async (req, res) => {

    const { email, password } = req.body;

    try {

      const user = await User.findOne({ email: email });
      if (!user) {
        return res.status(400).json(
          {
            message: 'Account does not exist',
            success: false,
            data: null
          });
      }

      if (!user.isVerified) {
        return res.status(400).json(
          {
            message: 'Account not verified. Verify the account to log in.',
            success: false,
            data: null
          });
      }

      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        return res.status(400).json(
          {
            message: 'Incorrect Password',
            success: false,
            data: null
          });
      }

      const token = jwt.sign({ id: user._id, }, JWT_SECRET, { expiresIn: '1h' });

      const username = user.username

      logger.info(`Login successful for user ${username}`)

      return res.status(200).json(
        {
          message: 'Login successful',
          success: true,
          data: { token }
        });
    }
    catch (error) {
      logger.error('Error logging in user:', error);
      res.status(500).json(
        {
          message: 'Internal Server Error',
          success: false,
          data: null
        });
    }
  }
];

const forgetPassword = [
  body('email').isEmail().withMessage('Invalid email format'),
  handleValidationErrors,
  async (req, res) => {

    const { email } = req.body;

    try {

      const user = await User.findOne({ email: email });
      if (!user) {
        return res.status(400).json(
          {
            message: 'Account does not exist',
            success: false,
            data: null
          });
      }

      const verificationOTP = Math.floor(100000 + Math.random() * 900000).toString();

      await User.updateOne({ email: email }, { verificationOTP: verificationOTP });

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: mailingEmail,
          pass: mailingEmailPassword,
        },
      });

      const mailOptions = {
        from: mailingEmail,
        to: email,
        subject: 'Reset Password',
        text: `Please use ${verificationOTP} OTP to reset your password.`,
      };

      await transporter.sendMail(mailOptions);
      logger.info(`An email with an OTP is sent to ${email}.`);

      return res.status(200).json(
        {
          message: `An email with an OTP is sent to ${email}. Please use this OTP to reset your password.`,
          success: true,
          data: null
        });

    }
    catch (error) {
      logger.error('Error in forget password:', error);
      return res.status(500).json(
        {
          message: 'Internal Server Error',
          success: false,
          data: null
        });
    }
  }
];

const resetPassword = [
  body('email').isEmail().withMessage('Invalid email format'),
  body('verificationOTP').notEmpty().withMessage('OTP is required'),

  body('newPassword')
    .isLength({ min: 6 })
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one digit'),

  body('verifyNewPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),

  handleValidationErrors,

  async (req, res) => {

    const { email, verificationOTP, newPassword } = req.body;

    try {

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json(
          {
            message: 'User does not exist',
            success: false,
            data: null
          });
      }

      if (verificationOTP !== user.verificationOTP) {
        return res.status(400).json(
          {
            message: 'Invalid OTP',
            success: false,
            data: null
          });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const updatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

      await User.updateOne({ email }, { password: hashedPassword, verificationOTP: updatedOTP });

      logger.info('Password reset successfully')

      return res.status(200).json(
        {
          message: 'Password reset successfully',
          success: true,
          data: null
        });
    }
    catch (error) {

      logger.error('Error resetting password:', error);
      return res.status(500).json(
        {
          message: 'Internal Server Error',
          success: false,
          data: null
        });
    }
  }
];

const updatePassword = [

  body('email').isEmail().withMessage('Invalid email format'),

  body('newPassword')
    .isLength({ min: 6 })
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one digit'),

  body('verifyNewPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),

  handleValidationErrors,

  async (req, res) => {

    const { email, newPassword } = req.body;

    try {

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await User.updateOne({ email }, { password: hashedPassword });

      logger.info('Password updated successfully')

      return res.status(200).json(
        {
          message: 'Password updated successfully',
          success: true,
          data: null
        });
    }
    catch (error) {

      logger.error('Error updating password:', error);
      return res.status(500).json(
        {
          message: 'Internal Server Error',
          success: false,
          data: null
        });
    }
  }
];

module.exports = { addUser, verifyUser, loginUser, forgetPassword, resetPassword, updatePassword };
