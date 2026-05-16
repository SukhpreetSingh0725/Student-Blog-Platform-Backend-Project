const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  deleteAccount
} = require("../controllers/userController");
const { isLoggedIn } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

router.get("/profile", isLoggedIn, getProfile);
router.post("/update-profile", isLoggedIn, upload.single("profilePic"), updateProfile);
router.post("/delete-account", isLoggedIn, deleteAccount);

module.exports = router;