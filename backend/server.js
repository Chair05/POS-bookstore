const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

const db = require("./db");
const authRoutes = require("./routes/authRoutes");
const productsRoute = require("./routes/productRoutes");

const app = express();

// -------------------------
// Middleware
// -------------------------
app.use(cors());
app.use(express.json());

// Serve uploaded images
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
// GET ALL SALES
// -------------------------
app.get("/api/sales", (req, res) => {
  const query = `
    SELECT 
      id,
      product_name,
      barcode,
      quantity,
      price,
      total,
      created_at
    FROM sales
    ORDER BY created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ Error fetching sales:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    res.json(results);
  });
});

// -------------------------
// Start Server
// -------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
