import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Lccb-logo.jpeg"; // adjust if needed

export default function SignUp() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("admin");

  const handleSignUp = (e) => {
    e.preventDefault();

    if (!username || !password || !confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    fetch("http://localhost:5000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert(`${role} account created successfully!`);
          navigate("/login");
        } else {
          alert(data.message);
        }
      })
      .catch(() => {
        alert("Server error. Try again later.");
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] px-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-gray-100 w-full max-w-2xl px-6 py-8 sm:px-10 sm:py-10">

        {/* Header */}
        <div className="flex items-center justify-center gap-4 mb-6 text-center">
          <div className="w-12 h-12 rounded-lg overflow-hidden shadow bg-white flex items-center justify-center">
            <img
              src={logo}
              alt="School Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <div>
            <h1 className="text-xl font-semibold text-gray-900">Sign Up</h1>
            <p className="text-sm text-gray-500">
              Create a new Admin or Sub account
            </p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSignUp}
          className="space-y-4 max-w-xl mx-auto text-left"
        >

          {/* Role */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Sign up as
            </label>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-11 px-4 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="admin">Admin</option>
              <option value="sub">Sub User</option>
            </select>
          </div>

          {/* Username */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full h-11 px-4 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full h-11 px-4 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Confirm Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full h-11 px-4 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full h-11 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold shadow hover:brightness-105 active:scale-95 transition"
          >
            Sign Up
          </button>
        </form>

        {/* Links */}
        <div className="mt-6 flex flex-col items-center gap-2 text-sm">

          <button
            onClick={() => navigate("/")}
            className="text-blue-600 hover:underline"
          >
            ← Back to Home
          </button>

          <button
            onClick={() => navigate("/login")}
            className="text-emerald-600 hover:underline"
          >
            Already have an account? Log in
          </button>

        </div>
      </div>
    </div>
  );
}
