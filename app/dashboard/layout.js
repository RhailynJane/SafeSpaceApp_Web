'use client';
import SiteHeader from "@/components/site-header";
import { useAuth, useUser } from "@clerk/nextjs";

export default function DashboardLayout({ children }) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader 
        isAuthenticated={isSignedIn}
        userName={user?.fullName}
      />
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}
