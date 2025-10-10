'use client';
import AdminNav from "@/components/admindashboard/AdminNav";

// REFERENCES: Gemini Code Assist Agent / Gemini-Pro-2 

export default function AdminLayout({ children }) {
  // Mock user data for demonstration
  const userName = "Admin User";
  const isAuthenticated = true;
  // No onSignOut handler passed: allow SiteHeader to perform the real sign-out flow

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}
 
