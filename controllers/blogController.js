const Blog = require("../models/Blog");

const getReadTime = (content) => {
  const wordCount = content.split(" ").length;
  const minutes = Math.ceil(wordCount / 200);
  return minutes < 1 ? "1 min read" : `${minutes} min read`;
};

const getAllBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    const totalBlogs = await Blog.countDocuments();
    const totalPages = Math.ceil(totalBlogs / limit);

    const blogs = await Blog.find()
      .populate("author", "fullName profilePic")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.render("blogs", {
      title: "Blogs - Student Blog Platform",
      currentPage: "blogs",
      blogs,
      searchQuery: "",
      page,
      totalPages
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
};

const searchBlogs = async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) return res.redirect("/blogs");

    const blogs = await Blog.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { tags: { $regex: query, $options: "i" } },
        { content: { $regex: query, $options: "i" } }
      ]
    })
      .populate("author", "fullName profilePic")
      .sort({ createdAt: -1 });

    res.render("blogs", {
      title: `Search: ${query} - Student Blog Platform`,
      currentPage: "blogs",
      blogs,
      searchQuery: query,
      page: 1,
      totalPages: 1
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
};

const getCreateBlog = (req, res) => {
  res.render("blog-create", {
    title: "Create Blog - Student Blog Platform",
    currentPage: "blogs",
    error: null
  });
};

const postCreateBlog = async (req, res) => {
  try {
    const { title, content, tags } = req.body;

    if (!title || !content) {
      return res.render("blog-create", {
        title: "Create Blog - Student Blog Platform",
        currentPage: "blogs",
        error: "Title and content are required."
      });
    }

    const coverImage = req.file ? req.file.filename : null;
    const authorId = req.session.user._id || req.user.id;

    const newBlog = new Blog({
      title,
      content,
      author: authorId,
      coverImage,
      tags: tags ? tags.split(",").map(t => t.trim()) : []
    });

    await newBlog.save();
    res.redirect("/blogs");
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
};

const getBlogDetail = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate("author", "fullName profilePic")
      .populate("comments.user", "fullName profilePic");

    if (!blog) return res.status(404).send("<h1>Blog not found</h1>");

    res.render("blog-detail", {
      title: blog.title + " - Student Blog Platform",
      currentPage: "blogs",
      blog,
      readTime: getReadTime(blog.content) 
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
};

const getEditBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("<h1>Blog not found</h1>");

    const userId = req.session.user._id || req.user.id;
    if (blog.author.toString() !== userId.toString()) {
      return res.status(403).send("<h1>Not authorized</h1>");
    }

    res.render("blog-edit", {
      title: "Edit Blog - Student Blog Platform",
      currentPage: "blogs",
      blog,
      error: null
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
};

const postEditBlog = async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("<h1>Blog not found</h1>");

    const userId = req.session.user._id || req.user.id;
    if (blog.author.toString() !== userId.toString()) {
      return res.status(403).send("<h1>Not authorized</h1>");
    }

    blog.title = title;
    blog.content = content;
    blog.tags = tags ? tags.split(",").map(t => t.trim()) : [];
    if (req.file) blog.coverImage = req.file.filename;

    await blog.save();
    res.redirect("/blogs/" + blog._id);
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
};

const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("<h1>Blog not found</h1>");

    const userId = req.session.user._id || req.user.id;
    if (blog.author.toString() !== userId.toString()) {
      return res.status(403).send("<h1>Not authorized</h1>");
    }

    await Blog.deleteOne({ _id: req.params.id });
    res.redirect("/blogs");
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
};

const likeBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("Blog not found");

    const userId = req.session.user._id || req.user.id;
    const alreadyLiked = blog.likes.includes(userId);

    if (alreadyLiked) {
      blog.likes.pull(userId);
    } else {
      blog.likes.push(userId);
    }

    await blog.save();
    res.redirect("/blogs/" + blog._id);
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
};

const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("Blog not found");

    const userId = req.session.user._id || req.user.id;

    blog.comments.push({
      user: userId,
      text: text
    });

    await blog.save();
    res.redirect("/blogs/" + blog._id);
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
};

const deleteComment = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("Blog not found");

    const userId = req.session.user._id || req.user.id;
    const comment = blog.comments.id(req.params.commentId);

    if (comment.user.toString() !== userId.toString()) {
      return res.status(403).send("<h1>Not authorized</h1>");
    }

    comment.deleteOne();
    await blog.save();
    res.redirect("/blogs/" + blog._id);
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
};

module.exports = {
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
};