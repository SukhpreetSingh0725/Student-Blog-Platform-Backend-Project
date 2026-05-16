const express = require("express");
const router = express.Router();
const {
  getAllBlogs,
  searchBlogs,
  getCreateBlog,
  postCreateBlog,
  getBlogDetail,
  getEditBlog,
  postEditBlog,
  deleteBlog,
  likeBlog,
  addComment,
  deleteComment
} = require("../controllers/blogController");
const { isLoggedIn } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

router.get("/", getAllBlogs);
router.get("/search", searchBlogs);
router.get("/create", isLoggedIn, getCreateBlog);
router.post("/create", isLoggedIn, upload.single("coverImage"), postCreateBlog);
router.get("/:id", getBlogDetail);
router.get("/:id/edit", isLoggedIn, getEditBlog);
router.post("/:id/edit", isLoggedIn, upload.single("coverImage"), postEditBlog);
router.post("/:id/delete", isLoggedIn, deleteBlog);
router.post("/:id/like", isLoggedIn, likeBlog);
router.post("/:id/comment", isLoggedIn, addComment);
router.post("/:id/comment/:commentId/delete", isLoggedIn, deleteComment);

module.exports = router;