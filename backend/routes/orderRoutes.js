const express = require("express");
const router = express.Router();
const db = require("../db");
const { promisePool } = require("../db");
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

// ==================== E-COMMERCE HELPERS ====================

// Map ecom_orders.status (human-friendly) <-> POS online_orders.order_status (enum)
const ECOM_TO_POS_STATUS = {
  "Pending Payment Verification": "pending_payment",
  "Payment Verified": "verified",
  "Preparing": "preparing",
  "Ready for Pickup": "ready_for_pickup",
  "Completed": "completed",
  "Rejected": "rejected",
  "Cancelled": "cancelled",
};
const POS_TO_ECOM_STATUS = {
  pending_payment: "Pending Payment Verification",
  verified: "Payment Verified",
  preparing: "Preparing",
  ready_for_pickup: "Ready for Pickup",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const generatePickupCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Normalize an ecom_orders row to the same shape the POS Orders page expects
const formatEcomOrder = (o) => {
  const date = new Date(o.created_at);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return {
    id: o.id,
    source: "ecom",
    order_number: `ECO-${y}${m}${d}-${String(o.id).padStart(4, "0")}`,
    customer_id: o.customer_id,
    customer_name: o.customer_full_name || "",
    customer_email: o.customer_email || "",
    customer_contact: o.customer_contact || "",
    total_amount: o.total_amount,
    payment_method: String(o.payment_method || "gcash").toLowerCase().includes("rcbc") ? "rcbc" : "gcash",
    reference_number: o.reference_number || null,
    receipt_image: o.receipt_image || null,
    payment_status: o.payment_status || "pending",
    order_status: ECOM_TO_POS_STATUS[o.status] || o.status,
    verified_at: o.verified_at || null,
    pickup_code: o.pickup_code || null,
    created_at: o.created_at,
  };
};

// ==================== CUSTOMERS ====================

router.get("/customers", (req, res) => {
  const sql = `
    SELECT c.*,
      (SELECT COUNT(*) FROM online_orders WHERE customer_id = c.id AND order_status != 'rejected') +
      (SELECT COUNT(*) FROM ecom_orders WHERE customer_id = c.id AND status != 'Rejected') AS total_orders,
      COALESCE((SELECT SUM(total_amount) FROM online_orders WHERE customer_id = c.id AND order_status != 'rejected'), 0) +
      COALESCE((SELECT SUM(total_amount) FROM ecom_orders WHERE customer_id = c.id AND status != 'Rejected'), 0) AS total_purchases
    FROM customers c
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
      (SELECT COUNT(*) FROM online_orders WHERE customer_id = c.id AND order_status != 'rejected') +
      (SELECT COUNT(*) FROM ecom_orders WHERE customer_id = c.id AND status != 'Rejected') AS total_orders,
      COALESCE((SELECT SUM(total_amount) FROM online_orders WHERE customer_id = c.id AND order_status != 'rejected'), 0) +
      COALESCE((SELECT SUM(total_amount) FROM ecom_orders WHERE customer_id = c.id AND status != 'Rejected'), 0) AS total_purchases
    FROM customers c
    WHERE c.id = ?
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
    const posOrders = (results || []).map((o) => ({ ...o, source: "pos" }));

    promisePool.query("SELECT * FROM ecom_orders WHERE customer_id = ?", [req.params.id])
      .then(([ecomRows]) => {
        const ecomOrders = (ecomRows || []).map(formatEcomOrder);
        const orders = [...posOrders, ...ecomOrders].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        res.json({ success: true, orders });
      })
      .catch((err2) => {
        console.error("Failed to fetch e-commerce customer orders:", err2);
        res.json({ success: true, orders: posOrders });
      });
  });
});

// ==================== ORDERS ====================

router.get("/orders", (req, res) => {
  const sql = `
    SELECT o.*,
      c.name AS customer_name, c.email AS customer_email, c.contact AS customer_contact,
      (SELECT GROUP_CONCAT(oi.product_name SEPARATOR ', ')
         FROM order_items oi WHERE oi.order_id = o.id) AS product_names
    FROM online_orders o
    JOIN customers c ON o.customer_id = c.id
    ORDER BY o.created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("GET /orders (online_orders) SQL error:", err);
      return res.status(500).json({ success: false, message: "Database error", error: err.message });
    }

    const posOrders = (results || []).map((o) => ({ ...o, source: "pos" }));

    promisePool.query("SELECT * FROM ecom_orders")
      .then(([ecomRows]) => {
        const ecomOrders = (ecomRows || []).map(formatEcomOrder);
        const orderIds = ecomOrders.map((o) => o.id);
        if (orderIds.length === 0) {
          return res.json({ success: true, orders: [...posOrders, ...ecomOrders] });
        }
        const placeholders = orderIds.map(() => "?").join(",");
        return promisePool.query(
          `SELECT order_id, GROUP_CONCAT(product_name SEPARATOR ', ') AS product_names
           FROM ecom_order_items WHERE order_id IN (${placeholders}) GROUP BY order_id`,
          orderIds
        ).then(([nameRows]) => {
          const nameMap = {};
          (nameRows || []).forEach((r) => { nameMap[r.order_id] = r.product_names; });
          ecomOrders.forEach((o) => { o.product_names = nameMap[o.id] || ""; });
          const orders = [...posOrders, ...ecomOrders].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );
          res.json({ success: true, orders });
        });
      })
      .catch((err2) => {
        console.error("Failed to fetch e-commerce orders:", err2);
        res.json({ success: true, orders: posOrders });
      });
  });
});

