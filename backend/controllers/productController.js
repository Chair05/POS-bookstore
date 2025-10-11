const { getAllProducts, addProduct } = require("../models/productModel");

const fetchProducts = (req, res) => {
  getAllProducts((err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Server error" });
    res.json({ success: true, products: results });
  });
};

const createProduct = (req, res) => {
  const product = req.body;
  if (!product.name || !product.price || !product.category || !product.barcode)
    return res.status(400).json({ success: false, message: "All fields required" });

  addProduct(product, (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ success: false, message: "Barcode already exists" });
      }
      return res.status(500).json({ success: false, message: "Server error" });
    }
    res.json({ success: true, id: result.insertId });
  });
};

module.exports = { fetchProducts, createProduct };
