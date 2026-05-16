require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const cookieParser = require("cookie-parser");
const passport = require("passport");
const connectDB = require("./config/db");

const app = express();
const PORT = 3000;
connectDB();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 12,
    httpOnly: true
  },
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URL
  })
}));

app.use(passport.initialize());
app.use(passport.session());
require("./auth/google")(passport);

const User = require("./models/User");
const jwt = require("jsonwebtoken");

app.use(async (req, res, next) => {
  try {
    if (req.session.user) {
      const user = await User.findById(req.session.user._id);
      res.locals.user = user;
      return next();
    }

    const token = req.cookies?.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

const pageRoutes = require("./routes/pageRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const blogRoutes = require("./routes/blogRoutes");

app.use("/", pageRoutes);
app.use("/", authRoutes);
app.use("/", userRoutes);
app.use("/blogs", blogRoutes);

app.use((req, res) => {
  res.status(404).send("<h1>404 - Page Not Found</h1>");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});