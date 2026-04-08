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
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [notifications, setNotifications] = useState([]);

  const barcodeRef = useRef("");

  // AUTH
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) navigate("/");
    else setUser(storedUser);
  }, [navigate]);

  const isAdmin = user?.role === "admin";

  // LOAD DATA
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

  // NOTIFICATIONS
  const addNotification = (message) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  };

  // BARCODE
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

  const handleBarcodeScan = (code) => {
    const product = products.find((p) => String(p.barcode) === String(code));

    if (!product) return addNotification("Product not found");

    const inCart = checkoutItems.filter((c) => c.id === product.id).length;

    if (product.stock - inCart <= 0) {
      return addNotification("Out of stock");
    }

    setCheckoutItems((prev) => [...prev, product]);
    setTotal((prev) => prev + Number(product.price));
  };

  const removeFromCheckout = (index) => {
    const removed = checkoutItems[index];
    setCheckoutItems((prev) => prev.filter((_, i) => i !== index));
    setTotal((prev) => prev - Number(removed.price));
  };

  // PAYMENT
  const handlePay = async () => {
    if (!checkoutItems.length) {
      addNotification("Checkout is empty");
      return;
    }

    try {
      const grouped = {};

      checkoutItems.forEach((item) => {
        if (!grouped[item.barcode]) grouped[item.barcode] = 0;
        grouped[item.barcode]++;
      });

      const items = Object.keys(grouped).map((barcode) => ({
        barcode,
        quantity: grouped[barcode],
      }));

      const res = await fetch("http://localhost:5000/api/products/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();

      if (!data.success) {
        addNotification(data.message || "Payment failed");
        return;
      }

      setCheckoutItems([]);
      setTotal(0);
      loadProducts();

      addNotification("Payment successful");

    } catch (err) {
      console.error(err);
      addNotification("Error processing payment");
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
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
    <div className="flex h-screen w-screen bg-white">

      {/* SIDEBAR */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-blue-700 p-5 z-50 transform transition ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <h2 className="text-xl font-bold text-white mb-6">Menu</h2>

        <Link to="/dashboard" className={linkClass("/dashboard")} onClick={() => setSidebarOpen(false)}>Home</Link>

        {isAdmin && (
          <Link to="/stock" className={linkClass("/stock")} onClick={() => setSidebarOpen(false)}>Inventory</Link>
        )}

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
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* MAIN */}
      <div className="flex flex-col flex-1">

     <header className="flex items-center justify-between bg-blue-600 text-white px-4 py-3 shadow">

  {/* LEFT: Burger */}
  <button
    onClick={() => setSidebarOpen(true)}
    className="text-2xl relative -top-2"
  >
    ☰
  </button>

  {/* CENTER: Logo + Title */}
  <div className="flex items-center gap-2">
    <img src={LccbLogo} className="h-10 w-10 rounded" />
    <h1 className="text-xl font-bold whitespace-nowrap">
      LCCB Bookstore
    </h1>
  </div>

   {/* RIGHT (empty spacer) */}
    <div className="w-10"></div>

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
                  <img src={`http://localhost:5000${p.image}`} className="h-20 w-full object-contain mb-2" />

                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-gray-600">₱{p.price}</p>

                  <p className={`text-xs mt-1 ${p.stock <= 30 ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                    {p.stock <= 30 ? `Only ${p.stock} left` : `Stock: ${p.stock}`}
                  </p>

                  <button
                    onClick={() => handleBarcodeScan(p.barcode)}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full mt-2 py-1 rounded"
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
                <div key={i} className="flex justify-between items-center mb-2">
                  <span>{item.name}</span>
                  <button
                    onClick={() => removeFromCheckout(i)}
                    className="text-sm leading-none text-red-500 hover:text-red-700"
                  >
                    ✖
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handlePay}
              className="bg-green-600 hover:bg-green-700 text-white py-2 mt-3 rounded"
            >
              Pay ₱{total.toFixed(2)}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}