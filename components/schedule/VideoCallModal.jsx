
"use client"

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video, Mic, MicOff, VideoOff, PhoneOff } from "lucide-react";
import SendBirdCall from "sendbird-calls";

export default function VideoCallModal({ appointment, open, onOpenChange }) {
  const [call, setCall] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (open && appointment) {
      const initSendbird = async () => {
        const appId = process.env.NEXT_PUBLIC_SENDBIRD_APP_ID;
        console.log("Sendbird App ID:", appId);
        if (!appId) {
          console.error("Sendbird App ID is not defined. Make sure to set NEXT_PUBLIC_SENDBIRD_APP_ID in your .env.local file and restart the server.");
          return;
        }
        SendBirdCall.init(appId);
        await SendBirdCall.authenticate({
          userId: "user-1", // This should be the current user's ID
          accessToken: null, // Optional, if you have access tokens
        });
        await SendBirdCall.connect();
        const call = await SendBirdCall.dial(
          {
            userId: "user-2", // This should be the other user's ID
            isVideoCall: true,
          },
          {
            localMediaView: localVideoRef.current,
            remoteMediaView: remoteVideoRef.current,
            audioEnabled: true,
            videoEnabled: true,
          }
        );
        setCall(call);
      };
      initSendbird();
    }

    return () => {
      if (call) {
        call.end();
      }
      if (SendBirdCall.isInitialized) {
        SendBirdCall.deauthenticate();
      }
    };
  }, [open, appointment]);

  const handleToggleMute = () => {
    if (call) {
      if (isMuted) {
        call.unmute();
      } else {
        call.mute();
      }
      setIsMuted(!isMuted);
    }
  };

  const handleToggleVideo = () => {
    if (call) {
      if (isVideoOff) {
        call.startVideo();
      } else {
        call.stopVideo();
      }
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleEndCall = () => {
    if (call) {
      call.end();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Video Call</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <video ref={remoteVideoRef} autoPlay className="w-full h-full bg-black" />
          <video ref={localVideoRef} autoPlay muted className="absolute bottom-4 right-4 w-48 h-36 bg-black" />
        </div>
        <div className="flex justify-center gap-4 mt-4">
          <Button onClick={handleToggleMute} variant={isMuted ? "destructive" : "outline"}>
            {isMuted ? <MicOff /> : <Mic />}
          </Button>
          <Button onClick={handleToggleVideo} variant={isVideoOff ? "destructive" : "outline"}>
            {isVideoOff ? <VideoOff /> : <Video />}
          </Button>
          <Button onClick={handleEndCall} variant="destructive">
            <PhoneOff />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
