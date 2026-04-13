import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import LccbLogo from "../assets/Lccb-logo.jpeg";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [checkoutItems, setCheckoutItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [cash, setCash] = useState("");
  const [change, setChange] = useState(0);

  const [receiptId, setReceiptId] = useState(null);
  const [receiptItems, setReceiptItems] = useState([]);
  const [receiptTotal, setReceiptTotal] = useState(0);
  const [receiptCash, setReceiptCash] = useState("");
  const [receiptChange, setReceiptChange] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [notifications, setNotifications] = useState([]);

  const barcodeRef = useRef("");

  const closeSidebar = () => setSidebarOpen(false);

  /* AUTH */
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) navigate("/");
    else setUser(storedUser);
  }, [navigate]);

  const isAdmin = user?.role === "admin";

  /* LOAD DATA */
  const loadProducts = async () => {
    const res = await fetch("http://localhost:5000/api/products");
    const data = await res.json();
    if (data.success) setProducts(data.products);
  };

  const loadCategories = async () => {
    const res = await fetch("http://localhost:5000/api/categories");
    const data = await res.json();
    if (data.success) {
      const cats = data.categories.map((c) =>
        typeof c === "string" ? c : c.name
      );
      setCategories(cats);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  /* NOTIFICATIONS */
  const addNotification = (message) => {
    const id = Date.now();
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

  /* ADD TO CART */
  const handleBarcodeScan = (code) => {
    const product = products.find(
      (p) => String(p.barcode) === String(code)
    );

    if (!product) return addNotification("Product not found");

    const inCart = checkoutItems.filter(
      (c) => c.id === product.id
    ).length;

    if (product.stock - inCart <= 0) {
      return addNotification("Out of stock");
    }

    const item = {
      id: product.id,
      name: product.name,
      price: Number(product.price),
      size: product.size || null,
      barcode: product.barcode,
      stock: product.stock,
    };

    setCheckoutItems((prev) => [...prev, item]);
    setTotal((prev) => prev + item.price);
  };

  /* REMOVE ITEM */
  const removeFromCheckout = (index) => {
    const removed = checkoutItems[index];
    setCheckoutItems((prev) => prev.filter((_, i) => i !== index));
    setTotal((prev) => prev - removed.price);
  };

  /* PAYMENT */
  const handlePay = async () => {
    if (!checkoutItems.length)
      return addNotification("Checkout empty");

    const cashNum = Number(cash);
    if (cashNum < total)
      return addNotification("Insufficient cash");

    try {
      const grouped = {};

      checkoutItems.forEach((item) => {
        grouped[item.barcode] = (grouped[item.barcode] || 0) + 1;
      });

      const items = Object.keys(grouped).map((barcode) => ({
        barcode,
        quantity: grouped[barcode],
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

      const id = data.receiptId || Date.now();

      setReceiptId(id);
      setReceiptItems([...checkoutItems]);
      setReceiptTotal(total);
      setReceiptCash(cashNum);
      setReceiptChange(cashNum - total);

      setShowReceipt(true);

      setTimeout(() => {
        setShowReceipt(false);
      }, 4000);

      setCheckoutItems([]);
      setTotal(0);
      setCash("");
      setChange(0);

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
      ? p.category === categoryFilter
      : true;
    return matchSearch && matchCategory;
  });

  const linkClass = (path) =>
    `block px-3 py-2 rounded ${
      location.pathname === path
        ? "bg-blue-500 text-white"
        : "text-white hover:bg-blue-600"
    }`;

  return (
    <div className="relative flex h-screen w-screen bg-white overflow-hidden">

      {/* BACKDROP */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-blue-700 p-5 z-50 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <h2 className="text-xl font-bold text-white mb-6">Menu</h2>

        <Link onClick={closeSidebar} to="/dashboard" className={linkClass("/dashboard")}>
          Home
        </Link>

        {isAdmin && (
          <Link onClick={closeSidebar} to="/stock" className={linkClass("/stock")}>
            Inventory
          </Link>
        )}

        <Link onClick={closeSidebar} to="/sales" className={linkClass("/sales")}>
          Sales
        </Link>

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

      {/* MAIN */}
      <div className="flex flex-col flex-1">

        {/* HEADER */}
        <header className="flex items-center justify-between bg-blue-600 text-white px-4 py-3 shadow">
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
                className="border p-2 rounded"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((p) => (
                <div key={p.id} className="border p-3 rounded shadow-sm">

                  <img
                    src={`http://localhost:5000${p.image}`}
                    className="h-20 w-full object-contain mb-2"
                  />

                  <p>{p.name}</p>

                  <p className="text-sm text-gray-500">
                    Size: {p.size || "N/A"}
                  </p>

                  <p className="text-sm text-gray-500">
                    Stock: {p.stock ?? 0}
                  </p>

                  {p.stock <= 5 && (
                    <p className="text-xs text-red-500 font-bold">
                      Low Stock
                    </p>
                  )}

                  <p>₱{p.price}</p>

                  <button
                    onClick={() => handleBarcodeScan(p.barcode)}
                    className="bg-blue-600 text-white w-full mt-2 py-1 rounded"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* CHECKOUT */}
          <div className="w-80 bg-white shadow p-4 flex flex-col rounded">

            <h2 className="font-bold mb-3">Checkout</h2>

            <div className="flex-1 overflow-auto">
              {checkoutItems.map((item, i) => (
                <div key={i} className="flex justify-between border-b py-1">

                  <div>
                    <span>{item.name}</span>

                    <p className="text-xs text-gray-500">
                      Size: {item.size || "N/A"}
                    </p>
                  </div>

                  <span>₱{item.price.toFixed(2)}</span>

                  <button
                    onClick={() => removeFromCheckout(i)}
                    className="text-red-500 relative -top-6"
                  >
                    ✖
                  </button>

                </div>
              ))}
            </div>

            <div className="mt-2 font-semibold">
              Subtotal: ₱{total.toFixed(2)}
            </div>

            <input
              type="number"
              placeholder="Cash"
              className="border p-2 mt-2 rounded"
              value={cash}
              onChange={(e) => setCash(e.target.value)}
            />

            <div className="text-green-600 font-bold">
              Change: ₱{change.toFixed(2)}
            </div>

            <button
              onClick={handlePay}
              className="bg-green-600 text-white py-2 mt-3 rounded"
            >
              Pay
            </button>

            {showReceipt && (
              <div className="mt-4 border-t pt-3 text-sm">
                <p className="font-bold">Receipt #{receiptId}</p>

          {receiptItems.map((item, i) => (
      <p key={i}>
       {item.name} ({item.size || "N/A"}) - ₱{item.price.toFixed(2)}
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