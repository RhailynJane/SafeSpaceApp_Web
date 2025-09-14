"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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
      alert("Invalid credentials. Use password: demo123");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginForm({ email: "", password: "" });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {!currentUser ? (
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-center">SafeSpace Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              />
            </div>
            <Button onClick={handleLogin} className="w-full bg-teal-600 text-white">
              Sign In
            </Button>
            <div className="text-sm text-gray-500">
              Demo Emails: <br />
              admin@safespace.com <br />
              worker@safespace.com <br />
              leader@safespace.com <br />
              Password: <strong>demo123</strong>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Welcome, {currentUser.name}!</h1>
          <p className="text-gray-600">Role: {currentUser.role}</p>
          <Button onClick={handleLogout} className="bg-red-500 text-white">
            Sign Out
          </Button>
        </div>
      )}
    </div>
  );
}
