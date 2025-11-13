const db = require('./db');

const Product = {
  getAll: (callback) => {
    db.query('SELECT * FROM products', callback);
  },

  create: (data, callback) => {
    db.query(
      'INSERT INTO products (name, price, category) VALUES (?, ?, ?)',
      [data.name, data.price, data.category],
      callback
    );
  },

  update: (id, data, callback) => {
    db.query(
      'UPDATE products SET name=?, price=?, category=? WHERE id=?',
      [data.name, data.price, data.category, id],
      callback
    );
  },

  delete: (id, callback) => {
    db.query('DELETE FROM products WHERE id=?', [id], callback);
  }
};

module.exports = Product;
