const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const path = require("path");

// -------------------------
// MULTER IMAGE UPLOAD
// -------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// -------------------------
// GET ALL PRODUCTS
// -------------------------
router.get("/", (req, res) => {
  const sql = "SELECT * FROM products ORDER BY id DESC";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Error fetching products:", err);
      return res.status(500).json({ success: false });
    }
    res.json({ success: true, products: results });
  });
});

// -------------------------
// ADD NEW PRODUCT
// -------------------------
router.post("/", (req, res) => {
  const { name, price, category, barcode, stock, image } = req.body;

  if (!name || !price || !category || !barcode) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields"
    });
  }

  const sql = `
    INSERT INTO products (name, price, category, barcode, stock, image)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [name, price, category, barcode, stock || 0, image || ""], (err, result) => {
    if (err) {
      console.error("❌ Error adding product:", err);
      return res.status(500).json({ success: false });
    }

    res.json({
      success: true,
      id: result.insertId,
      message: "Product added successfully"
    });
  });
});

// -------------------------
// GET PRODUCT BY BARCODE
// -------------------------
router.get("/barcode/:barcode", (req, res) => {
  const { barcode } = req.params;

  const sql = "SELECT * FROM products WHERE barcode = ? LIMIT 1";

  db.query(sql, [barcode], (err, results) => {
    if (err) return res.status(500).json({ success: false });

    if (results.length === 0) {
      return res.json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, product: results[0] });
  });
});

// -------------------------
// PURCHASE — deduct stock + record sale
// -------------------------
router.post("/purchase", (req, res) => {
  const { barcode } = req.body;

  if (!barcode) {
    return res.json({ success: false, message: "Barcode missing" });
  }

  const findProduct = "SELECT * FROM products WHERE barcode = ? LIMIT 1";

  db.query(findProduct, [barcode], (err, results) => {
    if (err) return res.status(500).json({ success: false });

    if (results.length === 0) {
      return res.json({ success: false, message: "Product not found" });
    }

    const product = results[0];

    if (product.stock <= 0) {
      return res.json({ success: false, message: "Out of stock" });
    }

    // Deduct stock
    db.query(
      "UPDATE products SET stock = stock - 1 WHERE id = ?",
      [product.id],
      (err2) => {
        if (err2) return res.status(500).json({ success: false });

        // Insert sale record
        const saleSQL = `
          INSERT INTO sales (product_id, barcode, quantity, price, total, product_name)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        const quantity = 1;
        const total = quantity * product.price;

        db.query(
          saleSQL,
          [
            product.id,
            product.barcode,
            quantity,
            product.price,
            total,
            product.name
          ],
          (err3) => {
            if (err3) {
              console.error("❌ Error recording sale:", err3);
            }
          }
        );

        res.json({
          success: true,
          message: "Purchase successful",
          remaining_stock: product.stock - 1
        });
      }
    );
  });
});

// -------------------------
// ADD STOCK
// -------------------------
router.put("/:id/add-stock", (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid stock amount" });
  }

  db.query(
    "UPDATE products SET stock = stock + ? WHERE id = ?",
    [amount, id],
    (err, result) => {
      if (err) return res.status(500).json({ success: false });

      if (result.affectedRows === 0) {
        return res.json({ success: false, message: "Product not found" });
      }

      res.json({ success: true, message: "Stock successfully added" });
    }
  );
});

// -------------------------
// UPDATE PRODUCT IMAGE
// -------------------------
router.put("/:id/update-image", upload.single("image"), (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No image uploaded" });
  }

  const newPath = "/uploads/" + req.file.filename;

  const sql = "UPDATE products SET image = ? WHERE id = ?";

  db.query(sql, [newPath, id], (err) => {
    if (err) return res.status(500).json({ success: false });

    res.json({
      success: true,
      message: "Image updated successfully",
      newImage: newPath
    });
  });
});

// -------------------------------------------------------
// ✅ FIX FOR YOUR ISSUE: GET SALES DATA
// -------------------------------------------------------
router.get("/sales", (req, res) => {
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
      return res.status(500).json({
        success: false,
        message: "Database error",
      });
    }

    res.json({
      success: true,
      sales: results,
    });
  });
});

module.exports = router;
