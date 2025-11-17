"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useClerk, useAuth, useUser } from "@clerk/nextjs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Bell, LogOut, AlertTriangle, Clock, CheckCircle, User, Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import Sendbird from 'sendbird';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function getInitials(name) {
  if (!name) return "SS";
  const parts = name.trim().split(" ");
  const first = parts[0]?.[0] ?? "";
  const last = parts[1]?.[0] ?? "";
  return (first + last || first || "SS").toUpperCase();
}

export default function SiteHeader() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const isAuthenticated = !!isSignedIn;
  const userName = user?.fullName ?? null;
  const [notificationModal, setNotificationModal] = useState(false);
  const router = useRouter();
  const [signOutLoading, setSignOutLoading] = useState(false);
  const clerk = useClerk();
  const [notifications, setNotifications] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const { isDark, toggleDarkMode } = useTheme();

  // Load profile from Convex
  const convexSelf = useQuery(
    api.users.getByClerkId,
    isAuthenticated && user?.id ? { clerkId: user.id } : "skip"
  );

  useEffect(() => {
    if (!convexSelf) return;
    setProfileData({
      profile_image_url: convexSelf.profileImageUrl || convexSelf.imageUrl || "",
    });
  }, [convexSelf]);

  useEffect(() => {
    const sb = new Sendbird({ appId: '201BD956-A3BA-448A-B8A2-8E1A23404303' });
    if (user) {
      sb.connect(user.id, (user, error) => {
        if (error) {
          console.error("Sendbird connection error:", error);
        } else {
          console.log("Sendbird connected for user:", user);
        }
      });
    }
  }, [user]);

  const convexNotifications = useQuery(
    api.notifications.listMine,
    isAuthenticated && user?.id ? { userId: user.id } : "skip"
  );

  useEffect(() => {
    if (!Array.isArray(convexNotifications)) return;
    // Map Convex docs to UI shape expected by header
    const mapped = convexNotifications.map((n) => ({
      id: n._id,
      message: n.message,
      is_read: !!n.isRead,
      created_at: new Date(n.createdAt).toISOString(),
      type: n.type || 'system',
      title: n.title || 'Notification',
    }));
    setNotifications(mapped);
  }, [convexNotifications]);

  const handleSignOutClick = async () => {
    setSignOutLoading(true);
    console.debug("Sign out clicked: attempting clerk.signOut");
    try {
      if (clerk && typeof clerk.signOut === "function") {
        // try to sign out via Clerk client which will also handle redirect
        await clerk.signOut({ redirectUrl: "/" });
        console.debug("clerk.signOut completed");
        return;
      } else {
        console.debug("clerk.signOut not available on clerk client", clerk);
      }
    } catch (err) {
      console.error("clerk.signOut failed:", err);
    }

    // Fallback: navigate to login page
    console.debug("Falling back to router.push('/') for sign-out");
    try {
      router.push("/");
    } catch (err) {
      console.error("router.push failed during sign-out fallback:", err);
    } finally {
      setSignOutLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case "urgent":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "referral":
        return <User className="h-4 w-4 text-blue-500" />;
      case "appointment":
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const handleProfileClick = () => {
    router.push('/profile');
  };

  const markAllAsReadMut = useMutation(api.notifications.markAllAsRead);
  const clearAllMut = useMutation(api.notifications.clearAll);

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear all notifications?')) {
      try {
        if (user?.id) {
          await clearAllMut({ userId: user.id });
        }
        setNotifications([]);
        setNotificationModal(false);
      } catch (error) {
        console.error("Error clearing notifications:", error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      if (user?.id) {
        await markAllAsReadMut({ userId: user.id });
      }
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setNotificationModal(false);
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };



  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-2 sm:px-3 lg:px-5">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="SafeSpace Logo" className="h-12 w-12" />
            <span className="text-xl font-bold">
              <span className="text-emerald-600">Safe</span>
              <span className="text-foreground">Space</span>
            </span>
            <span className="sr-only">
              SafeSpace - Mental Health Support Platform
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle always visible */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Toggle theme"
              onClick={toggleDarkMode}
              title={isDark ? "Switch to light" : "Switch to dark"}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            {isAuthenticated ? (
              <>
                {/* Notification Bell */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    aria-label="Notifications"
                    onClick={() => setNotificationModal(true)}
                  >
                    <Bell className="h-5 w-5 text-orange-500" />
                    {unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </div>

                {/* Avatar - clickable for profile */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-0"
                  onClick={handleProfileClick}
                  aria-label="Open profile"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profileData?.profile_image_url} alt={userName} />
                    <AvatarFallback className="bg-teal-100 text-teal-700 text-xs">
                      {getInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>

                <Button
                  variant="ghost"
                  className="gap-2"
                  aria-label="Sign out"
                  onClick={handleSignOutClick}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {signOutLoading ? "Signing out..." : "Sign out"}
                  </span>
                </Button>


              </>
            ) : null}
          </div>
        </div>
      </header>

      {/* Notification Modal */}
      <Dialog open={notificationModal} onOpenChange={setNotificationModal}>
        <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount} new
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border ${
                    !notification.is_read 
                      ? 'bg-accent/30 border-border' 
                      : 'bg-card border-border'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon('referral')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">
                          New Referral
                        </p>
                        {!notification.is_read && (
                          <div className="h-2 w-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {notifications.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            )}
          </div>
          <div className="flex-shrink-0 mt-4 grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleClearAll}
            >
              Clear All
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
);}