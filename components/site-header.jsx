"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useClerk, useAuth, useUser } from "@clerk/nextjs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
    const appId = process.env.NEXT_PUBLIC_SENDBIRD_APP_ID;
    if (!appId) {
      console.warn("NEXT_PUBLIC_SENDBIRD_APP_ID not configured - SendBird chat disabled");
      return;
    }
    
    try {
      const sb = new Sendbird({ appId });
      if (user) {
        sb.connect(user.id, (sbUser, error) => {
          if (error) {
            // Silently handle SendBird errors (domain not whitelisted, app disabled, etc.)
            console.debug("SendBird connection skipped:", error.message);
          } else {
            console.log("SendBird connected for user:", sbUser);
          }
        });
      }
    } catch (error) {
      // Catch any initialization errors
      console.debug("SendBird initialization skipped:", error.message);
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
                {/* Notification Bell with Popover */}
                <Popover open={notificationModal} onOpenChange={setNotificationModal}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full relative"
                      aria-label="Notifications"
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
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-[500px] p-0 mr-4" 
                    align="end"
                    sideOffset={8}
                  >
                    <div className="flex flex-col max-h-[600px]">
                      <div className="flex-shrink-0 p-4 border-b bg-slate-50 dark:bg-slate-900">
                        <div className="flex items-center gap-3">
                          <Bell className="h-5 w-5" />
                          <h3 className="font-semibold text-lg">Notifications</h3>
                          {unreadCount > 0 && (
                            <Badge variant="secondary" className="ml-auto px-2 py-0.5 text-xs">
                              {unreadCount} new
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-3">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-4 rounded-lg border-2 transition-all hover:shadow-md cursor-pointer ${
                                !notification.is_read 
                                  ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700' 
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-1 p-2 rounded-lg bg-teal-100 dark:bg-teal-900/40">
                                  {getNotificationIcon('referral')}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                      New Referral
                                    </p>
                                    {!notification.is_read && (
                                      <div className="h-2.5 w-2.5 bg-teal-600 dark:bg-teal-500 rounded-full animate-pulse"></div>
                                    )}
                                  </div>
                                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-2 leading-relaxed">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {new Date(notification.created_at).toLocaleDateString('en-US', { 
                                      weekday: 'short', 
                                      month: 'short', 
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {notifications.length === 0 && (
                          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                            <Bell className="mx-auto h-12 w-12 mb-3 opacity-30" />
                            <p className="text-sm font-medium">No notifications</p>
                            <p className="text-xs mt-1">You're all caught up!</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-shrink-0 p-3 border-t bg-slate-50 dark:bg-slate-900 grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full"
                          onClick={handleMarkAllAsRead}
                        >
                          Mark all as read
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full"
                          onClick={handleClearAll}
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

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
    </>
);}