const express = require("express");
const router = express.Router();
const { fetchProducts, createProduct } = require("../controllers/productController");

router.get("/products", fetchProducts);
router.post("/products", createProduct);

module.exports = router;
