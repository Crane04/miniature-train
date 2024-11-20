const express = require("express");
const router = express.Router();
const { createUser, getAllUsers } = require("../controllers/user.controllers");

router.post("/create", createUser);
router.get("/", getAllUsers);

module.exports = router;
