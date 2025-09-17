import AdminNav from "@/components/admindashboard/AdminNav";

export default function AdminLayout({ children }) {
  return (
    <>
      <AdminNav />
      {children}
    </>
  );
}