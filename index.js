require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const multer = require("multer");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "student_blog_jwt_secret_key";
const cookieParser = require("cookie-parser");
const passport = require("passport");
const app = express();
const PORT = 3000;


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(cookieParser());
app.use(express.urlencoded({extended:true}));

app.use(session({
  secret: "student_blog_secret_key",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 12 },
  store: MongoStore.create({      
    mongoUrl: "mongodb://127.0.0.1:27017/student_blog"
  })
}));


app.use(passport.initialize());
app.use(passport.session());

require("./auth/google")(passport); 

mongoose.connect("mongodb://127.0.0.1:27017/student_blog")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

const User = require("./models/User");
const Message = require("./models/Message");
const Blog = require("./models/Blog");
app.use(async (req, res, next) => {
  try {
    if (req.session.user) {
      const user = await User.findById(req.session.user._id);
      res.locals.user = user;
      return next();
    }


    const token = req.cookies?.token;
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);
      res.locals.user = user;
      req.session.user = user;
      return next();
    }

    res.locals.user = null;
    next();
  } catch (err) {
    res.locals.user = null;
    next();
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed!"), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
});

app.get("/", async (req, res) => {
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
});

app.get("/contact", (req, res) => {
  res.render("contact", {title: "ContactPage - Student Blog Platform",
    currentPage: "contact",
  });
});


app.post("/contact", async (req, res) => {
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
});


app.get("/about", (req, res) => {
  res.render("about", {
    title: "AboutPage - Student Blog Platform",
    currentPage: "about",
  });
});

app.get("/signup", (req, res) => {
  res.render("signup", {
    title: "SignUp- Student Blog Platform",
    error: null,
    currentPage: "signup",
  });
});

app.post("/signup", upload.single("profilePic"), async (req, res) => {
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
});



app.get("/signin", (req, res) => {
  res.render("signin", {
    title: "SignIn- Student Blog Platform",
    error: null,
    currentPage:"signin",
  });
});

app.post("/signin", async (req, res) => {
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
    const token = jwt.sign(
      { id: user._id, email: user.email, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

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
});

