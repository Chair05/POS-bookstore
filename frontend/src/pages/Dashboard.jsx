import React, { useState, useEffect, useRef } from "react";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([
    { name: "Notebook", price: 50, category: "Supplies", barcode: "1111" },
    { name: "Ballpen", price: 20, category: "Supplies", barcode: "2222" },
    { name: "School Shirt", price: 350, category: "Merch", barcode: "3333" },
    { name: "PE Shirt", price: 400, category: "PE Uniform", barcode: "4444" },
  ]);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    category: "",
    barcode: "",
  });
  const [barcodeInput, setBarcodeInput] = useState("");

  const barcodeRef = useRef("");

  // Automatically detect barcode scans (if using a physical scanner)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        const scannedCode = barcodeRef.current.trim();
        handleBarcodeScan(scannedCode);
        barcodeRef.current = "";
      } else {
        barcodeRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle barcode input (manual or scanned)
  const handleBarcodeScan = (code) => {
    const product = products.find((p) => p.barcode === code);
    if (product) {
      addToCart(product);
    } else {
      alert("❌ No item found for barcode: " + code);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (item) => {
    setCart([...cart, item]);
    setTotal(total + item.price);
  };

  const removeFromCart = (index) => {
    const updatedCart = [...cart];
    const removed = updatedCart.splice(index, 1)[0];
    setCart(updatedCart);
    setTotal(total - removed.price);
  };

  const clearCart = () => {
    setCart([]);
    setTotal(0);
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price || !newItem.category || !newItem.barcode) {
      alert("Please fill in all fields!");
      return;
    }

    const newProduct = {
      name: newItem.name,
      price: parseFloat(newItem.price),
      category: newItem.category,
      barcode: newItem.barcode,
    };

    setProducts([...products, newProduct]);
    setNewItem({ name: "", price: "", category: "", barcode: "" });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-700">📚 Bookstore POS</h1>
        <button
          onClick={() => {
            localStorage.removeItem("user");
            window.location.href = "/";
          }}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </header>

      <div className="grid grid-cols-3 gap-6">
        {/* Product List */}
        <div className="col-span-2 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Products</h2>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded-lg px-3 py-2 w-1/2 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProducts.map((item, idx) => (
              <div
                key={idx}
                onClick={() => addToCart(item)}
                className="border p-4 rounded-xl cursor-pointer hover:bg-blue-50 transition"
              >
                <p className="font-semibold text-gray-800">{item.name}</p>
                <p className="text-sm text-gray-500">{item.category}</p>
                <p className="text-xs text-gray-400">Barcode: {item.barcode}</p>
                <p className="text-blue-700 font-bold mt-2">₱{item.price}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🛒 Cart</h2>

          <ul className="space-y-2 mb-4 max-h-[250px] overflow-y-auto">
            {cart.length === 0 && (
              <p className="text-gray-400 text-center">Cart is empty</p>
            )}
            {cart.map((item, idx) => (
              <li
                key={idx}
                className="flex justify-between items-center border-b pb-1"
              >
                <div>
                  <span className="font-medium">{item.name}</span>{" "}
                  <span className="text-sm text-gray-500">₱{item.price}</span>
                </div>
                <button
                  onClick={() => removeFromCart(idx)}
                  className="text-red-500 hover:text-red-700 text-sm font-semibold"
                >
                  ✖
                </button>
              </li>
            ))}
          </ul>

          <div className="flex justify-between text-lg font-bold mb-4">
            <span>Total:</span>
            <span>₱{total}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={clearCart}
              className="w-full bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 transition"
            >
              Clear
            </button>
            <button
              onClick={() => alert("✅ Transaction Complete!")}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Pay
            </button>
          </div>

          {/* Barcode Input (manual or scanner) */}
          <div className="mt-6">
            <h3 className="text-sm text-gray-600 mb-1">Scan or Enter Barcode:</h3>
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
              className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
        </div>
      </div>

      {/* Add Product Form */}
      <div className="mt-8 bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">➕ Add New Product</h2>
        <form
          onSubmit={handleAddProduct}
          className="grid grid-cols-1 md:grid-cols-5 gap-4"
        >
          <input
            type="text"
            placeholder="Item name"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
          />
          <input
            type="number"
            placeholder="Price"
            value={newItem.price}
            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
          />
          <input
            type="text"
            placeholder="Category"
            value={newItem.category}
            onChange={(e) =>
              setNewItem({ ...newItem, category: e.target.value })
            }
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
          />
          <input
            type="text"
            placeholder="Barcode"
            value={newItem.barcode}
            onChange={(e) =>
              setNewItem({ ...newItem, barcode: e.target.value })
            }
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
          />
          <button
            type="submit"
            className="bg-green-600 text-white rounded-lg py-2 hover:bg-green-700 transition"
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
