const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const isLoggedIn = (req, res, next) => {
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
};

module.exports = { isLoggedIn };