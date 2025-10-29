
"use client";
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";

// Dynamically import sendbird-calls
let SendBirdCall = null;
if (typeof window !== 'undefined') {
  SendBirdCall = require('sendbird-calls');
}

const VoiceCallModal = ({ user, supervisor, onCallEnd }) => {
  const [isCalling, setIsCalling] = useState(false);
  const [call, setCall] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [callStatus, setCallStatus] = useState("Dialing...");
  const [error, setError] = useState(null);

  const audioRef = useRef(null);

  useEffect(() => {
    if (!SendBirdCall) return;

    const initSendBird = async () => {
      try {
        SendBirdCall.init(process.env.NEXT_PUBLIC_SENDBIRD_APP_ID);
        await SendBirdCall.authenticate({ userId: user.id, accessToken: null });
        await SendBirdCall.connectWebSocket();
      } catch (err) {
        console.error("Error initializing Sendbird Calls:", err);
        setError("Failed to initialize voice call service.");
      }
    };

    initSendBird();

    return () => {
      if (SendBirdCall) {
        SendBirdCall.deauthenticate();
      }
    };
  }, [user.id]);

  const startCall = async () => {
    if (!SendBirdCall) {
      setError("Voice call service is not available.");
      return;
    }

    setIsCalling(true);
    setError(null);

    try {
      const dialParams = {
        calleeId: supervisor.id,
        isVideoCall: false,
        callOption: {
          localMediaView: null,
          remoteMediaView: audioRef.current,
          audioEnabled: true,
          videoEnabled: false,
        },
      };

      const newCall = await SendBirdCall.dial(dialParams);
      setCall(newCall);

      newCall.onEstablished = () => setCallStatus("Connected");
      newCall.onConnected = () => setCallStatus("Connecting...");
      newCall.onEnded = () => {
        setCallStatus("Call Ended");
        endCall();
      };
    } catch (err) {
      console.error("Error starting call:", err);
      setError("Failed to start the call.");
      setIsCalling(false);
    }
  };

  const endCall = () => {
    if (call) {
      call.end();
    }
    setCall(null);
    setIsCalling(false);
    onCallEnd();
  };

  const toggleMute = () => {
    if (call) {
      if (isMuted) {
        call.unmuteMicrophone();
      } else {
        call.muteMicrophone();
      }
      setIsMuted(!isMuted);
    }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isAudioEnabled;
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button onClick={startCall} className="w-full">
          <Phone className="mr-2 h-4 w-4" />
          Call Supervisor
        </Button>
      </DialogTrigger>
      {isCalling && (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calling {supervisor.name}...</DialogTitle>
            <DialogDescription>{callStatus}</DialogDescription>
          </DialogHeader>
          {error && <p className="text-red-500">{error}</p>}
          <div className="flex justify-center items-center space-x-4 my-8">
            <Button variant="outline" onClick={toggleMute}>
              {isMuted ? <MicOff /> : <Mic />}
            </Button>
            <Button variant="destructive" onClick={endCall}>
              <PhoneOff />
            </Button>
            <Button variant="outline" onClick={toggleAudio}>
              {isAudioEnabled ? <Volume2 /> : <VolumeX />}
            </Button>
          </div>
          <audio ref={audioRef} autoPlay />
        </DialogContent>
      )}
    </Dialog>
  );
};

export default VoiceCallModal;

