const express = require("express");
const router = express.Router();

require("dotenv").config();

router.post("/", async (req, res) => {
  res.cookie("token", "").json("ok");
});

module.exports = router;
