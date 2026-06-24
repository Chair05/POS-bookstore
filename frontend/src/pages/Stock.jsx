import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

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
    imageFile: null,
    imagePreview: "",
  });

  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [notification, setNotification] = useState(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadStock();
    loadCategories();
  }, []);

  useEffect(() => {
    if (!openActionMenuId) return;
    const handler = (e) => {
      if (!e.target.closest(".action-menu")) setOpenActionMenuId(null);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [openActionMenuId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target)
      ) {
        setCategoryDropdownOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
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

  const addProduct = async () => {
    let { name, category, price, barcode } = newProduct;

    if (!name || !category || !price || !barcode)
      return alert("Fill all fields");

    const formData = new FormData();

    formData.append("name", name);
    formData.append("category", category);
    formData.append("price", price);
    formData.append("barcode", barcode);
    formData.append("stock", newProduct.stock);

    // append image if provided
    if (newProduct.imageFile) {
      formData.append("image", newProduct.imageFile);
    }

    if (newProduct.size && newProduct.size.trim() !== "") {
      formData.append("size", newProduct.size);
    }

    try {
      const res = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setNotification({ type: "success", message: "Product added successfully!" });
        setTimeout(() => setNotification(null), 3000);
        setShowAddModal(false);
        setNewProduct({
          name: "",
          category: "",
          price: "",
          barcode: "",
          stock: 1,
            size: "",
            imageFile: null,
            imagePreview: "",
        });
        await loadStock();
        await loadCategories();
      } else {
        alert("Error: " + (data.message || "Failed to add product"));
      }
    } catch (err) {
      alert("Server error: " + err.message);
      console.error("Product add error:", err);
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

      if (!data.success) {
        return alert(data.message || "Failed to add category");
      }

      setNewCategory("");
      setShowCategoryModal(false);
      loadCategories();

      // auto select new category
      setNewProduct((prev) => ({
        ...prev,
        category: data.category.name,
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to add category. Please try again.");
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

  const filteredStock = stock.filter((item) => {
    const query = search.toLowerCase();

    if (categoryFilter && item.category !== categoryFilter) {
      return false;
    }

    return item.name?.toLowerCase().includes(query);
  });

  if (loading) return (
    <div className="h-screen w-screen bg-gray-100 flex justify-center items-center">
      <div className="text-center">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-lg font-semibold text-gray-600">Loading...</p>
      </div>
    </div>
  );
  if (error) return (
    <div className="h-screen w-screen bg-gray-100 flex justify-center items-center">
      <div className="text-center">
        <div className="text-4xl mb-4">❌</div>
        <p className="text-lg font-semibold text-red-600">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-gray-100 flex flex-col">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <header className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 shadow">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-2xl transition relative -top-[7px]"
          >
            ☰
          </button>

          <h1 className="text-xl font-bold leading-none whitespace-nowrap">
            Stock Inventory
          </h1>
        </div>
      </header>

      {/* Notification toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div className="px-4 py-3 rounded-lg shadow-md bg-white text-gray-800 border border-gray-200 max-w-sm">
            {notification.message}
          </div>
        </div>
      )}

      <div className="p-3 bg-white shadow flex flex-wrap items-center gap-3">
        <input
          placeholder="Search product..."
          className="flex-1 min-w-[220px] px-4 py-2 h-11 rounded-full border"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div ref={categoryDropdownRef} className="relative -top-[8px]">
          <button
            type="button"
            onClick={() => setCategoryDropdownOpen((prev) => !prev)}
            className="h-11 px-4 rounded-xl border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-blue-50 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer flex items-center gap-2 min-w-[160px] whitespace-nowrap"
          >
            <span>{categoryFilter || "All Categories"}</span>
            <span className="text-gray-500">▾</span>
          </button>

          {categoryDropdownOpen && (
            <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter("");
                  setCategoryDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-600 hover:text-white transition"
              >
                All Categories
              </button>
              {categories.map((cat, idx) => {
                const label = typeof cat === "string" ? cat : cat?.name || "";
                return (
                  <button
                    key={`${label}-${idx}`}
                    type="button"
                    onClick={() => {
                      setCategoryFilter(label);
                      setCategoryDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-600 hover:text-white transition"
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

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

                  <td className="p-3 relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenActionMenuId(
                          openActionMenuId === item.id ? null : item.id
                        );
                      }}
                      className="px-2 py-1 hover:bg-gray-100 rounded relative -top-[9px]"
                    >
                      ⋮
                    </button>

                    {openActionMenuId === item.id && (
                      <div className="action-menu absolute right-0 mt-2 bg-white shadow-lg rounded-xl overflow-hidden w-40 z-50">
                        <label className="block px-4 py-2 hover:bg-gray-100 cursor-pointer">
                          📷 Upload Image
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

                        {item.image && (
                          <div
                            onClick={async () => {
                              if (!window.confirm("Remove image for this product?")) return;

                              await fetch(
                                `http://localhost:5000/api/products/${item.id}/remove-image`,
                                {
                                  method: "PUT",
                                }
                              );

                              setOpenActionMenuId(null);
                              loadStock();
                            }}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            🗑️ Remove Image
                          </div>
                        )}

                        <div
                          onClick={() => deleteProduct(item.id)}
                          className="px-4 py-2 text-red-600 hover:bg-red-100 cursor-pointer"
                        >
                          🗑️ Delete
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
        <div className="fixed inset-0 bg-black/40 flex justify-center backdrop-blur-sm items-center z-50 px-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl">
            <div className="flex flex-col gap-2 text-center mb-6">
              <h2 className="text-2xl font-semibold">➕ Add Product</h2>
              <p className="text-sm text-gray-500">
                Add a new inventory item with category, pricing, and stock details.
              </p>
            </div>

            <div className="grid gap-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Product Name</span>
                <input
                  value={newProduct.name}
                  placeholder="Enter product name"
                  className="w-full border px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none"
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                />
              </label>

              <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-end">
                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-medium text-gray-700">Category</span>
                  <select
                    className="w-full border px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none"
                    value={newProduct.category}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, category: e.target.value })
                    }
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat, idx) => {
                      const label = typeof cat === "string" ? cat : cat?.name || "";
                      return (
                        <option key={`${label}-${idx}`} value={label}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="h-12 w-full md:w-auto px-5 bg-gray-100 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-200 transition"
                >
                  + Category
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Price</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newProduct.price}
                    placeholder="0.00"
                    className="w-full border px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none"
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, price: e.target.value })
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Barcode</span>
                  <input
                    value={newProduct.barcode}
                    placeholder="Enter barcode"
                    className="w-full border px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none"
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, barcode: e.target.value })
                    }
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-end">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Stock</span>
                  <input
                    type="number"
                    min="0"
                    value={newProduct.stock}
                    placeholder="Quantity"
                    className="w-full border px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none appearance-none"
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, stock: e.target.value })
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Size</span>
                  <select
                    className="w-full border px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none appearance-none"
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
                </label>
              </div>

              <label className="space-y-2 mt-2">
                <span className="text-sm font-medium text-gray-700">Image (optional)</span>
                <div className="flex items-center gap-3">
                  {newProduct.imagePreview ? (
                    <img
                      src={newProduct.imagePreview}
                      alt="preview"
                      className="h-20 w-20 rounded-xl object-cover border"
                    />
                  ) : (
                    <div className="h-20 w-20 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 border">
                      No image
                    </div>
                  )}

                  <div className="flex flex-col ml-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = URL.createObjectURL(file);
                        setNewProduct((prev) => ({
                          ...prev,
                          imageFile: file,
                          imagePreview: url,
                        }));
                      }}
                    />

                    {newProduct.imagePreview && (
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            URL.revokeObjectURL(newProduct.imagePreview);
                          } catch (e) {}
                          setNewProduct((prev) => ({
                            ...prev,
                            imageFile: null,
                            imagePreview: "",
                          }));
                        }}
                        className="text-sm text-red-600 mt-2 hover:underline w-max"
                      >
                        Remove image
                      </button>
                    )}
                  </div>
                </div>
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewProduct({
                    name: "",
                    category: "",
                    price: "",
                    barcode: "",
                    stock: 1,
                    size: "",
                    imageFile: null,
                    imagePreview: "",
                  });
                }}
                className="w-full sm:w-auto px-5 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>

              <button
                onClick={addProduct}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-md"
              >
                Add Product
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
              📂 Add Category
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