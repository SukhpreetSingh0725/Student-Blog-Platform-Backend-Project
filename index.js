const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = 3000;
let currentUser = null;

const DATA_FILE=path.join(__dirname,"data","messages.json");
const USERS_FILE=path.join(__dirname,"data","users.json");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static("public"));
app.use(express.urlencoded({extended:true}));



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


app.post("/contact",(req,res)=>{
  const name = req.body.UserName;
  const email = req.body.UserEmail;
  const message= req.body.message;

 
  
  
  const newMessages={
      name: req.body.UserName,
      email: req.body.UserEmail,
      message: req.body.message,
      date: new Date().toLocaleString()
  };

  let messages=[];
  if(fs.existsSync(DATA_FILE)){
      const fileData = fs.readFileSync(DATA_FILE,"utf-8");
      messages =JSON.parse(fileData);
  }
  messages.push(newMessages);
  fs.writeFileSync(DATA_FILE,JSON.stringify(messages,null,2));

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

app.post("/signup", (req, res) => {
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

  let users = [];

  if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  }

  const existingUser = users.find(user => user.email === email);

  if (existingUser) {
    return res.render("signup", {
      title: "SignUp- Student Blog Platform",
      error: "Email already registered.",
      currentPage: "signup",
      user: currentUser
    });
  }

  const newuser={
    name: req.body.UserName,
    email: req.body.UserEmail,
    password: req.body.password,
    date: new Date().toLocaleString()
};

  users.push(newuser);

  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

  res.render("success", {
    title: "Account Created",
    name: req.body.UserName,
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

app.post("/signin", (req, res) => {
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

  let users = [];

  if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  }

  const user = users.find(
    user =>
      user.email.toLowerCase() === email.toLowerCase() &&
      user.password === password
  );

  if (!user) {
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

app.post("/update-profile", (req, res) => {

  const newName = req.body.name;
  const newPassword = req.body.password;
  let users = JSON.parse(fs.readFileSync(USERS_FILE));
  const index = users.findIndex(u => u.email === currentUser.email);

  if (index !== -1) {
    users[index].name = newName;
    if (newPassword) {
      users[index].password = newPassword;
    }
    currentUser = users[index];
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  }
  res.redirect("/profile");

});

app.post("/delete-account", (req, res) => {

  let users = JSON.parse(fs.readFileSync(USERS_FILE));
  users = users.filter(u => u.email !== currentUser.email);
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  currentUser = null;
  res.redirect("/signup");

});


app.get("/logout", (req, res) => {
  currentUser = null;
  res.redirect("/");
});



app.use((req,res)=>{
    res.status(404).send("<h1>404 - Page Not Found</h1><p> Sorry, we couldn't find that!</p>");
  
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});