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

router.post("/restock", (req, res) => {
  const { productId, amount, supplier, costPrice, notes } = req.body;

  if (!productId || !amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid restock data",
    });
  }

  db.query(
    "SELECT stock FROM products WHERE id = ?",
    [productId],
    (err, results) => {
      if (err) return res.status(500).json({ success: false });

      if (results.length === 0)
        return res.status(404).json({ success: false, message: "Product not found" });

      const previousStock = results[0].stock;
      const newStock = previousStock + Number(amount);
      const parsedCostPrice = costPrice ? Number(costPrice) : null;

      // 1. update product stock
      db.query(
        "UPDATE products SET stock = ? WHERE id = ?",
        [newStock, productId],
        (err) => {
          if (err) return res.status(500).json({ success: false });

          // 2. log restock
          db.query(
            `INSERT INTO restocks 
            (product_id, quantity_added, previous_stock, new_stock, reason, supplier, cost_price, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              productId,
              amount,
              previousStock,
              newStock,
              `${supplier || "N/A"} | ${notes || ""}`,
              supplier || null,
              parsedCostPrice,
              notes || null,
            ],
            (err) => {
              if (err) return res.status(500).json({ success: false });

              res.json({
                success: true,
                message: "Restock successful",
                newStock,
              });
            }
          );
        }
      );
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

  const productId = parseInt(id, 10);
  const stockAmount = parseInt(amount, 10);

  if (!stockAmount || stockAmount <= 0)
    return res
      .status(400)
      .json({ success: false, message: "Invalid stock amount" });

  db.query(
    "UPDATE products SET stock = stock + ? WHERE id = ?",
    [stockAmount, productId],
    (err, result) => {
      if (err) {
        console.error("Add stock error:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }

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
  const { items, customerName } = req.body;
  const cleanedCustomerName =
    typeof customerName === "string" && customerName.trim()
      ? customerName.trim()
      : null;

  console.log("Checkout received - customerName:", cleanedCustomerName);

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.json({ success: false, message: "Cart is empty" });
  }

  try {
    // =========================
    // Generate short receipt ID
    // =========================
   const receiptId = await new Promise((resolve, reject) => {
  db.query(
    "SELECT COALESCE(MAX(receipt_id), 1000) + 1 AS nextReceipt FROM sales_items",
    (err, results) => {
      if (err) return reject(err);
      const receiptId = results[0].nextReceipt;
      resolve(receiptId);
    }
  );
});
    // =========================
    // Process checkout items
    // =========================
    let total = 0;
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

        total += product.price * quantity;

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
            `INSERT INTO sales_items 
            (product_id, barcode, quantity, price, total, product_name, receipt_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
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

    // Insert receipt total into sales table
    console.log("Inserting sales record - customerName:", cleanedCustomerName);
    await new Promise((resolve, reject) => {
      db.query(
        `INSERT INTO sales (receipt_id, total, adminId, customer_name) VALUES (?, ?, ?, ?)`,
        [receiptId, total, null, cleanedCustomerName],
        (err) => (err ? reject(err) : resolve())
      );
    });

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
    `SELECT
        si.id,
        si.receipt_id,
        si.product_id,
        si.product_name,
        si.barcode,
        si.quantity,
        si.price,
        si.total,
        si.created_at,
        s.total as receipt_total,
        s.customer_name
     FROM sales_items si
     LEFT JOIN sales s ON si.receipt_id = s.receipt_id
     ORDER BY si.created_at DESC`,
    (err, results) => {
      if (err)
        return res.status(500).json({ success: false, message: "Database error", error: err.message });

      res.json({ success: true, sales: results });
    }
  );
});

// -------------------------
// GET restock logs
// -------------------------
router.get("/restocks", (req, res) => {
  db.query(
    `SELECT r.*, p.name as product_name 
     FROM restocks r 
     LEFT JOIN products p ON r.product_id = p.id 
     ORDER BY r.created_at DESC`,
    (err, results) => {
      if (err) return res.status(500).json({ success: false });

      res.json({
        success: true,
        restocks: results,
      });
    }
  );
});

module.exports = router;