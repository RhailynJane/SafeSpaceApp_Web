"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useClerk, useAuth, useUser } from "@clerk/nextjs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Bell, LogOut, AlertTriangle, Clock, CheckCircle, User } from "lucide-react";
import Sendbird from "sendbird";

/** Utility to get initials for avatar fallback */
function getInitials(name) {
  if (!name) return "SS";
  const parts = name.trim().split(" ");
  const first = parts[0]?.[0] ?? "";
  const last = parts[1]?.[0] ?? "";
  return (first + last || first || "SS").toUpperCase();
}

/** Time formatter for notification timestamps */
function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

/** Get icon per notification type */
function getNotificationIcon(type) {
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
}

export default function SiteHeader() {
  const router = useRouter();
  const clerk = useClerk();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const isAuthenticated = !!isSignedIn;
  const userName = user?.fullName ?? null;

  // ---- State ----
  const [mounted, setMounted] = useState(false);
  const [notificationModal, setNotificationModal] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [profileData, setProfileData] = useState(null);

  // ---- Mount check (prevents hydration mismatch) ----
  useEffect(() => setMounted(true), []);

  // ---- Fetch profile ----
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setProfileData(data);
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      }
    };
    fetchProfile();
  }, [isAuthenticated]);

  // ---- Sendbird connection ----
  useEffect(() => {
    if (!mounted || !user) return;

    const sb = new Sendbird({ appId: process.env.NEXT_PUBLIC_SENDBIRD_APP_ID });
    sb.connect(user.id, (sbUser, error) => {
      if (error) {
        console.error("Sendbird connection error:", error);
        return;
      }
      console.log("Sendbird connected:", sbUser.nickname);

      const ChannelHandler = new sb.ChannelHandler();

      ChannelHandler.onMessageReceived = (channel, message) => {
        setNotifications((prev) => [
          {
            id: message.messageId,
            message: message.message,
            type: "referral",
            created_at: message.createdAt,
            is_read: false,
          },
          ...prev,
        ]);
      };

      sb.addChannelHandler("siteHeaderHandler", ChannelHandler);
    });

    return () => {
      try {
        sb.removeChannelHandler("siteHeaderHandler");
        sb.disconnect();
      } catch {
        // ignore cleanup
      }
    };
  }, [mounted, user]);

  // ---- Fetch notifications ----
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchNotifications = async () => {
      try {
        const response = await fetch("/api/notifications/mine");
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error("Notification fetch error:", error);
      }
    };
    fetchNotifications();
  }, [isAuthenticated]);

  // ---- Handle Sign Out ----
  const handleSignOutClick = async () => {
    setSignOutLoading(true);
    try {
      if (clerk && typeof clerk.signOut === "function") {
        await clerk.signOut({ redirectUrl: "/" });
        return;
      }
    } catch (err) {
      console.error("clerk.signOut failed:", err);
    }
    router.push("/");
    setSignOutLoading(false);
  };

  // ---- Handle notification actions ----
  const handleClearAll = async () => {
    if (confirm("Are you sure you want to clear all notifications?")) {
      try {
        await fetch("/api/notifications", { method: "DELETE" });
        setNotifications([]);
      } catch (error) {
        console.error("Error clearing notifications:", error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/notifications/mark-as-read", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  // ---- Unread count ----
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ---- Render placeholder during hydration ----
  if (!mounted) {
    return (
      <header className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full"></div>
        </div>
      </header>
    );
  }

  // ---- Render full header ----
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
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-2">
            {isAuthenticated && (
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

                {/* Avatar */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-0"
                  onClick={() => router.push("/profile")}
                  aria-label="Open profile"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profileData?.profile_image_url} alt={userName} />
                    <AvatarFallback className="bg-teal-100 text-teal-700 text-xs">
                      {getInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>

                {/* Sign Out */}
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
            )}
          </div>
        </div>
      </header>

      {/* Notifications Dialog */}
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

          {/* Notification list */}
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-lg border ${
                    !n.is_read
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900">
                          {n.title || "New Notification"}
                        </p>
                        {!n.is_read && <div className="h-2 w-2 bg-blue-500 rounded-full" />}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{n.message}</p>
                      <p className="text-xs text-gray-400">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}

              {notifications.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 mt-4 grid grid-cols-2 gap-2">
            <Button variant="outline" className="w-full" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
            <Button variant="destructive" className="w-full" onClick={handleClearAll}>
              Clear All
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
