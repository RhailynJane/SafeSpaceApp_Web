'use client';
import { useUser } from '@clerk/nextjs';

export default function WorkspaceGreeting() {
  const { user } = useUser();
  
  const firstName = user?.firstName || 'User';
  const userRole = user?.publicMetadata?.role || 'staff';
  
  // Format role for display
  const roleDisplay = userRole
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-foreground">
        {getGreeting()}, {firstName}
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        {roleDisplay} • {new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </p>
    </div>
  );
}
