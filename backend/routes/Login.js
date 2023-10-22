const express = require("express");
const User = require("../models/User");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

require("dotenv").config();

router.post("/", async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (!existingUser) {
      return res
        .status(400)
        .json({ message: "Please try again with correct credentials" });
    }

    const comparePassword = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!comparePassword) {
      return res.status(400).json({
        message: "Please try again with correct credentials",
      });
    }

    const data = {
      user: {
        id: existingUser.id,
        username: existingUser.username,
      },
    };
    const authToken = jwt.sign(data, process.env.JWT_SECRET);
    res.cookie("token", authToken).json({
      id: existingUser._id,
      username: existingUser.username,
    });
  } catch (error) {
    return res.status(400).json(error);
  }
});

module.exports = router;
