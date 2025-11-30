const express = require("express");
const router = express.Router();
const db = require("../db");

// ✅ Register (Sign Up Admin)
// Create admin (Sign Up)
router.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ success: false, message: "Missing fields" });

  db.query(
  "INSERT INTO admins (username, password) VALUES (?, ?)",
  [username, password],
  (err) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    return res.json({ success: true, message: "Admin registered!" });
  }
);
});


// ✅ Login
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.query(
    "SELECT * FROM admins WHERE username = ? AND password = ?",
    [username, password],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Database error" });
      }

      if (result.length === 0) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }

      res.json({ success: true, message: "Login successful" });
    }
  );
});

module.exports = router;
