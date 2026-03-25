import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Stock() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [categories, setCategories] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    barcode: "",
    stock: 1,
  });

  const [scanInputs, setScanInputs] = useState({});
  const [amountInputs, setAmountInputs] = useState({});
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [search, setSearch] = useState("");

  /* ================= LOAD ================= */
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

  /* ================= STOCK UPDATE ================= */
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

  /* ================= ADD PRODUCT ================= */
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

  /* ================= DELETE ================= */
  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    await fetch(`http://localhost:5000/api/products/${id}`, {
      method: "DELETE",
    });

    setOpenActionMenuId(null);
    loadStock();
  };

  /* ================= SCAN ================= */
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

  /* ================= SEARCH (NAME + CATEGORY) ================= */
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

      {/* HEADER */}
      <div className="bg-blue-600 px-6 py-4 flex justify-between items-center shadow-md">
        <h1 className="text-white text-xl font-semibold">
          Stock Inventory
        </h1>

        <Link to="/dashboard">
          <button className="bg-white text-blue-600 px-4 py-2 rounded-full font-semibold hover:bg-gray-100">
            ⬅ Back
          </button>
        </Link>
      </div>

      {/* SEARCH + ADD (moved slightly higher) */}
      <div className="p-3 bg-white shadow flex items-start gap-3">

        <input
          placeholder="Search product or category..."
          className="flex-1 px-4 py-2 rounded-full border focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition"
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

                  {/* IMAGE */}
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
                  <td className="p-3 text-gray-500">{item.barcode}</td>

                  <td className="p-3 font-semibold text-blue-600">
                    ₱{item.price}
                  </td>

                  <td className="p-3 font-semibold">{item.stock}</td>

                  {/* SCAN */}
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

                  {/* ACTION MENU */}
                  <td className="p-3 relative">
                    <button
                      onClick={() =>
                        setOpenActionMenuId(
                          openActionMenuId === item.id ? null : item.id
                        )
                      }
                      className="px-2 py-1 hover:bg-gray-100 rounded"
                    >
                      ⋮
                    </button>

                    {openActionMenuId === item.id && (
                      <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-xl overflow-hidden w-40 z-50">

                        {/* UPLOAD IMAGE */}
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

                              try {
                                await fetch(
                                  `http://localhost:5000/api/products/${item.id}/update-image`,
                                  {
                                    method: "PUT",
                                    body: fd,
                                  }
                                );

                                setOpenActionMenuId(null);
                                loadStock();
                              } catch (err) {
                                alert("Upload failed");
                              }
                            }}
                          />
                        </label>

                        {/* DELETE */}
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

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center backdrop-blur-sm items-center z-50">

          <div className="bg-white rounded-2xl p-6 w-full max-w-md">

            <h2 className="text-xl font-semibold mb-4 text-center">
              Add Product
            </h2>

            <div className="flex flex-col gap-3">

              <input placeholder="Name" className="border px-3 py-2 rounded"
                onChange={(e)=>setNewProduct({...newProduct,name:e.target.value})}/>

              <input placeholder="Category" className="border px-3 py-2 rounded"
                onChange={(e)=>setNewProduct({...newProduct,category:e.target.value})}/>

              <input placeholder="Price" className="border px-3 py-2 rounded"
                onChange={(e)=>setNewProduct({...newProduct,price:e.target.value})}/>

              <input placeholder="Barcode" className="border px-3 py-2 rounded"
                onChange={(e)=>setNewProduct({...newProduct,barcode:e.target.value})}/>

              <input placeholder="Stock" className="border px-3 py-2 rounded"
                onChange={(e)=>setNewProduct({...newProduct,stock:e.target.value})}/>

            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={addProduct}
                className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition shadow-md font-medium "
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