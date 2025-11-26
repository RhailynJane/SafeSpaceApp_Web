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
    if (!window.JitsiMeetExternalAPI || !jitsiContainerRef.current) {
      console.error('Jitsi API not available or container not ready');
      return;
    }

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
          'fodeviceselection', 'hangup', 'chat', 'raisehand',
          'videoquality', 'filmstrip', 'tileview', 'settings',
        ],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        DEFAULT_BACKGROUND: '#1a1a1a',
        DISABLE_VIDEO_BACKGROUND: false,
        FILM_STRIP_MAX_HEIGHT: 120,
      },
      userInfo: {
        displayName: currentUserId || 'Therapist',
      },
    };

    try {
      const api = new window.JitsiMeetExternalAPI(domain, options);

      // Event listeners
      api.addEventListener('videoConferenceJoined', () => {
        console.log('✅ Joined Jitsi meeting successfully');
        setCallStatus('joined');
      });

      api.addEventListener('videoConferenceLeft', () => {
        console.log('Left Jitsi meeting');
        handleEndCall();
      });

      api.addEventListener('readyToClose', () => {
        console.log('Ready to close');
        handleEndCall();
      });

      api.addEventListener('participantJoined', (participant) => {
        console.log('Participant joined:', participant.displayName);
      });

      setJitsiApi(api);
    } catch (error) {
      console.error('Error initializing Jitsi:', error);
      setCallStatus('ready');
    }
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
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col dark:bg-gray-900 dark:border-gray-800">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="dark:text-gray-100 text-lg font-semibold">
            Video Call with {appointment?.client_name || appointment?.client?.client_first_name || "Client"}
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400 text-sm">
            {callStatus === "idle" && "Initializing video call..."}
            {callStatus === "ready" && "Share the meeting link with your client or join the call"}
            {callStatus === "loading" && "Loading Jitsi Meet..."}
            {callStatus === "joined" && "Connected - Use the controls in the video window"}
            {callStatus === "ended" && "Call ended"}
          </DialogDescription>
        </DialogHeader>

        {/* Pre-join Screen */}
        {callStatus === "ready" && (
          <div className="flex-1 flex flex-col gap-4 overflow-auto py-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-blue-100 dark:border-gray-700">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-blue-600 rounded-lg">
                  <Video className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-1">
                    Secure Video Meeting
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Powered by Jitsi Meet - Free, open-source, and secure video conferencing
                  </p>
                </div>
              </div>

              {/* Meeting URL */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                  📋 Share this meeting link with your client:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={meetingUrl}
                    readOnly
                    onClick={(e) => e.target.select()}
                    className="flex-1 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Button
                    size="sm"
                    onClick={handleCopyUrl}
                    className={`${
                      copied 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white px-4 py-3`}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openInNewTab}
                    className="dark:border-gray-600 dark:hover:bg-gray-800 px-4 py-3"
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  No account needed - Your client can join directly from any browser
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-3 pt-2">
              <Button
                onClick={joinCall}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Video className="h-5 w-5 mr-2" />
                Join Video Call
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                size="lg"
                className="dark:border-gray-600 dark:hover:bg-gray-800 px-6"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {callStatus === "loading" && (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-950 rounded-lg">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Loading video call...</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">This may take a few seconds</p>
            </div>
          </div>
        )}

        {/* Jitsi Meet Container */}
        {callStatus === "joined" && (
          <div className="flex-1 flex flex-col min-h-0">
            <div 
              ref={jitsiContainerRef} 
              className="flex-1 rounded-lg overflow-hidden bg-gray-900"
            />
            <div className="flex justify-center gap-3 pt-4 flex-shrink-0">
              <Button
                onClick={handleEndCall}
                variant="destructive"
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white px-8"
              >
                <PhoneOff className="h-5 w-5 mr-2" />
                End Call & Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
