const User = require("../models/User");
const Blog = require("../models/Blog");
const Message = require("../models/Message");

const getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBlogs = await Blog.countDocuments();
    const totalMessages = await Message.countDocuments();
    const totalLikes = await Blog.aggregate([
      { $project: { likesCount: { $size: "$likes" } } },
      { $group: { _id: null, total: { $sum: "$likesCount" } } }
    ]);
    const totalComments = await Blog.aggregate([
      { $project: { commentsCount: { $size: "$comments" } } },
      { $group: { _id: null, total: { $sum: "$commentsCount" } } }
    ]);

    res.render("admin/dashboard", {
      title: "Admin Dashboard - Student Blog Platform",
      currentPage: "admin",
      totalUsers,
      totalBlogs,
      totalMessages,
      totalLikes: totalLikes[0]?.total || 0,
      totalComments: totalComments[0]?.total || 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
};

const getAdminUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.render("admin/users", {
      title: "Manage Users - Admin",
      currentPage: "admin",
      users
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
};

const deleteUser = async (req, res) => {
  try {
    await User.deleteOne({ _id: req.params.id });
    await Blog.deleteMany({ author: req.params.id });
    res.redirect("/admin/users");
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
};


const getAdminBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate("author", "fullName email")
      .sort({ createdAt: -1 });

    res.render("admin/blogs", {
      title: "Manage Blogs - Admin",
      currentPage: "admin",
      blogs
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
};


const deleteAdminBlog = async (req, res) => {
  try {
    await Blog.deleteOne({ _id: req.params.id });
    res.redirect("/admin/blogs");
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
};

const getAdminMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.render("admin/messages", {
      title: "Contact Messages - Admin",
      currentPage: "admin",
      messages
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
};

const deleteMessage = async (req, res) => {
  try {
    await Message.deleteOne({ _id: req.params.id });
    res.redirect("/admin/messages");
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
};

module.exports = {
  getAdminDashboard,
  getAdminUsers,
  deleteUser,
  getAdminBlogs,
  deleteAdminBlog,
  getAdminMessages,
  deleteMessage
};