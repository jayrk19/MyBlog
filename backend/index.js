const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

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
app.use("/post", require("./routes/Post"));

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

app.listen(process.env.PORT, () =>
  console.log(`Server running on http://localhost:${process.env.PORT}`)
);
