"use client";

import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function ClientList() {
  const { data: clients, error } = useSWR("/api/clients", fetcher);

  if (error) return <div>Failed to load clients</div>;
  if (!clients) return <div>Loading...</div>;

  return (
    <div>
      {clients.map((client) => (
        <div key={client.id} className="flex items-center justify-between p-2 border-b">
          <div>
            {client.client_first_name} {client.client_last_name}
          </div>
        </div>
      ))}
    </div>
  );
}
