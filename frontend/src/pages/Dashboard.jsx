import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import LccbLogo from "../assets/Lccb-logo.jpeg";
import Sidebar from "./Sidebar";
import { getDepartmentInfo } from "../utils/departmentUtils";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [checkoutItems, setCheckoutItems] = useState({});
  const [total, setTotal] = useState(0);
  const [cash, setCash] = useState("");
  const [change, setChange] = useState(0);
  const [receiptId, setReceiptId] = useState(null);
  const [receiptItems, setReceiptItems] = useState([]);
  const [receiptTotal, setReceiptTotal] = useState(0);
  const [receiptCash, setReceiptCash] = useState("");
  const [receiptChange, setReceiptChange] = useState(0);
  const [receiptCustomerName, setReceiptCustomerName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [checkoutDepartment, setCheckoutDepartment] = useState("Students");
  const [notifications, setNotifications] = useState([]);
  const barcodeRef = useRef("");
  const scanLock = useRef(false);
  const closeSidebar = () => setSidebarOpen(false);

  /* AUTH */
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) navigate("/");
    else setUser(storedUser);
  }, [navigate]);

  useEffect(() => {
  const cashNum = Number(cash);

  if (!cash || isNaN(cashNum)) {
    setChange(0);
    return;
  }

  setChange(cashNum - total);
}, [cash, total]);

  useEffect(() => {
    const newTotal = Object.values(checkoutItems).reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );
    setTotal(newTotal);
  }, [checkoutItems]);

  const isAdmin = user?.role === "admin";

  /* LOAD DATA */
  const loadProducts = async () => {
    const res = await fetch("http://localhost:5000/api/products");
    const data = await res.json();
    if (data.success) setProducts(data.products);
  };

  const loadCategories = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/categories");
      const data = await res.json();

      if (data.success && Array.isArray(data.categories)) {
        const cats = Array.from(
          new Set(
            data.categories
              .map((c) =>
                typeof c === "string"
                  ? c.trim()
                  : c?.name?.toString().trim()
              )
              .filter(Boolean)
          )
        );

        if (cats.length > 0) {
          setCategories(cats);
          return;
        }
      }
    } catch (err) {
      console.error("Failed to load categories", err);
    }

    // Fallback: derive categories from loaded products if API returns none
    const derived = Array.from(
      new Set(
        products
          .map((p) => p.category?.toString().trim())
          .filter(Boolean)
      )
    );
    setCategories(derived);
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  useEffect(() => {
    if (categories.length === 0 && products.length > 0) {
      const derived = Array.from(
        new Set(
          products
            .map((p) => p.category?.toString().trim())
            .filter(Boolean)
        )
      );
      setCategories(derived);
    }
  }, [categories.length, products]);

  /* NOTIFICATIONS */
