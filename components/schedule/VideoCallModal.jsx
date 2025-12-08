"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video as VideoIcon, Mic, MicOff, VideoOff, PhoneOff, Loader2, AlertCircle } from "lucide-react";
import TwilioVideo from "twilio-video";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";

const TrackView = ({ track, isLocal }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!track || !containerRef.current) return;
    const element = track.attach();
    const container = containerRef.current;
    container.innerHTML = "";
    container.appendChild(element);

    if (isLocal && element instanceof HTMLMediaElement) {
      element.muted = true;
    }

    return () => {
      track.detach().forEach((el) => el.remove());
    };
  }, [track, isLocal]);

  return <div ref={containerRef} className="w-full h-full" />;
};

const ParticipantTile = ({ participant, isLocal }) => {
  const [videoTracks, setVideoTracks] = useState([]);
  const [audioTracks, setAudioTracks] = useState([]);

  useEffect(() => {
    const subscribed = (track) => {
      if (track.kind === "video") setVideoTracks((prev) => [...prev, track]);
      if (track.kind === "audio") setAudioTracks((prev) => [...prev, track]);
    };

    const unsubscribed = (track) => {
      if (track.kind === "video") setVideoTracks((prev) => prev.filter((t) => t.sid !== track.sid));
      if (track.kind === "audio") setAudioTracks((prev) => prev.filter((t) => t.sid !== track.sid));
    };

    const publications = Array.from(participant.tracks.values());
    setVideoTracks(publications.map((p) => p.track).filter((t) => t && t.kind === "video"));
    setAudioTracks(publications.map((p) => p.track).filter((t) => t && t.kind === "audio"));

    participant.on("trackSubscribed", subscribed);
    participant.on("trackUnsubscribed", unsubscribed);

    return () => {
      participant.off("trackSubscribed", subscribed);
      participant.off("trackUnsubscribed", unsubscribed);
    };
  }, [participant]);

  return (
    <div className="border rounded-md overflow-hidden bg-black relative min-h-[180px]">
      <div className="absolute top-2 left-2 px-2 py-1 text-xs bg-black/70 text-white rounded">
        {isLocal ? "You" : participant.identity}
      </div>
      <div className="aspect-video bg-black flex items-center justify-center">
        {videoTracks.length === 0 ? (
          <span className="text-white/70 text-sm">No video</span>
        ) : (
          videoTracks.map((track) => <TrackView key={track.sid} track={track} isLocal={isLocal} />)
        )}
      </div>
      {audioTracks.map((track) => (
        <TrackView key={track.sid} track={track} isLocal={isLocal} />
      ))}
    </div>
  );
};

