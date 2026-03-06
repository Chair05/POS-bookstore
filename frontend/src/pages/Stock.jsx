import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Stock() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);

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
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [search, setSearch] = useState("");

  /* ================= LOAD DATA ================= */

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
      if (data.success) setCategories(data.categories || []);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= STOCK ================= */

  const updateStock = async (id, amount) => {
    setStock((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, stock: (p.stock || 0) + amount } : p
      )
    );

    try {
      await fetch(`http://localhost:5000/api/products/${id}/add-stock`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
    } catch {
      loadStock();
    }
  };

  /* ================= CATEGORY ================= */

  const addCategory = async () => {
    if (!newCategory.trim()) return alert("Enter category name");

    if (categories.some((c) => c.name === newCategory))
      return alert("Category already exists");

    const res = await fetch("http://localhost:5000/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategory }),
    });

    const data = await res.json();

    if (data.success) {
      await loadCategories();
      setNewProduct((p) => ({ ...p, category: data.category.name }));
      setNewCategory("");
    }
  };

  /* ================= PRODUCT ================= */

  const addProduct = async () => {
    const { name, category, price, barcode } = newProduct;

    if (!name || !category || !price || !barcode)
      return alert("Fill all fields");

    const formData = new FormData();
    Object.entries(newProduct).forEach(([k, v]) =>
      formData.append(k, v)
    );

    const res = await fetch("http://localhost:5000/api/products", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.success) {
      setShowAddModal(false);
      setNewProduct({
        name: "",
        category: "",
        price: "",
        barcode: "",
        stock: 1,
      });
      loadStock();
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    await fetch(`http://localhost:5000/api/products/${id}`, {
      method: "DELETE",
    });

    setOpenActionMenuId(null);
    loadStock();
  };

  const handleScanEnter = (id) => {
    const barcode = scanInputs[id];
    const amount = Number(amountInputs[id]) || 1;

    const product = stock.find((p) => p.id === id);

    if (product?.barcode === barcode) {
      updateStock(id, amount);

      setScanInputs((p) => ({ ...p, [id]: "" }));
      setAmountInputs((p) => ({ ...p, [id]: 1 }));
    } else alert("Barcode mismatch");
  };

  const filteredStock = stock.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <p className="p-6">Loading...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="h-screen w-screen bg-gray-100 flex flex-col">

      {/* HEADER */}
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">📦 Stock Inventory</h1>

        <Link
          to="/dashboard"
          className="bg-white text-blue-600 px-4 py-2 rounded-full font-semibold"
        >
          ⬅ Dashboard
        </Link>
      </div>

      {/* SEARCH + ADD */}
      <div className="flex items-center justify-between p-4 bg-white shadow gap-3">
        <input
          placeholder="Search product..."
          className="border px-3 py-2 rounded flex-1 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-full font-semibold"
        >
          ➕ Add Product
        </button>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-y-auto p-4">
        <table className="min-w-full bg-white rounded-xl shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Image</th>
              <th className="p-2">Product</th>
              <th className="p-2">Category</th>
              <th className="p-2">Barcode</th>
              <th className="p-2">Price</th>
              <th className="p-2">Stock</th>
              <th className="p-2">Scan</th>
              <th className="p-2"></th>
            </tr>
          </thead>

          <tbody>
            {filteredStock.map((item) => (
              <tr key={item.id} className="border-b">

                <td className="p-2">
                  {item.image ? (
                    <img
                      src={`http://localhost:5000${item.image}`}
                      className="h-12 w-12 rounded object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-gray-200 rounded" />
                  )}
                </td>

                <td className="p-2 font-semibold">{item.name}</td>

                <td className="p-2">{item.category || "-"}</td>

                <td className="p-2">{item.barcode}</td>

                <td className="p-2 text-blue-600 font-bold">
                  ₱{item.price}
                </td>

                <td className="p-2 font-bold">{item.stock}</td>

                <td className="p-2 flex gap-1">
                  <input
                    placeholder="Scan"
                    className="border px-1 py-1 text-xs"
                    value={scanInputs[item.id] || ""}
                    onChange={(e) =>
                      setScanInputs((p) => ({
                        ...p,
                        [item.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleScanEnter(item.id)
                    }
                  />

                  <input
                    type="number"
                    className="border px-1 py-1 w-14 text-xs"
                    value={amountInputs[item.id] || 1}
                    onChange={(e) =>
                      setAmountInputs((p) => ({
                        ...p,
                        [item.id]: e.target.value,
                      }))
                    }
                  />
                </td>

                <td className="p-2">
                  <button
                    className="text-gray-500 hover:bg-gray-100 px-2 rounded"
                    onClick={() =>
                      setOpenActionMenuId(
                        openActionMenuId === item.id ? null : item.id
                      )
                    }
                  >
                    ⋮
                  </button>

                  {openActionMenuId === item.id && (
                    <div className="absolute right-4 bg-white border shadow rounded text-sm z-50">
                      <div
                        className="px-3 py-2 hover:bg-red-100 text-red-600 cursor-pointer"
                        onClick={() => deleteProduct(item.id)}
                      >
                        Delete
                      </div>
                    </div>
                  )}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ADD PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">

          <div className="bg-white rounded-2xl p-6 w-full max-w-md">

            <h2 className="text-2xl font-semibold mb-4 text-center">
              ➕ Add New Product
            </h2>

            <div className="flex flex-col gap-3">

              <input
                placeholder="Product Name"
                className="border rounded px-3 py-2"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
              />

              <select
                className="border rounded px-3 py-2"
                value={newProduct.category}
                onChange={(e) => {
                  if (e.target.value === "__add_new") {
                    setShowAddCategoryModal(true);
                    setNewProduct({ ...newProduct, category: "" });
                  } else {
                    setNewProduct({
                      ...newProduct,
                      category: e.target.value,
                    });
                  }
                }}
              >
                <option value="">Select Category</option>

                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}

                <option value="__add_new">➕ Add new category</option>
              </select>

              <input
                type="number"
                placeholder="Price"
                className="border rounded px-3 py-2"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    price: e.target.value,
                  })
                }
              />

              <input
                placeholder="Barcode"
                className="border rounded px-3 py-2"
                value={newProduct.barcode}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    barcode: e.target.value,
                  })
                }
              />

              <input
                type="number"
                placeholder="Stock"
                className="border rounded px-3 py-2"
                value={newProduct.stock}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    stock: e.target.value,
                  })
                }
              />

            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={addProduct}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Add Product
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}