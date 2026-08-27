import { Router } from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireCustomer } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = Router();

router.use(authenticateToken, requireCustomer);

router.post('/:id/payment', upload.single('receipt'), async (req, res) => {
  try {
    const { id } = req.params;
    const { referenceNumber, paymentMethod = 'GCash' } = req.body;

    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE id = ? AND customer_id = ?',
      [id, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Payment receipt image is required' });
    }

    const receiptPath = `/uploads/receipts/${req.file.filename}`;

    await pool.query(
      "UPDATE orders SET reference_number = ?, receipt_image = ?, payment_method = ?, payment_status = 'pending' WHERE id = ?",
      [referenceNumber || '', receiptPath, paymentMethod, id]
    );

    await pool.query(
      `INSERT INTO payments (order_id, customer_id, receipt_image, reference_number, payment_method, amount, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [id, req.user.id, receiptPath, referenceNumber || '', paymentMethod, orders[0].total_amount]
    );

    res.json({ message: 'Payment submitted successfully' });
  } catch (error) {
    console.error('Upload payment error:', error);
    res.status(500).json({ message: 'Failed to upload payment' });
  }
});

export default router;
