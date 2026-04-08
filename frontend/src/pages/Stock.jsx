import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Stock() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [categories, setCategories] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);

  // ✅ NEW
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    barcode: "",
    stock: 1,
    size: "",
  });

  const [scanInputs, setScanInputs] = useState({});
  const [amountInputs, setAmountInputs] = useState({});
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [search, setSearch] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();

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

  const linkClass = (path) =>
    `block px-3 py-2 rounded ${
      window.location.pathname === path
        ? "bg-blue-500 text-white"
        : "text-white hover:bg-blue-600"
    }`;

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

  const addProduct = async () => {
    let { name, category, price, barcode } = newProduct;

    if (!name || !category || !price || !barcode || category === "__new__")
      return alert("Fill all fields");

    const formData = new FormData();

    formData.append("name", name);
    formData.append("category", category);
    formData.append("price", price);
    formData.append("barcode", barcode);
    formData.append("stock", newProduct.stock);

    if (newProduct.size && newProduct.size.trim() !== "") {
      formData.append("size", newProduct.size);
    }

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
        size: "",
      });
      loadStock();
      loadCategories();
    }
  };

  // ✅ NEW CATEGORY HANDLER
  const addCategory = async () => {
    if (!newCategory.trim()) return alert("Enter category name");

    try {
      const res = await fetch("http://localhost:5000/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory }),
      });

      const data = await res.json();

      if (data.success) {
        setNewCategory("");
        setShowCategoryModal(false);
        loadCategories();

        // auto select new category
        setNewProduct((prev) => ({
          ...prev,
          category: data.category.name,
        }));
      }
    } catch (err) {
      console.error(err);
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
    } else {
      alert("Barcode mismatch");
    }
  };

  const filteredStock = stock.filter((item) => {
    const query = search.toLowerCase();

    return (
      item.name?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query)
    );
  });

  if (loading) return <p className="p-6">Loading...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="h-screen w-screen bg-gray-100 flex flex-col">

      {/* SIDEBAR */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-blue-700 p-5 z-50 transform transition ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <h2 className="text-xl font-bold text-white mb-6">Menu</h2>

        <Link to="/dashboard" className={linkClass("/dashboard")} onClick={() => setSidebarOpen(false)}>Home</Link>
        <Link to="/stock" className={linkClass("/stock")} onClick={() => setSidebarOpen(false)}>Inventory</Link>
        <Link to="/sales" className={linkClass("/sales")} onClick={() => setSidebarOpen(false)}>Sales</Link>

        <button
          onClick={() => {
            localStorage.removeItem("user");
            navigate("/");
          }}
          className="mt-6 w-full bg-white text-blue-600 py-2 rounded font-semibold"
        >
          Logout
        </button>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <header className="flex items-center bg-blue-600 text-white px-4 py-3 shadow">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-2xl relative -top-[7px]"
          >
            ☰
          </button>

          <h1 className="text-xl font-bold leading-none whitespace-nowrap">
            Stock Inventory
          </h1>
        </div>
      </header>

      <div className="p-3 bg-white shadow flex items-center gap-3">
        <input
          placeholder="Search product or category..."
          className="flex-1 px-4 py-2 h-11 rounded-full border mt-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          onClick={() => setShowAddModal(true)}
          className="h-11 px-6 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition flex items-center justify-center whitespace-nowrap relative -top-[9px]"
        >
          Add Product
        </button>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50 text-sm text-gray-600">
              <tr>
                <th className="p-3 text-left">Image</th>
                <th className="p-3 text-left">Product</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Size</th>
                <th className="p-3 text-left">Barcode</th>
                <th className="p-3 text-left">Price</th>
                <th className="p-3 text-left">Stock</th>
                <th className="p-3 text-left">Scan</th>
                <th className="p-3"></th>
              </tr>
            </thead>

            <tbody>
              {filteredStock.map((item) => (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    {item.image ? (
                      <img
                        src={`http://localhost:5000${item.image}`}
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 rounded-xl" />
                    )}
                  </td>

                  <td className="p-3 font-medium">{item.name}</td>
                  <td className="p-3 text-gray-500">{item.category || "-"}</td>
                  <td className="p-3 text-gray-500">{item.size || "-"}</td>
                  <td className="p-3 text-gray-500">{item.barcode}</td>
                  <td className="p-3 font-semibold text-blue-600">₱{item.price}</td>
                  <td className="p-3 font-semibold">{item.stock}</td>

                  <td className="p-3 flex gap-1">
                    <input
                      placeholder="Scan"
                      className="border px-2 py-1 text-xs rounded"
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
                      className="border px-2 py-1 w-14 text-xs rounded"
                      value={amountInputs[item.id] || 1}
                      onChange={(e) =>
                        setAmountInputs((p) => ({
                          ...p,
                          [item.id]: e.target.value,
                        }))
                      }
                    />
                  </td>

                  <td className="p-3 relative">
                    <button
                      onClick={() =>
                        setOpenActionMenuId(
                          openActionMenuId === item.id ? null : item.id
                        )
                      }
                      className="px-2 py-1 hover:bg-gray-100 rounded relative -top-[9px]"
                    >
                      ⋮
                    </button>

                    {openActionMenuId === item.id && (
                      <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-xl overflow-hidden w-40 z-50">
                        <label className="block px-4 py-2 hover:bg-gray-100 cursor-pointer">
                          Upload Image
                          <input
                            type="file"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (!file) return;

                              const fd = new FormData();
                              fd.append("image", file);

                              await fetch(
                                `http://localhost:5000/api/products/${item.id}/update-image`,
                                {
                                  method: "PUT",
                                  body: fd,
                                }
                              );

                              setOpenActionMenuId(null);
                              loadStock();
                            }}
                          />
                        </label>

                        <div
                          onClick={() => deleteProduct(item.id)}
                          className="px-4 py-2 text-red-600 hover:bg-red-100 cursor-pointer"
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
      </div>

      {/* ADD PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center backdrop-blur-sm items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-center">
              Add Product
            </h2>

            <div className="flex flex-col gap-3">
              <input
                placeholder="Name"
                className="border px-3 py-2 rounded"
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
              />

              <select
                className="border px-3 py-2 rounded"
                value={newProduct.category}
                onChange={(e) => {
                  const value = e.target.value;

                  if (value === "__new__") {
                    setShowCategoryModal(true); // ✅ open overlay
                  } else {
                    setNewProduct({ ...newProduct, category: value });
                  }
                }}
              >
                <option value="">Select Category</option>

                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}

                <option value="__new__">+ Add New Category</option>
              </select>

              <input
                placeholder="Price"
                className="border px-3 py-2 rounded"
                onChange={(e) =>
                  setNewProduct({ ...newProduct, price: e.target.value })
                }
              />

              <input
                placeholder="Barcode"
                className="border px-3 py-2 rounded"
                onChange={(e) =>
                  setNewProduct({ ...newProduct, barcode: e.target.value })
                }
              />

              <input
                placeholder="Stock"
                className="border px-3 py-2 rounded"
                onChange={(e) =>
                  setNewProduct({ ...newProduct, stock: e.target.value })
                }
              />

              <select
                className="border px-3 py-2 rounded"
                value={newProduct.size}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, size: e.target.value })
                }
              >
                <option value="">Select Size (Optional)</option>
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
                <option value="XL">XL</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded">
                Cancel
              </button>

              <button
                onClick={addProduct}
                className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition shadow-md font-medium"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ CATEGORY MODAL OVERLAY */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-semibold mb-4 text-center">
              Add Category
            </h2>

            <input
              placeholder="Category name"
              className="border px-3 py-2 rounded w-full"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={addCategory}
                className="bg-blue-600 text-white px-6 py-2 rounded-full"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}