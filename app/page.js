"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useSignIn, useUser } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SiteHeader from "@/components/site-header";

export default function SafespacePlatform() {
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { signIn, setActive } = useSignIn();
  const { user } = useUser();

  useEffect(() => {
    if (isSignedIn && user) {
      const email =
        user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress;
      if (email) {
        fetch("/api/get-user-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, userId: user.id }),
        })
          .then((res) => res.json())
          .then(({ role }) => {
            if (role && role.trim().toLowerCase() === "admin") {
              router.push("/admin/overview");
            } else if (role === "team_leader" || role === "support_worker") {
              router.push("/dashboard");
            }
          });
      }
    }
  }, [isSignedIn, user, router]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: loginForm.email,
        password: loginForm.password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
      } else {
        alert("Login failed. Please check credentials.");
      }
    } catch (err) {
      console.error(err);
      alert("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader
        isAuthenticated={isSignedIn}
        userName={user?.fullName ?? null}
      />

      {/* Only show login card if not signed in */}
      {!isSignedIn && (
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
              <CardTitle className="text-2xl font-bold text-gray-800">
                <span className="text-teal-600">Safe</span>
                <span className="text-gray-900">Space</span>
              </CardTitle>
              <CardDescription>Mental Health Support Platform</CardDescription>
            </CardHeader>.
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
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}