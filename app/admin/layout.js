'use client';
import AdminNav from "@/components/admindashboard/AdminNav";
import SiteHeader from "@/components/site-header";

// REFERENCES: Gemini Code Assist Agent / Gemini-Pro-2 

export default function AdminLayout({ children }) {
  // Mock user data for demonstration
  const userName = "Admin User";
  const isAuthenticated = true;
  const handleSignOut = () => {
    // In a real app, this would handle the sign-out logic
    alert("Signed out!");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader 
        isAuthenticated={isAuthenticated}
        userName={userName}
        onSignOut={handleSignOut}
      />
      <AdminNav />
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}