const express = require("express");
const router = express.Router();
const db = require("../db");
const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads")),
  filename: (req, file, cb) => cb(null, `receipt-${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

const generateOrderNumber = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${y}${m}${d}-${rand}`;
};

// ==================== CUSTOMERS ====================

router.get("/customers", (req, res) => {
  const sql = `
    SELECT c.*,
      COUNT(DISTINCT o.id) AS total_orders,
      COALESCE(SUM(o.total_amount), 0) AS total_purchases
    FROM customers c
    LEFT JOIN online_orders o ON c.id = o.customer_id AND o.order_status != 'rejected'
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Database error", error: err.message });
    res.json({ success: true, customers: results });
  });
});

router.get("/customers/:id", (req, res) => {
  const sql = `
    SELECT c.*,
      COUNT(DISTINCT o.id) AS total_orders,
      COALESCE(SUM(o.total_amount), 0) AS total_purchases
    FROM customers c
    LEFT JOIN online_orders o ON c.id = o.customer_id AND o.order_status != 'rejected'
    WHERE c.id = ?
    GROUP BY c.id
  `;
  db.query(sql, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });
    if (!results.length) return res.status(404).json({ success: false, message: "Customer not found" });
    res.json({ success: true, customer: results[0] });
  });
});

router.get("/customers/:id/orders", (req, res) => {
  const sql = `
    SELECT o.*,
      c.name AS customer_name, c.email AS customer_email, c.contact AS customer_contact
    FROM online_orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE o.customer_id = ?
    ORDER BY o.created_at DESC
  `;
  db.query(sql, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });
    res.json({ success: true, orders: results });
  });
});

// ==================== ORDERS ====================

router.get("/orders", (req, res) => {
  const sql = `
    SELECT o.*,
      c.name AS customer_name, c.email AS customer_email, c.contact AS customer_contact
    FROM online_orders o
    JOIN customers c ON o.customer_id = c.id
    ORDER BY o.created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Database error", error: err.message });
    res.json({ success: true, orders: results });
  });
});

router.get("/orders/:id", (req, res) => {
  const sql = `
    SELECT o.*,
      c.name AS customer_name, c.email AS customer_email, c.contact AS customer_contact
    FROM online_orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE o.id = ?
  `;
  db.query(sql, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });
    if (!results.length) return res.status(404).json({ success: false, message: "Order not found" });

    const order = results[0];

    db.query(
      "SELECT * FROM order_items WHERE order_id = ?",
      [order.id],
      (err2, items) => {
        if (err2) return res.status(500).json({ success: false, message: "Database error" });
        order.items = items;
        res.json({ success: true, order });
      }
    );
  });
});

router.get("/orders/:id/items", (req, res) => {
  db.query(
    "SELECT * FROM order_items WHERE order_id = ?",
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ success: false, message: "Database error" });
      res.json({ success: true, items: results });
    }
  );
});

