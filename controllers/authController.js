const User = require("../models/User");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

// GET /signup
const getSignup = (req, res) => {
  res.render("signup", {
    title: "SignUp - Student Blog Platform",
    error: null,
    currentPage: "signup"
  });
};

// POST /signup
const postSignup = async (req, res) => {
  try {
    const { UserName: name, UserEmail: email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.render("signup", {
        title: "SignUp - Student Blog Platform",
        error: "All fields are required.",
        currentPage: "signup",
        formData: { name, email }
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.render("signup", {
        title: "SignUp - Student Blog Platform",
        error: "Invalid email format.",
        currentPage: "signup",
        formData: { name, email }
      });
    }

    if (password.length < 6) {
      return res.render("signup", {
        title: "SignUp - Student Blog Platform",
        error: "Password must be at least 6 characters.",
        currentPage: "signup",
        formData: { name, email }
      });
    }

    if (password !== confirmPassword) {
      return res.render("signup", {
        title: "SignUp - Student Blog Platform",
        error: "Passwords do not match.",
        currentPage: "signup",
        formData: { name, email }
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("signup", {
        title: "SignUp - Student Blog Platform",
        error: "Email already registered.",
        currentPage: "signup",
        formData: { name, email }
      });
    }

    const profilePic = req.file ? req.file.filename : "default-avatar.png";

    const newUser = new User({
      fullName: name,
      email,
      password,
      profilePic
    });
    await newUser.save();

    res.render("success", {
      title: "Account Created",
      name,
      currentPage: "success",
      message: "Your account has been created successfully.",
      redirectUrl: "/signin",
      buttonText: "Go to Sign In"
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong. Please try again.");
  }
};

// GET /signin
const getSignin = (req, res) => {
  res.render("signin", {
    title: "SignIn - Student Blog Platform",
    error: null,
    currentPage: "signin"
  });
};

// POST /signin
const postSignin = async (req, res) => {
  try {
    const { UserEmail: email, password } = req.body;

    if (!email || !password) {
      return res.render("signin", {
        title: "SignIn - Student Blog Platform",
        error: "All fields are required.",
        currentPage: "signin",
        emailValue: email
      });
    }

    const user = await User.findOne({ email });
    const isMatch = user && await user.comparePassword(password);

    if (!isMatch) {
      return res.render("signin", {
        title: "SignIn - Student Blog Platform",
        error: "Invalid email or password.",
        currentPage: "signin",
        emailValue: email
      });
    }

    // ✅ Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    // ✅ Store in cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    });

    req.session.user = user;
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong. Please try again.");
  }
};

// GET /logout
const logout = (req, res) => {
  res.clearCookie("token");
  res.clearCookie("connect.sid");
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.redirect("/");
  });
};

// GET /auth/google/callback
const googleCallback = async (req, res) => {
  req.session.user = req.user;

  const token = jwt.sign(
    { id: req.user._id, email: req.user.email, fullName: req.user.fullName },
    JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  });

  res.redirect("/dashboard");
};

module.exports = {
  getSignup,
  postSignup,
  getSignin,
  postSignin,
  logout,
  googleCallback
};