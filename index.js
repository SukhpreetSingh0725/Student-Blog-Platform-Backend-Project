const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = 3000;

const DATA_FILE=path.join(__dirname,"data","messages.json");

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
    name: req.body.UserName
  });
});


app.get("/about", (req, res) => {
  res.render("about", {
    title: "About - Student Blog Platform",
    currentPage: "about"
  });
});

app.use((req,res)=>{
    res.status(404).send("<h1>404 - Page Not Found</h1><p> Sorry, we couldn't find that!</p>");
  
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});