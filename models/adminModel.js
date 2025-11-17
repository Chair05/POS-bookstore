// backend/models/adminModel.js
const db = require("../db");

const createAdmin = (username, password, callback) => {
  const query = "INSERT INTO admin (username, password) VALUES (?, ?)";
  db.query(query, [username, password], callback);
};

const findAdmin = (username, password, callback) => {
  const query = "SELECT * FROM admin WHERE username = ? AND password = ?";
  db.query(query, [username, password], callback);
};

module.exports = { createAdmin, findAdmin };
8