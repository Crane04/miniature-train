const express = require("express");
const router = express.Router();
const { createUser } = require("../controllers/user.controllers");

router.post("/create", createUser);

module.exports = router;
