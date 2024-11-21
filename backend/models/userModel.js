const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    address: { type: String, required: true },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true,
    },
    genotype: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    disability: { type: String, default: null }, // Null if no disability
    previousHospitals: [
      {
        hospitalName: { type: String, required: true },
        dateVisited: { type: Date, default: Date.now }, // Default to current date
      },
    ],
    phoneNumber: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    profilePicture: {
      data: Buffer, // Binary data for the image
      contentType: String, // MIME type (e.g., 'image/png', 'image/jpeg')
    },
    additionalNotes: {
      type: String,
      default: null, // Null if no additional notes
    }
  },
  { timestamps: true } // Adds createdAt and updatedAt fields automatically
);

module.exports = mongoose.model('User', userSchema);
