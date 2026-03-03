import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String, // short summary shown on cards
    },
    coverImage: {
      type: String, // file path or URL
      default: null,
    },
    category: {
      type: String,
      enum: ["Technology", "Design", "Culture", "Business", "Science", "Other"],
      default: "Other",
    },
    tags: {
      type: [String], // array of tags e.g. ["nodejs", "express"]
      default: [],
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Blog = mongoose.model("Blog", blogSchema);
export default Blog;