router.get("/orders/:id", (req, res) => {
  const source = req.query.source || "pos";

  if (source === "ecom") {
    promisePool.query("SELECT * FROM ecom_orders WHERE id = ?", [req.params.id])
      .then(([orders]) => {
        if (!orders.length) return res.status(404).json({ success: false, message: "Order not found" });
        const order = formatEcomOrder(orders[0]);
        return promisePool.query("SELECT * FROM ecom_order_items WHERE order_id = ?", [order.id])
          .then(([items]) => {
            order.items = items.map((item) => ({
              id: item.id,
              product_id: item.product_id,
              product_name: item.product_name,
              barcode: null,
              quantity: item.quantity,
              price: item.price,
              total: Number(item.price) * Number(item.quantity),
            }));
            res.json({ success: true, order });
          });
      })
      .catch((err) => {
        console.error("Failed to fetch e-commerce order:", err);
        res.status(500).json({ success: false, message: "Database error" });
      });
    return;
  }

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
  const source = req.query.source || "pos";
  const validStatuses = ["pending_payment", "verified", "preparing", "ready_for_pickup", "completed", "rejected", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  if (source === "ecom") {
    const ecomStatus = POS_TO_ECOM_STATUS[status] || status;
    promisePool.query("UPDATE ecom_orders SET status = ? WHERE id = ?", [ecomStatus, req.params.id])
      .then(([result]) => {
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Order not found" });
        res.json({ success: true, message: "Status updated" });
      })
      .catch((err) => {
        console.error("Failed to update e-commerce order status:", err);
        res.status(500).json({ success: false, message: "Database error" });
      });
    return;
  }

  const paymentStatusMap = {
    pending_payment: "pending",
    verified: "verified",
    preparing: "verified",
    ready_for_pickup: "verified",
    completed: "verified",
    rejected: "rejected",
    cancelled: "rejected",
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
  const source = req.query.source || "pos";

  if (source === "ecom") {
    promisePool.query("SELECT * FROM ecom_orders WHERE id = ?", [req.params.id])
      .then(async ([orders]) => {
        if (!orders.length) return res.status(404).json({ success: false, message: "Order not found" });
        const connection = await promisePool.getConnection();
        try {
          await connection.beginTransaction();

          let pickupCode = null;
          let isUnique = false;
          while (!isUnique) {
            pickupCode = generatePickupCode();
            const [existing] = await connection.query(
              "SELECT id FROM ecom_orders WHERE pickup_code = ?",
              [pickupCode]
            );
            if (existing.length === 0) isUnique = true;
          }

          await connection.query(
            "UPDATE ecom_orders SET payment_status = 'verified', status = 'Payment Verified', pickup_code = ? WHERE id = ?",
            [pickupCode, req.params.id]
          );

          await connection.query(
            "UPDATE ecom_payments SET status = 'verified', verified_by = ?, verified_at = NOW() WHERE order_id = ?",
            [verified_by || null, req.params.id]
          );

          const [items] = await connection.query(
            "SELECT product_id, quantity, product_name FROM ecom_order_items WHERE order_id = ?",
            [req.params.id]
          );

          for (const item of items) {
            await connection.query(
              "UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE id = ?",
              [item.quantity, item.product_id]
            );
            await connection.query(
              `INSERT INTO inventory_logs (product_id, product_name, type, quantity, reason, staff, receipt_id)
               VALUES (?, ?, 'OUT', ?, ?, 'System', ?)`,
              [item.product_id, item.product_name, item.quantity, `Ecommerce Order ${req.params.id}`, req.params.id]
            );
          }

          await connection.commit();
          res.json({ success: true, message: "Payment verified", pickup_code: pickupCode });
        } catch (err2) {
          await connection.rollback();
          console.error("Failed to verify e-commerce payment:", err2);
          res.status(500).json({ success: false, message: "Database error" });
        } finally {
          connection.release();
        }
      })
      .catch((err) => {
        console.error("Failed to verify e-commerce payment:", err);
        res.status(500).json({ success: false, message: "Database error" });
      });
    return;
  }

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
  const source = req.query.source || "pos";

  if (source === "ecom") {
    promisePool.query("UPDATE ecom_orders SET payment_status = 'rejected', status = 'Rejected' WHERE id = ?", [req.params.id])
      .then(([result]) => {
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Order not found" });
        return promisePool.query("UPDATE ecom_payments SET status = 'rejected' WHERE order_id = ?", [req.params.id])
          .then(() => res.json({ success: true, message: "Payment rejected" }));
      })
      .catch((err) => {
        console.error("Failed to reject e-commerce payment:", err);
        res.status(500).json({ success: false, message: "Database error" });
      });
    return;
  }

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

  Promise.all([
    promisePool.query("SELECT COUNT(*) AS count FROM online_orders WHERE order_status = 'pending_payment'"),
    promisePool.query("SELECT COUNT(*) AS count FROM ecom_orders WHERE status = 'Pending Payment Verification'"),
    promisePool.query("SELECT COUNT(*) AS count FROM online_orders WHERE order_status = 'verified' AND payment_status = 'verified'"),
    promisePool.query("SELECT COUNT(*) AS count FROM ecom_orders WHERE status = 'Payment Verified'"),
    promisePool.query("SELECT COUNT(*) AS count FROM products WHERE deleted = 0 AND stock <= 30 AND stock > 0"),
    promisePool.query("SELECT COUNT(*) AS count FROM online_orders WHERE order_status = 'ready_for_pickup'"),
    promisePool.query("SELECT COUNT(*) AS count FROM ecom_orders WHERE status = 'Ready for Pickup'"),
  ])
    .then(([
      [posPending], [ecomPending],
      [posPrep], [ecomPrep],
      [lowStock],
      [posReady], [ecomReady],
    ]) => {
      notifications.push({ type: "pending_payment", count: posPending[0].count + ecomPending[0].count });
      notifications.push({ type: "pending_preparation", count: posPrep[0].count + ecomPrep[0].count });
      notifications.push({ type: "low_stock", count: lowStock[0].count });
      notifications.push({ type: "new_orders", count: posPending[0].count + ecomPending[0].count });
      notifications.push({ type: "ready_for_pickup", count: posReady[0].count + ecomReady[0].count });
      res.json({ success: true, notifications });
    })
    .catch((err) => {
      console.error("Failed to fetch notifications:", err);
      res.json({ success: true, notifications });
    });
});

// ==================== REPORTS ====================

router.get("/reports/summary", (req, res) => {
  const { start_date, end_date } = req.query;
  let dateFilter = "";
  const params = [];

  if (start_date && end_date) {
    dateFilter = "AND created_at BETWEEN ? AND ?";
    params.push(start_date, end_date + " 23:59:59", start_date, end_date + " 23:59:59");
  }

  const sql = `
    SELECT
      COUNT(*) AS total_orders,
      COUNT(CASE WHEN order_status = 'completed' THEN 1 END) AS completed_orders,
      COUNT(CASE WHEN order_status = 'preparing' THEN 1 END) AS preparing_orders,
      COUNT(CASE WHEN order_status = 'ready_for_pickup' THEN 1 END) AS ready_for_pickup_orders,
      COUNT(CASE WHEN order_status = 'rejected' THEN 1 END) AS rejected_orders,
      COUNT(CASE WHEN payment_status = 'verified' THEN 1 END) AS verified_payments,
      COALESCE(SUM(CASE WHEN order_status = 'completed' THEN total_amount ELSE 0 END), 0) AS completed_revenue,
      COALESCE(SUM(total_amount), 0) AS total_revenue
    FROM (
      SELECT id, order_status, payment_status, total_amount, created_at
      FROM online_orders
      WHERE 1=1 ${dateFilter}
      UNION ALL
      SELECT id, REPLACE(LOWER(status), ' ', '_') AS order_status, payment_status, total_amount, created_at
      FROM ecom_orders
      WHERE 1=1 ${dateFilter}
    ) o
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
    params.push(start_date, end_date + " 23:59:59", start_date, end_date + " 23:59:59");
  }

  const sql = `
    SELECT date, COUNT(*) AS orders, SUM(revenue) AS revenue FROM (
      SELECT DATE(created_at) AS date, 1 AS revenue
      FROM online_orders WHERE order_status != 'rejected' ${dateFilter}
      UNION ALL
      SELECT DATE(created_at) AS date, total_amount AS revenue
      FROM ecom_orders WHERE REPLACE(LOWER(status), ' ', '_') != 'rejected' ${dateFilter}
    ) t
    GROUP BY date ORDER BY date DESC
  `;
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });
    res.json({ success: true, data: results });
  });
});

router.get("/reports/customer-summary", (req, res) => {
  const sql = `
    SELECT c.id,
      COALESCE(NULLIF(c.name, ''), NULLIF(c.full_name, ''), c.email) AS name,
      c.email, c.contact,
      COUNT(*) AS total_orders,
      COALESCE(SUM(o.total_amount), 0) AS total_spent,
      MIN(o.created_at) AS first_order,
      MAX(o.created_at) AS last_order
    FROM customers c
    JOIN (
      SELECT customer_id, total_amount, created_at
      FROM online_orders WHERE order_status != 'rejected'
      UNION ALL
      SELECT customer_id, total_amount, created_at
      FROM ecom_orders WHERE REPLACE(LOWER(status), ' ', '_') != 'rejected'
    ) o ON c.id = o.customer_id
    GROUP BY c.id
    ORDER BY total_spent DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Database error", error: err.message });
    res.json({ success: true, data: results });
  });
});

