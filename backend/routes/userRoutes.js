const express = require("express");
const router = express.Router();
const { createUser, getAllUsers, updateUser, searchUser, getUserById, deleteUserById, clearAllUsers } = require("../controllers/user.controllers");

router.post("/create", createUser);
router.get("/", getAllUsers);
router.put("/update/:userId", updateUser);
router.get("/search", searchUser);
router.get('/:userId', getUserById);
router.delete('/:userId', deleteUserById);
router.delete('/', clearAllUsers);

module.exports = router;
