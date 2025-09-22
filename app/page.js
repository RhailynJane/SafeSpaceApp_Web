"use client";

import { useState } from "react";
<<<<<<< HEAD
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SiteHeader from "@/components/site-header";
import InteractiveDashboard from "./interactive/page"; // only interactive dashboard
=======
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SiteHeader from "@/components/site-header";
import InteractiveDashboard from "./interactive/page"; // only interactive dashboard
>>>>>>> 3160e9a23df26201897c43c7dd9c2dac733d8db8

export default function SafespacePlatform() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const router = useRouter();

  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      router.push('/admin/overview');
    }
  }, [currentUser, router]);

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
      <SiteHeader
        isAuthenticated={isAuthed}
        userName={currentUser?.name ?? null}
        onSignOut={handleLogout}
      />

      {!isAuthed ? (
        <section className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-gradient-to-br from-teal-50 to-green-100 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-600">
                <img
                  src="/images/logo.png"
                  alt="SafeSpace Logo"
                  className="h-10 w-10"
                />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                <span className="text-teal-600">Safe</span>
                <span className="text-gray-900">Space</span>
              </CardTitle>
              <CardDescription>Mental Health Support Platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={loginForm.email}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, password: e.target.value })
                  }
                />
              </div>
              <Button
                onClick={handleLogin}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                Sign In
              </Button>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  <strong>Demo Accounts:</strong>
                </p>
                <p>Admin: admin@safespace.com</p>
                <p>Team Leader: leader@safespace.com</p>
                <p>Support Worker: worker@safespace.com</p>
                <p>Password: demo123</p>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : (
                // After Login → Show Dashboard based on user role
                <InteractiveDashboard
            userRole={currentUser.role}
            userName={currentUser.name.split(" ")[0]}
          />
      )}
    </div>
  );
}