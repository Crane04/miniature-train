const Hospital = require('../models/hospitalModel');
const { sendEmail } = require('../utils/emailSender')
// Create a new hospital
exports.createHospital = async (req, res) => {
  try {
    const { name, regId, hospitalType, contactEmail, address } = req.body;

    // Check if any of the fields are empty
    if (!name || !regId || !hospitalType || !contactEmail || !address) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Create the new hospital document
    const newHospital = new Hospital({
      name,
      regId,
      hospitalType,
      contactEmail,
      address,
    });
    
    // Save the new hospital to the database
    await newHospital.save();

    // // Prepare the email content
    // const subject = 'Hospital Registration Pending';
    // const text = `Dear ${name},\n\nThank you for registering your hospital with us. Your registration is currently pending and will be reviewed shortly.\n\nWe will notify you once the registration process is complete.`;
    // const html = `<p>Dear <strong>${name}</strong>,</p><p>Thank you for registering your hospital with us. Your registration is currently pending and will be reviewed shortly.</p><p>We will notify you once the registration process is complete.</p>`;

    // // Send email to the provided contact email
    // await sendEmail(contactEmail, subject, text, html);

    // Respond with success message and the new hospital data
    res.status(201).json({ message: 'Hospital created successfully, and email sent!', hospital: newHospital });
  } catch (err) {
    // If there's an error, return a 500 status with the error message
    res.status(500).json({ message: 'Error creating hospital', error: err.message });
  }
};

// Get all hospitals
exports.getAllHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find();
    res.status(200).json(hospitals);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching hospitals', error: err.message });
  }
};

// Get a hospital by registration ID
exports.getHospitalByRegId = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ regId: req.params.regId });
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }
    res.status(200).json(hospital);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching hospital', error: err.message });
  }
};

exports.clearAllHospitals = async (req, res) => {
  try {
    // Delete all documents in the Hospital collection
    await Hospital.deleteMany({});

    // Return a success message after clearing the hospitals
    res.status(200).json({ message: 'All hospitals have been cleared successfully.' });
  } catch (err) {
    // If there's an error, return a 500 status with the error message
    res.status(500).json({ message: 'Error clearing hospitals', error: err.message });
  }
};