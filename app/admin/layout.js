import AdminNav from "@/components/admindashboard/AdminNav";

// REFERENCES: Gemini Code Assist Agent / Gemini-Pro-2 

export default function AdminLayout({ children }) {
  return (
    <>
      <AdminNav />
      {children}
    </>
  );
}