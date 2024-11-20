const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Hospital = require('../models/hospitalModel');
require("dotenv").config()

// Create user with profile picture and hospital linkage
exports.createUser = async (req, res) => {
  try {
    // Extract JWT token from headers
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authorization token is required.' });
    }

    // Verify JWT token and extract hospital details
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const hospital = await Hospital.findOne({regId:decoded.regId});
    if (!hospital) {
      return res.status(404).json({ message: 'Invalid hospital authorization.' });
    }

    // Extract fields from request body
    const {
      fullName,
      address,
      gender,
      genotype,
      bloodGroup,
      phoneNumber,
      dateOfBirth,
    } = req.body;

    // Validate required fields one by one
    const missingFields = [];
    if (!fullName) missingFields.push('Full Name is required.');
    if (!address) missingFields.push('Address is required.');
    if (!gender) missingFields.push('Gender is required.');
    if (!genotype) missingFields.push('Genotype is required.');
    if (!bloodGroup) missingFields.push('Blood Group is required.');
    if (!phoneNumber) missingFields.push('Phone Number is required.');
    if (!dateOfBirth) missingFields.push('Date of Birth is required.');

    if (missingFields.length > 0) {
      return res.status(400).json({ message: 'Validation Error', errors: missingFields });
    }

    // Create the new user
    const newUser = new User({
      fullName,
      address,
      gender,
      genotype,
      bloodGroup,
      phoneNumber,
      dateOfBirth,
      previousHospitals: [
        {
          hospitalName: hospital.name,
          dateVisited: new Date(), // Current date
        },
      ],
    });

    // If a profile picture is uploaded, save it
    if (req.file) {
      newUser.profilePicture.data = req.file.buffer;
      newUser.profilePicture.contentType = req.file.mimetype;
    }

    await newUser.save();

    res.status(201).json({
      message: 'User created successfully',
      user: newUser,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await User.find();

    // Return the users as a JSON response
    res.status(200).json({
      message: 'Users retrieved successfully',
      users,
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({
      message: 'Error retrieving users',
      error: error.message,
    });
  }
};

// Update user details and add the current hospital as previous hospital
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params; // Get userId from URL params
    const updateData = req.body; // Get data to update from request body

    // Check if the user is authenticated and get their hospital
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authorization token is required.' });
    }

    // Verify JWT token and extract hospital details
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const hospital = await Hospital.findOne({regId:decoded.regId});
    if (!hospital) {
      return res.status(404).json({ message: 'Invalid hospital authorization.' });
    }

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add the current hospital to the previousHospitals array (if not already added)
    if (!user.previousHospitals.some(h => h.hospitalName === hospital.name)) {
      user.previousHospitals.push({
        hospitalName: hospital.name,
        dateVisited: new Date(),
      });
    }

    // Update the user details
    const updatedUser = await User.findByIdAndUpdate(userId, { ...updateData, previousHospitals: user.previousHospitals }, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating user',
      error: error.message,
    });
  }
};
