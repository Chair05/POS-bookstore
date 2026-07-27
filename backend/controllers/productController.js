const Product = require('../models/productModel');

exports.getProducts = (req, res) => {
  Product.getAll((err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(results);
  });
};

exports.createProduct = (req, res) => {
  const { name, price, category, barcode, stock, image } = req.body;

  Product.create({ name, price, category, barcode, stock, image }, (err, result) => {
    if (err) return res.status(500).json({ message: "Insert failed" });

    res.json({ message: "Product added", id: result.insertId });
  });
};


exports.updateProduct = (req, res) => {
  const { id } = req.params;
  const { name, price, category, barcode, stock } = req.body;

  Product.update(id, { name, price, category, barcode, stock }, (err) => {
    if (err) return res.status(500).json({ message: 'Update failed' });
    res.json({ message: 'Product updated' });
  });
};

exports.deleteProduct = (req, res) => {
  const { id } = req.params;
  Product.delete(id, (err) => {
    if (err) return res.status(500).json({ message: 'Delete failed' });
    res.json({ message: 'Product deleted' });
  });
};

exports.purchaseProduct = (req, res) => {
  const { barcode, quantity } = req.body;

  Product.reduceStock(barcode, quantity, (err, result) => {
    if (err) return res.status(500).json({ message: 'Purchase failed' });

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'Not enough stock!' });
    }

    res.json({ message: 'Purchase successful! Stock updated.' });
  });
};

exports.updateStock = (req, res) => {
  const id = req.params.id;
  const { amount } = req.body;

  const sql = `
    UPDATE products
    SET stock = stock + ?
    WHERE id = ?
  `;

  db.query(sql, [amount, id], (err) => {
    if (err) {
      console.log("Stock update error:", err);
      return res.status(500).json({ success: false });
    }

    res.json({ success: true });
  });
};

  Product.updateStock(id, amount, (err) => {
    if (err) return res.status(500).json({ message: "Stock update failed" });
    res.json({ message: "Stock added successfully" });
  });

