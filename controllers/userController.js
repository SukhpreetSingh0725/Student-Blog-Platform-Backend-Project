const User = require("../models/User");

const getProfile = (req, res) => {
  res.render("profile", {
    title: "Profile - Student Blog Platform",
    currentPage: "profile"
  });
};


const updateProfile = async (req, res) => {
  try {
    const { name, password } = req.body;
    const user = await User.findOne({ email: req.session.user.email });

    if (user) {
      user.fullName = name;
      if (password) {
        user.password = password;
      }
      if (req.file) {
        user.profilePic = req.file.filename;
      }
      await user.save();
      req.session.user = user;
    }

    res.render("profile", {
      title: "Profile - Student Blog Platform",
      currentPage: "profile",
      success: true
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong. Please try again.");
  }
};


const deleteAccount = async (req, res) => {
  try {
    await User.deleteOne({ email: req.session.user.email });
    req.session.destroy((err) => {
      if (err) console.error(err);
      res.redirect("/signup");
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong. Please try again.");
  }
};

module.exports = {
  getProfile,
  updateProfile,
  deleteAccount
};