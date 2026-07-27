import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Lccb-logo.jpeg";
import cover from "../assets/gg.jpg";

export default function SignUp() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState("admin");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSignUp = (e) => {
    e.preventDefault();

    if (!username || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      setTimeout(() => setError(""), 4000);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setTimeout(() => setError(""), 4000);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setTimeout(() => setError(""), 4000);
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
          const displayRole = role === "sub" ? "Staff" : "Admin";
          setSuccess(`${displayRole} account created successfully!`);
          setTimeout(() => navigate("/login"), 1200);
        } else {
          setError(data.message || "Registration failed.");
          setTimeout(() => setError(""), 4000);
        }
      })
      .catch(() => {
        setError("Server error. Try again later.");
        setTimeout(() => setError(""), 4000);
      });
  };

  return (
    <div className="w-screen h-screen flex overflow-hidden">

      {/* LEFT SIDE IMAGE */}
      <div className="w-1/2 h-full relative">
        <img
          src={cover}
          alt="Signup Cover"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Blue Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-blue-700/70 to-blue-500/60"></div>

        <div className="absolute inset-0 flex items-center justify-center text-white text-center px-12">
          <div>
            <h2 className="text-4xl font-bold mb-4">Create Your Account</h2>
            <p className="text-lg opacity-90">Register to access the bookstore system.</p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE FORM (SCROLLABLE) */}
      <div className="w-1/2 h-full overflow-y-auto bg-gray-50 px-8 py-12 flex items-start justify-center">
        <div className="w-full">

          {/* Notification Banners */}
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-800">{error}</div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800">{success}</div>
          )}

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg bg-white">
              <img src={logo} alt="LCCB Logo" className="w-full h-full object-contain" />
            </div>

            <div>
              <h1 className="text-lg font-bold text-gray-900">Sign Up</h1>
              <p className="text-sm text-gray-500">Create an Admin or Staff account</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSignUp} className="space-y-3">

            {/* Role */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Sign up as</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full h-9 px-3 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600">
                <option value="admin">Admin</option>
                <option value="sub">Staff</option>
              </select>
            </div>

            {/* Username */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" className="w-full sm:w-[520px] mx-auto h-9 px-3 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600" />
            </div>

            {/* Password */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Password</label>
              <div className="flex items-center w-full max-w-[210px] h-9 rounded-lg border border-gray-300 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-600">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" className="flex-1 h-full px-3 text-sm bg-transparent focus:outline-none rounded-l-lg" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="h-full px-2 flex items-center justify-center text-blue-600 hover:text-blue-800 rounded-r-lg text-sm font-normal">
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="flex items-center w-full max-w-[210px] h-9 rounded-lg border border-gray-300 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-600">
                <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className="flex-1 h-full px-3 text-sm bg-transparent focus:outline-none rounded-l-lg" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="h-full px-2 flex items-center justify-center text-blue-600 hover:text-blue-800 rounded-r-lg text-sm font-normal">
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            {/* Submit */}
            <button type="submit" className="w-full h-9 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold shadow-lg hover:brightness-105 active:scale-[0.98] transition">Sign Up</button>
          </form>

          {/* Links */}
          <div className="mt-4 flex flex-col gap-1 text-xs pb-10">
            <button onClick={() => navigate("/")} className="text-blue-600 hover:underline text-left">← Back to Home</button>

            <button onClick={() => navigate("/login")} className="text-emerald-600 hover:underline text-left">Already have an account? Log in</button>
          </div>

        </div>
      </div>

    </div>
  );
}
