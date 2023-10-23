const express = require("express");
const router = express.Router();
const multer = require("multer");
const uploadMiddleware = multer({ dest: "uploads/" });
const jwt = require("jsonwebtoken");
const fs = require("fs");
const Post = require("../models/Post");

require("dotenv").config();

router.put("/:id", uploadMiddleware.single("file"), async (req, res) => {
  const id = req.params.id;
  let newPath = null;
  if (req.file) {
    const { originalname, path } = req.file;
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    newPath = path + "." + ext;
    fs.renameSync(path, newPath);
  }

  const { token } = req.cookies;
  const data = jwt.verify(
    token,
    process.env.JWT_SECRET,
    {},
    async (err, info) => {
      if (err) return res.status(400).json({ message: "no jwt found" });

      const existingPost = await Post.findById(id);
      if (
        !existingPost ||
        existingPost.author._id.toString() !== info.user.id
      ) {
        return res
          .status(400)
          .json({ message: "Bad Request. Please try again later" });
      }
      const { title, content, summary } = req.body;

      await existingPost.updateOne({
        title,
        summary,
        content,
        cover: newPath ? newPath : existingPost.cover,
      });
      res.status(200).json({ existingPost });
    }
  );
});

router.post("/", uploadMiddleware.single("file"), async (req, res) => {
  const { originalname, path } = req.file;
  const parts = originalname.split(".");
  const ext = parts[parts.length - 1];
  const newPath = path + "." + ext;
  fs.renameSync(path, newPath);

  const { token } = req.cookies;
  const data = jwt.verify(
    token,
    process.env.JWT_SECRET,
    {},
    async (err, info) => {
      if (err) return res.status(400).json({ message: "no jwt found" });
      const { title, content, summary } = req.body;
      const post = await new Post({
        title,
        summary,
        content,
        cover: newPath,
        author: info.user.id,
      });
      const newPost = await post.save();
      res.json(newPost);
    }
  );
});

router.get("/", async (req, res) => {
  const posts = await Post.find()
    .populate("author", ["name"])
    .sort({ createdAt: -1 });
  res.json(posts);
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;
  const post = await Post.findById(id).populate("author", ["name"]);
  res.json(post);
});

module.exports = router;
