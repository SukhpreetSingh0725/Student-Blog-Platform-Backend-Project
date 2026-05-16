const express = require("express");
const router = express.Router();
const {
  getHome,
  getAbout,
  getContact,
  postContact,
  getDashboard
} = require("../controllers/pageController");
const { isLoggedIn } = require("../middleware/auth");

router.get("/", getHome);
router.get("/about", getAbout);
router.get("/contact", getContact);
router.post("/contact", postContact);
router.get("/dashboard", isLoggedIn, getDashboard);

module.exports = router;