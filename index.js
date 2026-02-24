const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static("public"));


app.get("/", (req, res) => {
  res.render("home", {title: "Student Blog Platform"});
});

app.use((req,res)=>{
    res.status(404).send("<h1>404 - Page Not Found</h1><p> Sorry, we couldn't find that!</p>");
  
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});