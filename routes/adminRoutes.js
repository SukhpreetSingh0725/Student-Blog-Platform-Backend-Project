const express = require("express");
const router = express.Router();
const {
  getAdminDashboard,
  getAdminUsers,
  deleteUser,
  getAdminBlogs,
  deleteAdminBlog,
  getAdminMessages,
  deleteMessage
} = require("../controllers/adminController");
const { isLoggedIn } = require("../middleware/auth");
const { isAdmin } = require("../middleware/isAdmin");

router.use(isLoggedIn, isAdmin);

router.get("/", getAdminDashboard);
router.get("/users", getAdminUsers);
router.post("/users/:id/delete", deleteUser);
router.get("/blogs", getAdminBlogs);
router.post("/blogs/:id/delete", deleteAdminBlog);
router.get("/messages", getAdminMessages);
router.post("/messages/:id/delete", deleteMessage);

module.exports = router;