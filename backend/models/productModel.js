const db = require("../db");

const getAllProducts = (callback) => {
  db.query("SELECT * FROM products", callback);
};

const addProduct = (product, callback) => {
  const { name, price, category, barcode } = product;
  const query = "INSERT INTO products (name, price, category, barcode) VALUES (?, ?, ?, ?)";
  db.query(query, [name, price, category, barcode], callback);
};

module.exports = { getAllProducts, addProduct };
