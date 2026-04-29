// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const db = require("./db"); // Your MySQL connection
const authRoutes = require("./routes/authRoutes");
const productsRoute = require("./routes/productRoutes");

const app = express();

// -------------------------
// Middleware
// -------------------------
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// -------------------------
// Routes
// -------------------------
app.use("/api", authRoutes);
app.use("/api/products", productsRoute);

// Default route
app.get("/", (req, res) => {
  res.send("POS Backend Running ✅");
});

// JSON fallback for unknown routes
app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ success: false, message: "API endpoint not found" });
  }
  res.status(404).send("Not found");
});

// -------------------------
// Test DB Connection
// -------------------------
db.connect(err => {
  if (err) {
    console.error("❌ Database connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL database");
  }
});

// -------------------------
// Sales Routes
// -------------------------

// Get all sales
app.get("/api/sales", (req, res) => {
  const query = `
    SELECT 
      id,
      product_name,
      barcode,
      quantity,
      price,
      total,
      created_at,
      receipt_id
    FROM sales
    ORDER BY created_at DESC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ Error fetching sales:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    res.json({ success: true, sales: results });
  });
});

// -------------------------
// Categories Routes
// -------------------------

// Get all categories
app.get("/api/categories", (req, res) => {
  const sql = "SELECT * FROM categories ORDER BY name ASC";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });
    res.json({ success: true, categories: results });
  });
});

// Add new category
app.post("/api/categories", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, message: "Category name required" });

  const sql = "INSERT INTO categories (name) VALUES (?)";
  db.query(sql, [name], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });

    // Return category object to match frontend expectation
    res.json({ success: true, category: { id: result.insertId, name } });
  });
});

// Delete category
app.delete("/api/categories/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM categories WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Category not found" });
    res.json({ success: true, message: "Category deleted" });
  });
});

// -------------------------
// Start Server
// -------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
