const Blog = require("../models/Blog");
const Message = require("../models/Message");

// GET / - Home page
const getHome = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate("author", "fullName profilePic")
      .sort({ createdAt: -1 })
      .limit(3);

    res.render("home", {
      title: "HomePage - Student Blog Platform",
      currentPage: "home",
      blogs
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
};

// GET /about - About page
const getAbout = (req, res) => {
  res.render("about", {
    title: "AboutPage - Student Blog Platform",
    currentPage: "about"
  });
};

// GET /contact - Contact page
const getContact = (req, res) => {
  res.render("contact", {
    title: "ContactPage - Student Blog Platform",
    currentPage: "contact",
    error: null
  });
};

// POST /contact - Submit contact form
const postContact = async (req, res) => {
  try {
    const { UserName, UserEmail, message } = req.body;

    if (!UserName || !UserEmail || !message) {
      return res.render("contact", {
        title: "ContactPage - Student Blog Platform",
        currentPage: "contact",
        error: "All fields are required."
      });
    }

    const newMessage = new Message({
      fullName: UserName,
      email: UserEmail,
      message: message
    });

    await newMessage.save();

    res.render("success", {
      title: "Message Sent",
      name: UserName,
      currentPage: "success",
      message: "Your message has been sent successfully.",
      redirectUrl: "/contact",
      buttonText: "Go Back to Contact"
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong. Please try again.");
  }
};

// GET /dashboard - Dashboard page
const getDashboard = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const myBlogs = await Blog.find({ author: userId })
      .sort({ createdAt: -1 });

    let totalLikes = 0;
    let totalComments = 0;

    myBlogs.forEach(blog => {
      totalLikes += blog.likes.length;
      totalComments += blog.comments.length;
    });

    res.render("dashboard", {
      title: "Dashboard - Student Blog Platform",
      currentPage: "dashboard",
      myBlogs,
      totalLikes,
      totalComments
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
};

module.exports = {
  getHome,
  getAbout,
  getContact,
  postContact,
  getDashboard
};