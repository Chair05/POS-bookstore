import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LogIn() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
  e.preventDefault();
  if (!username || !password) return alert("Please fill in all fields.");

  fetch("http://localhost:5000/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        localStorage.setItem("user", JSON.stringify({ name: data.name }));
        window.location.href = "/dashboard";
      } else {
        alert(data.message);
      }
    })
    .catch((err) => {
      console.error(err);
      alert("Server error. Try again later.");
    });
};


  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">🔑 Admin Login</h1>
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow-md w-80">
        <label className="block mb-2 font-semibold">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border w-full p-2 mb-4 rounded"
          placeholder="Enter username"
        />

        <label className="block mb-2 font-semibold">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border w-full p-2 mb-4 rounded"
          placeholder="Enter password"
        />

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded font-semibold"
        >
          Log In
        </button>
      </form>

      <div className="mt-4 flex flex-col items-center gap-2">
        <button
          onClick={() => navigate("/")}
          className="text-blue-600 hover:underline"
        >
          ← Back to Home
        </button>
        <button
          onClick={() => navigate("/signin")}
          className="text-green-600 hover:underline"
        >
          ➕ Create Admin Account
        </button>
      </div>
    </div>
  );
}
