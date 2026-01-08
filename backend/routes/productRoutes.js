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
    }));
    res.json({ success: true, products });
  });
});

// -------------------------
// GET product by barcode
// -------------------------
router.get("/barcode/:barcode", (req, res) => {
  const { barcode } = req.params;
  const sql = "SELECT * FROM products WHERE barcode = ? LIMIT 1";

  db.query(sql, [barcode], (err, results) => {
    if (err) return res.status(500).json({ success: false });
    if (results.length === 0)
      return res.json({ success: false, message: "Product not found" });

    res.json({
      success: true,
      product: { ...results[0], barcode: String(results[0].barcode) },
    });
  });
});

// -------------------------
// ADD new product
// -------------------------
router.post("/", upload.single("image"), (req, res) => {
  const { name, price, category, barcode, stock } = req.body;
  const image = req.file ? "/uploads/" + req.file.filename : "";

  if (!name || !price || !category || !barcode)
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });

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
// UPDATE product category
// -------------------------
router.put("/:id/update-category", (req, res) => {
  const { id } = req.params;
  const { category } = req.body;

  if (!category)
    return res
      .status(400)
      .json({ success: false, message: "Category is required" });

  const sql = "UPDATE products SET category = ? WHERE id = ?";

  db.query(sql, [category, id], (err, result) => {
    if (err) {
      console.error("❌ Category update error:", err);
      return res.status(500).json({ success: false });
    }

    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    res.json({ success: true, message: "Category updated" });
  });
});

// -------------------------
// ADD stock by amount
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
  const sql = "UPDATE products SET image = ? WHERE id = ?";

  db.query(sql, [newPath, id], (err) => {
    if (err) return res.status(500).json({ success: false });
    res.json({
      success: true,
      message: "Image updated",
      newImage: newPath,
    });
  });
});

// -------------------------
// DELETE product
// -------------------------
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  // Find the product first to delete its image
  db.query("SELECT image FROM products WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (results.length === 0)
      return res.status(404).json({ success: false, message: "Product not found" });

    const imagePath = results[0].image ? path.join(__dirname, "..", results[0].image) : null;

    // Delete product
    db.query("DELETE FROM products WHERE id = ?", [id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: err.message });

      // Delete image file if exists
      if (imagePath) fs.unlink(imagePath, (err) => {}); // ignore errors

      res.json({ success: true, message: "Product deleted successfully" });
    });
  });
});

// -------------------------
// CHECKOUT (create sales)
// -------------------------
router.post("/checkout", async (req, res) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0)
    return res.json({ success: false, message: "Cart is empty" });

  const receiptId = Date.now();

  try {
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

        if (!product)
          throw new Error(`Product ${item.barcode} not found`);

        const quantity = item.quantity || 1;
        if (product.stock < quantity)
          throw new Error(`${product.name} is out of stock`);

        await new Promise((resolve, reject) => {
          db.query(
            "UPDATE products SET stock = stock - ? WHERE id = ?",
            [quantity, product.id],
            (err) => (err ? reject(err) : resolve())
          );
        });

        await new Promise((resolve, reject) => {
          db.query(
            `
            INSERT INTO sales 
            (product_id, barcode, quantity, price, total, product_name, receipt_id, refunded)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0)
          `,
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
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------
// GET all sales
// -------------------------
router.get("/sales", (req, res) => {
  const sql = `
    SELECT id, product_name, barcode, quantity, price, total, created_at, receipt_id, refunded, refund_type
    FROM sales
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ success: false, message: "Database error" });

    res.json({ success: true, sales: results });
  });
});


// -------------------------
// REFUND sale by receipt ID
// -------------------------
router.put("/refund/:receiptId", (req, res) => {
  const { receiptId } = req.params;
  const { resellable } = req.body;

  const refundType = resellable ? "resellable" : "defective";

  db.query(
    "SELECT * FROM sales WHERE receipt_id = ? AND refunded = 0",
    [receiptId],
    async (err, sales) => {
      if (err)
        return res.status(500).json({ success: false, message: "DB error" });

      if (sales.length === 0)
        return res
          .status(404)
          .json({ success: false, message: "Already refunded or not found" });

      // Mark refunded + save refund type
      db.query(
        "UPDATE sales SET refunded = 1, refund_type = ? WHERE receipt_id = ?",
        [refundType, receiptId],
        async (err) => {
          if (err)
            return res.status(500).json({ success: false, message: "Refund failed" });

          // Return stock if resellable
          if (resellable) {
            for (const item of sales) {
              await new Promise((resolve, reject) => {
                db.query(
                  "UPDATE products SET stock = stock + ? WHERE id = ?",
                  [item.quantity, item.product_id],
                  (err) => (err ? reject(err) : resolve())
                );
              });
            }
          }

          res.json({
            success: true,
            message: `Refunded (${refundType})`,
          });
        }
      );
    }
  );
});


module.exports = router;
