import React from "react";
import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div style={{
      width: "220px",
      height: "100vh",
      background: "#1f1f1f",
      color: "white",
      padding: "20px",
      position: "fixed",
      top: 0,
      left: 0
    }}>
      <h2>POS Menu</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        <li style={{ margin: "15px 0" }}>
          <Link to="/" style={{ textDecoration: "none", color: "white" }}>
            🏠 Dashboard
          </Link>
        </li>

        <li style={{ margin: "15px 0" }}>
          <Link to="/stock" style={{ textDecoration: "none", color: "white" }}>
            📦 Stock Manager
          </Link>
        </li>

        <li style={{ margin: "15px 0" }}>
          <Link to="/sales" style={{ textDecoration: "none", color: "white" }}>
            💰 Sales (future)
          </Link>
        </li>
      </ul>
    </div>
  );
}
