"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useClerk, useAuth, useUser } from "@clerk/nextjs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Bell, LogOut, AlertTriangle, Clock, CheckCircle, User } from "lucide-react";
import Sendbird from 'sendbird';

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

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
      }
    };

    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated]);

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

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications/mine');
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

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

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear all notifications?')) {
      try {
        await fetch('/api/notifications', { method: 'DELETE' });
        setNotifications([]);
        setNotificationModal(false);
      } catch (error) {
        console.error("Error clearing notifications:", error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-as-read', { method: 'PATCH' });
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setNotificationModal(false);
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) {
      return Math.floor(interval) + " years ago";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      return Math.floor(interval) + " months ago";
    }
    interval = seconds / 86400;
    if (interval > 1) {
      return Math.floor(interval) + " days ago";
    }
    interval = seconds / 3600;
    if (interval > 1) {
      return Math.floor(interval) + " hours ago";
    }
    interval = seconds / 60;
    if (interval > 1) {
      return Math.floor(interval) + " minutes ago";
    }
    return Math.floor(seconds) + " seconds ago";
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="flex h-14 items-center justify-between px-2 sm:px-3 lg:px-5">
          {/* Logo */}
          <div className="flex items-center gap-2 ml-[-16px]">
            <img src="/images/logo.png" alt="SafeSpace Logo" className="h-10 w-10 " />
            <span className="text-lg font-bold">
              <span className="text-teal-600">Safe</span>
              <span className="text-gray-900">Space</span>
            </span>
            <span className="sr-only">
              SafeSpace - Mental Health Support Platform
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
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
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon('referral')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900">
                          New Referral
                        </p>
                        {!notification.is_read && (
                          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400">
                        {timeAgo(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {notifications.length === 0 && (
              <div className="text-center py-8 text-gray-500">
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