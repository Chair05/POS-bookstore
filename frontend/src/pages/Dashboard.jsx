import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    category: "",
    barcode: "",
    image: "",
    stock: 0
  });
  const [search, setSearch] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const barcodeRef = useRef("");

  // Fetch products
  const loadProducts = () => {
    fetch("http://localhost:5000/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProducts(data.products);
      })
      .catch((err) => console.error("Failed to fetch products:", err));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Barcode listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      ) {
        return;
      }

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

  // Purchase product (backend)
  const purchaseProduct = async (barcode) => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/products/purchase",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ barcode })
        }
      );

      const data = await response.json();

      if (response.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            String(p.barcode) === String(barcode)
              ? { ...p, stock: data.remaining_stock }
              : p
          )
        );
        return { success: true, product: data.product };
      } else {
        alert(`❌ ${data.message}`);
        return { success: false };
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error contacting server");
      return { success: false };
    }
  };

  // Barcode scan
  const handleBarcodeScan = async (code) => {
    const product = products.find((p) => String(p.barcode) === String(code));

    if (!product) {
      alert("❌ No item found for barcode: " + code);
      return;
    }

    if (product.stock <= 0) {
      alert("❌ Product is out of stock");
      return;
    }

    const result = await purchaseProduct(code);
    if (result.success) addToCart(product);
  };

  // Cart functions
  const addToCart = (item) => {
    setCart((prev) => [...prev, item]);
    setTotal((prev) => prev + Number(item.price));
  };

  const removeFromCart = (index) => {
    const updated = [...cart];
    const removed = updated.splice(index, 1)[0];
    setCart(updated);
    setTotal((prev) => prev - Number(removed.price));

    fetch(`http://localhost:5000/api/products/stock/${removed.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 1 })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProducts((prev) =>
            prev.map((p) =>
              p.id === removed.id ? { ...p, stock: data.new_stock } : p
            )
          );
        }
      })
      .catch((err) => console.error("Error updating stock:", err));
  };

  const clearCart = () => {
    cart.forEach((item) => {
      fetch(`http://localhost:5000/api/products/stock/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 1 })
      }).catch((err) => console.error("Error updating stock:", err));
    });

    setCart([]);
    setTotal(0);
    loadProducts();
  };

  // PRINT RECEIPT FUNCTION
  const printReceipt = () => {
    const receiptWindow = window.open("", "PRINT", "height=600,width=400");

    const date = new Date().toLocaleString();

    receiptWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: Arial; padding: 10px; }
            h2 { text-align: center; }
            .item { display: flex; justify-content: space-between; }
            .total { margin-top: 20px; font-size: 18px; font-weight: bold; }
            hr { margin: 10px 0; }
          </style>
        </head>
        <body>
          <h2>📚 Bookstore Receipt</h2>
          <p>${date}</p>
          <hr />
          ${cart
            .map(
              (item) =>
                `<div class="item"><span>${item.name}</span><span>₱${item.price}</span></div>`
            )
            .join("")}
          <hr />
          <div class="total">TOTAL: ₱${total}</div>
          <p style="text-align:center; margin-top:20px;">Thank you for purchasing!</p>
        </body>
      </html>
    `);

    receiptWindow.document.close();
    receiptWindow.focus();
    receiptWindow.print();
    receiptWindow.close();
  };

  // Pay + print receipt
  const handlePay = () => {
    if (cart.length === 0) return alert("Cart is empty");

    printReceipt();

    setCart([]);
    setTotal(0);
    loadProducts();
  };

  // Add product
  const handleAddProduct = (e) => {
    e.preventDefault();
    const { name, price, category, barcode, stock } = newItem;
    if (!name || !price || !category || !barcode)
      return alert("Please fill all fields.");

    fetch("http://localhost:5000/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItem)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Product added!");
          setNewItem({
            name: "",
            price: "",
            category: "",
            barcode: "",
            image: "",
            stock: 0
          });
          loadProducts();
        } else {
          alert(data.message);
        }
      })
      .catch(() => alert("Server error."));
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // UI
  return (
    <div className="min-h-screen bg-sky-300 p-4 md:p-6">
      {/* HEADER */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-700">📚 Bookstore POS</h1>

        <button
          onClick={() => {
            localStorage.removeItem("user");
            window.location.href = "/";
          }}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl shadow"
        >
          Logout
        </button>
      </header>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PRODUCTS */}
        <div className="lg:col-span-2 bg-white shadow-xl rounded-2xl p-6">
          <div className="flex flex-col md:flex-row justify-between mb-4 gap-3">
            <h2 className="text-xl font-semibold text-gray-800">Products</h2>

            <input
              type="text"
              placeholder="Search product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded-xl px-3 py-2 w-full md:w-1/2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* PRODUCT GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="bg-gray-50 p-4 rounded-xl shadow hover:shadow-lg transition"
              >
                {p.image && (
                  <img
                    src={`http://localhost:5000${p.image}?v=${Date.now()}`}
                    alt={p.name}
                    className="w-full h-28 rounded-xl object-cover shadow mb-3"
                  />
                )}

                <p className="font-bold text-gray-800">{p.name}</p>
                <p className="text-sm text-gray-500">{p.category}</p>
                <p className="text-xs text-gray-400">Barcode: {p.barcode}</p>

                <p className="text-blue-700 font-bold mt-2">₱{p.price}</p>
                <p className="text-xs text-gray-500">Stock: {p.stock}</p>

                <button
                  onClick={() => handleBarcodeScan(p.barcode)}
                  className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl transition"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* CART */}
        <div className="bg-white shadow-xl rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🛒 Cart</h2>

          <ul className="space-y-3 max-h-[260px] overflow-y-auto pr-2">
            {cart.length === 0 && (
              <p className="text-center text-gray-400">Cart is empty</p>
            )}

            {cart.map((item, index) => (
              <li
                key={index}
                className="flex justify-between items-center bg-gray-50 p-3 rounded-xl shadow-sm"
              >
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-gray-500">₱{item.price}</p>
                </div>

                <button
                  onClick={() => removeFromCart(index)}
                  className="text-red-500 hover:text-red-700 text-lg"
                >
                  ✖
                </button>
              </li>
            ))}
          </ul>

          <div className="flex justify-between items-center text-lg font-bold mt-4">
            <span>Total:</span>
            <span>₱{total}</span>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={clearCart}
              className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-xl"
            >
              Clear
            </button>
            <button
              onClick={handlePay}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl"
            >
              Pay & Print
            </button>
          </div>

          {/* Manual Barcode */}
          <div className="mt-6">
            <h3 className="text-sm text-gray-600 mb-1">Enter Barcode:</h3>
            <input
              type="text"
              placeholder="Enter barcode..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleBarcodeScan(barcodeInput);
                  setBarcodeInput("");
                }
              }}
              className="border rounded-xl px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* NAV BUTTONS */}
      <div className="flex gap-4 mt-6">
        <Link to="/stock">
          <button className="px-5 py-3 bg-blue-500 text-white rounded-xl shadow hover:bg-blue-600">
            Manage Stock
          </button>
        </Link>

        <Link to="/sales">
          <button className="px-5 py-3 bg-purple-600 text-white rounded-xl shadow hover:bg-purple-700">
            View Sales
          </button>
        </Link>
      </div>

      {/* ADD PRODUCT */}
      <div className="mt-8 bg-white p-6 rounded-2xl shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          ➕ Add New Product
        </h2>

        <form
          onSubmit={handleAddProduct}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          <input
            type="text"
            placeholder="Image URL"
            value={newItem.image}
            onChange={(e) =>
              setNewItem({ ...newItem, image: e.target.value })
            }
            className="border rounded-xl px-3 py-2"
          />
          <input
            type="text"
            placeholder="Name"
            value={newItem.name}
            onChange={(e) =>
              setNewItem({ ...newItem, name: e.target.value })
            }
            className="border rounded-xl px-3 py-2"
          />
          <input
            type="number"
            placeholder="Price"
            value={newItem.price}
            onChange={(e) =>
              setNewItem({ ...newItem, price: e.target.value })
            }
            className="border rounded-xl px-3 py-2"
          />
          <input
            type="text"
            placeholder="Category"
            value={newItem.category}
            onChange={(e) =>
              setNewItem({ ...newItem, category: e.target.value })
            }
            className="border rounded-xl px-3 py-2"
          />
          <input
            type="text"
            placeholder="Barcode"
            value={newItem.barcode}
            onChange={(e) =>
              setNewItem({ ...newItem, barcode: e.target.value })
            }
            className="border rounded-xl px-3 py-2"
          />
          <input
            type="number"
            placeholder="Stock"
            value={newItem.stock}
            onChange={(e) =>
              setNewItem({ ...newItem, stock: e.target.value })
            }
            className="border rounded-xl px-3 py-2"
          />

          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white rounded-xl py-2 shadow"
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
