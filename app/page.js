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
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [showTwoFactor, setShowTwoFactor] = useState(false);
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

      console.log("Sign-in attempt status:", attempt.status);

      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        // Redirect will happen via useEffect after isSignedIn becomes true
      } else if (attempt.status === "needs_first_factor") {
        // User needs to complete first factor (e.g., password)
        console.log("Needs first factor authentication");
        alert("Please complete the first factor authentication.");
      } else if (attempt.status === "needs_second_factor") {
        // User needs to complete 2FA
        console.log("Needs second factor authentication (2FA)");
        console.log("Available second factors:", attempt.supportedSecondFactors);
        
        // Check if email code is available and prepare it
        const emailFactor = attempt.supportedSecondFactors?.find(
          factor => factor.strategy === 'email_code'
        );
        
        if (emailFactor) {
          console.log("Email code factor available, preparing email...");
          try {
            await signIn.prepareSecondFactor({
              strategy: 'email_code',
              emailAddressId: emailFactor.emailAddressId,
            });
            console.log("Email code sent! Check your inbox.");
          } catch (prepareError) {
            console.error("Failed to send email code:", prepareError);
          }
        }
        
        setShowTwoFactor(true);
        // Don't alert - show the 2FA input form instead
      } else if (attempt.status === "needs_new_password") {
        // User needs to set a new password
        console.log("Needs new password");
        router.push("/force-password-reset");
      } else if (attempt.status === "needs_identifier") {
        // Additional identifier needed
        console.log("Needs identifier");
        alert("Additional information required. Please contact support.");
      } else {
        console.error("Unexpected sign-in status:", attempt.status, attempt);
        alert(`Login incomplete. Status: ${attempt.status}. Please contact support if this persists.`);
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error?.errors?.[0]?.message || error?.message || "Unknown error";
      alert(`Login failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle 2FA verification
  const handleTwoFactorVerification = async (e) => {
    e.preventDefault();
    if (!isLoaded || !twoFactorCode) return;
    setLoading(true);

    try {
      // Get current sign-in attempt to check available factors
      const currentAttempt = signIn;
      console.log("Available second factors:", currentAttempt.supportedSecondFactors);
      
      let attempt;
      const availableStrategies = currentAttempt.supportedSecondFactors?.map(f => f.strategy) || [];
      
      // Try the available strategy
      if (availableStrategies.includes('email_code')) {
        console.log("Attempting email_code verification");
        attempt = await signIn.attemptSecondFactor({
          strategy: "email_code",
          code: twoFactorCode,
        });
      } else if (availableStrategies.includes('totp')) {
        console.log("Attempting TOTP verification");
        attempt = await signIn.attemptSecondFactor({
          strategy: "totp",
          code: twoFactorCode,
        });
      } else if (availableStrategies.includes('phone_code')) {
        console.log("Attempting phone_code verification");
        attempt = await signIn.attemptSecondFactor({
          strategy: "phone_code",
          code: twoFactorCode,
        });
      } else {
        throw new Error("No supported 2FA method found");
      }

      console.log("2FA verification status:", attempt.status);

      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        // Redirect will happen via useEffect after isSignedIn becomes true
      } else {
        console.error("2FA verification not complete:", attempt);
        alert("2FA verification failed. Please try again.");
      }
    } catch (error) {
      console.error("2FA verification error:", error);
      const errorMessage = error?.errors?.[0]?.message || error?.message || "Unknown error";
      alert(`2FA verification failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Redirect if already signed in
  const [hasAttemptedReload, setHasAttemptedReload] = useState(false);

  useEffect(() => {
    if (isSignedIn && user) {
      const rawRole = user.publicMetadata?.role;
      const normalizeRole = (r) => {
        if (!r) return null;
        const splitCamel = r.replace(/([a-z])([A-Z])/g, "$1_$2");
        return splitCamel.toLowerCase().replace(/[\s-]+/g, "_");
      };

      const role = normalizeRole(rawRole);
      console.debug("Signed in user:", {
        userId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        rawRole,
        normalizedRole: role,
        publicMetadata: user.publicMetadata,
        hasAttemptedReload
      });

      // If role is not yet available or not recognized, and we haven't tried reloading yet
      if (!role && !hasAttemptedReload) {
        console.log("User role not found in publicMetadata, attempting to reload user data.");
        setHasAttemptedReload(true);
        user.reload(); // Force Clerk to re-fetch user data
        return; // Prevent immediate redirection with stale data
      }

      if (role === "admin") {
        console.log("Redirecting to admin dashboard");
        router.push("/admin/overview");
      } else if (role === "super_admin" || role === "superadmin") {
        console.log("Redirecting to superadmin dashboard");
        router.push("/superadmin");
      } else if (role === "team_leader" || role === "support_worker") {
        console.log("Redirecting to workspace");
        router.push("/workspace");
      } else if (role) { // If a role exists but is not recognized (e.g., a new role type)
        console.log("Signed in with unrecognized role:", rawRole);
        alert(`Unrecognized role: ${rawRole}. Please contact support.`);
        // Optionally, redirect to a generic page or show an error
        // router.push("/unauthorized");
      } else { // No role found even after reload attempt
        console.log("Signed in but no recognized role assigned in Clerk metadata after reload", rawRole);
        alert("No role assigned to your account. Please contact support to have a role assigned.");
        // Handle cases where no role is assigned even after reload, e.g., redirect to a setup page
      }
    }
  }, [isSignedIn, user, router, hasAttemptedReload]);

  //  Render
  return (
    <div className="min-h-screen bg-background">

      {!isSignedIn && (
  <section className="flex min-h-[calc(100vh-56px)] items-start justify-center pt-8 bg-gradient-to-br from-accent/10 to-accent/20 dark:from-accent/5 dark:to-accent/10 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-600">
                <img src="/images/logo.png" alt="SafeSpace Logo" className="h-10 w-10" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                <span className="text-primary">Safe</span>
                <span className="text-foreground">Space</span>
              </CardTitle>
              <CardDescription>Mental Health Support Platform</CardDescription>
            </CardHeader>

            <CardContent>
              {!showTwoFactor ? (
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
                    className="w-full"
                  >
                    {loading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleTwoFactorVerification} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="twoFactorCode">Two-Factor Authentication Code</Label>
                    <Input
                      id="twoFactorCode"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                      maxLength={6}
                      required
                      autoFocus
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter the 6-digit code from your email or authenticator app
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowTwoFactor(false);
                        setTwoFactorCode("");
                      }}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || twoFactorCode.length !== 6}
                    >
                      {loading ? "Verifying..." : "Verify"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
