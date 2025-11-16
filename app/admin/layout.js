'use client';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminNav from "@/components/admindashboard/AdminNav";
import PresencePinger from "@/components/admindashboard/PresencePinger.jsx";

// REFERENCES: Gemini Code Assist Agent / Gemini-Pro-2
// SECURITY: Client-side defense-in-depth authentication verification

export default function AdminLayout({ children }) {
  const { isLoaded, userId, sessionId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Defense-in-depth: Client-side auth verification
    if (isLoaded) {
      if (!userId) {
        // Not authenticated - redirect to sign in
        router.push('/sign-in');
        return;
      }

      // Check if user has admin or superadmin role
      const userRole = user?.publicMetadata?.role;
      if (userRole !== 'admin' && userRole !== 'superadmin') {
        // Not authorized - redirect to unauthorized page
        router.push('/unauthorized');
        return;
      }

      // User is authenticated and authorized
      setIsAuthorized(true);
    }
  }, [isLoaded, userId, user, router]);

  // Show loading state while checking authentication
  if (!isLoaded || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <AdminNav />
        <main className="flex-1 p-6">
          {sessionId && <PresencePinger />}
          {children}
        </main>
      </div>
    </div>
  );
}
