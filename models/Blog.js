const mongoose = require("mongoose");
const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true, trim: true, maxlength: 500 },
}, { timestamps: true });

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    maxlength: [100, "Title cannot exceed 100 characters"]
  },
  content: {
    type: String,
    required: [true, "Content is required"],
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  comments: [commentSchema],
  coverImage: {
    type: String,
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }]
}, { timestamps: true });

const Blog = mongoose.model("Blog", blogSchema);
module.exports = Blog;