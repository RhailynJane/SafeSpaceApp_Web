"use client";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
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

export default function SafespacePlatform() {
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { isSignedIn } = useAuth();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { user } = useUser();

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);

    try {
      const attempt = await signIn.create({
        identifier: loginForm.email,
        password: loginForm.password,
      });

      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
      } else {
        console.error("Login not complete:", attempt);
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn && user) {
      // Normalize role strings from Clerk to handle variants like
      // 'team_leader', 'team-leader', 'teamLeader', 'team leader', etc.
      const rawRole = user.publicMetadata?.role;

      // Code written with assistance of Chatgpt - to resove variant strings issue
      const normalizeRole = (r) => {
        if (!r) return null;
        // convert camelCase to snake_case, replace spaces/hyphens with underscores
        const splitCamel = r.replace(/([a-z])([A-Z])/g, "$1_$2");
        return splitCamel.toLowerCase().replace(/[\s-]+/g, "_");
      };

      const role = normalizeRole(rawRole);
      console.debug("Signed in user role (raw):", rawRole, "normalized:", role);

      if (role === "admin") {
        router.push("/admin/overview");
      } else if (role === "team_leader" || role === "support_worker") {
        // team leaders and support workers land on the interactive dashboard
        router.push("/interactive");
      } else {
        console.log("Signed in but no recognized role assigned in Clerk metadata", rawRole);
      }
    }
  }, [isSignedIn, user, router]);

  //  Render
  return (
    <div className="min-h-screen bg-gray-50">

      {!isSignedIn && (
  <section className="flex min-h-[calc(100vh-56px)] items-start justify-center pt-8 bg-gradient-to-br from-teal-50 to-green-100 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-600">
                <img src="/images/logo.png" alt="SafeSpace Logo" className="h-10 w-10" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                <span className="text-teal-600">Safe</span>
                <span className="text-gray-900">Space</span>
              </CardTitle>
              <CardDescription>Mental Health Support Platform</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
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
                    required
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
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
