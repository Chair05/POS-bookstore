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
