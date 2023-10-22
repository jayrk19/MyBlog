const express = require("express");
const User = require("../models/User");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

require("dotenv").config();

router.post("/", async (req, res) => {
  const { name, username, password } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const securePassword = await bcrypt.hash(password, salt);
    const user = await new User({ name, username, password: securePassword });

    const existingUser = await User.findOne(user);

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = await user.save();

    const data = {
      user: {
        id: newUser.id,
        username: newUser.username,
      },
    };
    const authToken = jwt.sign(data, process.env.JWT_SECRET);
    res.cookie("token", authToken, { maxAge: 5000, httpOnly: true }).json("ok");
  } catch (error) {
    return res.status(400).json(error);
  }
});

module.exports = router;
