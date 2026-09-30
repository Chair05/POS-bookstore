import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";

export default function Restock() {
  const navigate = useNavigate();
  const barcodeRef = useRef(null);

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

  const printReceipt = (receiptData, receiptWindow) => {
    if (!receiptWindow) return false;

    const { product, quantity, supplier, costPrice, notes } = receiptData;

    const today = new Date().toLocaleString();
    const escapeHtml = (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const content = `
      <html>
        <head>
          <title>Restock Receipt</title>
          <style>
            body {
              font-family: "Segoe UI", Arial, sans-serif;
              margin: 0;
              padding: 24px 20px;
              color: #111827;
              background: #fff;
            }
            .receipt {
              width: 100%;
              max-width: 360px;
              margin: 0 auto;
              border: 1px solid #d1d5db;
              border-radius: 10px;
              padding: 18px 16px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
            }
            .title {
              text-align: center;
              font-size: 20px;
              font-weight: 700;
              margin: 0 0 6px;
              letter-spacing: 0.03em;
            }
            .subtitle {
              text-align: center;
              font-size: 12px;
              color: #6b7280;
              margin-bottom: 12px;
            }
            .divider {
              border-top: 1px dashed #9ca3af;
              margin: 10px 0;
            }
            .row {
              display: flex;
              justify-content: space-between;
              gap: 12px;
              margin: 6px 0;
              font-size: 13px;
            }
            .label { color: #4b5563; }
            .value { font-weight: 600; text-align: right; }
            .notes {
              margin-top: 8px;
              padding: 8px;
              background: #f9fafb;
              border-radius: 6px;
              font-size: 12px;
              color: #374151;
              white-space: pre-wrap;
            }
            .footer {
              margin-top: 12px;
              text-align: center;
              font-size: 11px;
              color: #6b7280;
            }
            @media print {
              body { padding: 0; }
              .receipt { border: none; box-shadow: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <h2 class="title">Restock Receipt</h2>
            <p class="subtitle">Stock update record</p>
            <div class="row"><span class="label">Product</span><span class="value">${escapeHtml(product.name)}</span></div>
            <div class="row"><span class="label">Barcode</span><span class="value">${escapeHtml(product.barcode)}</span></div>
            <div class="row"><span class="label">Qty Added</span><span class="value">${escapeHtml(quantity)}</span></div>
            <div class="row"><span class="label">Supplier</span><span class="value">${escapeHtml(supplier || "N/A")}</span></div>
            <div class="row"><span class="label">Cost Price</span><span class="value">${costPrice ? `₱${Number(costPrice).toFixed(2)}` : "N/A"}</span></div>
            <div class="divider"></div>
            ${notes ? `<div class="notes">${escapeHtml(notes)}</div>` : ""}
            <div class="footer">${escapeHtml(today)}</div>
          </div>
        </body>
      </html>
    `;

    receiptWindow.document.write(content);
    receiptWindow.document.close();
    receiptWindow.focus();
    receiptWindow.print();
    return true;
  };

  const handleRestock = async () => {
    if (!product) return alert("Scan a product first");
    if (!quantity || Number(quantity) <= 0)
      return alert("Enter valid quantity");

    const receiptData = {
      product,
      quantity: Number(quantity),
      supplier,
      costPrice,
      notes,
    };
    const receiptWindow = window.open("", "_blank");
    if (receiptWindow) {
      receiptWindow.document.write("<title>Preparing restock receipt...</title>");
      receiptWindow.document.close();
    }

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

      if (!printReceipt(receiptData, receiptWindow)) {
        alert("Restock completed, but the receipt popup was blocked. Allow pop-ups for this site to print receipts automatically.");
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
      receiptWindow?.close();
      console.error(err);
      alert("Failed to restock: " + err.message);
    }
  };

  return (
    <Layout title="Restock">
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
                  className="px-5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-md"
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

              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleRestock}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-md"
                >
                  Confirm Restock
                </button>
              </div>
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
    </Layout>
  );
}