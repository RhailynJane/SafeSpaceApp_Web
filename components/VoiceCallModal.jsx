"use client";

// Placeholder for VoiceCallModal component
export default function VoiceCallModal({ user, supervisor, onCallEnd }) {
    // Implement your voice call modal UI and logic here
    return null;
}"use client";

import { useEffect, useState } from "react";
import SendBirdCall from "sendbird-calls";

export default function VoiceCallModal({ user, supervisor, onCallEnd }) {
  const [call, setCall] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initSendBird = async () => {
      try {
        const appId = process.env.NEXT_PUBLIC_SENDBIRD_APP_ID;
        if (!appId || appId === "placeholder_for_sendbird_app_id") {
          console.error(
            "Sendbird App ID is not configured. Please set NEXT_PUBLIC_SENDBIRD_APP_ID in your .env.local"
          );
          return;
        }

        if (!user?.id) {
          console.error("User object missing. Cannot initialize Sendbird Calls.");
          return;
        }

        // Initialize Sendbird Calls
        SendBirdCall.init(appId);

        // Authenticate user (omit accessToken if not using token auth)
        await SendBirdCall.authenticate({ userId: user.id });

        // Connect WebSocket
        await SendBirdCall.connectWebSocket();

        console.log("✅ Sendbird Calls initialized for user:", user.id);
        setInitialized(true);
      } catch (err) {
        console.error("Error initializing Sendbird Calls:", err);
      }
    };

    initSendBird();
  }, [user]);

  const startCall = async () => {
    if (!initialized || !supervisor?.id) return;

    try {
      const outgoingCall = await SendBirdCall.dial(supervisor.id, {
        isVideoCall: false, // set to true if you want video
      });

      setCall(outgoingCall);

      outgoingCall.onEnded = () => {
        console.log("Call ended");
        setCall(null);
        onCallEnd?.();
      };

      console.log("📞 Call started with supervisor:", supervisor.id);
    } catch (err) {
      console.error("Error starting call:", err);
    }
  };

  const endCall = () => {
    if (call) {
      call.end();
      setCall(null);
      onCallEnd?.();
    }
  };

  return (
    <div>
      <button
        onClick={startCall}
        disabled={!initialized || !supervisor?.id || call}
        className="btn btn-primary"
      >
        {call ? "Call in progress..." : "Start Voice Call"}
      </button>

      {call && (
        <button onClick={endCall} className="btn btn-danger ml-2">
          End Call
        </button>
      )}
    </div>
  );
}
