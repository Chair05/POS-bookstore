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
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ success: false, message: "Category already exists" });
      }
      return res.status(500).json({ success: false, message: "Database error" });
    }

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
// Auto-migrate missing columns on existing tables
// -------------------------
const ensureColumn = (table, column, definition) => {
  db.query(`SHOW COLUMNS FROM ${table} LIKE '${column}'`, (err, result) => {
    if (!err && result.length === 0) {
      db.query(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
    }
  });
};

ensureColumn("sales_items", "receipt_id", "receipt_id INT NULL AFTER id");
ensureColumn("sales", "customer_name", "customer_name VARCHAR(255) NULL");
ensureColumn("sales", "receipt_id", "receipt_id INT NULL");
ensureColumn("sales", "adminId", "adminId INT NULL");
ensureColumn("inventory_logs", "receipt_id", "receipt_id INT NULL");

// -------------------------
// Inventory Logs
// -------------------------

// Auto-create inventory_logs table
db.query(`
  CREATE TABLE IF NOT EXISTS inventory_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    receipt_id INT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    type ENUM('IN','OUT') NOT NULL,
    quantity INT NOT NULL,
    reason VARCHAR(255) DEFAULT '',
    staff VARCHAR(100) DEFAULT 'System',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Drop problematic unique key if it exists from a previous schema
db.query("ALTER TABLE inventory_logs DROP INDEX unique_log", () => {});

// Backfill existing data (INSERT IGNORE so it only adds missing rows)
db.query(`
  INSERT IGNORE INTO inventory_logs (product_id, product_name, type, quantity, reason, staff, created_at)
  SELECT si.product_id, si.product_name, 'OUT', si.quantity, 'Sale', 'System', si.created_at
  FROM sales_items si
`, (err) => err && console.error("OUT backfill error:", err));

db.query(`
  INSERT IGNORE INTO inventory_logs (product_id, product_name, type, quantity, reason, staff, created_at)
  SELECT r.product_id, COALESCE(p.name, 'Unknown'), 'IN', r.quantity_added,
         COALESCE(NULLIF(r.reason, ''), 'Restock'), 'Admin', r.created_at
  FROM restocks r
  LEFT JOIN products p ON r.product_id = p.id
`, (err) => err && console.error("IN backfill error:", err));

app.get("/api/inventory-logs", (req, res) => {
  db.query(
    "SELECT * FROM inventory_logs ORDER BY created_at DESC",
    (err, results) => {
      if (err) return res.status(500).json({ success: false, message: "Database error" });
      res.json({ success: true, logs: results });
    }
  );
});

// JSON fallback for unknown routes
app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ success: false, message: "API endpoint not found" });
  }
  res.status(404).send("Not found");
});

// -------------------------
// Start Server
// -------------------------
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`🚨 Port ${PORT} is already in use. Stop the existing backend process or change the PORT.`);
  } else {
    console.error("🚨 Server error:", error);
  }
  process.exit(1);
});
