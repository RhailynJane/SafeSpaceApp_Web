// 'use client' directive marks this component for client-side rendering in Next.js
"use client"

// Import necessary React hooks for managing state, side effects, and references
import { useState, useEffect, useRef } from "react";

// Import Dialog components from a UI library (likely Shadcn UI)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
// Import Button component
import { Button } from "@/components/ui/button";

// Import icons from lucide-react library
import { Video, Mic, MicOff, VideoOff, PhoneOff, Loader2, AlertCircle } from "lucide-react";

// Define a variable for the SendBirdCall SDK
let SendBirdCall = null;
// Dynamically import SendBirdCall only when 'window' (the browser environment) is available.
if (typeof window !== 'undefined') {
  SendBirdCall = require('sendbird-calls');
}

/**
 * VideoCallModal Component
 *
 * A modal component to handle video calls using Sendbird Calls SDK.
 * Sendbird provides reliable video calling for messaging apps.
 *
 * @param {Object} props - The component props.
 * @param {Object} props.appointment - Data about the appointment (e.g., client_name).
 * @param {boolean} props.open - State to control the visibility of the modal.
 * @param {function(boolean): void} props.onOpenChange - Callback to change the modal's open state.
 * @param {string} props.currentUserId - The ID of the currently logged-in user (the caller).
 * @param {string} props.recipientUserId - The ID of the user to call (the client/therapist).
 * @returns {JSX.Element} The Video Call Modal component.
 */
export default function VideoCallModal({ appointment, open, onOpenChange, currentUserId, recipientUserId }) {
  // State to hold the active call object returned by Sendbird
  const [call, setCall] = useState(null);
  // State for toggling microphone mute status
  const [isMuted, setIsMuted] = useState(false);
  // State for toggling local video status
  const [isVideoOff, setIsVideoOff] = useState(false);
  // State for call connection status: "idle", "connecting", "connected", "error"
  const [callStatus, setCallStatus] = useState("idle");
  // State to store and display error messages
  const [error, setError] = useState("");
  // State to check if the video call feature is correctly configured
  const [isEnabled, setIsEnabled] = useState(false);

  // useRef is used to directly reference DOM elements (video tags)
  const localVideoRef = useRef(null); // Reference for the current user's video feed
  const remoteVideoRef = useRef(null); // Reference for the other user's video feed
  const callRef = useRef(null); // A stable reference to the call object for cleanup functions

  /**
   * EFFECT: Configuration Check
   * Runs once on component mount to verify if the Sendbird Calls App ID is set.
   */
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_SENDBIRD_CALLS_APP_ID;
    if (!appId || appId === 'placeholder_disable_video_calls') {
      setIsEnabled(false);
      setError("Video calling requires a separate Sendbird Calls application. The current Sendbird App ID is for chat only, not for voice/video calls. Please create a Sendbird Calls application at https://dashboard.sendbird.com and add NEXT_PUBLIC_SENDBIRD_CALLS_APP_ID to your .env.local file.");
    } else {
      setIsEnabled(true);
    }
  }, []);

  /**
   * EFFECT: Call Initiation and Connection
   */
  useEffect(() => {
    if (!open || !appointment || !isEnabled || !SendBirdCall) return;

    const initSendbird = async () => {
      try {
        setCallStatus("connecting");
        setError("");

        const appId = process.env.NEXT_PUBLIC_SENDBIRD_CALLS_APP_ID;
        if (!appId) {
          throw new Error("Sendbird Calls App ID is not configured. Please create a Sendbird Calls application (different from Chat app) at https://dashboard.sendbird.com");
        }

        // Initialize SDK
        if (!SendBirdCall.isInitialized) {
          SendBirdCall.init(appId);
        }

        // Authenticate User
        const authOption = {
          userId: currentUserId || `user-${Date.now()}`,
          accessToken: null,
        };
        await SendBirdCall.authenticate(authOption);

        // Connect WebSocket
        await SendBirdCall.connectWebSocket();

        // Request Media Permissions
        await SendBirdCall.useMedia({
          audio: true,
          video: true,
        });

        // Dial the Call
        const dialParams = {
          userId: recipientUserId || "user-2",
          isVideoCall: true,
          callOption: {
            localMediaView: localVideoRef.current,
            remoteMediaView: remoteVideoRef.current,
            audioEnabled: true,
            videoEnabled: true,
          },
        };

        const newCall = await SendBirdCall.dial(dialParams);
        setCall(newCall);
        callRef.current = newCall;

        // Set up Call Listeners
        newCall.onEstablished = (call) => {
          setCallStatus("connected");
          console.log('Call established');
        };

        newCall.onEnded = (call) => {
          console.log('Call ended');
          handleEndCall();
        };

      } catch (err) {
        console.error("Error initializing Sendbird:", err);
        setError(err.message || "Failed to start video call. Please try again.");
        setCallStatus("error");
      }
    };

    initSendbird();

    // Cleanup
    return () => {
      if (callRef.current) {
        try {
          callRef.current.end();
        } catch (e) {
          console.error("Error ending call:", e);
        }
      }
      if (SendBirdCall?.isInitialized) {
        try {
          SendBirdCall.deauthenticate();
        } catch (e) {
          console.error("Error deauthenticating:", e);
        }
      }
    };
  }, [open, appointment, currentUserId, recipientUserId, isEnabled]);

  /**
   * Handler to toggle the microphone on/off
   */
  const handleToggleMute = () => {
    if (call) {
      try {
        if (isMuted) {
          call.unmuteMicrophone();
        } else {
          call.muteMicrophone();
        }
        setIsMuted(!isMuted);
      } catch (err) {
        console.error("Error toggling mute:", err);
      }
    }
  };

  /**
   * Handler to toggle the local video stream on/off
   */
  const handleToggleVideo = () => {
    if (call) {
      try {
        if (isVideoOff) {
          call.startVideo();
        } else {
          call.stopVideo();
        }
        setIsVideoOff(!isVideoOff);
      } catch (err) {
        console.error("Error toggling video:", err);
      }
    }
  };

  /**
   * Handler to terminate the call and close the modal
   */
  const handleEndCall = () => {
    if (callRef.current) {
      try {
        callRef.current.end();
      } catch (e) {
        console.error("Error ending call:", e);
      }
    }
    setCall(null);
    callRef.current = null;
    setCallStatus("idle");
    setIsMuted(false);
    setIsVideoOff(false);
    onOpenChange(false);
  };

  // Configuration Disabled State
  if (!isEnabled) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <AlertCircle className="h-5 w-5" />
              Video Consultation Coming Soon
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              This feature is still in development.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-lg">
            <p className="text-sm">Video consultations are still under development. We'll let you know once this feature is available. Thank you for your patience!</p>
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={() => onOpenChange(false)} variant="outline" className="dark:border-gray-700">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
        <div className="flex-1 relative bg-gray-900 dark:bg-gray-950 rounded-lg overflow-hidden min-h-0">
          {/* Remote video (other person) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover bg-gray-800"
          />

          {/* Local video (you) - Picture-in-picture style */}
          <div className="absolute bottom-4 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-white dark:border-gray-700 shadow-xl">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover bg-gray-700"
            />
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
