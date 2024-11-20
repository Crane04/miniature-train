const express = require("express");
const router = express.Router();
const { createUser, getAllUsers, updateUser, searchUser } = require("../controllers/user.controllers");

router.post("/create", createUser);
router.get("/", getAllUsers);
router.put("/update/:userId", updateUser);
router.get("/search", searchUser);

module.exports = router;
