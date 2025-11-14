import React, { useState, useEffect, useRef } from "react";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [newItem, setNewItem] = useState({ name: "", price: "", category: "", barcode: "" });
  const [search, setSearch] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const barcodeRef = useRef("");

  // Check login
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) window.location.href = "/";
  }, []);

  // Fetch products from backend

useEffect(() => {
  fetch("http://localhost:5000/api/products")
    .then((res) => res.json())
    .then((data) => {
      if (data.success) setProducts(data.products);
    })
    .catch((err) => console.error("Failed to fetch products:", err));
}, []);


  // Barcode scanner
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        handleBarcodeScan(barcodeRef.current.trim());
        barcodeRef.current = "";
      } else {
        barcodeRef.current += e.key;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [products]);

  const handleBarcodeScan = (code) => {
    const product = products.find((p) => p.barcode === code);
    if (product) addToCart(product);
    else alert("❌ No item found for barcode: " + code);
  };

  const addToCart = (item) => {
    setCart([...cart, item]);
    setTotal(total + item.price);
  };

  const removeFromCart = (idx) => {
    const updated = [...cart];
    const removed = updated.splice(idx, 1)[0];
    setCart(updated);
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

  fetch("http://localhost:5000/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newItem),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        alert("Product added!");
        setProducts([...products, { ...newItem, id: data.id }]);
        setNewItem({ name: "", price: "", category: "", barcode: "" });
      } else {
        alert(data.message);
      }
    })
    .catch((err) => {
      console.error(err);
      alert("Server error. Try again later.");
    });
};

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-700">📚 Bookstore POS</h1>
        <button
          onClick={() => { localStorage.removeItem("user"); window.location.href = "/"; }}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </header>

      <div className="grid grid-cols-3 gap-6">
        {/* Products */}
        <div className="col-span-2 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Products</h2>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded-lg px-3 py-2 w-1/2 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProducts.map((p) => (
              <div key={p.id || p.barcode} onClick={() => addToCart(p)}
                className="border p-4 rounded-xl cursor-pointer hover:bg-blue-50 transition"
              >
                <p className="font-semibold text-gray-800">{p.name}</p>
                <p className="text-sm text-gray-500">{p.category}</p>
                <p className="text-xs text-gray-400">Barcode: {p.barcode}</p>
                <p className="text-blue-700 font-bold mt-2">₱{p.price}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🛒 Cart</h2>
          <ul className="space-y-2 mb-4 max-h-[250px] overflow-y-auto">
            {cart.length === 0 && <p className="text-gray-400 text-center">Cart is empty</p>}
            {cart.map((item, idx) => (
              <li key={idx} className="flex justify-between items-center border-b pb-1">
                <div>
                  <span className="font-medium">{item.name}</span> 
                  <span className="text-sm text-gray-500">₱{item.price}</span>
                </div>
                <button onClick={() => removeFromCart(idx)} className="text-red-500 hover:text-red-700 text-sm font-semibold">✖</button>
              </li>
            ))}
          </ul>
          <div className="flex justify-between text-lg font-bold mb-4">
            <span>Total:</span><span>₱{total}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={clearCart} className="w-full bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400">Clear</button>
            <button onClick={() => alert("✅ Transaction Complete!")} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Pay</button>
          </div>

          <div className="mt-6">
            <h3 className="text-sm text-gray-600 mb-1">Scan or Enter Barcode:</h3>
            <input
              type="text"
              placeholder="Enter barcode..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => { if(e.key==="Enter"){ handleBarcodeScan(barcodeInput); setBarcodeInput(""); } }}
              className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
        </div>
      </div>

      {/* Add product */}
      <div className="mt-8 bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">➕ Add New Product</h2>
        <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input type="text" placeholder="Item name" value={newItem.name} onChange={e=>setNewItem({...newItem,name:e.target.value})} className="border rounded-lg px-3 py-2"/>
          <input type="number" placeholder="Price" value={newItem.price} onChange={e=>setNewItem({...newItem,price:e.target.value})} className="border rounded-lg px-3 py-2"/>
          <input type="text" placeholder="Category" value={newItem.category} onChange={e=>setNewItem({...newItem,category:e.target.value})} className="border rounded-lg px-3 py-2"/>
          <input type="text" placeholder="Barcode" value={newItem.barcode} onChange={e=>setNewItem({...newItem,barcode:e.target.value})} className="border rounded-lg px-3 py-2"/>
          <button type="submit" className="bg-green-600 text-white rounded-lg py-2 hover:bg-green-700">Add</button>
        </form>
      </div>
    </div>
  );
}
