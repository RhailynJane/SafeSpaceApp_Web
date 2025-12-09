"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video as VideoIcon, Mic, MicOff, VideoOff, PhoneOff, Loader2, AlertCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import AgoraRTC from "agora-rtc-sdk-ng";
import { AgoraRTCProvider, useLocalCameraTrack, useLocalMicrophoneTrack, useJoin, usePublish, useRemoteUsers } from "agora-rtc-react";

const AgoraVideoCall = ({ channelName, onLeave, agoraToken, agoraAppId }) => {
  const { user } = useUser();
  
  const [activeConnection, setActiveConnection] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Agora hooks
  // enabled parameter: true = get the track, false = don't get the track
  // So: !isMuted means "enabled" (if not muted, enable microphone)
  // And: !isVideoOff means "enabled" (if video is not off, enable camera)
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(!isMuted);
  const { localCameraTrack } = useLocalCameraTrack(!isVideoOff);
  
  // Only publish tracks that are ready (not null/undefined) AND are valid ILocalTrack objects
  const tracksToPublish = useMemo(() => {
    const tracks = [];
    // Validate each track is a proper ILocalTrack object before adding
    if (localMicrophoneTrack && typeof localMicrophoneTrack.getTrackId === 'function') {
      tracks.push(localMicrophoneTrack);
    }
    if (localCameraTrack && typeof localCameraTrack.getTrackId === 'function') {
      tracks.push(localCameraTrack);
    }
    return tracks;
  }, [localMicrophoneTrack, localCameraTrack]);
  
  usePublish(tracksToPublish.length > 0 ? tracksToPublish : null);
  
  useJoin({
    appid: agoraAppId,
    channel: channelName,
    token: agoraToken,
    uid: 0, // Let Agora auto-assign UID
  }, activeConnection);

  const remoteUsers = useRemoteUsers();

  const handleToggleMute = () => {
    if (localMicrophoneTrack) {
      // If currently muted, enable it (setEnabled(true)). If not muted, disable it (setEnabled(false))
      const newState = !isMuted;
      localMicrophoneTrack.setEnabled(!newState);
      console.log('🎤 Mic toggled:', { before: isMuted, after: newState, enabled: !newState });
      setIsMuted(newState);
    }
  };

  const handleToggleVideo = () => {
    if (localCameraTrack) {
      // Toggle: if currently off, turn on (setEnabled(true)). If on, turn off (setEnabled(false))
      const newState = !isVideoOff;
      localCameraTrack.setEnabled(!newState); // setEnabled(true) to turn ON, setEnabled(false) to turn OFF
      console.log('📹 Video toggled:', { before: isVideoOff, after: newState, enabled: !newState });
      setIsVideoOff(newState);
    }
  };

  const handleEndCall = () => {
    setActiveConnection(false);
    localMicrophoneTrack?.close();
    localCameraTrack?.close();
    onLeave();
  };

  useEffect(() => {
    if (localCameraTrack) {
      console.log('📹 Playing local camera track:', { trackId: localCameraTrack.getTrackId?.(), enabled: localCameraTrack.enabled });
      try {
        localCameraTrack.play("local-video");
      } catch (err) {
        console.error('📹 Error playing camera track:', err);
      }
    }
  }, [localCameraTrack]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-auto">
        {/* Local Video */}
        <div className="relative bg-gray-950 rounded-lg overflow-hidden aspect-video shadow-lg">
          <div id="local-video" className="w-full h-full" />
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-950/95">
              <div className="text-center text-gray-400">
                <VideoOff className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Camera Off</p>
              </div>
            </div>
          )}
          <div className="absolute bottom-2 left-2 px-2 py-1 text-xs bg-black/70 text-white rounded">
            You {isMuted && "(Muted)"} {isVideoOff && "(No Video)"}
          </div>
        </div>

        {/* Remote Users */}
        {remoteUsers.length === 0 ? (
          <div className="bg-gray-900 rounded-lg flex items-center justify-center aspect-video">
            <div className="text-center text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p>Waiting for others to join...</p>
            </div>
          </div>
        ) : (
          remoteUsers.map((remoteUser) => (
            <RemoteVideoPlayer key={remoteUser.uid} user={remoteUser} />
          ))
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 border-t">
        <Button
          variant={isMuted ? "destructive" : "outline"}
          size="icon"
          onClick={handleToggleMute}
          className="rounded-full w-12 h-12"
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>

        <Button
          variant={isVideoOff ? "destructive" : "outline"}
          size="icon"
          onClick={handleToggleVideo}
          className="rounded-full w-12 h-12"
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
        </Button>

        <Button
          variant="destructive"
          size="icon"
          onClick={handleEndCall}
          className="rounded-full w-12 h-12"
        >
          <PhoneOff className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

const RemoteVideoPlayer = ({ user }) => {
  useEffect(() => {
    if (user.videoTrack) {
      user.videoTrack.play(`remote-${user.uid}`);
    }
    if (user.audioTrack) {
      user.audioTrack.play();
    }

    return () => {
      user.videoTrack?.stop();
      user.audioTrack?.stop();
    };
  }, [user]);

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
      <div id={`remote-${user.uid}`} className="w-full h-full" />
      <div className="absolute bottom-2 left-2 px-2 py-1 text-xs bg-black/70 text-white rounded">
        {user.uid}
      </div>
    </div>
  );
};

export default function VideoCallModal({ appointment, open, onOpenChange, currentUserId, recipientUserId }) {
  const { user } = useUser();
  const [callStatus, setCallStatus] = useState("idle");
  const [error, setError] = useState("");
  const [agoraClient, setAgoraClient] = useState(null);
  const [agoraToken, setAgoraToken] = useState(null);
  const [agoraAppId, setAgoraAppId] = useState(null);

  const roomName = useMemo(() => {
    if (appointment?._id) return `appt-${appointment._id}`;
    if (appointment?.id) return `appt-${appointment.id}`;
    if (recipientUserId && currentUserId) return `pair-${currentUserId}-${recipientUserId}`;
    return "safespace-call";
  }, [appointment?._id, appointment?.id, recipientUserId, currentUserId]);

  useEffect(() => {
    if (open && user?.id) {
      // Fetch Agora token
      const fetchToken = async () => {
        try {
          setCallStatus("connecting");
          console.log('📱 Fetching Agora token for room:', roomName);
          
          const response = await fetch("/api/agora/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              channelName: roomName,
              uid: 0, // Let Agora auto-assign
              role: "publisher",
            }),
          });

          console.log('📱 Token response status:', response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('📱 Token response error:', response.status, errorText);
            throw new Error(`Failed to get Agora token: ${response.status} ${errorText}`);
          }

          const data = await response.json();
          console.log('📱 Agora token received:', { token: data.token?.substring(0, 20) + '...', appId: data.appId });
          
          setAgoraToken(data.token);
          setAgoraAppId(data.appId);

          // Create Agora client
          const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
          setAgoraClient(client);
          setCallStatus("connected");
          setError("");
        } catch (err) {
          console.error("❌ Error fetching Agora token:", err.message, err);
          setError(`Failed to connect to video call: ${err.message}`);
          setCallStatus("idle");
        }
      };

      fetchToken();
    }

    return () => {
      if (agoraClient) {
        agoraClient.leave();
      }
    };
  }, [open, user?.id, roomName]);

  const handleLeave = () => {
    setCallStatus("idle");
    if (agoraClient) {
      agoraClient.leave();
    }
    setAgoraClient(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col dark:bg-gray-900 dark:border-gray-800" aria-describedby="video-call-description">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 dark:text-white">
            <VideoIcon className="w-5 h-5" />
            Video Call
          </DialogTitle>
          <DialogDescription id="video-call-description">
            Connect with {appointment?.participantName || "participant"} via video call
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {error ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Connection Error</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                <Button onClick={() => onOpenChange(false)}>Close</Button>
              </div>
            </div>
          ) : callStatus === "connecting" ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-gray-600 dark:text-gray-400">Connecting to video call...</p>
              </div>
            </div>
          ) : callStatus === "connected" && agoraClient && agoraToken && agoraAppId ? (
            <AgoraRTCProvider client={agoraClient}>
              <AgoraVideoCall 
                channelName={roomName} 
                onLeave={handleLeave}
                agoraToken={agoraToken}
                agoraAppId={agoraAppId}
              />
            </AgoraRTCProvider>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
