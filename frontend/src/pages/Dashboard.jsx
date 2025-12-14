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

  /* ================= PURCHASE ================= */
  const purchaseProduct = async (barcode, receiptId) => {
    const res = await fetch("http://localhost:5000/api/products/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barcode, receiptId }),
    });
    return await res.json();
  };

  /* ================= RECEIPT ================= */
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

    // generate a single receiptId for this checkout
    const receiptId = Math.floor(Date.now() / 1000);

    for (const item of cart) {
      await purchaseProduct(item.barcode, receiptId);
    }

    printReceipt();
    setCart([]);
    setTotal(0);
    loadProducts(); // sync stock
  };

  /* ================= SEARCH ================= */
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f3f4f6] px-4 py-6">
      <header className="flex justify-between mb-6">
        <h1 className="text-3xl font-semibold">📚 POS Dashboard</h1>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/";
          }}
          className="bg-red-500 text-white rounded-full px-4 py-2"
        >
          Logout
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PRODUCTS */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6">
          <input
            placeholder="Search product..."
            className="w-full mb-4 rounded-xl border px-3 py-2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((p) => (
              <div key={p.id} className="bg-gray-50 rounded-xl p-3">
                <img
                  src={`http://localhost:5000${p.image}`}
                  className="h-28 w-full object-cover rounded-lg mb-2"
                  alt={p.name}
                />
                <p className="font-medium text-sm">{p.name}</p>
                <p className="text-xs">₱{p.price}</p>
                <p className="text-xs mb-2">Stock: {p.stock}</p>
                <button
                  onClick={() => handleBarcodeScan(p.barcode)}
                  className="w-full bg-blue-600 text-white rounded-full py-1 text-xs"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* CART */}
        <div className="bg-white rounded-3xl p-6">
          <h2 className="font-semibold mb-3">🛒 Cart</h2>

          {cart.map((item, i) => (
            <div
              key={i}
              className="flex justify-between bg-gray-50 rounded-xl px-3 py-2 mb-1"
            >
              <span>{item.name}</span>
              <span>₱{item.price}</span>
              <button
                onClick={() => removeFromCart(i)}
                className="text-red-500"
              >
                ✖
              </button>
            </div>
          ))}

          <hr className="my-3" />
          <p className="font-semibold">Total: ₱{total.toFixed(2)}</p>

          <button
            onClick={handlePay}
            className="w-full mt-3 bg-emerald-500 text-white rounded-full py-2"
          >
            Pay & Print
          </button>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <Link to="/stock">
          <button className="bg-blue-600 text-white rounded-full px-4 py-2">
            Manage Stock
          </button>
        </Link>
        <Link to="/sales">
          <button className="bg-purple-600 text-white rounded-full px-4 py-2">
            View Sales
          </button>
        </Link>
      </div>
    </div>
  );
}
