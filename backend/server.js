const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./models/db");
const authRoutes = require("./routes/authRoutes"); // ✅ one consistent import

const app = express(); // ✅ define app FIRST

// ✅ Middlewares
app.use(cors());
app.use(express.json());

// ✅ Register API routes here
app.use("/api", authRoutes);

app.get("/", (req, res) => {
  res.send("POS Backend Running");
});

// ✅ Default PORT fallback (prevents .env errors)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
