// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const fs = require("fs");
const db = require("./db"); // Your MySQL connection
const { promisePool } = require("./db");
const authRoutes = require("./routes/authRoutes");
const productsRoute = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");

// E-commerce routes
const ecomAuthRoutes = require("./ecommerce-routes/auth");
const ecomProductRoutes = require("./ecommerce-routes/customerProducts");
const ecomCartRoutes = require("./ecommerce-routes/customerCart");
const ecomOrderRoutes = require("./ecommerce-routes/customerOrders");
const ecomPaymentRoutes = require("./ecommerce-routes/customerPayments");
const ecomAdminRoutes = require("./ecommerce-routes/admin");

const app = express();

// -------------------------
// Middleware
// -------------------------
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Ensure receipts upload directory exists
const receiptsDir = path.join(__dirname, "uploads", "receipts");
if (!fs.existsSync(receiptsDir)) fs.mkdirSync(receiptsDir, { recursive: true });

// -------------------------
// Routes
// -------------------------
app.use("/api", authRoutes);
app.use("/api/products", productsRoute);
app.use("/api/orders", orderRoutes);

// E-commerce routes
app.use("/api/auth", ecomAuthRoutes);
app.use("/api/customer/products", ecomProductRoutes);
app.use("/api/customer/cart", ecomCartRoutes);
app.use("/api/customer/orders", ecomOrderRoutes);
app.use("/api/customer/orders", ecomPaymentRoutes);
app.use("/api/admin", ecomAdminRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "LCCB Bookstore API is running" });
});

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
ensureColumn("sales", "customer_type", "customer_type VARCHAR(100) DEFAULT ''");
ensureColumn("sales", "checkout_department", "checkout_department VARCHAR(100) DEFAULT ''");
ensureColumn("sales", "receipt_id", "receipt_id INT NULL");
ensureColumn("sales", "adminId", "adminId INT NULL");
ensureColumn("inventory_logs", "receipt_id", "receipt_id INT NULL");
ensureColumn("admins", "can_view_inventory_logs", "can_view_inventory_logs TINYINT(1) DEFAULT 0");
ensureColumn("products", "department", "department VARCHAR(100) DEFAULT ''");

// Ensure customers table has all columns needed by both POS and e-commerce
ensureColumn("customers", "name", "name VARCHAR(255) NOT NULL");
ensureColumn("customers", "contact", "contact VARCHAR(50)");
ensureColumn("customers", "full_name", "full_name VARCHAR(255)");
ensureColumn("customers", "contact_number", "contact_number VARCHAR(20)");
ensureColumn("customers", "role", "role VARCHAR(20) DEFAULT 'customer'");
ensureColumn("customers", "updated_at", "updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

// Ensure order_items has all columns needed by the merged orders list/reports
ensureColumn("order_items", "product_name", "product_name VARCHAR(255) NULL");
ensureColumn("order_items", "barcode", "barcode VARCHAR(100) NULL");
ensureColumn("order_items", "price", "price DECIMAL(10,2) NOT NULL DEFAULT 0");
ensureColumn("order_items", "total", "total DECIMAL(10,2) NOT NULL DEFAULT 0");
ensureColumn("order_items", "created_at", "created_at DATETIME DEFAULT CURRENT_TIMESTAMP");

// Ensure ecom_order_items has product_name for the merged orders list GROUP_CONCAT
ensureColumn("ecom_order_items", "product_name", "product_name VARCHAR(255) NULL");
ensureColumn("ecom_order_items", "price", "price DECIMAL(10,2) NOT NULL DEFAULT 0");
ensureColumn("ecom_order_items", "selected_size", "selected_size VARCHAR(50) NULL");

// Ensure ecom_orders has verified_at (used by GCash online payment + POS display)
ensureColumn("ecom_orders", "verified_at", "verified_at DATETIME NULL");
ensureColumn("ecom_orders", "payment_method", "payment_method VARCHAR(50) NULL");
ensureColumn("ecom_orders", "pickup_code", "pickup_code VARCHAR(10) NULL");

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

// -------------------------
// Online Orders Tables (POS)
// -------------------------
db.query(`
  CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    contact VARCHAR(50),
    contact_number VARCHAR(20),
    password VARCHAR(255),
    role VARCHAR(20) DEFAULT 'customer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`);

db.query(`
  CREATE TABLE IF NOT EXISTS online_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_method ENUM('gcash','rcbc') DEFAULT 'gcash',
    payment_status ENUM('pending','verified','rejected') DEFAULT 'pending',
    order_status ENUM('pending_payment','verified','preparing','ready_for_pickup','completed','rejected') DEFAULT 'pending_payment',
    reference_number VARCHAR(100),
    receipt_image VARCHAR(500),
    verified_by INT NULL,
    verified_at DATETIME NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  )
`);

db.query(`
  CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    barcode VARCHAR(100),
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES online_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  )
`);

db.query(`
  CREATE TABLE IF NOT EXISTS order_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),
    receipt_image VARCHAR(500),
    status ENUM('pending','verified','rejected') DEFAULT 'pending',
    verified_by INT NULL,
    verified_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES online_orders(id) ON DELETE CASCADE
  )
`);

// -------------------------
// E-commerce Tables
// -------------------------
db.query(`
  CREATE TABLE IF NOT EXISTS ecom_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending Payment Verification',
    customer_full_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_contact VARCHAR(20),
    reference_number VARCHAR(255),
    payment_method VARCHAR(50),
    receipt_image VARCHAR(500),
    payment_status VARCHAR(20) DEFAULT 'pending',
    pickup_code VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  )
`);

db.query(`
  CREATE TABLE IF NOT EXISTS ecom_order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    selected_size VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES ecom_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  )
`);

db.query(`
  CREATE TABLE IF NOT EXISTS ecom_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    customer_id INT NOT NULL,
    receipt_image VARCHAR(500),
    reference_number VARCHAR(255),
    payment_method VARCHAR(50),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    verified_by INT,
    verified_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES ecom_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  )
`);

db.query(`
  CREATE TABLE IF NOT EXISTS ecom_carts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_customer_cart (customer_id)
  )
`);

db.query(`
  CREATE TABLE IF NOT EXISTS ecom_cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    selected_size VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES ecom_carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  )
`);

app.get("/api/inventory-logs", (req, res) => {
  const role = req.header("x-user-role");
  const canViewInventoryLogs = req.header("x-user-can-view-inventory-logs") === "true";

  if (role !== "admin" && !canViewInventoryLogs) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  db.query(
    "SELECT * FROM inventory_logs ORDER BY created_at DESC",
    (err, results) => {
      if (err) return res.status(500).json({ success: false, message: "Database error" });
      res.json({ success: true, logs: results });
    }
  );
});

app.get("/api/sales/monthly-report", (req, res) => {
  const role = req.header("x-user-role");
  if (role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const sql = `
    SELECT
      DATE_FORMAT(created_at, '%Y-%m') AS month,
      COUNT(DISTINCT receipt_id) AS item_count,
      SUM(quantity) AS total_items,
      SUM(total) AS total_revenue
    FROM sales_items
    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
    ORDER BY month DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });
    res.json({ success: true, reports: results });
  });
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
