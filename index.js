const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const app = express();
const PORT = 3000;
let currentUser = null;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static("public"));
app.use(express.urlencoded({extended:true}));

mongoose.connect("mongodb://127.0.0.1:27017/student_blog")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

const User = require("./models/User");
const Message = require("./models/Message");


app.get("/", (req, res) => {
  res.render("home", {title: "HomePage - Student Blog Platform",
    currentPage: "home",
    user: currentUser
  });
});

app.get("/contact", (req, res) => {
  res.render("contact", {title: "ContactPage - Student Blog Platform",
    currentPage: "contact",
    user: currentUser
  });
});


app.post("/contact", async (req,res)=>{ 
  const newMessage = new Message({
    fullName: req.body.UserName,
    email: req.body.UserEmail,
    message: req.body.message
  });
  
await newMessage.save();
res.render("success",{title: "Message Sent",
    name: req.body.UserName,
    currentPage: "success",
    user: currentUser,
    message: "Your message has been sent successfully.",
    redirectUrl: "/contact",
    buttonText: "Go Back to Contact"
  });
});


app.get("/about", (req, res) => {
  res.render("about", {
    title: "AboutPage - Student Blog Platform",
    currentPage: "about",
    user: currentUser
  });
});

app.get("/signup", (req, res) => {
  res.render("signup", {
    title: "SignUp- Student Blog Platform",
    error: null,
    currentPage: "signup",
    user: currentUser
  });
});

app.post("/signup", async(req, res) => {
  const name = req.body.UserName;
  const email = req.body.UserEmail;
  const password= req.body.password;
  const confirmPassword = req.body.confirmPassword;


  if (!name || !email || !password || !confirmPassword) {
    return res.render("signup", {
      title: "SignUp- Student Blog Platform",
      error: "All fields are required.",
      currentPage: "signup",
      user: currentUser
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return res.render("signup", {
      title: "SignUp- Student Blog Platform",
      error: "Invalid email format.",
      currentPage: "signup",
      user: currentUser
    });
  }

  if (password.length < 6) {
    return res.render("signup", {
      title: "SignUp- Student Blog Platform",
      error: "Password must be at least 6 characters.",
      currentPage: "signup",
      user: currentUser
    });
  }

  if (password !== confirmPassword) {
    return res.render("signup", {
      title: "SignUp- Student Blog Platform",
      error: "Passwords do not match.",
      currentPage: "signup",
      user: currentUser
    });
  }

  

  const existingUser = await User.findOne({email: email});

  if (existingUser) {
    return res.render("signup", {
      title: "SignUp- Student Blog Platform",
      error: "Email already registered.",
      currentPage: "signup",
      user: currentUser
    });
  }

  const newUser = new User({
    fullName: name,
    email: email,
    password: password
  });
  await newUser.save();

  res.render("success", {
    title: "Account Created",
    name: name,
    currentPage: "success",
    message: "Your account has been created successfully.",
    redirectUrl: "/signin",
    buttonText: "Go to Sign In",
    user: currentUser
  });

});


app.get("/signin", (req, res) => {
  res.render("signin", {
    title: "SignIn- Student Blog Platform",
    error: null,
    currentPage:"signin",
    user: currentUser
  });
});

app.post("/signin", async (req, res) => {
  const email = req.body.UserEmail;
  const password= req.body.password;

  if (!email || !password) {
    return res.render("signin", {
      title: "SignIn- Student Blog Platform",
      error: "All fields are required.",
      currentPage: "signin",
      user: currentUser
    });
  }

  const user = await User.findOne({ email: email });

  if (!user || user.password!==password) {
    return res.render("signin", {
      title: "SignIn- Student Blog Platform",
      error: "Invalid email or password.",
      currentPage: "signin",
      user: currentUser
    });
  }
  currentUser = user;
  res.redirect("/dashboard");

});

app.get("/dashboard", (req, res) => {

  if (!currentUser) {
    return res.redirect("/signin");
  }

  res.render("dashboard", {
    title: "Dashboard - Student Blog Platform",
    currentPage: "dashboard",
    user: currentUser
  });
});

app.get("/profile", (req, res) => {

  if (!currentUser) {
    return res.redirect("/signin");
  }

  res.render("profile", {
    title: "Profile - Student Blog Platform",
    currentPage: "profile",
    user: currentUser
  });

});

app.post("/update-profile", async (req, res) => {

  const newName = req.body.name;
  const newPassword = req.body.password;

  const user = await User.findOne({ email: currentUser.email });

  if (user) {
    user.fullName = newName;

    if (newPassword) {
      user.password = newPassword;
    }

    await user.save();
    currentUser = user;
  }

  res.redirect("/profile");
});

app.post("/delete-account", async (req, res) => {

  await User.deleteOne({ email: currentUser.email });

  currentUser = null;

  res.redirect("/signup");
});

app.get("/logout", (req, res) => {
  currentUser = null;
  res.redirect("/");
});

app.use((req, res) => {
  res.status(404).send("<h1>404 - Page Not Found</h1>");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});