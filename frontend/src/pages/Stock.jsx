import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Stock() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [imageFiles, setImageFiles] = useState({});
  const [scannedCode, setScannedCode] = useState("");

  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    barcode: "",
    stock: 1,
  });

  const categories = [
    "School Supplies",
    "Shirt",
    "Pants",
    "Footwear",
    "Pen",
    "Others",
  ];

  /* ================= LOAD STOCK ================= */
  useEffect(() => {
    loadStock();
  }, []);

  const loadStock = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/products");
      const data = await res.json();
      if (!data.success) throw new Error("Failed to load stock");
      setStock(data.products);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= UPDATE STOCK ================= */
  const updateStock = async (productId, amount) => {
    const res = await fetch(
      `http://localhost:5000/api/products/${productId}/add-stock`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      }
    );
    const data = await res.json();
    if (data.success) loadStock();
    else alert("Failed to update stock");
  };

  /* ================= UPDATE CATEGORY ================= */
  const updateCategory = async (productId, category) => {
    const res = await fetch(
      `http://localhost:5000/api/products/${productId}/update-category`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      }
    );
    const data = await res.json();
    if (!data.success) alert("Failed to update category");
    else loadStock();
  };

  /* ================= UPDATE IMAGE ================= */
  const updateImage = async (productId) => {
    const file = imageFiles[productId];
    if (!file) return alert("Please choose an image first");

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(
      `http://localhost:5000/api/products/${productId}/update-image`,
      {
        method: "PUT",
        body: formData,
      }
    );

    const data = await res.json();
    if (data.success) {
      alert("Image updated!");
      setImageFiles((prev) => ({ ...prev, [productId]: null }));
      loadStock();
    } else alert("Image update failed");
  };

  /* ================= ADD PRODUCT ================= */
  const addProduct = async () => {
    const { name, category, price, barcode, stock: pStock } = newProduct;
    if (!name || !category || !price || !barcode)
      return alert("Please fill in all fields");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("category", category);
    formData.append("price", Number(price));
    formData.append("barcode", barcode);
    formData.append("stock", Number(pStock));

    const res = await fetch("http://localhost:5000/api/products", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.success) {
      alert("Product added!");
      setNewProduct({
        name: "",
        category: "",
        price: "",
        barcode: "",
        stock: 1,
      });
      loadStock();
    } else alert("Failed to add product");
  };

  /* ================= BARCODE SCANNER (SMART) ================= */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore typing inside inputs
      if (
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "SELECT"
      )
        return;

      if (e.key === "Enter" && scannedCode) {
        const product = stock.find(
          (item) => item.barcode === scannedCode
        );

        if (product) {
          // Existing product → add stock
          updateStock(product.id, 1);
        } else {
          // New product → auto-fill barcode
          setNewProduct((prev) => ({
            ...prev,
            barcode: scannedCode,
          }));
        }

        setScannedCode("");
      } else if (e.key.length === 1) {
        setScannedCode((prev) => prev + e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scannedCode, stock]);

  if (loading) return <p className="p-6 text-white">Loading...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="h-screen w-screen bg-blue-500 p-4 flex flex-col">
      <Link
        to="/dashboard"
        className="mb-4 bg-white text-blue-600 px-6 py-3 rounded-full font-semibold shadow hover:bg-blue-100 transition w-fit"
      >
        ⬅ Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold text-white mb-4">
        📦 Stock Inventory
      </h1>

      {/* ADD PRODUCT */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-4 sticky top-0 z-10">
        <h2 className="text-xl font-semibold mb-4">
          ➕ Add New Product
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            placeholder="Name"
            className="border rounded-lg px-4 py-3"
            value={newProduct.name}
            onChange={(e) =>
              setNewProduct({ ...newProduct, name: e.target.value })
            }
          />

          <select
            className="border rounded-lg px-4 py-3"
            value={newProduct.category}
            onChange={(e) =>
              setNewProduct({ ...newProduct, category: e.target.value })
            }
          >
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Price"
            className="border rounded-lg px-4 py-3"
            value={newProduct.price}
            onChange={(e) =>
              setNewProduct({ ...newProduct, price: e.target.value })
            }
          />

          <input
            placeholder="Barcode (scan item)"
            className="border rounded-lg px-4 py-3 bg-gray-50"
            value={newProduct.barcode}
            readOnly
          />

          <input
            type="number"
            placeholder="Stock"
            className="border rounded-lg px-4 py-3"
            value={newProduct.stock}
            onChange={(e) =>
              setNewProduct({ ...newProduct, stock: e.target.value })
            }
          />
        </div>

        <button
          onClick={addProduct}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-full font-semibold shadow"
        >
          Add Product
        </button>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl shadow-lg">
        <table className="min-w-full">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="p-4">Image</th>
              <th className="p-4">Product</th>
              <th className="p-4">Category</th>
              <th className="p-4">Barcode</th>
              <th className="p-4">Price</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-4">
                  <img
                    src={`http://localhost:5000${item.image}`}
                    className="h-16 w-16 rounded-xl object-cover"
                    alt=""
                  />
                </td>
                <td className="p-4 font-semibold">{item.name}</td>
                <td className="p-4">
                  <select
                    className="border rounded-lg px-3 py-2"
                    value={item.category}
                    onChange={(e) =>
                      updateCategory(item.id, e.target.value)
                    }
                  >
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </td>
                <td className="p-4">{item.barcode}</td>
                <td className="p-4 font-bold text-blue-600">
                  ₱{item.price}
                </td>
                <td className="p-4 font-bold">{item.stock}</td>
                <td className="p-4 space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setImageFiles((prev) => ({
                        ...prev,
                        [item.id]: e.target.files[0],
                      }))
                    }
                  />
                  <button
                    onClick={() => updateImage(item.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-medium"
                  >
                    Upload Image
                  </button>
                  <button
                    onClick={() => {
                      const amount = prompt("Add stock", "1");
                      if (amount)
                        updateStock(item.id, Number(amount));
                    }}
                    className="w-full border-2 border-blue-600 text-blue-600 py-2 rounded-xl font-medium hover:bg-blue-50"
                  >
                    + Add Stock
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
