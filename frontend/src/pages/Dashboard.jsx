import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const barcodeRef = useRef("");

  /* ================= LOAD PRODUCTS ================= */
  const loadProducts = async () => {
    const res = await fetch("http://localhost:5000/api/products");
    const data = await res.json();
    if (data.success) setProducts(data.products);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  /* ================= BARCODE SCANNER ================= */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      )
        return;

      if (e.key === "Enter") {
        handleBarcodeScan(barcodeRef.current.trim());
        barcodeRef.current = "";
      } else {
        barcodeRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [products, cart]);

  /* ================= ADD TO CART ================= */
  const handleBarcodeScan = (code) => {
    const product = products.find((p) => String(p.barcode) === String(code));
    if (!product) return alert("❌ Product not found");

    const inCartQty = cart.filter((c) => c.id === product.id).length;
    if (product.stock - inCartQty <= 0) return alert("❌ Out of stock");

    setCart((prev) => [...prev, product]);
    setTotal((prev) => prev + Number(product.price));
  };

  /* ================= REMOVE FROM CART ================= */
  const removeFromCart = (index) => {
    const removed = cart[index];
    setCart((prev) => prev.filter((_, i) => i !== index));
    setTotal((prev) => prev - Number(removed.price));
  };

  /* ================= PRINT RECEIPT ================= */
  const printReceipt = () => {
    const grouped = cart.reduce((acc, item) => {
      if (!acc[item.id]) acc[item.id] = { ...item, quantity: 0 };
      acc[item.id].quantity += 1;
      return acc;
    }, {});
    const groupedArr = Object.values(grouped);

    const win = window.open("", "", "width=400,height=600");
    win.document.write(`
      <html>
        <body style="font-family:Arial">
          <h2 style="text-align:center">📚 Bookstore Receipt</h2>
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

  /* ================= HANDLE PAY ================= */
  const handlePay = async () => {
    if (!cart.length) return alert("Cart is empty");

    const items = cart.map((i) => ({ barcode: i.barcode, quantity: 1 }));

    try {
      const res = await fetch("http://localhost:5000/api/products/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();
      if (!data.success) return alert(data.message || "Purchase failed");

      printReceipt();
      setCart([]);
      setTotal(0);
      loadProducts();
    } catch (err) {
      console.error(err);
      alert("An error occurred while processing the payment.");
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen w-screen bg-blue-500">
      {/* Header */}
      <header className="flex flex-wrap justify-between items-center bg-blue-600 shadow-md py-4 px-4 md:px-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white">📚 POS Dashboard</h1>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/";
          }}
          className="bg-white text-blue-600 hover:bg-gray-100 rounded-full px-6 py-3 md:px-8 md:py-3 text-lg md:text-xl font-semibold transition"
        >
          Logout
        </button>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row lg:gap-6 flex-grow p-4 md:p-6 overflow-auto">
        {/* Products */}
        <div className="lg:flex-1 bg-white rounded-3xl p-6 shadow-md w-full">
          <input
            placeholder="Search product..."
            className="w-full mb-4 rounded-xl border px-4 py-3 text-base md:text-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="bg-gray-50 rounded-xl p-4 shadow hover:shadow-lg transition"
              >
                <img
                  src={`http://localhost:5000${p.image}`}
                  className="h-28 w-full object-contain rounded-lg mb-3"
                  alt={p.name}
                />
                <p className="font-medium text-base md:text-lg text-gray-800">{p.name}</p>
                <p className="text-sm md:text-base text-gray-600 mb-1">₱{p.price}</p>
                <p className="text-sm md:text-base text-gray-500 mb-2">Stock: {p.stock}</p>
                <button
                  onClick={() => handleBarcodeScan(p.barcode)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full py-2 md:py-3 text-base md:text-lg font-semibold transition"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="lg:w-96 bg-white rounded-3xl p-6 shadow-md mt-4 lg:mt-0 w-full">
          <h2 className="font-semibold text-lg md:text-xl mb-4">🛒 Cart</h2>

          {cart.length === 0 && (
            <p className="text-gray-500 text-sm md:text-base">Cart is empty</p>
          )}

          {cart.map((item, i) => (
            <div
              key={i}
              className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-2 mb-2 shadow-sm"
            >
              <div>
                <p className="text-sm md:text-base font-medium">{item.name}</p>
                <p className="text-xs md:text-sm text-gray-600">₱{item.price}</p>
              </div>
              <button
                onClick={() => removeFromCart(i)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-1 md:py-2 text-sm md:text-base font-semibold transition"
              >
                ✖
              </button>
            </div>
          ))}

          <hr className="my-3 border-gray-300" />
          <p className="font-semibold text-gray-800 text-lg md:text-xl">
            Total: ₱{total.toFixed(2)}
          </p>

          <button
            onClick={handlePay}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full py-3 md:py-4 text-lg md:text-xl font-semibold transition"
          >
            Pay
          </button>
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 md:p-6 w-full">
        <Link to="/stock">
          <button className="flex-1 bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 rounded-full py-3 md:py-4 text-lg md:text-xl font-semibold transition">
            Manage Stock
          </button>
        </Link>
        <Link to="/sales">
          <button className="flex-1 bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 rounded-full py-3 md:py-4 text-lg md:text-xl font-semibold transition">
            View Sales
          </button>
        </Link>
      </div>
    </div>
  );
}