router.post("/orders", (req, res) => {
  const { customer_id, items, payment_method, reference_number, receipt_image, notes } = req.body;

  if (!customer_id || !items || !items.length) {
    return res.status(400).json({ success: false, message: "Customer and items required" });
  }

  const order_number = generateOrderNumber();
  let total_amount = 0;
  items.forEach((item) => {
    total_amount += Number(item.price) * Number(item.quantity || 1);
  });

  const sql = `
    INSERT INTO online_orders (order_number, customer_id, total_amount, payment_method, reference_number, receipt_image, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(
    sql,
    [order_number, customer_id, total_amount, payment_method || "gcash", reference_number || null, receipt_image || null, notes || null],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Database error", error: err.message });

      const orderId = result.insertId;

      const itemSql = `
        INSERT INTO order_items (order_id, product_id, product_name, barcode, quantity, price, total)
        VALUES ?
      `;
      const itemValues = items.map((item) => [
        orderId,
        item.product_id,
        item.product_name,
        item.barcode || null,
        item.quantity || 1,
        item.price,
        Number(item.price) * Number(item.quantity || 1),
      ]);

      db.query(itemSql, [itemValues], (err2) => {
        if (err2) return res.status(500).json({ success: false, message: "Error adding items", error: err2.message });
        res.json({ success: true, orderId, order_number });
      });
    }
  );
});

router.put("/orders/:id/status", (req, res) => {
  const { status } = req.body;
  const validStatuses = ["pending_payment", "verified", "preparing", "ready_for_pickup", "completed", "rejected"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  const paymentStatusMap = {
    pending_payment: "pending",
    verified: "verified",
    preparing: "verified",
    ready_for_pickup: "verified",
    completed: "verified",
    rejected: "rejected",
  };

  const sql = `
    UPDATE online_orders SET order_status = ?, payment_status = ? WHERE id = ?
  `;
  db.query(sql, [status, paymentStatusMap[status] || "pending", req.params.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Order not found" });

    if (status === "completed") {
      db.query(
        "SELECT * FROM order_items WHERE order_id = ?",
        [req.params.id],
        (err2, items) => {
          if (err2 || !items || !items.length) return;

          items.forEach((item) => {
            db.query("UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE id = ?", [item.quantity, item.product_id]);
            db.query(
              `INSERT INTO inventory_logs (product_id, product_name, type, quantity, reason, staff, receipt_id)
               VALUES (?, ?, 'OUT', ?, ?, 'System', ?)`,
              [item.product_id, item.product_name, item.quantity, `Online Order ${req.params.id}`, req.params.id]
            );
          });
        }
      );
    }

    res.json({ success: true, message: "Status updated" });
  });
});

router.put("/orders/:id/verify-payment", (req, res) => {
  const { verified_by } = req.body;
  const sql = `
    UPDATE online_orders
    SET payment_status = 'verified', order_status = 'verified',
        verified_by = ?, verified_at = NOW()
    WHERE id = ?
  `;
  db.query(sql, [verified_by || null, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Order not found" });

    db.query(
      "UPDATE order_payments SET status = 'verified', verified_by = ?, verified_at = NOW() WHERE order_id = ?",
      [verified_by || null, req.params.id]
    );

    res.json({ success: true, message: "Payment verified" });
  });
});

router.put("/orders/:id/reject-payment", (req, res) => {
  const sql = `
    UPDATE online_orders
    SET payment_status = 'rejected', order_status = 'rejected'
    WHERE id = ?
  `;
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Order not found" });

    db.query(
      "UPDATE order_payments SET status = 'rejected' WHERE order_id = ?",
      [req.params.id]
    );

    res.json({ success: true, message: "Payment rejected" });
  });
});

router.post("/orders/:id/upload-receipt", upload.single("receipt"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

  const receiptPath = `/uploads/${req.file.filename}`;
  const sql = `UPDATE online_orders SET receipt_image = ? WHERE id = ?`;
  db.query(sql, [receiptPath, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Order not found" });

    db.query(
      "UPDATE order_payments SET receipt_image = ? WHERE order_id = ?",
      [receiptPath, req.params.id]
    );

    res.json({ success: true, receipt_path: receiptPath });
  });
});

// ==================== NOTIFICATIONS ====================

router.get("/notifications", (req, res) => {
  const notifications = [];

  db.query(
    "SELECT COUNT(*) AS count FROM online_orders WHERE order_status = 'pending_payment'",
    (err1, pendingPayments) => {
      if (!err1) notifications.push({ type: "pending_payment", count: pendingPayments[0].count });

      db.query(
        "SELECT COUNT(*) AS count FROM online_orders WHERE order_status = 'verified' AND payment_status = 'verified'",
        (err2, pendingPrep) => {
          if (!err2) notifications.push({ type: "pending_preparation", count: pendingPrep[0].count });

          db.query(
            "SELECT COUNT(*) AS count FROM products WHERE stock <= 30 AND stock > 0",
            (err3, lowStock) => {
              if (!err3) notifications.push({ type: "low_stock", count: lowStock[0].count });

              db.query(
                "SELECT COUNT(*) AS count FROM online_orders WHERE order_status = 'pending_payment'",
                (err4, newOrders) => {
                  if (!err4) notifications.push({ type: "new_orders", count: newOrders[0].count });

                  db.query(
                    "SELECT COUNT(*) AS count FROM online_orders WHERE order_status = 'ready_for_pickup'",
                    (err5, readyPickup) => {
                      if (!err5) notifications.push({ type: "ready_for_pickup", count: readyPickup[0].count });

                      res.json({ success: true, notifications });
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

// ==================== REPORTS ====================

router.get("/reports/summary", (req, res) => {
  const { start_date, end_date } = req.query;
  let dateFilter = "";
  const params = [];

  if (start_date && end_date) {
    dateFilter = "AND o.created_at BETWEEN ? AND ?";
    params.push(start_date, end_date + " 23:59:59");
  }

  const sql = `
    SELECT
      COUNT(DISTINCT o.id) AS total_orders,
      COUNT(DISTINCT CASE WHEN o.order_status = 'completed' THEN o.id END) AS completed_orders,
      COUNT(DISTINCT CASE WHEN o.order_status = 'preparing' THEN o.id END) AS preparing_orders,
      COUNT(DISTINCT CASE WHEN o.order_status = 'ready_for_pickup' THEN o.id END) AS ready_for_pickup_orders,
      COUNT(DISTINCT CASE WHEN o.order_status = 'rejected' THEN o.id END) AS rejected_orders,
      COUNT(DISTINCT CASE WHEN o.payment_status = 'verified' THEN o.id END) AS verified_payments,
      COALESCE(SUM(CASE WHEN o.order_status = 'completed' THEN o.total_amount ELSE 0 END), 0) AS completed_revenue,
      COALESCE(SUM(o.total_amount), 0) AS total_revenue
    FROM online_orders o
    WHERE 1=1 ${dateFilter}
  `;
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Database error", error: err.message });
    res.json({ success: true, summary: results[0] });
  });
});

router.get("/reports/daily-sales", (req, res) => {
  const { start_date, end_date } = req.query;
  let dateFilter = "";
  const params = [];

  if (start_date && end_date) {
    dateFilter = "AND created_at BETWEEN ? AND ?";
    params.push(start_date, end_date + " 23:59:59");
  }

  const sql = `
    SELECT DATE(created_at) AS date, COUNT(*) AS orders, SUM(total_amount) AS revenue
    FROM online_orders WHERE order_status != 'rejected' ${dateFilter}
    GROUP BY DATE(created_at) ORDER BY date DESC
  `;
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });
    res.json({ success: true, data: results });
  });
});

router.get("/reports/customer-summary", (req, res) => {
  const sql = `
    SELECT c.id, c.name, c.email, c.contact,
      COUNT(o.id) AS total_orders,
      COALESCE(SUM(o.total_amount), 0) AS total_spent,
      MIN(o.created_at) AS first_order,
      MAX(o.created_at) AS last_order
    FROM customers c
    JOIN online_orders o ON c.id = o.customer_id AND o.order_status != 'rejected'
    GROUP BY c.id
    ORDER BY total_spent DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });
    res.json({ success: true, data: results });
  });
});

