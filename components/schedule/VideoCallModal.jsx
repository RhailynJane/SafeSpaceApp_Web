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
import { Video, PhoneOff, Copy, Check, ExternalLink } from "lucide-react";

/**
 * VideoCallModal Component
 *
 * A modal component to handle video calls using Jitsi Meet (100% free, open-source).
 * Jitsi provides secure, high-quality video calls perfect for therapy/healthcare sessions.
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
  // State for Jitsi API instance
  const [jitsiApi, setJitsiApi] = useState(null);
  // State for call connection status: "idle", "loading", "ready", "joined", "ended"
  const [callStatus, setCallStatus] = useState("idle");
  // State for the meeting room name
  const [roomName, setRoomName] = useState("");
  // State for the meeting URL to share
  const [meetingUrl, setMeetingUrl] = useState("");
  // State to check if URL was copied
  const [copied, setCopied] = useState(false);

  // Ref for the container where Jitsi will embed the video
  const jitsiContainerRef = useRef(null);

  /**
   * Generate a unique room name for this appointment
   */
  useEffect(() => {
    if (open && appointment) {
      const appointmentId = appointment.id || appointment._id;
      const uniqueRoom = `safespace-${appointmentId}-${Date.now()}`;
      setRoomName(uniqueRoom);
      setMeetingUrl(`https://meet.jit.si/${uniqueRoom}`);
      setCallStatus("ready");
    }
  }, [open, appointment]);

  /**
   * Initialize Jitsi Meet when user clicks Join Call
   */
  const joinCall = () => {
    if (!roomName || callStatus === "joined") return;

    setCallStatus("loading");

    // Load Jitsi Meet API script dynamically
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => {
      initializeJitsi();
    };
    document.body.appendChild(script);
  };

  /**
   * Initialize Jitsi Meet API
   */
  const initializeJitsi = () => {
    if (!window.JitsiMeetExternalAPI || !jitsiContainerRef.current) return;

    const domain = 'meet.jit.si'; // Free Jitsi server
    const options = {
      roomName: roomName,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainerRef.current,
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        enableWelcomePage: false,
        prejoinPageEnabled: false, // Skip pre-join screen
        disableDeepLinking: true,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
          'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
          'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
          'tileview', 'download', 'help', 'mute-everyone',
        ],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
      },
      userInfo: {
        displayName: currentUserId || 'User',
      },
    };

    const api = new window.JitsiMeetExternalAPI(domain, options);

    // Event listeners
    api.addEventListener('videoConferenceJoined', () => {
      console.log('Joined Jitsi meeting');
      setCallStatus('joined');
    });

    api.addEventListener('videoConferenceLeft', () => {
      console.log('Left Jitsi meeting');
      handleEndCall();
    });

    api.addEventListener('readyToClose', () => {
      handleEndCall();
    });

    setJitsiApi(api);
  };

  /**
   * Handler to terminate the call and close the modal
   */
  const handleEndCall = () => {
    if (jitsiApi) {
      try {
        jitsiApi.dispose();
      } catch (e) {
        console.error("Error disposing Jitsi API:", e);
      }
    }
    
    // Reset all states
    setJitsiApi(null);
    setCallStatus("idle");
    setRoomName("");
    setMeetingUrl("");
    setCopied(false);
    onOpenChange(false);
  };

  /**
   * Copy meeting URL to clipboard
   */
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(meetingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Open meeting in new tab
   */
  const openInNewTab = () => {
    window.open(meetingUrl, '_blank');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (jitsiApi) {
        jitsiApi.dispose();
      }
    };
  }, [jitsiApi]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl dark:bg-gray-900 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">
            Video Call with {appointment?.client_name || appointment?.client?.client_first_name || "Client"}
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            {callStatus === "idle" && "Initializing video call..."}
            {callStatus === "ready" && "Ready to join - Share the link or click 'Join Call'"}
            {callStatus === "loading" && "Loading Jitsi Meet..."}
            {callStatus === "joined" && "Call in progress - Use controls to manage audio/video"}
            {callStatus === "ended" && "Call ended"}
          </DialogDescription>
        </DialogHeader>

        {/* Pre-join Screen */}
        {callStatus === "ready" && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <Video className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Secure Video Meeting
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Powered by Jitsi Meet - 100% free, open-source, and secure
                  </p>
                </div>
              </div>

              {/* Meeting URL */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Share this link with your client:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={meetingUrl}
                    readOnly
                    className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyUrl}
                    className="dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openInNewTab}
                    className="dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Your client can join by clicking this link in any browser - no account needed
                </p>
              </div>
            </div>

            {/* Join Button */}
            <div className="flex justify-center">
              <Button
                onClick={joinCall}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              >
                <Video className="h-5 w-5 mr-2" />
                Join Video Call
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {callStatus === "loading" && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading video call...</p>
            </div>
          </div>
        )}

        {/* Jitsi Meet Container */}
        <div 
          ref={jitsiContainerRef} 
          className={`w-full ${callStatus === "joined" ? "block" : "hidden"}`}
          style={{ height: '500px' }}
        />

        {/* Footer Buttons */}
        <div className="flex justify-end gap-2 pt-2">
          {callStatus === "joined" && (
            <Button
              onClick={handleEndCall}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              <PhoneOff className="h-4 w-4 mr-2" />
              End Call
            </Button>
          )}
          {(callStatus === "ready" || callStatus === "loading") && (
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="dark:border-gray-700"
            >
              Cancel
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
