const User = require("../models/User");

const isAdmin = async (req, res, next) => {
  try {
    if (!res.locals.user) {
      return res.redirect("/signin");
    }

    const user = await User.findById(res.locals.user._id);

    if (!user || !user.isAdmin) {
      return res.redirect("/signin");
    }

    next();
  } catch (err) {
    console.error(err);
    res.redirect("/signin");
  }
};

module.exports = { isAdmin };