router.get("/reports/best-sellers", (req, res) => {
  const { start_date, end_date } = req.query;
  let dateFilter = "";
  const params = [];

  if (start_date && end_date) {
    dateFilter = "AND oi.created_at BETWEEN ? AND ?";
    params.push(start_date, end_date + " 23:59:59");
  }

  const sql = `
    SELECT oi.product_id, oi.product_name, SUM(oi.quantity) AS total_sold, SUM(oi.total) AS total_revenue
    FROM order_items oi
    JOIN online_orders o ON oi.order_id = o.id
    WHERE o.order_status != 'rejected' ${dateFilter}
    GROUP BY oi.product_id, oi.product_name
    ORDER BY total_sold DESC
    LIMIT 10
  `;
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });
    res.json({ success: true, data: results });
  });
});

// ==================== DASHBOARD STATS ====================

router.get("/dashboard-stats", (req, res) => {
  const stats = {};
  let pending = 5;
  const done = () => {
    pending--;
    if (pending === 0) res.json({ success: true, stats });
  };

  db.query("SELECT COUNT(*) AS count FROM products", (e, r) => {
    stats.total_products = e ? 0 : r[0].count;
    done();
  });
  db.query("SELECT COUNT(*) AS count FROM categories", (e, r) => {
    stats.total_categories = e ? 0 : r[0].count;
    done();
  });
  db.query("SELECT COUNT(*) AS count FROM products WHERE stock <= 30", (e, r) => {
    stats.low_stock = e ? 0 : r[0].count;
    done();
  });
  db.query(
    "SELECT COUNT(*) AS count FROM online_orders WHERE order_status IN ('pending_payment','verified','preparing')",
    (e, r) => {
      stats.pending_orders = e ? 0 : r[0].count;
      done();
    }
  );
  db.query("SELECT COUNT(*) AS count FROM customers", (e, r) => {
    stats.total_customers = e ? 0 : r[0].count;
    done();
  });
});

module.exports = router;
