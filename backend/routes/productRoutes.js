const express = require("express");
const router = express.Router();


const db = require("../db");

router.get("/", (req, res) => {
  const sql = "SELECT * FROM products";

  db.query(sql, (err, results) => {
    if (err) {
      console.log("Error fetching products:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    res.json({
      success: true,
      products: results
    });
  });
});

router.post("/", (req, res) => {
  const { name, price, category, barcode, image, stock } = req.body;

  if (!name || !price || !category || !barcode) {
    return res.json({ success: false, message: "Missing fields" });
  }

  const sql = `
    INSERT INTO products (name, price, category, barcode, image, stock)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [name, price, category, barcode, image || "", stock || 0],
    (err, result) => {
      if (err) {
        console.log("Error adding product:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }

      res.json({ success: true, id: result.insertId });
    }
  );
});

router.get("/barcode/:barcode", (req, res) => {
  const { barcode } = req.params;

  const sql = "SELECT * FROM products WHERE barcode = ? LIMIT 1";

  db.query(sql, [barcode], (err, results) => {
    if (err) {
      console.log("Barcode lookup error:", err);
      return res.status(500).json({ success: false });
    }

    if (results.length === 0) {
      return res.json({ success: false, message: "Not found" });
    }

    res.json({ success: true, product: results[0] });
  });
});

// --------------------------------------
// PURCHASE — DEDUCT STOCK
// --------------------------------------
router.post("/purchase", (req, res) => {
  const { barcode } = req.body;

  if (!barcode) return res.json({ success: false, message: "No barcode" });

  const getProduct = "SELECT * FROM products WHERE barcode = ? LIMIT 1";

  db.query(getProduct, [barcode], (err, results) => {
    if (err) return res.status(500).json({ success: false });

    if (results.length === 0) {
      return res.json({ success: false, message: "Product not found" });
    }

    const product = results[0];

    if (product.stock <= 0) {
      return res.json({ success: false, message: "Out of stock" });
    }

    const updateStock = `
      UPDATE products
      SET stock = stock - 1
      WHERE id = ?
    `;

    db.query(updateStock, [product.id], (err2) => {
      if (err2) return res.status(500).json({ success: false });

      res.json({
        success: true,
        message: "Purchase complete",
        remaining_stock: product.stock - 1
      });
    });
  });
});

module.exports = router;
