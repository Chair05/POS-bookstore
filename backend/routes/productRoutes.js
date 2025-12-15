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
// ADD NEW PRODUCT (with optional image)
router.post("/", upload.single("image"), (req, res) => {
  const { name, price, category, barcode, stock } = req.body;
  const image = req.file ? "/uploads/" + req.file.filename : "";

  if (!name || !price || !category || !barcode) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  const sql = `
    INSERT INTO products (name, price, category, barcode, stock, image)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [name, price, category, barcode, stock || 0, image],
    (err, result) => {
      if (err) {
        console.error("❌ Error adding product:", err);
        return res.status(500).json({ success: false });
      }

      res.json({
        success: true,
        id: result.insertId,
        message: "Product added successfully",
      });
    }
  );
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
router.post("/checkout", (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.json({ success: false, message: "Cart is empty" });
  }

  const receiptId = Date.now();

  let completed = 0;
  let failed = false;

  items.forEach((item) => {
    const findProduct = "SELECT * FROM products WHERE barcode = ? LIMIT 1";

    db.query(findProduct, [item.barcode], (err, results) => {
      if (err || results.length === 0) {
        failed = true;
        return;
      }

      const product = results[0];

      if (product.stock <= 0) {
        failed = true;
        return;
      }

      db.query(
        "UPDATE products SET stock = stock - 1 WHERE id = ?",
        [product.id],
        (err2) => {
          if (err2) {
            failed = true;
            return;
          }

          const saleSQL = `
            INSERT INTO sales
            (product_id, barcode, quantity, price, total, product_name, receipt_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `;

          db.query(
            saleSQL,
            [
              product.id,
              product.barcode,
              1,
              product.price,
              product.price,
              product.name,
              receiptId
            ],
            () => {
              completed++;

              if (completed === items.length) {
                if (failed) {
                  return res.json({
                    success: false,
                    message: "Checkout partially failed"
                  });
                }

                res.json({
                  success: true,
                  message: "Payment successful",
                  receiptId
                });
              }
            }
          );
        }
      );
    });
  });
});



// -------------------------
// RESTOCK PRODUCT (when removed from cart)
// -------------------------
router.put("/restock/:id", (req, res) => {
  const { id } = req.params;

  db.query(
    "UPDATE products SET stock = stock + 1 WHERE id = ?",
    [id],
    (err) => {
      if (err) {
        console.error("❌ Error restocking product:", err);
        return res.status(500).json({ success: false });
      }

      db.query(
        "SELECT stock FROM products WHERE id = ?",
        [id],
        (err2, result) => {
          if (err2) {
            console.error("❌ Error fetching updated stock:", err2);
            return res.status(500).json({ success: false });
          }

          res.json({
            success: true,
            new_stock: result[0].stock
          });
        }
      );
    }
  );
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
// GET SALES DATA (includes receipt_id)
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
      created_at,
      receipt_id
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
