import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Stock() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [imageFiles, setImageFiles] = useState({});
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    barcode: "",
    stock: 1,
  });

  const [scanInputs, setScanInputs] = useState({});
  const [amountInputs, setAmountInputs] = useState({});
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  /* ================= LOAD STOCK & CATEGORIES ================= */
  useEffect(() => {
    loadStock();
    loadCategories();
  }, []);

  const loadStock = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/products");
      const data = await res.json();
      if (!data.success) throw new Error("Failed to load stock");
      setStock(data.products || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/categories");
      const data = await res.json();
      if (!data.success) throw new Error("Failed to load categories");
      setCategories(data.categories || []);
    } catch (err) {
      console.error("Category load error:", err);
    }
  };

  /* ================= UPDATE STOCK ================= */
  const updateStock = async (productId, amount) => {
    setStock((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, stock: (p.stock || 0) + amount } : p
      )
    );

    try {
      const res = await fetch(
        `http://localhost:5000/api/products/${productId}/add-stock`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        }
      );
      const data = await res.json();
      if (!data.success) {
        alert("Failed to update stock on server");
        loadStock();
      }
    } catch (err) {
      console.error(err);
      alert("Error updating stock");
      loadStock();
    }
  };

  /* ================= UPDATE CATEGORY ================= */
  const updateCategory = async (productId, categoryName) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/products/${productId}/update-category`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: categoryName }),
        }
      );
      const data = await res.json();
      if (!data.success) alert("Failed to update category");
      else loadStock();
    } catch (err) {
      console.error(err);
      alert("Error updating category");
    }
  };

  /* ================= ADD CATEGORY ================= */
  const addCategory = async () => {
    if (!newCategory.trim()) return alert("Enter category name");
    if (categories.some((c) => c.name === newCategory))
      return alert("Category already exists");

    try {
      const res = await fetch("http://localhost:5000/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory }),
      });
      const data = await res.json();

      if (data.success && data.category?.name) {
        await loadCategories();
        setNewProduct((prev) => ({ ...prev, category: data.category.name }));
        setNewCategory("");
      } else {
        console.error("Backend response invalid:", data);
        alert("Failed to add category");
      }
    } catch (err) {
      console.error("Error adding category:", err);
      alert("Error adding category");
    }
  };

  /* ================= DELETE CATEGORY ================= */
  const deleteCategory = async (categoryId, productId) => {
    if (!window.confirm("Delete this category?")) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/categories/${categoryId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        await loadCategories();
        if (productId) updateCategory(productId, "");
      } else alert("Failed to delete category");
    } catch (err) {
      console.error(err);
      alert("Error deleting category");
    }
  };

  /* ================= UPDATE IMAGE ================= */
  const updateImage = async (productId) => {
    const file = imageFiles[productId];
    if (!file) return alert("Please choose an image first");

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(
        `http://localhost:5000/api/products/${productId}/update-image`,
        { method: "PUT", body: formData }
      );
      const data = await res.json();
      if (data.success) {
        alert("Image updated!");
        setImageFiles((prev) => ({ ...prev, [productId]: null }));
        await loadStock();
      } else alert("Image update failed");
    } catch (err) {
      console.error(err);
      alert("Error updating image");
    }
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

    try {
      const res = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        alert("Product added!");
        setNewProduct({ name: "", category: "", price: "", barcode: "", stock: 1 });
        await loadStock();
      } else alert("Failed to add product");
    } catch (err) {
      console.error(err);
      alert("Error adding product");
    }
  };

  /* ================= DELETE PRODUCT ================= */
  const deleteProduct = async (productId) => {
    if (!productId) return alert("Invalid product ID");

    try {
      const res = await fetch(
        `http://localhost:5000/api/products/${productId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        alert("Product deleted!");
        setConfirmDeleteId(null);
        await loadStock();
      } else alert(data.message || "Failed to delete product");
    } catch (err) {
      console.error(err);
      alert("Error deleting product");
    }
  };

  /* ================= HANDLE PER-PRODUCT SCAN WITH AMOUNT ================= */
  const handleScanEnter = (productId) => {
    const barcode = scanInputs[productId]?.trim();
    let amount = Number(amountInputs[productId]) || 1;
    if (!barcode) return;

    const product = stock.find(
      (p) => p.id === productId && p.barcode === barcode
    );

    if (product) {
      updateStock(productId, amount);
      setScanInputs((prev) => ({ ...prev, [productId]: "" }));
      setAmountInputs((prev) => ({ ...prev, [productId]: 1 }));
    } else {
      alert("Barcode does not match this product");
    }
  };

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

      <h1 className="text-3xl font-bold text-white mb-4">📦 Stock Inventory</h1>

      {/* ADD PRODUCT */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-4">
        <h2 className="text-xl font-semibold mb-4">➕ Add New Product</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            placeholder="Name"
            className="border rounded-lg px-4 py-3"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
          />

          <select
            className="border rounded-lg px-4 py-3"
            value={newProduct.category}
            onChange={(e) =>
              setNewProduct({ ...newProduct, category: e.target.value === "__add_new" ? "" : e.target.value })
            }
          >
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
            <option value="__add_new">➕ Add new category</option>
          </select>

          {newProduct.category === "" && (
            <div className="flex gap-2">
              <input
                placeholder="New category"
                className="border rounded-lg px-4 py-3 flex-1"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <button onClick={addCategory} className="bg-green-600 text-white px-4 rounded-lg">Add</button>
            </div>
          )}

          <input
            type="number"
            placeholder="Price"
            className="border rounded-lg px-4 py-3"
            value={newProduct.price}
            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
          />

          <input
            placeholder="Barcode"
            className="border rounded-lg px-4 py-3"
            value={newProduct.barcode}
            onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
          />

          <input
            type="number"
            placeholder="Stock"
            className="border rounded-lg px-4 py-3"
            value={newProduct.stock}
            onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
          />
        </div>

        <button
          onClick={addProduct}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-full font-semibold"
        >
          Add Product
        </button>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl shadow-lg">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4">Image</th>
              <th className="p-4">Product</th>
              <th className="p-4">Category</th>
              <th className="p-4">Barcode</th>
              <th className="p-4">Price</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Scan + Amount</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((item) => (
              <tr key={item.id || Math.random()} className="border-b">
                <td className="p-4">
                  {item.image ? (
                    <img
                      src={`http://localhost:5000${item.image}`}
                      className="h-16 w-16 rounded-xl object-cover"
                      alt={item.name || "Product Image"}
                    />
                  ) : (
                    <div className="h-16 w-16 bg-gray-200 rounded-xl flex items-center justify-center text-gray-500">
                      No Image
                    </div>
                  )}
                </td>
                <td className="p-4 font-semibold">{item.name || "Unnamed"}</td>
                <td className="p-4 relative">
                  <div
                    className="border rounded-lg px-3 py-2 cursor-pointer w-40"
                    onClick={() =>
                      setOpenDropdownId(openDropdownId === item.id ? null : item.id)
                    }
                  >
                    {categories.find((c) => c.name === item.category)?.name ||
                      item.category || "Select Category"}
                  </div>
                  {openDropdownId === item.id && (
                    <ul className="absolute bg-white border rounded shadow mt-1 w-40 z-50 max-h-48 overflow-y-auto">
                      {categories.map((c) => (
                        <li
                          key={c.id}
                          className="flex justify-between items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          <span
                            onClick={() => {
                              updateCategory(item.id, c.name);
                              setOpenDropdownId(null);
                            }}
                            className="flex-1"
                          >
                            {c.name}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCategory(c.id, item.id);
                            }}
                            className="text-red-600 font-bold ml-2"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>

                <td className="p-4">{item.barcode || "—"}</td>
                <td className="p-4 font-bold text-blue-600">{item.price || 0}</td>
                <td className="p-4 font-bold">{item.stock || 0}</td>

                {/* SCAN + AMOUNT */}
                <td className="p-4 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      placeholder="Scan barcode"
                      className="border rounded-lg px-2 py-1 flex-1"
                      value={scanInputs[item.id] || ""}
                      onChange={(e) =>
                        setScanInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleScanEnter(item.id)}
                    />
                    <input
                      type="number"
                      min={1}
                      placeholder="Amount"
                      className="border rounded-lg px-2 py-1 w-20"
                      value={amountInputs[item.id] || 1}
                      onChange={(e) =>
                        setAmountInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                    />
                  </div>
                </td>

                {/* ACTIONS */}
                <td className="p-4 flex flex-col gap-2">
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        setImageFiles((prev) => ({ ...prev, [item.id]: e.target.files[0] }));
                      }
                    }}
                  />
                  {imageFiles[item.id] && (
                    <p className="text-sm text-green-600">
                      Selected: {imageFiles[item.id].name}
                    </p>
                  )}
                  <button
                    onClick={() => updateImage(item.id)}
                    className="w-full bg-blue-600 text-white py-2 rounded-xl"
                  >
                    Upload Image
                  </button>

                  {confirmDeleteId === item.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => deleteProduct(item.id)}
                        className="flex-1 bg-red-600 text-white py-2 rounded-xl"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="flex-1 border py-2 rounded-xl"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="w-full bg-red-100 text-red-700 py-2 rounded-xl"
                    >
                      🗑 Delete Item
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
