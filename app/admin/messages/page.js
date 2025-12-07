'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ChatInterface from '@/components/chat/ChatInterface';

/**
 * Admin Messaging Page
 * Allows admin users to communicate with team members and clients
 */
export default function AdminMessagesPage() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      if (!userId) {
        router.push('/sign-in');
        return;
      }

      const userRole = user?.publicMetadata?.role;
      if (userRole !== 'admin' && userRole !== 'superadmin') {
        router.push('/unauthorized');
        return;
      }

      setIsAuthorized(true);
    }
  }, [isLoaded, userId, user, router]);

  if (!isLoaded || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-1">Communicate with team members and clients</p>
      </div>

      <ChatInterface />
    </div>
  );
}
