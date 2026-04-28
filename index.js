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

function isLoggedIn(req, res, next) {
  const token = req.cookies?.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      res.clearCookie("token");
    }
  }
  if (req.session.user) {
    return next();
  }

  res.redirect("/signin");
}

app.get("/dashboard", isLoggedIn, (req, res) => {
  res.render("dashboard", {
    title: "Dashboard - Student Blog Platform",
    currentPage: "dashboard"
  });
});

app.get("/profile", isLoggedIn, (req, res) => {
  res.render("profile", {
    title: "Profile - Student Blog Platform",
    currentPage: "profile"
  });
});

app.post("/update-profile", isLoggedIn, upload.single("profilePic"), async (req, res) => {
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
});

app.post("/delete-account", isLoggedIn, async (req, res) => {
  try {
    await User.deleteOne({ email: req.session.user.email });
    req.session.destroy(); 
    res.redirect("/signup");
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong. Please try again.");
  }
});


app.get("/logout", (req, res) => {
  res.clearCookie("token"); 
  res.clearCookie("connect.sid"); 
  req.session.destroy((err) => { 
    if (err) console.error(err);
    res.redirect("/");
  });
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/signin" }),
  async (req, res) => {
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
  }
);


app.get("/blogs", async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate("author", "fullName profilePic")
      .sort({ createdAt: -1 });

    res.render("blogs", {
      title: "Blogs - Student Blog Platform",
      currentPage: "blogs",
      blogs,
      searchQuery: ""
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
});

app.get("/blogs/create", isLoggedIn, (req, res) => {
  res.render("blog-create", {
    title: "Create Blog - Student Blog Platform",
    currentPage: "blogs",
    error: null
  });
});

app.post("/blogs/create", isLoggedIn, upload.single("coverImage"), async (req, res) => {
  try {
    const { title, content, tags } = req.body;

    if (!title || !content) {
      return res.render("blog-create", {
        title: "Create Blog - Student Blog Platform",
        currentPage: "blogs",
        error: "Title and content are required."
      });
    }

    const coverImage = req.file ? req.file.filename : null;
    const authorId = req.session.user._id || req.user.id;

    const newBlog = new Blog({
      title,
      content,
      author: authorId,
      coverImage,
      tags: tags ? tags.split(",").map(t => t.trim()) : []
    });

    await newBlog.save();
    res.redirect("/blogs");
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
});

// ✅ Search blogs
app.get("/blogs/search", async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) return res.redirect("/blogs");

    const blogs = await Blog.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { tags: { $regex: query, $options: "i" } },
        { content: { $regex: query, $options: "i" } }
      ]
    })
    .populate("author", "fullName profilePic")
    .sort({ createdAt: -1 });

    res.render("blogs", {
      title: `Search: ${query} - Student Blog Platform`,
      currentPage: "blogs",
      blogs,
      searchQuery: query
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
});

app.get("/blogs/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate("author", "fullName profilePic")
      .populate("comments.user", "fullName profilePic");

    if (!blog) return res.status(404).send("<h1>Blog not found</h1>");

    res.render("blog-detail", {
      title: blog.title + " - Student Blog Platform",
      currentPage: "blogs",
      blog
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
});

app.get("/blogs/:id/edit", isLoggedIn, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("<h1>Blog not found</h1>");

    const userId = req.session.user._id || req.user.id;
    if (blog.author.toString() !== userId.toString()) {
      return res.status(403).send("<h1>Not authorized</h1>");
    }

    res.render("blog-edit", {
      title: "Edit Blog - Student Blog Platform",
      currentPage: "blogs",
      blog,
      error: null
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
});

app.post("/blogs/:id/edit", isLoggedIn, upload.single("coverImage"), async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("<h1>Blog not found</h1>");

    const userId = req.session.user._id || req.user.id;
    if (blog.author.toString() !== userId.toString()) {
      return res.status(403).send("<h1>Not authorized</h1>");
    }

    blog.title = title;
    blog.content = content;
    blog.tags = tags ? tags.split(",").map(t => t.trim()) : [];
    if (req.file) blog.coverImage = req.file.filename;

    await blog.save();
    res.redirect("/blogs/" + blog._id);
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
});

app.post("/blogs/:id/delete", isLoggedIn, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("<h1>Blog not found</h1>");

    const userId = req.session.user._id || req.user.id;
    if (blog.author.toString() !== userId.toString()) {
      return res.status(403).send("<h1>Not authorized</h1>");
    }

    await Blog.deleteOne({ _id: req.params.id });
    res.redirect("/blogs");
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
});

app.post("/blogs/:id/like", isLoggedIn, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("Blog not found");

    const userId = req.session.user._id || req.user.id;
    const alreadyLiked = blog.likes.includes(userId);

    if (alreadyLiked) {
      blog.likes.pull(userId);
    } else {
      blog.likes.push(userId);
    }

    await blog.save();
    res.redirect("/blogs/" + blog._id);
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
});

app.post("/blogs/:id/comment", isLoggedIn, async (req, res) => {
  try {
    const { text } = req.body;
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("Blog not found");

    const userId = req.session.user._id || req.user.id;

    blog.comments.push({
      user: userId,
      text: text
    });

    await blog.save();
    res.redirect("/blogs/" + blog._id);
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
});

app.post("/blogs/:id/comment/:commentId/delete", isLoggedIn, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("Blog not found");

    const userId = req.session.user._id || req.user.id;
    const comment = blog.comments.id(req.params.commentId);

    if (comment.user.toString() !== userId.toString()) {
      return res.status(403).send("<h1>Not authorized</h1>");
    }

    comment.deleteOne();
    await blog.save();
    res.redirect("/blogs/" + blog._id);
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
});



app.use((req, res) => {
  res.status(404).send("<h1>404 - Page Not Found</h1>");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});