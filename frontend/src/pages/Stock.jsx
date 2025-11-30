import React, { useEffect, useState } from "react";

export default function StockManager() {
  const [products, setProducts] = useState([]);
  const [adjustValue, setAdjustValue] = useState({});

  // -----------------------
  // FETCH ALL PRODUCTS
  // -----------------------
  const loadProducts = () => {
    fetch("http://localhost:5000/products")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProducts(data.products);
        }
      });
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // -----------------------
  // UPDATE STOCK
  // -----------------------
  const updateStock = (id) => {
    const value = Number(adjustValue[id] || 0);

    if (isNaN(value)) return alert("Invalid number");

    fetch(`http://localhost:5000/products/stock/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: value })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert("Stock updated!");
          loadProducts();
        } else {
          alert("Failed to update");
        }
      });
  };

  return (
    <div style={{ padding: "30px" }}>
      <h1>📦 Stock Management</h1>

      <table border="1" cellPadding="10" style={{ marginTop: "20px", width: "100%" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Barcode</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Add / Remove</th>
            <th>Update</th>
          </tr>
        </thead>

        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.barcode}</td>
              <td>{p.category}</td>
              <td>{p.stock}</td>

              <td>
                <input
                  type="number"
                  value={adjustValue[p.id] || ""}
                  placeholder="Enter stock"
                  onChange={(e) =>
                    setAdjustValue({
                      ...adjustValue,
                      [p.id]: e.target.value
                    })
                  }
                />
              </td>

              <td>
                <button onClick={() => updateStock(p.id)}>
                  Update Stock
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
