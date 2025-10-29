"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import SendbirdChat from "@/components/SendbirdChat";

export function MessageModal({ client }) {
  const [channelUrl, setChannelUrl] = useState(null);

  const createChannel = async () => {
    const res = await fetch('/api/messages/create-channel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: client.user_id }),
    });
    const data = await res.json();
    setChannelUrl(data.channelUrl);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button onClick={createChannel}>Message</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Chat with {client.client_first_name} {client.client_last_name}</DialogTitle>
        </DialogHeader>
        <div style={{ height: '500px' }}>
          {channelUrl && <SendbirdChat channelUrl={channelUrl} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}