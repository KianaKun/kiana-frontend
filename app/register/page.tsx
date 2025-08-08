"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async () => {
    try {
      const res = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (data.success) {
        setMessage("✅ Registrasi berhasil!");
        window.location.href = "/login"; // setelah daftar, pindah ke login
      } else {
        setMessage("❌ " + data.message);
      }
    } catch {
      setMessage("⚠️ Gagal koneksi ke server");
    }
  };

  return (
    <div className="min-h-screen bg-[#0E1116] flex items-center justify-center">
      <div className="bg-[#152030] p-8 rounded-md w-[380px]">
        <h2 className="bg-[#274056] text-white text-center py-2 font-medium mb-5">
          Registration Page
        </h2>

        <label className="text-white text-sm block mb-1">Email</label>
        <input
          type="email"
          className="w-full px-3 py-2 mb-4 bg-[#0E1116] text-white rounded outline-none focus:ring-2 focus:ring-blue-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="text-white text-sm block mb-1">Password</label>
        <input
          type="password"
          className="w-full px-3 py-2 mb-4 bg-[#0E1116] text-white rounded outline-none focus:ring-2 focus:ring-blue-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleRegister}
          className="bg-[#0E1116] text-white px-4 py-2 rounded-full hover:bg-[#1c2027] transition"
        >
          Register
        </button>

        {message && <p className="mt-4 text-white">{message}</p>}
      </div>
    </div>
  );
}
