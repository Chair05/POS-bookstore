import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import authRoutes from './src/backend/routes/auth.js';
import customerProductRoutes from './src/backend/routes/customerProducts.js';
import customerCartRoutes from './src/backend/routes/customerCart.js';
import customerOrderRoutes from './src/backend/routes/customerOrders.js';
import customerPaymentRoutes from './src/backend/routes/customerPayments.js';
import adminRoutes from './src/backend/routes/admin.js';
import otpRoutes from './src/backend/routes/otp.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/customer/products', customerProductRoutes);
app.use('/api/customer/cart', customerCartRoutes);
app.use('/api/customer/orders', customerOrderRoutes);
app.use('/api/customer/orders', customerPaymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/otp', otpRoutes);

// Ensure otp_codes table exists
import pool from './src/backend/config/database.js';
pool.query(`
  CREATE TABLE IF NOT EXISTS otp_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    purpose ENUM('login', 'register') NOT NULL,
    expires_at DATETIME NOT NULL,
    used TINYINT(1) DEFAULT 0,
    attempts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_purpose (email, purpose)
  )
`).then(() => {
  return pool.query("SHOW COLUMNS FROM otp_codes LIKE 'attempts'");
}).then(([cols]) => {
  if (cols.length === 0) {
    return pool.query("ALTER TABLE otp_codes ADD COLUMN attempts INT DEFAULT 0 AFTER used");
  }
}).catch(() => {});

pool.query(`
  CREATE TABLE IF NOT EXISTS inventory_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    receipt_id INT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    type ENUM('IN','OUT') NOT NULL,
    quantity INT NOT NULL,
    reason VARCHAR(255) DEFAULT '',
    staff VARCHAR(100) DEFAULT 'System',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).catch(() => {});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'LCCB Bookstore API is running' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`LCCB Bookstore API running on http://localhost:${PORT}`);
});
