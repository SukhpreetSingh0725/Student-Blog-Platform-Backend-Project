const User = require("../models/User");
const Blog = require("../models/Blog"); 
const { deleteFile } = require("../middleware/upload");

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
        if (user.profilePic) {
          deleteFile(user.profilePic);
        }
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
    const user = await User.findOne({ email: req.session.user.email });

    if (user) {
      if (user.profilePic) {
        deleteFile(user.profilePic);
      }
      const userBlogs = await Blog.find({ author: user._id });
      userBlogs.forEach(blog => {
        if (blog.coverImage) {
          deleteFile(blog.coverImage);
        }
      });


      await Blog.deleteMany({ author: user._id });
      await User.deleteOne({ email: req.session.user.email });
    }

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