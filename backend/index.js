const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const uploadMiddleware = multer({ dest: "uploads/" });
const cookieParser = require("cookie-parser");
const fs = require("fs");
const Post = require("./models/Post");
const User = require("./models/User");

const app = express();
app.use(express.json());
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));
require("dotenv").config();

mongoose.connect(process.env.DATABASE_URI);

const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to database"));

app.get("/", (req, res) => {
  res.json({ message: "Hello" });
});

app.use("/register", require("./routes/Register"));
app.use("/login", require("./routes/Login"));
app.use("/logout", require("./routes/Logout"));

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  const data = jwt.verify(token, process.env.JWT_SECRET, {}, (err, info) => {
    if (err) {
      return res.status(400).json({ message: "no jwt found" });
    } else {
      res.status(200).json(info);
    }
  });
});

app.put("/post/:id", uploadMiddleware.single("file"), async (req, res) => {
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

app.post("/post", uploadMiddleware.single("file"), async (req, res) => {
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

app.get("/post", async (req, res) => {
  const posts = await Post.find()
    .populate("author", ["name"])
    .sort({ createdAt: -1 });
  res.json(posts);
});

app.get("/post/:id", async (req, res) => {
  const id = req.params.id;
  const post = await Post.findById(id).populate("author", ["name"]);
  res.json(post);
});

app.listen(process.env.PORT, () =>
  console.log(`Server running on http://localhost:${process.env.PORT}`)
);
