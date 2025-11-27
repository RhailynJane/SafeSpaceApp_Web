'use client';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import WorkspaceNav from "@/components/workspace/WorkspaceNav";
import PresencePinger from "@/components/admindashboard/PresencePinger";
import WorkspaceGreeting from "@/components/workspace/WorkspaceGreeting";

export default function WorkspaceLayout({ children }) {
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

      // Check if user has appropriate role for workspace
      const userRole = user?.publicMetadata?.role;
      const allowedRoles = ['admin', 'superadmin', 'team_leader', 'support_worker', 'peer_support'];
      
      if (!allowedRoles.includes(userRole)) {
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

  const userRole = user?.publicMetadata?.role;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <WorkspaceNav userRole={userRole} />
        <main className="flex-1 p-6 overflow-auto">
          {sessionId && <PresencePinger />}
          <WorkspaceGreeting />
          {children}
        </main>
      </div>
    </div>
  );
}