export default function VideoCallModal({ appointment, open, onOpenChange, currentUserId, recipientUserId }) {
  const { user } = useUser();
  const generateToken = useMutation(api.twilio.generateAccessToken);

  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [callStatus, setCallStatus] = useState("idle");
  const [error, setError] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const roomName = useMemo(() => {
    if (appointment?._id) return `appt-${appointment._id}`;
    if (appointment?.id) return `appt-${appointment.id}`;
    if (recipientUserId && currentUserId) return `pair-${currentUserId}-${recipientUserId}`;
    return "safespace-call";
  }, [appointment?._id, appointment?.id, recipientUserId, currentUserId]);

  useEffect(() => {
    if (!open || !user?.id) return;

    let activeRoom = null;

    const joinRoom = async () => {
      try {
        setCallStatus("connecting");
        setError("");

        const token = await generateToken({ identity: user.id, room: roomName });

        activeRoom = await TwilioVideo.connect(token, {
          name: roomName,
          audio: true,
          video: { width: 640, height: 480 },
        });

        setRoom(activeRoom);
        setCallStatus("connected");
        setParticipants(Array.from(activeRoom.participants.values()));

        activeRoom.on("participantConnected", (participant) => {
          setParticipants((prev) => [...prev, participant]);
        });

        activeRoom.on("participantDisconnected", (participant) => {
          setParticipants((prev) => prev.filter((p) => p.sid !== participant.sid));
        });

        activeRoom.once("disconnected", () => {
          setParticipants([]);
          setRoom(null);
        });
      } catch (err) {
        console.error("Twilio join error", err);
        setError(err.message || "Failed to start video call. Please try again.");
        setCallStatus("error");
      }
    };

    joinRoom();

    return () => {
      if (activeRoom) {
        activeRoom.disconnect();
      }
      setParticipants([]);
      setRoom(null);
      setIsMuted(false);
      setIsVideoOff(false);
      setCallStatus("idle");
    };
  }, [open, user?.id, roomName, generateToken]);

  const handleToggleMute = () => {
    if (!room) return;
    room.localParticipant.audioTracks.forEach((pub) => {
      if (pub.track) {
        if (isMuted) pub.track.enable();
        else pub.track.disable();
      }
    });
    setIsMuted((prev) => !prev);
  };

  const handleToggleVideo = () => {
    if (!room) return;
    room.localParticipant.videoTracks.forEach((pub) => {
      if (pub.track) {
        if (isVideoOff) pub.track.enable();
        else pub.track.disable();
      }
    });
    setIsVideoOff((prev) => !prev);
  };

  const handleEndCall = () => {
    if (room) {
      room.disconnect();
    }
    setRoom(null);
    setCallStatus("idle");
    onOpenChange(false);
  };

  // Main Call UI
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col dark:bg-gray-900 dark:border-gray-800">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="dark:text-gray-100 text-lg font-semibold">
            Video Call with {appointment?.client_name || appointment?.client?.client_first_name || "Client"}
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400 text-sm">
            {callStatus === "connecting" && "Connecting to call..."}
            {callStatus === "connected" && "Call in progress - Use controls below to manage your audio/video"}
            {callStatus === "error" && "Call failed - See error message below"}
          </DialogDescription>
        </DialogHeader>

        {/* Error message display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-start gap-2 flex-shrink-0">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Video Display Area */}
        <div className="flex-1 relative bg-gray-900 dark:bg-gray-950 rounded-lg overflow-hidden min-h-0 p-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 h-full overflow-auto">
            {room?.localParticipant && (
              <ParticipantTile participant={room.localParticipant} isLocal />
            )}
            {participants.map((participant) => (
              <ParticipantTile key={participant.sid} participant={participant} isLocal={false} />
            ))}
          </div>

          {/* Connecting overlay */}
          {callStatus === "connecting" && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
              <div className="text-center text-white">
                <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4" />
                <p className="text-xl font-semibold">Connecting...</p>
                <p className="text-sm text-gray-300 mt-2">Please wait while we establish the connection</p>
              </div>
            </div>
          )}

          {/* Call status indicator */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
            {callStatus === "connecting" && (
              <>
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                Connecting...
              </>
            )}
            {callStatus === "connected" && (
              <>
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Connected
              </>
            )}
            {callStatus === "error" && (
              <>
                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                Failed
              </>
            )}
          </div>
        </div>

        {/* Call Controls */}
        <div className="flex justify-center gap-4 pt-6 pb-2 flex-shrink-0">
          {/* Mute Button */}
          <Button
            onClick={handleToggleMute}
            variant={isMuted ? "destructive" : "outline"}
            size="lg"
            className="rounded-full h-14 w-14 p-0 dark:border-gray-700"
            disabled={callStatus !== "connected"}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>

          {/* Video Toggle Button */}
          <Button
            onClick={handleToggleVideo}
            variant={isVideoOff ? "destructive" : "outline"}
            size="lg"
            className="rounded-full h-14 w-14 p-0 dark:border-gray-700"
            disabled={callStatus !== "connected"}
          >
            {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
          </Button>

          {/* End Call Button */}
          <Button
            onClick={handleEndCall}
            variant="destructive"
            size="lg"
            className="rounded-full h-14 w-14 p-0 bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
