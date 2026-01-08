const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all categories
router.get("/", (req, res) => {
  db.query("SELECT * FROM categories ORDER BY name ASC", (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });

    // Send both id and name
    const categories = results.map((r) => ({ id: r.id, name: r.name }));
    res.json({ success: true, categories });
  });
});

// ADD new category
router.post("/", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, message: "Name required" });

  db.query("INSERT INTO categories (name) VALUES (?)", [name], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });

    // Return the newly created category with its ID
    res.json({
      success: true,
      category: { id: result.insertId, name },
    });
  });
});

// DELETE category
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM categories WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: "Category deleted" });
  });
});

module.exports = router;
