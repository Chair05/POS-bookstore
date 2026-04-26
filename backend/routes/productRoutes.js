const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// -------------------------
// Multer setup for image uploads
// -------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// -------------------------
// GET all products
// -------------------------
router.get("/", (req, res) => {
  const sql = "SELECT * FROM products ORDER BY id DESC";

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ success: false });

    const products = results.map((p) => ({
      ...p,
      barcode: String(p.barcode),
      size: p.size || null, // ensure size is returned consistently
    }));

    res.json({
      success: true,
      products,
    });
  });
});

// -------------------------
// GET product by barcode
// -------------------------
router.get("/barcode/:barcode", (req, res) => {
  const { barcode } = req.params;

  db.query(
    "SELECT * FROM products WHERE barcode = ? LIMIT 1",
    [barcode],
    (err, results) => {
      if (err) return res.status(500).json({ success: false });

      if (results.length === 0)
        return res.json({ success: false, message: "Product not found" });

      const product = results[0];

      res.json({
        success: true,
        product: {
          ...product,
          barcode: String(product.barcode),
          size: product.size || null,
        },
      });
    }
  );
});

// -------------------------
// ADD new product (WITH SIZE FIX)
// -------------------------
router.post("/", upload.single("image"), (req, res) => {
  let { name, price, category, barcode, stock, size } = req.body;

  name = name?.trim();
  category = category?.trim();
  barcode = barcode?.toString().trim();
  size = size && size.trim() !== "" ? size.trim() : null; // ✅ FIX

  const image = req.file ? "/uploads/" + req.file.filename : "";

  if (!name || !price || !category || !barcode) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  const sql = `
    INSERT INTO products (name, price, category, barcode, stock, image, size)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      name,
      price,
      category,
      barcode,
      stock || 0,
      image,
      size, // ✅ already normalized
    ],
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
// UPDATE product category
// -------------------------
router.put("/:id/update-category", (req, res) => {
  const { id } = req.params;
  const { category } = req.body;

  if (!category)
    return res
      .status(400)
      .json({ success: false, message: "Category is required" });

  db.query(
    "UPDATE products SET category = ? WHERE id = ?",
    [category, id],
    (err, result) => {
      if (err) {
        console.error("❌ Category update error:", err);
        return res.status(500).json({ success: false });
      }

      if (result.affectedRows === 0)
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });

      res.json({ success: true, message: "Category updated" });
    }
  );
});

// -------------------------
// ADD stock
// -------------------------
router.put("/:id/add-stock", (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  if (!amount || amount <= 0)
    return res
      .status(400)
      .json({ success: false, message: "Invalid stock amount" });

  db.query(
    "UPDATE products SET stock = stock + ? WHERE id = ?",
    [amount, id],
    (err, result) => {
      if (err) return res.status(500).json({ success: false });

      if (result.affectedRows === 0)
        return res.json({ success: false, message: "Product not found" });

      res.json({ success: true, message: "Stock added" });
    }
  );
});

// -------------------------
// UPDATE product image
// -------------------------
router.put("/:id/update-image", upload.single("image"), (req, res) => {
  const { id } = req.params;

  if (!req.file)
    return res
      .status(400)
      .json({ success: false, message: "No image uploaded" });

  const newPath = "/uploads/" + req.file.filename;

  db.query(
    "UPDATE products SET image = ? WHERE id = ?",
    [newPath, id],
    (err) => {
      if (err) return res.status(500).json({ success: false });

      res.json({
        success: true,
        message: "Image updated",
        newImage: newPath,
      });
    }
  );
});

// -------------------------
// DELETE product
// -------------------------
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.query("SELECT image FROM products WHERE id = ?", [id], (err, results) => {
    if (err)
      return res.status(500).json({ success: false, message: err.message });

    if (results.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    const imagePath = results[0].image
      ? path.join(__dirname, "..", results[0].image)
      : null;

    db.query("DELETE FROM products WHERE id = ?", [id], (err) => {
      if (err)
        return res.status(500).json({ success: false, message: err.message });

      if (imagePath) fs.unlink(imagePath, () => {});

      res.json({ success: true, message: "Product deleted successfully" });
    });
  });
});

// -------------------------
// CHECKOUT
// -------------------------
router.post("/checkout", async (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.json({ success: false, message: "Cart is empty" });
  }

  try {
    // =========================
    // Generate short receipt ID
    // =========================
   const receiptId = await new Promise((resolve, reject) => {
  db.query(
    "SELECT MAX(receipt_id) AS maxReceipt FROM sales",
    (err, results) => {
      if (err) return reject(err);

      const max = results[0].maxReceipt;

      // If no sales yet → start clean
      if (!max || isNaN(max)) return resolve(1001);

      resolve(Number(max) + 1);
    }
  );
});
    // =========================
    // Process checkout items
    // =========================
    await Promise.all(
      items.map(async (item) => {
        const product = await new Promise((resolve, reject) => {
          db.query(
            "SELECT * FROM products WHERE barcode = ? LIMIT 1",
            [item.barcode],
            (err, results) => {
              if (err) reject(err);
              else resolve(results[0]);
            }
          );
        });

        if (!product) {
          throw new Error(`Product ${item.barcode} not found`);
        }

        const quantity = item.quantity || 1;

        if (product.stock < quantity) {
          throw new Error(`${product.name} is out of stock`);
        }

        // deduct stock
        await new Promise((resolve, reject) => {
          db.query(
            "UPDATE products SET stock = stock - ? WHERE id = ?",
            [quantity, product.id],
            (err) => (err ? reject(err) : resolve())
          );
        });

        // insert sale row
        await new Promise((resolve, reject) => {
          db.query(
            `INSERT INTO sales 
            (product_id, barcode, quantity, price, total, product_name, receipt_id, refunded)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
            [
              product.id,
              product.barcode,
              quantity,
              product.price,
              product.price * quantity,
              product.name,
              receiptId,
            ],
            (err) => (err ? reject(err) : resolve())
          );
        });
      })
    );

    res.json({
      success: true,
      message: "Payment successful",
      receiptId,
    });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// -------------------------
