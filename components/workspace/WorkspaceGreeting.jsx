'use client';
import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WorkspaceGreeting() {
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  
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
    <div className="mb-6 flex items-center justify-between">
      <div>
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
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-9 w-9"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        <UserButton 
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "h-9 w-9"
            }
          }}
        />
      </div>
    </div>
  );
}
