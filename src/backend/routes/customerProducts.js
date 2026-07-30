import { Router } from 'express';
import pool from '../config/database.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { search, category, sort, limit = 50, page = 1 } = req.query;

    let query = 'SELECT * FROM products WHERE stock > 0';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR barcode LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    const [columnRows] = await pool.query("SHOW COLUMNS FROM products LIKE 'created_at'");
    const hasCreatedAt = columnRows.length > 0;

    const sortMap = {
      newest: hasCreatedAt ? 'created_at DESC' : 'id DESC',
      'price-low': 'price ASC',
      'price-high': 'price DESC',
      name: 'name ASC',
      '-createdAt': hasCreatedAt ? 'created_at DESC' : 'id DESC',
      '-price': 'price DESC',
      price: 'price ASC',
    };

    query += ` ORDER BY ${sortMap[sort] || (hasCreatedAt ? 'created_at DESC' : 'id DESC')}`;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [rows] = await pool.query(query, params);

    const products = rows.map(formatProduct);

    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM products WHERE stock > 0'
    );

    res.json({
      products,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

router.get('/categories/list', async (req, res) => {
  try {
    const [tables] = await pool.query("SHOW TABLES LIKE 'categories'");
    let categories = [];

    if (tables.length > 0) {
      const [cols] = await pool.query("SHOW COLUMNS FROM categories");
      const colNames = cols.map((c) => c.Field);
      const nameCol = colNames.includes('name') ? 'name' : colNames.includes('category_name') ? 'category_name' : colNames[1] || 'id';

      const [rows] = await pool.query(`SELECT * FROM categories ORDER BY ${nameCol} ASC`);
      categories = rows.map((r) => ({
        id: r.id || r[cols[0].Field],
        name: r[nameCol],
      }));
    } else {
      const [rows] = await pool.query(
        "SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != '' ORDER BY category ASC"
      );
      categories = rows.map((r, i) => ({ id: i + 1, name: r.category }));
    }

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ product: formatProduct(rows[0]) });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

function formatProduct(row) {
  let sizes = [];
  if (row.sizes) {
    try {
      sizes = typeof row.sizes === 'string' ? JSON.parse(row.sizes) : row.sizes;
    } catch {
      sizes = [];
    }
  }
  if (sizes.length === 0 && row.size) {
    sizes = row.size.split(',').map((s) => s.trim()).filter(Boolean);
  }

  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    description: row.description || '',
    price: parseFloat(row.price),
    category: row.category,
    department: row.department || null,
    image: row.image,
    stock: row.stock,
    barcode: row.barcode || null,
    sizes,
    createdAt: row.created_at || row.id,
    updatedAt: row.updated_at || row.id,
  };
}

export default router;
