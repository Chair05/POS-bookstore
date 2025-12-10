import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Stock() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockAmount, setStockAmount] = useState("");
  const [imageFile, setImageFile] = useState(null);

  // Load stock
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

  const updateStock = async () => {
    if (!selectedProduct || !stockAmount) return;

    const res = await fetch(
      `http://localhost:5000/api/products/${selectedProduct.id}/add-stock`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(stockAmount) }),
      }
    );

    const data = await res.json();
    if (data.success) {
      alert("Stock updated!");
      setStockAmount("");
      setSelectedProduct(null);
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

  if (loading) return <p className="p-6">Loading stock...</p>;
  if (error) return <p className="p-6 text-red-600">⚠️ {error}</p>;

  return (
    <div className="p-6 bg-sky-100 min-h-screen">

      {/* Back Button */}
      <Link
        to="/dashboard"
        className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow mb-6"
      >
        ⬅ Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold mb-4 text-gray-800">📦 Stock Inventory</h1>

      {/* Table Container */}
      <div className="overflow-x-auto shadow-lg rounded-xl bg-white">
        <table className="min-w-full">
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
              <tr
                key={item.id}
                className="border-b hover:bg-gray-50 transition"
              >
                <td className="p-3">
                  <img
                    src={`http://localhost:5000${item.image}?v=${Date.now()}`}
                    alt="product"
                    className="w-16 h-16 object-cover rounded-lg shadow"
                  />
                </td>

                <td className="p-3 font-semibold">{item.name}</td>
                <td className="p-3 text-gray-600">{item.category}</td>
                <td className="p-3 text-gray-500">{item.barcode}</td>
                <td className="p-3 font-bold text-blue-600">
                  ₱{Number(item.price).toFixed(2)}
                </td>
                <td className="p-3 font-bold">{item.stock}</td>

                <td className="p-3">
                  <div className="flex flex-col gap-2">

                    {/* Image upload */}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files[0])}
                      className="text-sm"
                    />

                    <button
                      onClick={() => updateImage(item.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm shadow"
                    >
                      Update Image
                    </button>

                    <button
                      onClick={() => setSelectedProduct(item)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm shadow"
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

      {/* Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-xl w-80 shadow-xl">
            <h3 className="text-lg font-bold mb-3">
              Add Stock for: {selectedProduct.name}
            </h3>

            <input
              type="number"
              placeholder="Enter amount"
              value={stockAmount}
              onChange={(e) => setStockAmount(e.target.value)}
              className="w-full border px-3 py-2 rounded-lg mb-4"
            />

            <button
              onClick={updateStock}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg mb-2"
            >
              Update Stock
            </button>

            <button
              onClick={() => setSelectedProduct(null)}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
