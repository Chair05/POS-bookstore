const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./models/db"); // ✅ your database connection
const authRoutes = require("./routes/authRoutes"); 
const productsRoute = require("./routes/productRoutes"); // ✅ product routes

// Initialize Express first!
const app = express(); 

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", authRoutes);              // login, register, etc.
app.use("/api/products", productsRoute);  // product CRUD

// Default route
app.get("/", (req, res) => {
  res.send("POS Backend Running ✅");
});

// Optional: test DB connection
db.connect(err => {
  if (err) {
    console.error("❌ Database connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL database");
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
