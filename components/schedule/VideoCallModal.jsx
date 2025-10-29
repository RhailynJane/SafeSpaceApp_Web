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
// This prevents errors during Next.js server-side rendering (SSR).
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  SendBirdCall = require('sendbird-calls');
}

/**
 * VideoCallModal Component
 *
 * A modal component to handle the initiation, ongoing state, and termination
 * of a video call using the SendBird Calls SDK.
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
  // State to hold the active call object returned by SendBird
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
   * Runs once on component mount to verify if the Sendbird App ID is set.
   */
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_SENDBIRD_APP_ID;
    if (!appId || appId === 'placeholder_disable_video_calls') {
      setIsEnabled(false);
      setError("Video call feature is not configured. Contact administrator to enable this feature.");
    } else {
      setIsEnabled(true);
    }
  }, []); // Empty dependency array means it runs only once

  /**
   * EFFECT: Call Initiation and Connection
   * Runs whenever the modal opens, the appointment data changes, or user IDs change.
   * Handles Sendbird initialization, authentication, dialing, and setting up listeners.
   */
  useEffect(() => {
    // Exit early if the modal is closed, data is missing, feature is disabled, or SDK is not loaded
    if (!open || !appointment || !isEnabled || !SendBirdCall) return;

    const initSendbird = async () => {
      try {
        setCallStatus("connecting"); // Show loading indicator
        setError(""); // Clear previous errors

        const appId = process.env.NEXT_PUBLIC_SENDBIRD_APP_ID;

        if (!appId) {
          throw new Error("Sendbird App ID is not configured");
        }

        // 1. Initialize SDK
        if (!SendBirdCall.isInitialized) {
          SendBirdCall.init(appId);
        }

        // 2. Authenticate User
        const authOption = {
          userId: currentUserId || `user-${Date.now()}`, // Fallback ID if currentUserId is missing
          accessToken: null, // Placeholder for access token if required by Sendbird security
        };

        await SendBirdCall.authenticate(authOption);

        // 3. Connect WebSocket (required for real-time signaling)
        await SendBirdCall.connectWebSocket();

        // 4. Set up Global Call Listeners (e.g., for receiving incoming calls - though this component only dials)
        SendBirdCall.addListener('call-listener', {
          onEstablished: (call) => {
            console.log('Call established');
            setCallStatus("connected");
          },
          onEnded: (call) => {
            console.log('Call ended');
            handleEndCall(); // Automatically end the call if the remote party hangs up
          },
          // ... other listeners ...
        });

        // 5. Request Media Permissions (Camera and Microphone access from the browser)
        await SendBirdCall.useMedia({
          audio: true,
          video: true,
        });

        // 6. Dial the Call
        const dialParams = {
          userId: recipientUserId || "user-2", // The ID of the person being called
          isVideoCall: true, // Specify a video call
          callOption: {
            localMediaView: localVideoRef.current, // Link the local video element to the SDK
            remoteMediaView: remoteVideoRef.current, // Link the remote video element to the SDK
            audioEnabled: true,
            videoEnabled: true,
          },
        };

        const newCall = await SendBirdCall.dial(dialParams);
        setCall(newCall);
        callRef.current = newCall; // Store call object in ref for cleanup

        // 7. Set up Call-Specific Listeners (redundant but good practice)
        newCall.onEstablished = (call) => {
          setCallStatus("connected");
          console.log('Call established');
        };

        newCall.onEnded = (call) => {
          console.log('Call ended');
          handleEndCall();
        };

        // ... other call listeners ...

      } catch (err) {
        // Handle errors during initialization, authentication, or dialing
        console.error("Error initializing Sendbird:", err);
        setError(err.message || "Failed to start video call. Please try again.");
        setCallStatus("error");
      }
    };

    initSendbird();

    // Cleanup function: Runs when the component unmounts or before the effect runs again
    return () => {
      // 1. End the active call if it exists
      if (callRef.current) {
        try {
          callRef.current.end();
        } catch (e) {
          console.error("Error ending call:", e);
        }
      }
      // 2. Clean up Sendbird listeners and session
      if (SendBirdCall?.isInitialized) {
        try {
          SendBirdCall.removeListener('call-listener');
          SendBirdCall.deauthenticate(); // Disconnect the user session
        } catch (e) {
          console.error("Error deauthenticating:", e);
        }
      }
    };
  }, [open, appointment, currentUserId, recipientUserId, isEnabled]); // Dependencies

  /**
   * Handler to toggle the microphone on/off.
   */
  const handleToggleMute = () => {
    if (call) {
      try {
        if (isMuted) {
          call.unmuteMicrophone();
        } else {
          call.muteMicrophone();
        }
        setIsMuted(!isMuted); // Toggle the local state
      } catch (err) {
        console.error("Error toggling mute:", err);
      }
    }
  };

  /**
   * Handler to toggle the local video stream on/off.
   */
  const handleToggleVideo = () => {
    if (call) {
      try {
        if (isVideoOff) {
          call.startVideo();
        } else {
          call.stopVideo();
        }
        setIsVideoOff(!isVideoOff); // Toggle the local state
      } catch (err) {
        console.error("Error toggling video:", err);
      }
    }
  };

  /**
   * Handler to terminate the call and close the modal.
   * Called manually by the user or by the call's 'onEnded' listener.
   */
  const handleEndCall = () => {
    // Attempt to end the call via the SDK
    if (callRef.current) {
      try {
        callRef.current.end();
      } catch (e) {
        console.error("Error ending call:", e);
      }
    }
    // Reset all local states and close the modal
    setCall(null);
    callRef.current = null;
    setCallStatus("idle");
    setIsMuted(false);
    setIsVideoOff(false);
    onOpenChange(false);
  };

  // RENDER: Configuration Disabled State
  // If the feature is not configured, display a simple error modal instead of the call UI.
  if (!isEnabled) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Video Call Unavailable
            </DialogTitle>
            <DialogDescription>
              The video call feature is currently not configured.
            </DialogDescription>
          </DialogHeader>
          {/* Note: Alert component is missing import, assuming it exists */}
          {/* <Alert variant="destructive">
             <AlertCircle className="h-4 w-4" />
             <AlertDescription>
               {error || "Video calling is not enabled. Please contact your system administrator."}
             </AlertDescription>
           </Alert> */}
          <div className="flex justify-end pt-4">
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // RENDER: Main Call UI
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Video Call with {appointment?.client_name || "Client"}</DialogTitle>
          <DialogDescription>
            {/* Conditional status messages */}
            {callStatus === "connecting" && "Connecting to call..."}
            {callStatus === "connected" && "Call in progress"}
            {callStatus === "error" && "Call failed"}
          </DialogDescription>
        </DialogHeader>

        {/* Error message display (Assuming Alert component exists) */}
        {/* {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )} */}

        {/* Video Display Area */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
          {/* Remote video (other person) */}
          <video
            ref={remoteVideoRef} // Link the video element to the remoteVideoRef
            autoPlay // Start playing immediately
            playsInline // Important for mobile devices
            className="w-full h-full object-cover bg-gray-800"
          />

          {/* Local video (you) - Picture-in-picture style */}
          <div className="absolute bottom-4 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-white shadow-lg">
            <video
              ref={localVideoRef} // Link the video element to the localVideoRef
              autoPlay
              playsInline
              muted // Mute local video to prevent echo for the user
              className="w-full h-full object-cover bg-gray-700"
            />
          </div>

          {/* Connecting overlay - shows a spinner while establishing connection */}
          {callStatus === "connecting" && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center text-white">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
                <p className="text-lg font-medium">Connecting...</p>
              </div>
            </div>
          )}

          {/* Call status indicator corner badge */}
          <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-2 rounded-full text-sm font-medium">
            {callStatus === "connecting" && "Connecting..."}
            {callStatus === "connected" && "Connected"}
            {callStatus === "error" && "Failed"}
          </div>
        </div>

        {/* Call Controls (Buttons) */}
        <div className="flex justify-center gap-4 pt-4">
          {/* Mute Button */}
          <Button
            onClick={handleToggleMute}
            variant={isMuted ? "destructive" : "outline"} // Change color based on state
            size="lg"
            className="rounded-full h-14 w-14 p-0"
            disabled={callStatus !== "connected"} // Only active when call is fully connected
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>

          {/* Video Toggle Button */}
          <Button
            onClick={handleToggleVideo}
            variant={isVideoOff ? "destructive" : "outline"} // Change color based on state
            size="lg"
            className="rounded-full h-14 w-14 p-0"
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
