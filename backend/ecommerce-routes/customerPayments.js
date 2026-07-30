const { Router } = require('express');
const { promisePool } = require('../db');
const { authenticateToken, requireCustomer } = require('../ecommerce-middleware/auth');
const upload = require('../ecommerce-middleware/upload');

const router = Router();

router.use(authenticateToken, requireCustomer);

router.post('/:id/payment', upload.single('receipt'), async (req, res) => {
  try {
    const { id } = req.params;
    const { referenceNumber, paymentMethod = 'GCash' } = req.body;

    const [orders] = await promisePool.query(
      'SELECT * FROM ecom_orders WHERE id = ? AND customer_id = ?',
      [id, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Payment receipt image is required' });
    }

    if (!referenceNumber) {
      return res.status(400).json({ message: 'Reference number is required' });
    }

    const receiptPath = `/uploads/receipts/${req.file.filename}`;

    await promisePool.query(
      "UPDATE ecom_orders SET reference_number = ?, receipt_image = ?, payment_method = ?, payment_status = 'pending' WHERE id = ?",
      [referenceNumber, receiptPath, paymentMethod, id]
    );

    await promisePool.query(
      'INSERT INTO ecom_payments (order_id, customer_id, receipt_image, reference_number, payment_method, amount, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, req.user.id, receiptPath, referenceNumber, paymentMethod, orders[0].total_amount, 'pending']
    );

    res.json({ message: 'Payment submitted successfully' });
  } catch (error) {
    console.error('Upload payment error:', error);
    res.status(500).json({ message: 'Failed to upload payment' });
  }
});

module.exports = router;
