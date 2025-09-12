"use client";

import { Bell, LogOut } from "lucide-react";
import { Button } from "./ui/button"; 
import { cn } from "@/lib/utils"
export default function SiteHeader({
  isAuthenticated = false,
  userName = null,
  onSignOut,
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
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
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 text-orange-500" />
              </Button>

              <Button
                variant="ghost"
                onClick={onSignOut}
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
  );
}
