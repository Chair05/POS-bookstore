import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Stock() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [scannedCode, setScannedCode] = useState("");

  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    barcode: "",
    stock: 1,
  });

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
    if (data.success) {
      loadStock();
    } else {
      alert("Failed to update stock");
    }
  };

  const updateImage = async (productId) => {
    if (!imageFile) return alert("Please select an image first");

    const formData = new FormData();
    formData.append("image", imageFile);

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
      setImageFile(null);
      loadStock();
    } else {
      alert("Image update failed");
    }
  };

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

    if (imageFile) formData.append("image", imageFile);

    try {
      const res = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        alert("Product added!");
        setNewProduct({ name: "", category: "", price: "", barcode: "", stock: 1 });
        setImageFile(null);
        loadStock();
      } else {
        alert(data.message || "Failed to add product");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter" && scannedCode) {
        const product = stock.find((item) => item.barcode === scannedCode);
        if (!product) {
          alert("Product not found");
          setScannedCode("");
          return;
        }

        updateStock(product.id, 1);
        setScannedCode("");
      } else if (e.key !== "Enter") {
        setScannedCode((prev) => prev + e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scannedCode, stock]);

  if (loading) return <p className="p-6">Loading stock...</p>;
  if (error) return <p className="p-6 text-red-600">⚠️ {error}</p>;

  return (
    <div className="min-h-screen bg-sky-100 p-4 md:p-6">
      {/* Back Button */}
      <div className="flex justify-start items-center mb-6">
        <Link
          to="/dashboard"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700 flex items-center gap-1"
        >
          ⬅ Back to Dashboard
        </Link>
      </div>

      <h1 className="mb-4 text-2xl md:text-3xl font-bold text-gray-800">
        📦 Stock Inventory
      </h1>

      {/* Add New Product */}
      <div className="mb-6 rounded-xl bg-white p-4 md:p-6 shadow-lg">
        <h2 className="text-lg md:text-xl font-semibold mb-3">➕ Add New Product</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            placeholder="Name"
            className="border p-2 rounded w-full"
            value={newProduct.name}
            onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
          />
          <input
            placeholder="Category"
            className="border p-2 rounded w-full"
            value={newProduct.category}
            onChange={(e) => setNewProduct((prev) => ({ ...prev, category: e.target.value }))}
          />
          <input
            placeholder="Price"
            type="number"
            className="border p-2 rounded w-full"
            value={newProduct.price}
            onChange={(e) => setNewProduct((prev) => ({ ...prev, price: e.target.value }))}
          />
          <input
            placeholder="Barcode"
            className="border p-2 rounded w-full"
            value={newProduct.barcode}
            onChange={(e) => setNewProduct((prev) => ({ ...prev, barcode: e.target.value }))}
          />
          <input
            placeholder="Stock"
            type="number"
            className="border p-2 rounded w-full"
            value={newProduct.stock}
            onChange={(e) => setNewProduct((prev) => ({ ...prev, stock: e.target.value }))}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
            className="border p-2 rounded w-full"
          />
        </div>
        <button
          onClick={addProduct}
          className="mt-3 rounded-lg bg-green-600 px-4 py-2 text-white shadow hover:bg-green-700 w-full md:w-auto"
        >
          Add Product
        </button>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-lg">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-3 text-left">Image</th>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Barcode</th>
              <th className="p-3 text-left">Price</th>
              <th className="p-3 text-left">Stock</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {stock.map((item) => (
              <tr key={item.id} className="border-b transition hover:bg-gray-50">
                <td className="p-3">
                  <img
                    src={`http://localhost:5000${item.image}?v=${Date.now()}`}
                    alt="product"
                    className="h-16 w-16 rounded-lg object-cover shadow"
                  />
                </td>
                <td className="p-3 font-semibold">{item.name}</td>
                <td className="p-3 text-gray-600">{item.category}</td>
                <td className="p-3 text-gray-500">{item.barcode}</td>
                <td className="p-3 font-bold text-blue-600">₱{Number(item.price).toFixed(2)}</td>
                <td className="p-3 font-bold">{item.stock}</td>
                <td className="p-3">
                  <div className="flex flex-col md:flex-row gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files[0])}
                      className="text-sm"
                    />
                    <button
                      onClick={() => updateImage(item.id)}
                      className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white shadow hover:bg-blue-700"
                    >
                      Update Image
                    </button>
                    <button
                      onClick={() => {
                        const amount = prompt("Enter stock to add", "1");
                        if (amount) updateStock(item.id, Number(amount));
                      }}
                      className="rounded-lg bg-green-600 px-3 py-1 text-sm text-white shadow hover:bg-green-700"
                    >
                      + Add Stock
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
