import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query('SELECT id, full_name, email, contact_number, role FROM customers WHERE id = ?', [decoded.userId]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = {
      id: rows[0].id,
      fullName: rows[0].full_name,
      email: rows[0].email,
      contactNumber: rows[0].contact_number,
      role: rows[0].role,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(403).json({ message: 'Invalid token' });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query('SELECT id, full_name, email, contact_number, role FROM customers WHERE id = ?', [decoded.userId]);

    if (rows.length > 0) {
      req.user = {
        id: rows[0].id,
        fullName: rows[0].full_name,
        email: rows[0].email,
        contactNumber: rows[0].contact_number,
        role: rows[0].role,
      };
    }

    next();
  } catch {
    next();
  }
};

export const requireCustomer = (req, res, next) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({ message: 'Customer access required' });
  }
  next();
};

export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'staff') {
    return res.status(403).json({ message: 'Admin or staff access required' });
  }
  next();
};
