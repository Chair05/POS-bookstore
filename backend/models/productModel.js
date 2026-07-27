const db = require('../db');

const Product = {
  getAll: (callback) => {
    db.query('SELECT * FROM products', callback);
  },

  getByBarcode: (barcode, callback) => {
    db.query('SELECT * FROM products WHERE barcode = ?', [barcode], callback);
  },

 create: (data, callback) => {
  db.query(
    "INSERT INTO products (name, price, category, barcode, stock, image) VALUES (?, ?, ?, ?, ?, ?)",
    [data.name, data.price, data.category, data.barcode, data.stock, data.image],
    callback
  );
},

upupdateStock: (id, amount, callback) => {
  db.query(
    "UPDATE products SET stock = stock + ? WHERE id = ?",
    [amount, id],
    callback
  );
},



  update: (id, data, callback) => {
    db.query(
      'UPDATE products SET name=?, price=?, category=?, barcode=?, stock=? WHERE id=?',
      [
        data.name,
        data.price,
        data.category,
        data.barcode,
        data.stock,
        id
      ],
      callback
    );
  },
  

  delete: (id, callback) => {
    db.query('DELETE FROM products WHERE id=?', [id], callback);
  },

  reduceStock: (id, qty, callback) => {
    db.query(
      'UPDATE products SET stock = stock - ? WHERE id=? AND stock >= ?',
      [qty, id, qty],
      callback
    );
  }
};

module.exports = Product;
