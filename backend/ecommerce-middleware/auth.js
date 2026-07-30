const crypto = require('crypto');
const { promisePool } = require('../db');

function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    const signature = crypto.createHmac('sha256', process.env.JWT_SECRET).update(`${parts[0]}.${parts[1]}`).digest('base64url');
    if (signature !== parts[2]) return null;
    if (payload.exp && Date.now() >= payload.exp * 1000) return null;
    return payload;
  } catch { return null; }
}

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const [rows] = await promisePool.query(
      'SELECT id, full_name, email, contact_number, role FROM customers WHERE id = ?',
      [decoded.userId]
    );

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
    return res.status(403).json({ message: 'Invalid token' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return next();

    const decoded = verifyToken(token);
    if (decoded) {
      const [rows] = await promisePool.query(
        'SELECT id, full_name, email, contact_number, role FROM customers WHERE id = ?',
        [decoded.userId]
      );
      if (rows.length > 0) {
        req.user = {
          id: rows[0].id,
          fullName: rows[0].full_name,
          email: rows[0].email,
          contactNumber: rows[0].contact_number,
          role: rows[0].role,
        };
      }
    }
    next();
  } catch {
    next();
  }
};

const requireCustomer = (req, res, next) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({ message: 'Customer access required' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'staff') {
    return res.status(403).json({ message: 'Admin or staff access required' });
  }
  next();
};

module.exports = { authenticateToken, optionalAuth, requireCustomer, requireAdmin };
