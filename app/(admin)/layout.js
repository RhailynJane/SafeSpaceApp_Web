import AdminHeader from "@/components/admindashboard/AdminHeader";

export default function AdminLayout({ children }) {
  return (
    <>
      <AdminHeader />
      {children}
    </>
  );
}