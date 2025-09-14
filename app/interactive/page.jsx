export default function InteractiveDashboard({ userRole, userName }) {
  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p>Welcome, {userName}!</p>
      <p className="text-gray-600 mt-2">You are logged in as: <strong>{userRole}</strong></p>
    </div>
  );
}
