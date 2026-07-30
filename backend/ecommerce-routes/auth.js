const { Router } = require('express');
const crypto = require('crypto');
const { promisePool } = require('../db');
const { authenticateToken } = require('../ecommerce-middleware/auth');

const router = Router();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return salt + ':' + derivedKey.toString('hex');
}

function verifyPassword(password, hashed) {
  const [salt, key] = hashed.split(':');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return derivedKey.toString('hex') === key;
}

function signToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 })).toString('base64url');
  const signature = crypto.createHmac('sha256', process.env.JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

router.post('/register', async (req, res) => {
  try {
    const { fullName, email, contactNumber, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Full name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const [existing] = await promisePool.query('SELECT id FROM customers WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = hashPassword(password);
    const [result] = await promisePool.query(
      'INSERT INTO customers (full_name, name, email, contact_number, password, role) VALUES (?, ?, ?, ?, ?, ?)',
      [fullName, fullName, email, contactNumber || null, hashedPassword, 'customer']
    );

    const token = signToken({ userId: result.insertId });

    res.status(201).json({
      token,
      user: {
        id: result.insertId,
        fullName,
        email,
        contactNumber: contactNumber || null,
        role: 'customer',
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const [rows] = await promisePool.query(
      'SELECT id, full_name, email, contact_number, password, role FROM customers WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = rows[0];

    if (user.role === 'admin' || user.role === 'staff') {
      return res.status(403).json({ message: 'Admin/Staff accounts cannot login here. Use the admin panel.' });
    }

    const validPassword = verifyPassword(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken({ userId: user.id });

    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        contactNumber: user.contact_number,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        fullName: req.user.fullName,
        email: req.user.email,
        contactNumber: req.user.contactNumber,
        role: req.user.role,
      },
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Failed to get profile' });
  }
});

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { fullName, email, contactNumber } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ message: 'Full name and email are required' });
    }

    const [existing] = await promisePool.query(
      'SELECT id FROM customers WHERE email = ? AND id != ?',
      [email, req.user.id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    await promisePool.query(
      'UPDATE customers SET full_name = ?, name = ?, email = ?, contact_number = ? WHERE id = ?',
      [fullName, fullName, email, contactNumber || null, req.user.id]
    );

    res.json({
      user: {
        id: req.user.id,
        fullName,
        email,
        contactNumber: contactNumber || null,
        role: req.user.role,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const [rows] = await promisePool.query('SELECT password FROM customers WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const validPassword = verifyPassword(currentPassword, rows[0].password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const hashedPassword = hashPassword(newPassword);
    await promisePool.query('UPDATE customers SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

module.exports = router;
