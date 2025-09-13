"use client";

import { useState } from "react";
import SiteHeader from "./components/site-header";
import Dashboard from "./dashboard/page"; // ✅ import your dashboard
import InteractivePage from "./interactive/page"; // ✅ import your interactive page

export default function SafespacePlatform() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  // Mock users for demo
  const mockUsers = {
    "admin@safespace.com": {
      id: "1",
      name: "Admin User",
      email: "admin@safespace.com",
      role: "admin",
    },
    "leader@safespace.com": {
      id: "2",
      name: "Team Leader",
      email: "leader@safespace.com",
      role: "team-leader",
    },
    "worker@safespace.com": {
      id: "3",
      name: "Support Worker",
      email: "worker@safespace.com",
      role: "support-worker",
    },
  };

  const handleLogin = () => {
    const user = mockUsers[loginForm.email];
    if (user && loginForm.password === "demo123") {
      setCurrentUser(user);
    } else {
      alert("Invalid credentials. Use demo123 as password.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginForm({ email: "", password: "" });
  };

  const isAuthed = Boolean(currentUser);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Always show header */}
      <SiteHeader
        isAuthenticated={isAuthed}
        userName={currentUser?.name ?? null}
        onSignOut={handleLogout}
      />

      {!isAuthed ? (
        // 🔹 Login Page
        <section className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gradient-to-br from-teal-50 to-green-100 p-4">
          <div className="w-full max-w-md bg-white p-6 rounded shadow">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-600">
                <img
                  src="/images/logo.png"
                  alt="SafeSpace Logo"
                  className="h-10 w-10"
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                <span className="text-teal-600">Safe</span>
                <span className="text-gray-900">Space</span>
              </h2>
              <p className="text-gray-600">Mental Health Support Platform</p>
            </div>

            {/* Login Form */}
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block mb-1 font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={loginForm.email}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, email: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label htmlFor="password" className="block mb-1 font-medium">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, password: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>

              <button
                onClick={handleLogin}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white p-2 rounded"
              >
                Sign In
              </button>

              {/* Demo Account Info */}
              <div className="text-sm text-gray-600 mt-4">
                <p>
                  <strong>Demo Accounts:</strong>
                </p>
                <p>Admin: admin@safespace.com</p>
                <p>Team Leader: leader@safespace.com</p>
                <p>Support Worker: worker@safespace.com</p>
                <p>Password: demo123</p>
              </div>
            </div>
          </div>
        </section>
      ) : (
        // 🔹 After Login → Show Different Pages
        <div className="p-4">
          {currentUser.role === "support-worker" ? (
            <InteractivePage />
          ) : (
            <Dashboard />
          )}
        </div>
      )}
    </div>
  );
}
