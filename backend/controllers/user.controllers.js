const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Hospital = require('../models/hospitalModel');
const multer = require('multer');
require("dotenv").config()

const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Directory to save files
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Append unique name
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
}).single('profilePicture'); // Expect 'profilePicture' as the key


// Create user with profile picture and hospital linkage
exports.createUser = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: 'Error uploading file', error: err.message });
    }

    try {
      // Extract JWT token from headers
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'Authorization token is required.' });
      }

      // Verify JWT token and extract hospital details
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      const hospital = await Hospital.findOne({ regId: decoded.regId });
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

      // Validate required fields
      const requiredFields = {
        fullName: 'Full Name is required.',
        address: 'Address is required.',
        gender: 'Gender is required.',
        genotype: 'Genotype is required.',
        bloodGroup: 'Blood Group is required.',
        phoneNumber: 'Phone Number is required.',
        dateOfBirth: 'Date of Birth is required.',
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([key]) => !req.body[key])
        .map(([, message]) => message);

      if (missingFields.length > 0) {
        return res.status(400).json({ message: 'Validation Error', errors: missingFields });
      }

      // Initialize the new user object
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
            dateVisited: new Date(), // Record current hospital visit
          },
        ],
      });

      // Handle profile picture if uploaded
      if (req.file) {
        newUser.image = req.file ? `/uploads/${req.file.filename}` : null
      }

      // Save the new user to the database
      await newUser.save();

      res.status(201).json({
        message: 'User created successfully',
        user: newUser,
      });
    } catch (error) {
      res.status(500).json({ message: 'Error creating user', error: error.message });
    }
  });
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

exports.searchUser = async (req, res) => {
  try {
    const {
      fullName,
      address,
      gender,
      genotype,
      bloodGroup,
      illness,
      hospitalName,
      phoneNumber,
      dateOfBirth,
      disability,
    } = req.query;

    // Build the search query object
    const searchQuery = {};

    // Full Name (Case-insensitive partial search)
    if (fullName) {
      searchQuery.fullName = { $regex: fullName, $options: 'i' };
    }

    // Address (Case-insensitive partial search)
    if (address) {
      searchQuery.address = { $regex: address, $options: 'i' };
    }

    // Gender (Exact match)
    if (gender) {
      searchQuery.gender = gender;
    }

    // Genotype (Exact match)
    if (genotype) {
      searchQuery.genotype = genotype;
    }

    // Blood Group (Exact match)
    if (bloodGroup) {
      searchQuery.bloodGroup = bloodGroup;
    }

    // Illness (Partial search within previous illnesses)
    if (illness) {
      searchQuery['previousIllnesses.illness'] = { $regex: illness, $options: 'i' };
    }

    // Hospital Name (Partial search within previous hospitals)
    if (hospitalName) {
      searchQuery['previousHospitals.hospitalName'] = { $regex: hospitalName, $options: 'i' };
    }

    // Phone Number (Case-insensitive partial search)
    if (phoneNumber) {
      searchQuery.phoneNumber = { $regex: phoneNumber, $options: 'i' };
    }

    // Date of Birth (Exact match or range if needed)
    if (dateOfBirth) {
      searchQuery.dateOfBirth = new Date(dateOfBirth);
    }

    // Disability (Exact match)
    if (disability) {
      searchQuery.disability = { $regex: disability, $options: 'i' };
    }

    // Perform the search using the built query
    const users = await User.find(searchQuery);

    // If no users are found
    if (users.length === 0) {
      return res.status(404).json({ message: 'No users found matching your search.' });
    }

    // Return the search results
    res.status(200).json({
      message: 'Search results',
      users,
    });
  } catch (err) {
    // Handle errors
    res.status(500).json({ message: 'Error searching users', error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params; // Get the userId from the URL parameters

    // Fetch the user from the database
    const user = await User.findById(userId);

    // Check if user exists
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    

    // Return the user data
    res.status(200).json({
      message: 'User retrieved successfully',
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving user',
      error: error.message,
    });
  }
};

exports.deleteUserById = async (req, res) => {
  try {
    const { userId } = req.params; // Get the userId from the URL parameters

    // Check if the user exists
    const user = await User.find({_id: userId});
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const deletedUser = await User.findByIdAndDelete(userId);
    console.log('Deleted User:', deletedUser); // Log the deleted user


    const users = await User.find();

    res.status(200).json({
      message: 'User deleted successfully',
      users
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting user',
      error: error.message,
    });
  }
};

exports.clearAllUsers = async (req, res) => {
  try {
    // Delete all documents in the Hospital collection
    await User.deleteMany({});

    // Return a success message after clearing the hospitals
    res.status(200).json({ message: 'All hospitals have been cleared successfully.' });
  } catch (err) {
    // If there's an error, return a 500 status with the error message
    res.status(500).json({ message: 'Error clearing hospitals', error: err.message });
  }
};