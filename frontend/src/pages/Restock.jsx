import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Restock() {
  const navigate = useNavigate();
  const barcodeRef = useRef(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [barcode, setBarcode] = useState("");
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [product, setProduct] = useState(null);

  const [quantity, setQuantity] = useState(1);
  const [supplier, setSupplier] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [recentRestocks, setRecentRestocks] = useState([]);

  useEffect(() => {
    barcodeRef.current?.focus();

    // Load recent restocks from localStorage
    const saved = localStorage.getItem('recentRestocks');
    if (saved) {
      try {
        setRecentRestocks(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load recent restocks', e);
      }
    }
  }, []);

  const handleBarcodeSearch = async () => {
    if (!barcode.trim()) return;

    setLoadingProduct(true);

    try {
      const res = await fetch(
        `http://localhost:5000/api/products/barcode/${encodeURIComponent(
          barcode.trim()
        )}`
      );
      const data = await res.json();

      if (!data.success) {
        setProduct(null);
        return alert(data.message || "Product not found");
      }

      setProduct(data.product);
    } catch (err) {
      console.error(err);
      alert("Failed to load product: " + err.message);
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleRestock = async () => {
    if (!product) return alert("Scan a product first");
    if (!quantity || Number(quantity) <= 0)
      return alert("Enter valid quantity");

    try {
const res = await fetch("http://localhost:5000/api/products/restock", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    productId: product.id,
    amount: Number(quantity),
    supplier,
    costPrice,
    notes,
  }),
});

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to update stock");
      }

      const newLog = {
        id: Date.now(),
        productName: product.name,
        quantity: Number(quantity),
        costPrice: costPrice ? Number(costPrice) : null,
        staff: "Admin",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setRecentRestocks((prev) => {
        const updated = [newLog, ...prev].slice(0, 10);
        localStorage.setItem("recentRestocks", JSON.stringify(updated));
        return updated;
      });

      setProduct((prev) => ({
        ...prev,
        stock: prev.stock + Number(quantity),
      }));

      setBarcode("");
      setQuantity(1);
      setSupplier("");
      setCostPrice("");
      setNotes("");
      setProduct(null);

      setTimeout(() => {
        barcodeRef.current?.focus();
      }, 100);
    } catch (err) {
      console.error(err);
      alert("Failed to restock: " + err.message);
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-100 flex flex-col">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* HEADER */}
      <header className="flex items-center bg-blue-600 text-white px-4 py-3 shadow">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-2xl relative -top-[7px]"
          >
            ☰
          </button>

          <h1 className="text-xl font-bold leading-none whitespace-nowrap">
            Restock Inventory
          </h1>
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-4">
            {/* SCAN */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5">
              <h2 className="text-lg font-semibold mb-3">Scan Barcode</h2>

              <div className="flex gap-2">
                <input
                  ref={barcodeRef}
                  placeholder="Scan or enter barcode..."
                  className="flex-1 border px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleBarcodeSearch()}
                />

                <button
                  onClick={handleBarcodeSearch}
                  className="px-5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-md relative -top-[8px]"
                >
                  Search
                </button>
              </div>
            </div>

            {/* PRODUCT CARD */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5">
              <h2 className="text-lg font-semibold mb-4">Product Preview</h2>

              {loadingProduct ? (
                <div className="text-center py-10 text-gray-500">
                  Loading product...
                </div>
              ) : !product ? (
                <div className="text-center py-10 text-gray-400">
                  Scan a barcode to load product
                </div>
              ) : (
                <div className="flex gap-4 items-center">
                  {product.image ? (
                    <img
                      src={`http://localhost:5000${product.image}`}
                      alt={product.name}
                      className="h-24 w-24 rounded-2xl object-cover bg-gray-100"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-2xl bg-gray-200" />
                  )}

                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{product.name}</h3>
                    <p className="text-gray-500">{product.category}</p>
                    <p className="text-gray-500">Size: {product.size || "-"}</p>
                    <p className="text-gray-500">Barcode: {product.barcode}</p>
                    <p className="text-blue-600 font-semibold mt-1">
                      Current Stock: {product.stock}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* RESTOCK FORM */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5">
              <h2 className="text-lg font-semibold mb-4">Restock Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="number"
                  min="1"
                  placeholder="Quantity to Add"
                  className="border px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />

                <input
                  placeholder="Supplier (optional)"
                  className="border px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                />

                <input
                  type="number"
                  placeholder="Cost Price (optional)"
                  className="border px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                />

                <input
                  placeholder="Notes (optional)"
                  className="border px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button
                onClick={handleRestock}
                className="mt-4 w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-md"
              >
                Confirm Restock
              </button>
            </div>
          </div>

          {/* RIGHT */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5">
            <h2 className="text-lg font-semibold mb-4">Recent Restocks</h2>

            <div className="space-y-3">
              {recentRestocks.length === 0 ? (
                <p className="text-gray-400 text-sm">No recent restocks</p>
              ) : (
                recentRestocks.map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-xl p-3 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{log.productName}</p>
                      <p className="text-sm text-gray-500">
                        +{log.quantity} • {log.staff}
                        {log.costPrice != null && (
                          <span className="ml-2 text-sm text-gray-500">
                            • ${log.costPrice.toFixed(2)}
                          </span>
                        )}
                      </p>
                    </div>

                    <span className="text-sm text-gray-400">{log.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}