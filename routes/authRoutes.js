const express = require("express");
const router = express.Router();
const passport = require("passport");
const {
  getSignup,
  postSignup,
  getSignin,
  postSignin,
  logout,
  googleCallback
} = require("../controllers/authController");
const { upload } = require("../middleware/upload");

router.get("/signup", getSignup);
router.post("/signup", upload.single("profilePic"), postSignup);
router.get("/signin", getSignin);
router.post("/signin", postSignin);
router.get("/logout", logout);
router.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/signin" }),
  googleCallback
);

module.exports = router;