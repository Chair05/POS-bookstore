import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Stock() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [imageFiles, setImageFiles] = useState({});
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
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

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
  const updateCategory = async (productId, category) => {
    await fetch(
      `http://localhost:5000/api/products/${productId}/update-category`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      }
    );
    loadStock();
  };

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

  const deleteCategory = async (categoryId, productId) => {
    if (!window.confirm("Delete this category?")) return;
    await fetch(`http://localhost:5000/api/categories/${categoryId}`, {
      method: "DELETE",
    });
    if (productId) updateCategory(productId, "");
    loadCategories();
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
    await fetch(`http://localhost:5000/api/products/${id}`, {
      method: "DELETE",
    });
    setConfirmDeleteId(null);
    loadStock();
  };

  const updateImage = async (id) => {
    const file = imageFiles[id];
    if (!file) return alert("Select image first");

    const fd = new FormData();
    fd.append("image", file);

    await fetch(
      `http://localhost:5000/api/products/${id}/update-image`,
      { method: "PUT", body: fd }
    );

    setImageFiles((p) => ({ ...p, [id]: null }));
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

  if (loading) return <p className="p-6 text-white">Loading...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="h-screen w-screen bg-blue-500 p-4 flex flex-col">
      <Link
        to="/dashboard"
        className="mb-4 bg-white text-blue-600 px-6 py-3 rounded-full font-semibold w-fit"
      >
        ⬅ Back to Dashboard
      </Link>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-white">
          📦 Stock Inventory
        </h1>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-white text-blue-600 px-6 py-3 rounded-full font-semibold shadow"
        >
          ➕ Add New Product
        </button>
      </div>

      {/* ================= TABLE ================= */}
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
              <th className="p-4">Scan</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {stock.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-4">
                  {item.image ? (
                    <img
                      src={`http://localhost:5000${item.image}`}
                      className="h-16 w-16 rounded-xl object-cover"
                      alt=""
                    />
                  ) : (
                    <div className="h-16 w-16 bg-gray-200 rounded-xl" />
                  )}
                </td>

                <td className="p-4 font-semibold">{item.name}</td>

                <td className="p-4 relative">
                  <div
                    className="border px-3 py-2 rounded cursor-pointer"
                    onClick={() =>
                      setOpenDropdownId(
                        openDropdownId === item.id ? null : item.id
                      )
                    }
                  >
                    {item.category || "Select"}
                  </div>

                  {openDropdownId === item.id && (
                    <ul className="absolute bg-white border rounded shadow w-40 z-50">
                      {categories.map((c) => (
                        <li
                          key={c.id}
                          className="px-3 py-2 hover:bg-gray-100 flex justify-between"
                        >
                          <span
                            onClick={() => {
                              updateCategory(item.id, c.name);
                              setOpenDropdownId(null);
                            }}
                          >
                            {c.name}
                          </span>

                          <button
                            onClick={() =>
                              deleteCategory(c.id, item.id)
                            }
                            className="text-red-600"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>

                <td className="p-4">{item.barcode}</td>
                <td className="p-4 text-blue-600 font-bold">
                  ₱{item.price}
                </td>
                <td className="p-4 font-bold">{item.stock}</td>

                <td className="p-4">
                  <input
                    placeholder="Scan"
                    className="border px-2 py-1"
                    value={scanInputs[item.id] || ""}
                    onChange={(e) =>
                      setScanInputs((p) => ({
                        ...p,
                        [item.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      handleScanEnter(item.id)
                    }
                  />

                  <input
                    type="number"
                    className="border px-2 py-1 w-20 ml-2"
                    value={amountInputs[item.id] || 1}
                    onChange={(e) =>
                      setAmountInputs((p) => ({
                        ...p,
                        [item.id]: e.target.value,
                      }))
                    }
                  />
                </td>

                <td className="p-4 flex flex-col gap-2">
                  <input
                    type="file"
                    onChange={(e) =>
                      setImageFiles((p) => ({
                        ...p,
                        [item.id]: e.target.files[0],
                      }))
                    }
                  />

                  <button
                    onClick={() => updateImage(item.id)}
                    className="bg-blue-600 text-white py-2 rounded"
                  >
                    Upload
                  </button>

                  {confirmDeleteId === item.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => deleteProduct(item.id)}
                        className="bg-red-600 text-white flex-1 py-2 rounded"
                      >
                        Delete
                      </button>

                      <button
                        onClick={() =>
                          setConfirmDeleteId(null)
                        }
                        className="border flex-1 py-2 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        setConfirmDeleteId(item.id)
                      }
                      className="bg-red-100 text-red-700 py-2 rounded"
                    >
                      🗑 Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= ADD PRODUCT MODAL ================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl">
            <h2 className="text-2xl font-semibold mb-4">
              ➕ Add New Product
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                placeholder="Name"
                className="border rounded-lg px-4 py-3"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    name: e.target.value,
                  })
                }
              />

              <select
                className="border rounded-lg px-4 py-3"
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
                className="border px-4 py-3"
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
                className="border px-4 py-3"
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
                className="border px-4 py-3"
                value={newProduct.stock}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    stock: e.target.value,
                  })
                }
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-3 border rounded-full"
              >
                Cancel
              </button>

              <button
                onClick={addProduct}
                className="px-8 py-3 bg-blue-600 text-white rounded-full font-semibold"
              >
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADD CATEGORY MODAL ================= */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              ➕ Add New Category
            </h2>

            <input
              placeholder="Category name"
              className="border rounded-lg px-4 py-3 w-full"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setNewCategory("");
                }}
                className="px-5 py-2 border rounded-full"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  await addCategory();
                  setShowAddCategoryModal(false);
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-full font-semibold"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