router.get("/reports/best-sellers", (req, res) => {
  const { start_date, end_date } = req.query;
  let dateFilter = "";
  const params = [];

  if (start_date && end_date) {
    dateFilter = "AND oi.created_at BETWEEN ? AND ?";
    params.push(start_date, end_date + " 23:59:59", start_date, end_date + " 23:59:59");
  }

  const sql = `
    SELECT product_id, product_name, SUM(quantity) AS total_sold, SUM(total) AS total_revenue FROM (
      SELECT oi.product_id, oi.product_name, oi.quantity, oi.total
      FROM order_items oi
      JOIN online_orders o ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE o.order_status != 'rejected' AND p.deleted = 0 ${dateFilter}
      UNION ALL
      SELECT oi.product_id, oi.product_name, oi.quantity, (oi.quantity * oi.price) AS total
      FROM ecom_order_items oi
      JOIN ecom_orders o ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE REPLACE(LOWER(o.status), ' ', '_') != 'rejected' AND p.deleted = 0
      ${dateFilter ? dateFilter.replaceAll("oi.created_at", "o.created_at") : ""}
    ) t
    GROUP BY product_id, product_name
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
  let pending = 6;
  const done = () => {
    if (pending === 0) res.json({ success: true, stats });
  };

  db.query("SELECT COUNT(*) AS count FROM products WHERE deleted = 0", (e, r) => {
    stats.total_products = e ? 0 : r[0].count;
    pending--; done();
  });
  db.query("SELECT COUNT(*) AS count FROM categories", (e, r) => {
    stats.total_categories = e ? 0 : r[0].count;
    pending--; done();
  });
  db.query("SELECT COUNT(*) AS count FROM products WHERE deleted = 0 AND stock <= 30", (e, r) => {
    stats.low_stock = e ? 0 : r[0].count;
    pending--; done();
  });
  db.query(
    "SELECT COUNT(*) AS count FROM online_orders WHERE order_status IN ('pending_payment','verified','preparing')",
    (e, r) => {
      stats.pending_orders = e ? 0 : r[0].count;
      pending--;
      promisePool.query("SELECT COUNT(*) AS count FROM ecom_orders WHERE status IN ('Pending Payment Verification','Payment Verified','Preparing')")
        .then(([ecomR]) => {
          stats.pending_orders += ecomR[0].count;
          pending--; done();
        })
        .catch(() => { pending--; done(); });
    }
  );
  db.query("SELECT COUNT(*) AS count FROM customers", (e, r) => {
    stats.total_customers = e ? 0 : r[0].count;
    pending--; done();
  });
});

// ==================== STOCK TRENDS / ANALYSIS ====================

router.get("/reports/stock-trends", async (req, res) => {
  const days = parseInt(req.query.days) || 30;

  try {
    const [products] = await promisePool.query(
      "SELECT id, name, stock, cost_price FROM products WHERE deleted = 0"
    );

    const [sales] = await promisePool.query(
      `SELECT product_id, SUM(quantity) AS units FROM (
         SELECT oi.product_id, oi.quantity
         FROM order_items oi
         JOIN online_orders o ON oi.order_id = o.id
         WHERE o.order_status != 'rejected'
           AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         UNION ALL
         SELECT oi.product_id, oi.quantity
         FROM ecom_order_items oi
         JOIN ecom_orders o ON oi.order_id = o.id
         WHERE REPLACE(LOWER(o.status), ' ', '_') NOT IN ('rejected','cancelled')
           AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       ) t
       GROUP BY product_id`,
      [days, days]
    );

    const salesMap = {};
    sales.forEach((s) => { salesMap[s.product_id] = Number(s.units) || 0; });

    const LEAD_TIME_DAYS = 7;
    const SAFETY_STOCK = 10;
    const LOW_STOCK_THRESHOLD = 30;

    const trends = products
      .map((p) => {
        const unitsSold = salesMap[p.id] || 0;
        const dailyVelocity = unitsSold / days;
        const daysUntilEmpty = dailyVelocity > 0 ? Math.floor(p.stock / dailyVelocity) : Infinity;
        const reorderPoint = Math.ceil(dailyVelocity * LEAD_TIME_DAYS) + SAFETY_STOCK;
        const stockBelowThreshold = p.stock <= LOW_STOCK_THRESHOLD;
        const needsReorder = stockBelowThreshold || p.stock <= reorderPoint;
        const stockValue = Number(p.cost_price || 0) * p.stock;

        let status = "healthy";
        if (p.stock <= 0) status = "out_of_stock";
        else if (needsReorder || stockBelowThreshold) status = "low";
        else if (dailyVelocity > 0 && daysUntilEmpty < 14) status = "watch";

        return {
          id: p.id,
          name: p.name,
          stock: p.stock,
          cost_price: Number(p.cost_price || 0),
          stock_value: stockValue,
          units_sold: unitsSold,
          daily_velocity: Number(dailyVelocity.toFixed(2)),
          days_until_empty: isFinite(daysUntilEmpty) ? daysUntilEmpty : null,
          reorder_point: reorderPoint,
          needs_reorder: needsReorder,
          status,
        };
      })
      .sort((a, b) => b.daily_velocity - a.daily_velocity);

    const summary = {
      total_products: trends.length,
      out_of_stock: trends.filter((t) => t.status === "out_of_stock").length,
      low_stock: trends.filter((t) => t.status === "low").length,
      needs_reorder: trends.filter((t) => t.needs_reorder).length,
      healthy: trends.filter((t) => t.status === "healthy").length,
      total_stock_value: trends.reduce((s, t) => s + t.stock_value, 0),
    };

    res.json({
      success: true,
      days,
      summary,
      trends: trends.slice(0, 20),
      reorderList: trends.filter((t) => t.needs_reorder).slice(0, 20),
    });
  } catch (err) {
    console.error("Stock trends error:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

module.exports = router;
