"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Bell, LogOut, AlertTriangle, Clock, CheckCircle, User } from "lucide-react";

function getInitials(name) {
  if (!name) return "SS";
  const parts = name.trim().split(" ");
  const first = parts[0]?.[0] ?? "";
  const last = parts[1]?.[0] ?? "";
  return (first + last || first || "SS").toUpperCase();
}

export default function SiteHeader({
  isAuthenticated = false,
  userName = null,
}) {
  const [notificationModal, setNotificationModal] = useState(false);
  const router = useRouter();
  const { signOut } = useClerk();


  // Sample notifications 
  const notifications = [
    {
      id: 1,
      type: "urgent",
      title: "High-Risk Client Alert",
      message: "Carol Davis requires immediate attention - expressed suicidal ideation",
      time: "5 minutes ago",
      unread: true,
    },
    {
      id: 2,
      type: "referral",
      title: "New Referral",
      message: "Critical priority referral from Hospital Emergency Department",
      time: "1 hour ago",
      unread: true,
    },
    {
      id: 3,
      type: "appointment",
      title: "Upcoming Appointment",
      message: "Session with Alice Smith in 30 minutes",
      time: "2 hours ago",
      unread: false,
    },
    {
      id: 4,
      type: "system",
      title: "Monthly Report Ready",
      message: "Your monthly caseload summary has been generated",
      time: "1 day ago",
      unread: false,
    },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

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

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="SafeSpace Logo" className="h-10 w-10" />
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
                    <AvatarFallback className="bg-teal-100 text-teal-700 text-xs">
                      {getInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => signOut()}
                  className="gap-2"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign out</span>
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
                    notification.unread 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        {notification.unread && (
                          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400">
                        {notification.time}
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
          <div className="flex-shrink-0 mt-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                // Mark all as read logic here
                setNotificationModal(false);
              }}
            >
              Mark all as read
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
