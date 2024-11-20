const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospital.controller');

// Route to create a new hospital
router.post('/create', hospitalController.createHospital);

router.post('/login', hospitalController.hospitalLogin);
router.post('/verify', hospitalController.verifyHospital);

// Route to get all hospitals
router.get('/', hospitalController.getAllHospitals);

// Route to get a hospital by registration ID
router.get('/:regId', hospitalController.getHospitalByRegId);
router.delete('/', hospitalController.clearAllHospitals);

module.exports = router;
