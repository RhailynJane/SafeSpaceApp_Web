"use client";
import { useUser } from "@clerk/nextjs";

export default function AdminGreeting({ className = "" }) {
  const { user, isLoaded } = useUser();
  const name = isLoaded && user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.username || "Admin" : "Admin";
  return (
    <h1 className={`text-2xl font-bold text-foreground mb-6 ${className}`}>Welcome, {name}!</h1>
  );
}
