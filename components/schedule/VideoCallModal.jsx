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
import { Video, Mic, MicOff, VideoOff, PhoneOff, Loader2, AlertCircle, Copy, Check } from "lucide-react";

/**
 * VideoCallModal Component
 *
 * A modal component to handle video calls using Daily.co (HIPAA-compliant video platform).
 * Daily.co provides secure, high-quality video calls perfect for therapy/healthcare sessions.
 *
 * @param {Object} props - The component props.
 * @param {Object} props.appointment - Data about the appointment (e.g., client_name).
 * @param {boolean} props.open - State to control the visibility of the modal.
 * @param {function(boolean): void} props.onOpenChange - Callback to change the modal's open state.
 * @param {string} props.currentUserId - The ID of the currently logged-in user.
 * @param {string} props.recipientUserId - The ID of the user to call.
 * @returns {JSX.Element} The Video Call Modal component.
 */
export default function VideoCallModal({ appointment, open, onOpenChange, currentUserId, recipientUserId }) {
  // State for Daily call frame instance
  const [callFrame, setCallFrame] = useState(null);
  // State for toggling microphone mute status
  const [isMuted, setIsMuted] = useState(false);
  // State for toggling local video status
  const [isVideoOff, setIsVideoOff] = useState(false);
  // State for call connection status: "idle", "creating", "ready", "joining", "joined", "error"
  const [callStatus, setCallStatus] = useState("idle");
  // State to store and display error messages
  const [error, setError] = useState("");
  // State for the Daily room URL
  const [roomUrl, setRoomUrl] = useState("");
  // State to check if copied
  const [copied, setCopied] = useState(false);

  // Ref for the container where Daily will embed the video
  const callContainerRef = useRef(null);

  /**
   * EFFECT: Create Daily Room and Initialize Call
   * Runs when the modal opens
   */
  useEffect(() => {
    if (!open || !appointment) return;

    const initializeCall = async () => {
      try {
        setCallStatus("creating");
        setError("");

        // Create a Daily room via your backend API
        const response = await fetch('/api/daily/create-room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointmentId: appointment.id || appointment._id,
            participants: [currentUserId, recipientUserId],
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create video room');
        }

        const { roomUrl } = await response.json();
        setRoomUrl(roomUrl);
        setCallStatus("ready");

      } catch (err) {
        console.error("Error creating room:", err);
        setError(err.message || "Failed to create video call. Please try again.");
        setCallStatus("error");
      }
    };

    initializeCall();
  }, [open, appointment, currentUserId, recipientUserId]);

  /**
   * Join the Daily call
   */
  const joinCall = async () => {
    if (!roomUrl) return;

    try {
      setCallStatus("joining");

      // Dynamically import Daily only in browser
      const DailyIframe = (await import('@daily-co/daily-js')).default;

      // Create Daily call frame
      const frame = DailyIframe.createFrame(callContainerRef.current, {
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: '0',
          borderRadius: '8px',
        },
        showLeaveButton: false,
        showFullscreenButton: true,
      });

      // Set up event listeners
      frame.on('joined-meeting', () => {
        setCallStatus("joined");
        console.log('Joined meeting');
      });

      frame.on('left-meeting', () => {
        handleEndCall();
      });

      frame.on('error', (error) => {
        console.error('Daily error:', error);
        if (error?.errorMsg === 'account-missing-payment-method') {
          setError('Daily.co account requires payment method. Please add payment info at https://dashboard.daily.co/billing');
        } else {
          setError(error?.errorMsg || 'An error occurred during the call');
        }
        setCallStatus('error');
      });

      // Join the room
      await frame.join({ 
        url: roomUrl,
        userName: currentUserId || 'User',
      });

      setCallFrame(frame);

    } catch (err) {
      console.error("Error joining call:", err);
      if (err?.errorMsg === 'account-missing-payment-method') {
        setError('Daily.co account requires payment method. Please add payment info at https://dashboard.daily.co/billing');
      } else {
        setError(err?.errorMsg || err?.message || "Failed to join video call. Please try again.");
      }
      setCallStatus("error");
    }
  };

  /**
   * Handler to toggle the microphone on/off
   */
  const handleToggleMute = async () => {
    if (callFrame) {
      try {
        await callFrame.setLocalAudio(!isMuted);
        setIsMuted(!isMuted);
      } catch (err) {
        console.error("Error toggling mute:", err);
      }
    }
  };

  /**
   * Handler to toggle the local video stream on/off
   */
  const handleToggleVideo = async () => {
    if (callFrame) {
      try {
        await callFrame.setLocalVideo(!isVideoOff);
        setIsVideoOff(!isVideoOff);
      } catch (err) {
        console.error("Error toggling video:", err);
      }
    }
  };

  /**
   * Handler to terminate the call and close the modal
   */
  const handleEndCall = async () => {
    if (callFrame) {
      try {
        await callFrame.leave();
        await callFrame.destroy();
      } catch (e) {
        console.error("Error ending call:", e);
      }
    }
    
    // Reset all states
    setCallFrame(null);
    setCallStatus("idle");
    setIsMuted(false);
    setIsVideoOff(false);
    setRoomUrl("");
    onOpenChange(false);
  };

  /**
   * Copy room URL to clipboard
   */
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callFrame) {
        callFrame.destroy();
      }
    };
  }, [callFrame]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl dark:bg-gray-900 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">
            Video Call with {appointment?.client_name || appointment?.client?.client_first_name || "Client"}
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            {callStatus === "idle" && "Initializing video call..."}
            {callStatus === "creating" && "Creating secure video room..."}
            {callStatus === "ready" && "Room ready - Click 'Join Call' to start"}
            {callStatus === "joining" && "Joining call..."}
            {callStatus === "joined" && "Call in progress"}
            {callStatus === "error" && "Call failed - Check error message below"}
          </DialogDescription>
        </DialogHeader>

        {/* Error message display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Video Container or Pre-join Screen */}
        <div className="relative bg-gray-900 dark:bg-gray-950 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', minHeight: '400px' }}>
          {callStatus === "ready" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
              <Video className="h-16 w-16 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Ready to Join</h3>
              <p className="text-gray-300 mb-6 text-center">
                Your secure video room is ready. Share the link below with your client or click Join Call to start.
              </p>
              
              {/* Room URL Display */}
              <div className="w-full max-w-md mb-4">
                <div className="flex items-center gap-2 bg-gray-800 dark:bg-gray-900 rounded-lg p-3">
                  <input
                    type="text"
                    value={roomUrl}
                    readOnly
                    className="flex-1 bg-transparent text-white text-sm outline-none"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyUrl}
                    className="dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Share this link with your client to join the call
                </p>
              </div>

              <Button
                onClick={joinCall}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              >
                <Video className="h-5 w-5 mr-2" />
                Join Call
              </Button>
            </div>
          )}

          {(callStatus === "creating" || callStatus === "joining") && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
                <p className="text-lg font-medium">
                  {callStatus === "creating" ? "Creating room..." : "Joining call..."}
                </p>
              </div>
            </div>
          )}

          {/* Daily.co iframe container */}
          <div ref={callContainerRef} className={`w-full h-full ${callStatus === "joined" ? "block" : "hidden"}`} />

          {/* Call status indicator */}
          {callStatus === "joined" && (
            <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-2 rounded-full text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              Connected
            </div>
          )}
        </div>

        {/* Call Controls */}
        {callStatus === "joined" && (
          <div className="flex justify-center gap-4 pt-4">
            {/* Mute Button */}
            <Button
              onClick={handleToggleMute}
              variant={isMuted ? "destructive" : "outline"}
              size="lg"
              className="rounded-full h-14 w-14 p-0 dark:border-gray-700"
            >
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>

            {/* Video Toggle Button */}
            <Button
              onClick={handleToggleVideo}
              variant={isVideoOff ? "destructive" : "outline"}
              size="lg"
              className="rounded-full h-14 w-14 p-0 dark:border-gray-700"
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
        )}

        {/* Close button for pre-join or error states */}
        {(callStatus === "ready" || callStatus === "error") && callStatus !== "joined" && (
          <div className="flex justify-end pt-2">
            <Button onClick={() => onOpenChange(false)} variant="outline" className="dark:border-gray-700">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