// GET sales
// -------------------------
router.get("/sales", (req, res) => {
  db.query(
    `SELECT id, product_name, barcode, quantity, price, total, created_at, receipt_id, refunded, refund_type
     FROM sales
     ORDER BY created_at DESC`,
    (err, results) => {
      if (err)
        return res.status(500).json({ success: false, message: "Database error" });

      res.json({ success: true, sales: results });
    }
  );
});

// -------------------------
// REFUND (FIXED: ITEM LEVEL)
// -------------------------
router.put("/refund/:receiptId/:saleId", (req, res) => {
  const { receiptId, saleId } = req.params;
  const { resellable } = req.body;

  const refundType = resellable ? "resellable" : "defective";

  // Step 1: get ONLY the specific item
  db.query(
    "SELECT * FROM sales WHERE id = ? AND receipt_id = ? AND refunded = 0",
    [saleId, receiptId],
    (err, results) => {
      if (err)
        return res.status(500).json({
          success: false,
          message: "DB error",
        });

      if (results.length === 0)
        return res.status(404).json({
          success: false,
          message: "Item already refunded or not found",
        });

      const item = results[0];

      // Step 2: mark ONLY that item as refunded
      db.query(
        "UPDATE sales SET refunded = 1, refund_type = ? WHERE id = ?",
        [refundType, saleId],
        (err) => {
          if (err)
            return res.status(500).json({
              success: false,
              message: "Refund update failed",
            });

          // Step 3: return stock ONLY for that item (if resellable)
          if (resellable) {
            db.query(
              "UPDATE products SET stock = stock + ? WHERE id = ?",
              [item.quantity, item.product_id],
              (err) => {
                if (err)
                  return res.status(500).json({
                    success: false,
                    message: "Stock update failed",
                  });

                return res.json({
                  success: true,
                  message: "Item refunded (resellable)",
                });
              }
            );
          } else {
            return res.json({
              success: true,
              message: "Item refunded (defective)",
            });
          }
        }
      );
    }
  );
});

module.exports = router;