const addNotification = (message) => {
  const id = crypto.randomUUID(); // BEST FIX

  setNotifications((prev) => [...prev, { id, message }]);

  setTimeout(() => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, 3000);
};
  /* BARCODE */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT") return;

      if (e.key === "Enter") {
        const code = barcodeRef.current.trim();
        if (code) handleBarcodeScan(code);
        barcodeRef.current = "";
      } else if (/\d/.test(e.key)) {
        barcodeRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [products, checkoutItems]);

  /* AUTO-PRINT RECEIPT */
  useEffect(() => {
    if (showReceipt) {
      const timer = setTimeout(() => {
        handlePrintReceipt();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showReceipt]);

  /*barcode scan*/
const handleBarcodeScan = (code) => {
  if (scanLock.current) return;
  scanLock.current = true;

  setTimeout(() => {
    scanLock.current = false;
  }, 300);

  const product = products.find(
    (p) => String(p.barcode) === String(code)
  );

  if (!product) return addNotification("Product not found");

  if (!product.stock || product.stock <= 0) {
    return addNotification("Invalid stocks");
  }

  setCheckoutItems((prev) => {
    const existing = prev[product.id];
    const currentQty = existing ? existing.qty : 0;

    if (currentQty >= product.stock) {
      addNotification("Out of stock");
      return prev;
    }

    return {
      ...prev,
      [product.id]: existing
        ? { ...existing, qty: existing.qty + 1 }
        : {
            id: product.id,
            name: product.name,
            price: Number(product.price),
            size: product.size || null,
            department: product.department || "",
            barcode: product.barcode,
            qty: 1,
          },
    };
  });
};

  /* REMOVE ITEM */
const removeFromCheckout = (id) => {
  setCheckoutItems((prev) => {
    const item = prev[id];
    if (!item) return prev;

    const newState = { ...prev };
    delete newState[id];
    return newState;
  });
};

const decreaseQuantity = (id) => {
  setCheckoutItems((prev) => {
    const item = prev[id];
    if (!item) return prev;

    // if qty is 1 → remove item completely
    if (item.qty <= 1) {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    }

    // otherwise decrease qty
    return {
      ...prev,
      [id]: {
        ...item,
        qty: item.qty - 1,
      },
    };
  });
};

const increaseQuantity = (id) => {
  setCheckoutItems((prev) => {
    const item = prev[id];
    if (!item) return prev;

    const product = products.find((p) => String(p.id) === String(id));
    const max = product ? Number(product.stock || 0) : Infinity;

    if (item.qty >= max) {
      addNotification("Out of stock");
      return prev;
    }

    return {
      ...prev,
      [id]: {
        ...item,
        qty: item.qty + 1,
      },
    };
  });
};

const setQuantity = (id, value) => {
  setCheckoutItems((prev) => {
    const item = prev[id];
    if (!item) return prev;

    let qty = Number(value) || 0;
    if (qty < 1) qty = 1;

    const product = products.find((p) => String(p.id) === String(id));
    const max = product ? Number(product.stock || 0) : Infinity;
    if (qty > max) {
      addNotification(`Only ${max} available`);
      qty = max;
    }

    return {
      ...prev,
      [id]: {
        ...item,
        qty,
      },
    };
  });
};

const handlePay = async () => {
  if (!Object.keys(checkoutItems).length)
    return addNotification("Checkout empty");

  const cashNum = Number(cash);
  if (cashNum < total)
    return addNotification("Insufficient cash");

  try {
    const items = Object.values(checkoutItems).map((item) => ({
      barcode: item.barcode,
      quantity: item.qty,
    }));

    const res = await fetch(
      "http://localhost:5000/api/products/checkout",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customerName: customerName.trim() || null,
          checkoutDepartment,
        }),
      }
    );

    const data = await res.json();

    if (!data.success)
      return addNotification(data.message || "Payment failed");

    const id = data.receiptId;
    const snapshotItems = Object.values(checkoutItems);
    const snapshotTotal = total;
    const snapshotCash = cashNum;
    const snapshotChange = cashNum - total;
    const snapshotCustomerName = customerName.trim();

    setReceiptId(id);
    setReceiptItems(snapshotItems);
    setReceiptTotal(snapshotTotal);
    setReceiptCash(snapshotCash);
    setReceiptChange(snapshotChange);
    setReceiptCustomerName(snapshotCustomerName);

    setShowReceipt(true);

    setCheckoutItems({});
    setTotal(0);
    setCash("");
    setChange(0);
    setCustomerName("");

    loadProducts();
    addNotification("Successfully purchased ✔");
  } catch (err) {
    console.error(err);
    addNotification("Error processing payment");
  }
};

/* PRINT RECEIPT */
const formatReceiptItemLabel = (item) => {
  const department = item.department ? getDepartmentInfo(item.department).label : null;
  const sizeLabel = item.size ? ` (${item.size})` : "";
  return `${item.name}${sizeLabel}${department && department !== "General" ? ` (${department})` : ""}`;
};

