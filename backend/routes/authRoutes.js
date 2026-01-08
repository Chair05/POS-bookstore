const express = require("express");
const router = express.Router();
const db = require("../db");

// ✅ Register (Sign Up Admin or Sub User)
router.post("/register", (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role)
    return res.status(400).json({ success: false, message: "Missing fields" });

  // Only allow valid roles
  if (!["admin", "sub"].includes(role))
    return res.status(400).json({ success: false, message: "Invalid role" });

  // Insert into database
  db.query(
    "INSERT INTO admins (username, password, role) VALUES (?, ?, ?)",
    [username, password, role],
    (err) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      return res.json({ success: true, message: `${role} registered successfully!` });
    }
  );
});

// ✅ Login (Admin or Sub)
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ success: false, message: "Missing fields" });

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

      const user = result[0];

      // Return role to frontend for redirect
      res.json({
        success: true,
        message: "Login successful",
        name: user.username,
        role: user.role, // important!
      });
    }
  );
});

module.exports = router;
