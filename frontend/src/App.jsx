import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./pages/SignIn";
import LogIn from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import StartPage from "./pages/Start";
import StockManager from "./pages/Stock";
import SalesPage from "./pages/Sales";
import Restock from "./pages/Restock";
import Log from "./pages/InventoryLog";
import MonthlySalesReport from "./pages/MonthlySalesReport";
import ManageStaff from "./pages/ManageStaff";
import "./index.css";

function ProtectedRoute({ children }) {
  const user = localStorage.getItem("user");
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user?.role) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

function InventoryRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user?.role) return <Navigate to="/login" replace />;
  if (user.role === "admin" || user.canViewInventoryLogs) return children;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Router>
      <div style={{ width: "100%" }}>

        {/* Main routing */}
        <Routes>
          {/* Public */}
          <Route path="/" element={<StartPage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/login" element={<LogIn />} />

          {/* Protected */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/stock"
            element={
              <ProtectedRoute>
                <StockManager />
              </ProtectedRoute>
            }
          />

          <Route path="/sales" element={<ProtectedRoute><SalesPage /></ProtectedRoute>} />
          <Route
            path="/restock"
            element={
              <ProtectedRoute>
                <Restock />
              </ProtectedRoute>
            }
          />

          <Route path="/inventory-log" element={<ProtectedRoute><InventoryRoute><Log /></InventoryRoute></ProtectedRoute>} />
          <Route path="/sales-report" element={<ProtectedRoute><AdminRoute><MonthlySalesReport /></AdminRoute></ProtectedRoute>} />
          <Route path="/manage-staff" element={<ProtectedRoute><AdminRoute><ManageStaff /></AdminRoute></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}
