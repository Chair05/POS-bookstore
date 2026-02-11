import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Load user from localStorage
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) {
      navigate("/"); 
    } else {
      setUser(storedUser);
    }
  }, [navigate]);

  const isAdmin = user?.role === "admin";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [notifications, setNotifications] = useState([]);
  const barcodeRef = useRef("");

  // Load products
  const loadProducts = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/products");
      const data = await res.json();
      if (data.success) setProducts(data.products);
    } catch (err) {
      console.error("Error loading products:", err);
    }
  };

  // Load categories
  const loadCategories = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/categories");
      const data = await res.json();
      if (data.success) {
        const cats = data.categories.map((c) =>
          typeof c === "string" ? c : c.name
        );
        setCategories(cats);
      }
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  // Notifications
  const addNotification = (message) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  };

  // Barcode scanner
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      )
        return;

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
    if (!product) return addNotification(`❌ Product not found. Scanned: "${code}"`);

    const inCheckoutQty = checkoutItems.filter((c) => c.id === product.id).length;
    const remainingStock = product.stock - inCheckoutQty;

    if (remainingStock <= 0) return addNotification("❌ Out of stock");

    if (remainingStock <= 30)
      addNotification(`⚠ Only ${remainingStock} left in stock!`);

    setCheckoutItems((prev) => [...prev, product]);
    setTotal((prev) => prev + Number(product.price));
  };

  const removeFromCheckout = (index) => {
    const removed = checkoutItems[index];
    setCheckoutItems((prev) => prev.filter((_, i) => i !== index));
    setTotal((prev) => prev - Number(removed.price));
  };

  // Print receipt
  const printReceipt = () => {
    const grouped = checkoutItems.reduce((acc, item) => {
      if (!acc[item.id]) acc[item.id] = { ...item, quantity: 0 };
      acc[item.id].quantity += 1;
      return acc;
    }, {});
    const groupedArr = Object.values(grouped);

    const win = window.open("", "", "width=400,height=600");
    win.document.write(`
      <html>
        <body style="font-family:Arial">
          <h2 style="text-align:center">📚 LCCB Bookstore Receipt</h2>
          <hr/>
          ${groupedArr
            .map(
              (i) =>
                `<p>${i.name} x${i.quantity} <span style="float:right">₱${(
                  i.price * i.quantity
                ).toFixed(2)}</span></p>`
            )
            .join("")}
          <hr/>
          <h3>Total: ₱${total.toFixed(2)}</h3>
          <p style="text-align:center">Thank you!</p>
        </body>
      </html>
    `);
    win.print();
    win.close();
  };

  // Handle payment
  const handlePay = async () => {
    if (!checkoutItems.length) return addNotification("Checkout is empty");

    const items = checkoutItems.map((i) => ({ barcode: i.barcode, quantity: 1 }));

    try {
      const res = await fetch("http://localhost:5000/api/products/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();
      if (!data.success) return addNotification(data.message || "Purchase failed");

      printReceipt();
      setCheckoutItems([]);
      setTotal(0);
      loadProducts();
      loadCategories();
    } catch (err) {
      console.error(err);
      addNotification("An error occurred while processing the payment.");
    }
  };

  // Filter products
  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter ? p.category === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-screen w-screen bg-blue-500 relative">
      {/* Notifications */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-50">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="bg-yellow-300 text-black px-4 py-2 rounded shadow-md animate-slide-in"
          >
            {n.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="flex justify-between items-center bg-blue-600 shadow-md py-4 px-4 md:px-6 flex-shrink-0">
        <h1 className="text-3xl md:text-4xl font-bold text-white">📚 LCCB Bookstore</h1>
        <button
          onClick={() => {
            const confirmed = window.confirm("Are you sure you want to log out?");
            if (confirmed) {
              localStorage.removeItem("user");
              navigate("/");
            }
          }}
          className="bg-white text-blue-600 hover:bg-gray-100 rounded-full px-6 py-3 md:px-8 md:py-3 text-lg md:text-xl font-semibold transition"
        >
          Logout
        </button>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:flex-row gap-4 overflow-hidden p-4 md:p-6">
        {/* Products */}
        <div className="lg:flex-1 bg-white rounded-3xl p-6 shadow-md overflow-auto">
          <div className="flex flex-col sm:flex-row sm:gap-2 mb-4">
            <input
              placeholder="Search product..."
              className="flex-1 rounded-xl border px-4 py-3 text-base md:text-lg focus:ring-2 focus:ring-blue-500 outline-none mb-2 sm:mb-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="rounded-xl border px-4 py-3 text-base md:text-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="bg-gray-50 rounded-xl p-4 shadow hover:shadow-lg transition flex flex-col"
              >
                <img
                  src={`http://localhost:5000${p.image}`}
                  className="h-28 w-full object-contain rounded-lg mb-3"
                  alt={p.name}
                />
                <p className="font-medium text-base md:text-lg text-gray-800">{p.name}</p>
                <p className="text-sm md:text-base text-gray-600 mb-1">₱{p.price}</p>
                <p
                  className={`text-sm md:text-base mb-2 ${
                    p.stock <= 30 ? "text-red-600 font-semibold" : "text-gray-500"
                  }`}
                >
                  {p.stock <= 30 ? `⚠ Only ${p.stock} left!` : `Stock: ${p.stock}`}
                </p>
                {/* Add to checkout for both admin and sub */}
                <button
                  onClick={() => handleBarcodeScan(p.barcode)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full py-3 md:py-4 text-base md:text-lg font-semibold transition mt-auto"
                >
                  Add to Checkout
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Checkout */}
        <div className="lg:w-96 bg-white rounded-3xl p-6 shadow-md flex flex-col h-full overflow-auto">
          <h2 className="font-semibold text-lg md:text-xl mb-4">🛒 Checkout</h2>

          {checkoutItems.length === 0 && (
            <p className="text-gray-500 text-sm md:text-base">Checkout is empty</p>
          )}

          <div className="flex-1 overflow-auto">
            {checkoutItems.map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-2 mb-2 shadow-sm"
              >
                <div>
                  <p className="text-sm md:text-base font-medium">{item.name}</p>
                  <p className="text-xs md:text-sm text-gray-600">₱{item.price}</p>
                </div>
                <button
                  onClick={() => removeFromCheckout(i)}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-1 md:py-2 text-sm md:text-base font-semibold transition"
                >
                  ✖
                </button>
              </div>
            ))}
          </div>

          {/* Pay button for both admin and sub */}
          <button
            onClick={handlePay}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full py-3 md:py-4 text-lg md:text-xl font-semibold transition"
          >
            Pay
          </button>
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 md:p-6 bg-blue-500 flex-shrink-0">
        {/* Admin only: Manage Stock */}
        {isAdmin && (
          <Link to="/stock" className="flex-1">
            <button className="w-full bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 rounded-full py-3 md:py-4 text-lg md:text-xl font-semibold transition">
              Manage Stock
            </button>
          </Link>
        )}

        {/* Both admin and sub: View Sales */}
        <Link to="/sales" className="flex-1">
          <button className="w-full bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 rounded-full py-3 md:py-4 text-lg md:text-xl font-semibold transition">
            View Sales
          </button>
        </Link>
      </div>
    </div>
  );
}
