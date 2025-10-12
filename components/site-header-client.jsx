"use client";

import React from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import SiteHeader from "./site-header";

export default function SiteHeaderClient() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  return <SiteHeader isAuthenticated={!!isSignedIn} userName={user?.fullName ?? null} />;
}
