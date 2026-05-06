import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import LccbLogo from "../assets/Lccb-logo.jpeg";
import Sidebar from "./Sidebar";

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

  /* PAYMENT */
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
        body: JSON.stringify({ items }),
      }
    );

    const data = await res.json();

    if (!data.success)
      return addNotification("Payment failed");

    const id = data.receiptId;

    setReceiptId(id);
    setReceiptItems(Object.values(checkoutItems));
    setReceiptTotal(total);
    setReceiptCash(cashNum);
    setReceiptChange(cashNum - total);
    setReceiptCustomerName(customerName.trim());

    setShowReceipt(true);

    setTimeout(() => {
      setShowReceipt(false);
    }, 4000);

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
        <header className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-3 shadow">
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

            <div className="flex gap-2 mb-3">
              <input
                placeholder="Search..."
                className="border p-2 flex-1 rounded"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select
                className="border border-gray-300 bg-white px-3 py-1.5 rounded-lg shadow-sm hover:bg-blue-50 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-w-[120px] cursor-pointer"
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
          <div className="w-80 bg-white shadow p-4 flex flex-col rounded">

            <h2 className="font-bold mb-3">Checkout</h2>

            <div className="flex-1 overflow-auto">
          {Object.values(checkoutItems).map((item) => (
             <div key={item.id} className="flex justify-between border-b py-1">

       <div>
      <span>{item.name}</span>

     <p className="text-xs text-gray-500">
      Qty: {item.qty}
     </p>

      <p className="text-xs text-gray-500">
    Size: {item.size || "N/A"}
         </p>
         </div>

         <span>₱{(item.price * item.qty).toFixed(2)}</span>

<div className="flex gap-2 items-center">
  <button
    onClick={() => decreaseQuantity(item.id)}
    className="text-blue-500 hover:text-blue-700 font-bold px-2 transition relative -top-[7px]"
  >
    -
  </button>

      <span className="text-sm font-medium">
        {item.qty}
         </span>

         <button
          onClick={() => removeFromCheckout(item.id)}
          className="text-red-500 font-bold text-lg px-2 hover:text-red-700 transition relative -top-[7px]"
          title="Remove item"> × </button>
             </div>

                </div>
              ))}
            </div>

            <div className="mt-2 font-semibold">
              Subtotal: ₱{total.toFixed(2)}
            </div>

            <input
              type="text"
              inputMode="text"
              autoComplete="off"
              placeholder="Customer name (optional)"
              className="border p-2 mt-2 rounded"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
            />

            <input
              type="number"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Cash"
              className="border p-2 mt-2 rounded"
              value={cash}
              onChange={(e) => setCash(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
            />

            <div className="text-green-600 font-bold">
              Change: ₱{change.toFixed(2)}
            </div>

            <button
              onClick={handlePay}
              className="bg-green-600 hover:bg-green-700 text-white py-2 mt-3 rounded transition"
            >
              Pay
            </button>

            {showReceipt && (
              <div className="mt-4 border-t pt-3 text-sm bg-gray-50 p-3 rounded shadow-sm">
                <p className="font-bold">Receipt #{receiptId}</p>
                {receiptCustomerName && (
                  <p className="text-sm text-gray-700">Name: {receiptCustomerName}</p>
                )}

                {receiptItems.map((item, i) => (
                  <p key={i}>
                    {item.name} ({item.size || "N/A"}) x{item.qty} - ₱{(item.price * item.qty).toFixed(2)}
                  </p>
                ))}

                <p>Subtotal: ₱{receiptTotal.toFixed(2)}</p>
                <p>Cash: ₱{receiptCash}</p>
                <p>Change: ₱{receiptChange.toFixed(2)}</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}