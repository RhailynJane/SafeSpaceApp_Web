"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function ClientList() {
  const { user, isLoaded } = useUser();
  const clients = useQuery(
    api.clients.list,
    isLoaded && user?.id ? { clerkId: user.id } : "skip"
  );

  if (!clients) return <div>Loading...</div>;

  return (
    <div>
      {clients.map((client) => (
        <div key={client._id} className="flex items-center justify-between p-2 border-b">
          <div>
            {client.firstName} {client.lastName}
          </div>
        </div>
      ))}
    </div>
  );
}
