const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = 3000;

const DATA_FILE=path.join(__dirname,"data","messages.json");
const USERS_FILE=path.join(__dirname,"data","users.json");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static("public"));
app.use(express.urlencoded({extended:true}));



app.get("/", (req, res) => {
  res.render("home", {title: "Student Blog Platform",
    currentPage: "home"
  });
});

app.get("/contact", (req, res) => {
  res.render("contact", {title: "Contact - Student Blog Platform",
    currentPage: "contact"
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
    message: "Your message has been sent successfully.",
    redirectUrl: "/contact",
    buttonText: "Go Back to Contact"
  });
});


app.get("/about", (req, res) => {
  res.render("about", {
    title: "About - Student Blog Platform",
    currentPage: "about"
  });
});

app.get("/signup", (req, res) => {
  res.render("signup", {
    title: "Sign Up",
    error: null,
    currentPage: "signup"
  });
});

app.post("/signup", (req, res) => {
  const name = req.body.UserName;
  const email = req.body.UserEmail;
  const password= req.body.password;


  if (!name || !email || !password) {
    return res.render("signup", {
      title: "Sign Up",
      error: "All fields are required.",
      currentPage: "signup"
    });
  }

  if (!email.includes("@")) {
    return res.render("signup", {
      title: "Sign Up",
      error: "Invalid email format.",
      currentPage: "signup"
    });
  }

  if (password.length < 6) {
    return res.render("signup", {
      title: "Sign Up",
      error: "Password must be at least 6 characters.",
      currentPage: "signup"
    });
  }

  let users = [];

  if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  }

  const existingUser = users.find(user => user.email === email);

  if (existingUser) {
    return res.render("signup", {
      title: "Sign Up",
      error: "Email already registered.",
      currentPage: "signup"
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
    buttonText: "Go to Sign In"
  });

});


app.get("/signin", (req, res) => {
  res.render("signin", {
    title: "Sign In",
    error: null,
    currentPage:"signin"
  });
});

app.post("/signin", (req, res) => {
  const email = req.body.UserEmail;
  const password= req.body.password;

  if (!email || !password) {
    return res.render("signin", {
      title: "Sign In",
      error: "All fields are required.",
      currentPage: "signin"
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
      title: "Sign In",
      error: "Invalid email or password.",
      currentPage: "signin"
    });
  }


  res.render("dashboard", {
    title: "Dashboard",
    user: user,
    currentPage: "dashboard"
  });

  
});



app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});



app.use((req,res)=>{
    res.status(404).send("<h1>404 - Page Not Found</h1><p> Sorry, we couldn't find that!</p>");
  
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});