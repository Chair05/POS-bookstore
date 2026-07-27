const express = require("express");
const router = express.Router();
const db = require("../db");

// ✅ Register (Sign Up Admin or Sub User)
router.post("/register", (req, res) => {
  const { username, password, role, canViewInventoryLogs } = req.body;

  if (!username || !password || !role)
    return res.status(400).json({ success: false, message: "Missing fields" });

  // Only allow valid roles
  if (!["admin", "sub"].includes(role))
    return res.status(400).json({ success: false, message: "Invalid role" });

  const canView = role === "sub" && Boolean(canViewInventoryLogs);

  // Insert into database
  db.query(
    "INSERT INTO admins (username, password, role, can_view_inventory_logs) VALUES (?, ?, ?, ?)",
    [username, password, role, canView ? 1 : 0],
    (err) => {
      if (err) {
        console.error("Database query error:", err);
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ success: false, message: "Username already exists" });
        }
        return res.status(500).json({ success: false, message: "Database error" });
      }
      const displayRole = role === "sub" ? "Staff" : "Admin";
      return res.json({ success: true, message: `${displayRole} registered successfully!` });
    }
  );
});

// ✅ Login (Admin or Sub)
router.post("/login", (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role)
    return res.status(400).json({ success: false, message: "Missing fields" });

  if (!["admin", "sub"].includes(role))
    return res.status(400).json({ success: false, message: "Invalid role" });

  db.query(
    "SELECT * FROM admins WHERE username = ? AND password = ? AND role = ?",
    [username, password, role],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Database error" });
      }

      if (result.length === 0) {
        return res.status(401).json({ success: false, message: "Invalid credentials or wrong role" });
      }

      const user = result[0];

      // Return role to frontend for redirect
      res.json({
        success: true,
        message: "Login successful",
        name: user.username,
        role: user.role,
        canViewInventoryLogs: Boolean(user.can_view_inventory_logs),
      });
    }
  );
});

// Admin-only: list staff users and their inventory log access permission
router.get("/admin/staff", (req, res) => {
  const role = req.header("x-user-role");
  if (role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  db.query(
    "SELECT id, username, role, can_view_inventory_logs FROM admins WHERE role = 'sub' ORDER BY username",
    (err, results) => {
      if (err) {
        console.error("Error fetching staff users:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      res.json({ success: true, staff: results });
    }
  );
});

router.put("/admin/staff/:id/access", (req, res) => {
  const role = req.header("x-user-role");
  if (role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const id = Number(req.params.id);
  const allow = req.body.allow ? 1 : 0;

  if (!id) {
    return res.status(400).json({ success: false, message: "Invalid staff id" });
  }

  db.query(
    "UPDATE admins SET can_view_inventory_logs = ? WHERE id = ? AND role = 'sub'",
    [allow, id],
    (err, result) => {
      if (err) {
        console.error("Error updating staff access:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Staff user not found" });
      }

      res.json({ success: true, message: "Access updated", allow: Boolean(allow) });
    }
  );
});

module.exports = router;