const handlePrintReceipt = () => {
  const date = new Date().toLocaleString();
  
  const itemsHtml = receiptItems
    .map(
      (item) => {
        return `<p>${formatReceiptItemLabel(item)} x${item.qty} - ₱${(item.price * item.qty).toFixed(2)}</p>`;
      }
    )
    .join("");

  const w = window.open("", "_blank");
  
  if (!w) {
    return addNotification("Failed to open print window. Check pop-up blocker settings.");
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt #${receiptId}</title>
      <style>
        body {
          font-family: 'Courier New', Courier, monospace;
          padding: 20px;
          max-width: 400px;
          margin: 0 auto;
          color: #000;
        }
        h2 {
          text-align: center;
          margin-bottom: 10px;
        }
        .center { text-align: center; }
        .divider { border-top: 1px dashed #000; margin: 10px 0; }
        h3 { margin: 10px 0 5px 0; }
        p { margin: 3px 0; }
        .total { font-weight: bold; font-size: 16px; margin-top: 10px; }
        .thank-you { text-align: center; margin-top: 20px; font-size: 12px; }
      </style>
    </head>
    <body>
      <h2>LCCB Bookstore</h2>
      <p class="center">La Consolacion College Bacolod</p>
      <div class="divider"></div>
      <p class="center"><strong>Receipt #${receiptId}</strong></p>
      <p class="center">${date}</p>
      ${receiptCustomerName ? `<p class="center">Customer: <strong>${receiptCustomerName}</strong></p>` : ""}
      <div class="divider"></div>
      
      <h3>Items:</h3>
      ${itemsHtml}
      
      <div class="divider"></div>
      <div class="total">
        Total: ₱${receiptTotal.toFixed(2)}<br>
        Paid: ₱${receiptCash.toFixed(2)}<br>
        Change: ₱${receiptChange.toFixed(2)}
      </div>
      
      <div class="thank-you">
        <p>Thank you for your purchase!</p>
        <p>Please come again</p>
      </div>
    </body>
    </html>
  `;

  w.document.write(html);
  w.document.close();

  setTimeout(() => {
    w.focus();
    w.print();
    setTimeout(() => {
      setShowReceipt(false);
    }, 100);
  }, 250);
};

const filtered = products.filter((p) => {
    const matchSearch = p.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchCategory = categoryFilter
      ? String(p.category).trim() === String(categoryFilter).trim()
      : true;

    return matchSearch && matchCategory;
  });

  return (
    <div className="relative flex h-screen w-screen bg-white overflow-hidden">

<div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3">
  {notifications.map((n) => (
    <div
      key={n.id}
      className="w-80 bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-3 flex items-start justify-between animate-fadeIn"
    >
      <div className="flex gap-3">
        <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
        <div>
          <p className="text-sm font-semibold text-gray-800">
            Notification
          </p>
          <p className="text-sm text-gray-600">{n.message}</p>
        </div>
      </div>

      <button
        onClick={() =>
          setNotifications((prev) =>
            prev.filter((item) => item.id !== n.id)
          )
        }
        className="text-gray-400 hover:text-red-500 text-lg font-bold"
      >
        ×
      </button>
    </div>
  ))}
</div>

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* MAIN */}
      <div className="flex flex-col flex-1">

        {/* HEADER */}
        <header className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 shadow">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-2xl transition relative -top-[7px]"
            >
              ☰
            </button>

            <div className="flex items-center gap-2">
              <img src={LccbLogo} className="h-10 w-10 rounded" />
              <h1 className="text-xl font-bold">LCCB Bookstore</h1>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex flex-1 p-4 gap-4 overflow-hidden">

          {/* PRODUCTS */}
          <div className="flex-1 bg-white shadow p-4 overflow-auto rounded">

            <div className="flex gap-2 mb-3 flex-wrap">
              <input
                placeholder="Search..."
                className="border p-2 flex-1 rounded"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select
                className="border border-gray-300 bg-white h-[41px] px-3 py-2 mt-2 rounded-lg shadow-sm hover:bg-blue-50 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-w-[120px] cursor-pointer text-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-white text-gray-700">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className="group bg-white border border-slate-200 rounded-[28px] p-4 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative mb-4 rounded-3xl bg-slate-50 p-4 flex h-40 items-center justify-center overflow-hidden">
                    <img
                      src={`http://localhost:5000${p.image}`}
                      alt={p.name}
                      className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 leading-tight">{p.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">Size: {p.size || "N/A"}</p>
                      {p.department && p.department !== "General" ? (
                        <div className="mt-2">
                          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                            {p.department}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Stock</p>
                        <p className="text-sm font-semibold text-slate-700">{p.stock ?? 0}</p>
                      </div>
                      <p className="text-lg font-bold text-blue-600">₱{p.price}</p>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      {p.stock <= 0 ? (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                          Out of Stock
                        </span>
                      ) : p.stock <= 5 ? (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          In Stock
                        </span>
                      )}

                      <button
                        onClick={() => handleBarcodeScan(p.barcode)}
                        disabled={p.stock <= 0}
                        className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CHECKOUT */}
          <div className="w-96 bg-white shadow-lg p-2 flex flex-col rounded-lg h-full">

            <h2 className="font-bold text-lg mb-0 text-gray-800">Checkout</h2>

            <div className="flex-1 overflow-auto border border-gray-200 rounded p-3 mb-0 bg-gray-50">
{Object.values(checkoutItems).map((item) => (
  <div
    key={item.id}
    className="border-b border-gray-200 py-3 flex flex-col gap-2 overflow-hidden min-w-0 last:border-b-0"
  >
    {/* Product Info */}
    <div className="min-w-0 overflow-hidden">
      <p className="font-medium text-sm leading-tight break-words line-clamp-2 text-gray-800">
        {item.name}
      </p>

      <p className="text-xs text-gray-500 truncate mt-1">
        Size: {item.size || "N/A"}{item.department ? ` | Dept: ${item.department}` : ""}
      </p>
    </div>

    {/* Bottom Row */}
    <div className="flex items-center justify-between gap-2 min-w-0 mt-2">

      {/* Quantity Controls */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => decreaseQuantity(item.id)}
          className="w-5 h-5 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 text-blue-600 text-xs font-bold transition relative -top-[8px]"
          title="Decrease"
          type="button"
        >
          −
        </button>

<input
  type="number"
  min={1}
  value={item.qty}
  onChange={(e) => setQuantity(item.id, e.target.value)}
  onKeyDown={(e) => e.stopPropagation()}
  style={{ width: "40px" }}
  className="h-5 appearance-none text-center rounded bg-gray-200 text-[10px] font-bold"
/>
        <button
          onClick={() => increaseQuantity(item.id)}
          className="w-5 h-5 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 text-blue-600 text-xs font-bold transition relative -top-[8px]"
          title="Increase"
          type="button"
        >
          +
        </button>
      </div>

      {/* Price + Remove */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right font-bold text-sm text-green-600 whitespace-nowrap">
          ₱{(item.price * item.qty).toFixed(2)}
        </div>

        <button
          onClick={() => removeFromCheckout(item.id)}
          className="text-red-500 font-bold text-lg hover:text-red-700 hover:bg-red-50 px-1.5 py-0.5 rounded transition relative -top-[8px]"
          title="Remove item"
          type="button"
        >
          ×
        </button>
      </div>
    </div>
  </div>
))}
            </div>

            <div className="mt-auto">
              {/* Subtotal */}
              <div className="border-t-2 border-gray-200 pt-0 pb-1 mt-1">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-semibold">Subtotal:</span>
                  <span className="font-bold text-lg text-gray-900">₱{total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Checkout Dept</label>
                <select
                  value={checkoutDepartment}
                  onChange={(e) => setCheckoutDepartment(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Students">Students</option>
                  <option value="Teachers">Teachers</option>
                  <option value="Personnel">Personnel</option>
                </select>
              </div>

            {/* Customer Name Input */}
            <div className="mb-1">
              <input
                type="text"
                inputMode="text"
                autoComplete="off"
                placeholder="Customer name (optional)"
                className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>

            {/* Cash Input */}
            <div className="mb-0">
              <input
                type="number"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Cash amount"
                className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={cash}
                onChange={(e) => setCash(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>

            {/* Change Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-0">
              <p className="text-xs text-gray-600 font-medium">Change:</p>
              <p className="text-xl font-bold text-blue-600">
                ₱{change.toFixed(2)}
              </p>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePay}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition shadow-md hover:shadow-lg mb-0"
            >
              Pay
            </button>

            {/* Receipt */}
            {showReceipt && (
              <div className="border-t-2 border-gray-200 pt-3 bg-gradient-to-b from-gray-50 to-white p-3 rounded-lg shadow-md">
                <p className="font-bold text-lg text-gray-900 mb-2">Receipt #{receiptId}</p>

                {receiptCustomerName && (
                  <p className="text-sm text-gray-700 mb-2 font-semibold">Customer: {receiptCustomerName}</p>
                )}

                <div className="space-y-1 mb-2 pb-2 border-b border-gray-300">
                  {receiptItems.map((item, i) => {
                    const department = item.department ? getDepartmentInfo(item.department).label : null;
                    return (
                      <p key={i} className="text-xs text-gray-700">
                        {item.name}
                        {item.size ? ` (${item.size})` : ""}
                        {department && department !== "General" ? ` (${department})` : ""} × {item.qty}
                        <span className="float-right font-semibold">₱{(item.price * item.qty).toFixed(2)}</span>
                      </p>
                    );
                  })}
                </div>

                <div className="space-y-1 text-sm font-medium text-gray-800">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span>₱{receiptTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paid:</span>
                    <span>₱{receiptCash.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-bold text-base pt-1 border-t border-gray-300">
                    <span>Change:</span>
                    <span>₱{receiptChange.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={handlePrintReceipt}
                    className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-900 transition"
                  >
                    Print Receipt
                  </button>
                </div>
              </div>
            )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}