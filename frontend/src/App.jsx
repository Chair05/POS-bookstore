import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./pages/SignIn";
import LogIn from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import StartPage from "./pages/Start";
import StockManager from "./pages/Stock";
import SalesPage from "./pages/Sales";
import "./index.css";

function ProtectedRoute({ children }) {
  const user = localStorage.getItem("user");
  if (!user) return <Navigate to="/login" replace />;
  return children;
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

          <Route
            path="/sales"
            element={
              <ProtectedRoute>
                <SalesPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}
