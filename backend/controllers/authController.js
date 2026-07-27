// backend/controllers/authController.js
const { createAdmin, findAdmin } = require("../models/adminModel");

const register = (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ success: false, message: "All fields required" });

  createAdmin(username, password, (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ success: false, message: "Username already exists" });
      }
      console.error(err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    res.json({ success: true, id: result.insertId });
  });
};

const login = (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ success: false, message: "All fields required" });

  findAdmin(username, password, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Server error" });
    if (results.length > 0) return res.json({ success: true, name: results[0].username });
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  });
};

module.exports = { register, login };
