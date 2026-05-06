import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LccbLogo from "../assets/Lccb-logo.jpeg";

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const location = useLocation();
  const navigate = useNavigate();

  const closeSidebar = () => setSidebarOpen(false);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "sub";
  const showInventory = isAdmin || isStaff;

  const linkClass = (path) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      location.pathname === path
        ? "bg-white/20 text-white shadow-lg"
        : "text-white hover:bg-white/10"
    }`;

  return (
    <>
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-blue-700 via-blue-800 to-blue-900 p-5 z-50 transform transition-all duration-300 shadow-2xl ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 mb-8">
          <img
            src={LccbLogo}
            className="h-10 w-10 rounded-full border-2 border-white/20"
            alt="Logo"
          />
          <h2 className="text-xl font-bold text-white">Menu</h2>
        </div>

        <nav className="space-y-2">
          <Link onClick={closeSidebar} to="/dashboard" className={linkClass("/dashboard")}>
            <span className="text-xl text-white">⌂</span>
            <span className="font-medium">Home</span>
          </Link>

          {showInventory && (
            <>
              <Link onClick={closeSidebar} to="/stock" className={linkClass("/stock")}>
                <span className="text-xl text-white">▢</span>
                <span className="font-medium">Inventory</span>
              </Link>

              {isAdmin && (
                <Link onClick={closeSidebar} to="/restock" className={linkClass("/restock")}>
                  <span className="text-xl text-white">↻</span>
                  <span className="font-medium">Restock</span>
                </Link>
              )}
            </>
          )}

          <Link onClick={closeSidebar} to="/inventory-log" className={linkClass("/inventory-log")}>
            <span className="text-xl text-white">≡</span>
            <span className="font-medium">Inventory Log</span>
          </Link>

          {isAdmin && (
            <Link onClick={closeSidebar} to="/sales" className={linkClass("/sales")}> 
              <span className="text-xl text-white ml-[-4px]">▴</span>
              <span className="font-medium">Sales</span>
            </Link>
          )}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={() => {
              localStorage.removeItem("user");
              navigate("/");
            }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 border border-white/20"
          >
            <span className="text-xl text-white">⇥</span>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={closeSidebar}
        />
      )}
    </>
  );
}
