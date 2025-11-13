const Product = require('../models/productModel');

exports.getProducts = (req, res) => {
  Product.getAll((err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(results);
  });
};

exports.createProduct = (req, res) => {
  const { name, price, category } = req.body;
  Product.create({ name, price, category }, (err, result) => {
    if (err) return res.status(500).json({ message: 'Insert failed' });
    res.json({ message: 'Product added', id: result.insertId });
  });
};

exports.updateProduct = (req, res) => {
  const { id } = req.params;
  const { name, price, category } = req.body;
  Product.update(id, { name, price, category }, (err) => {
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
