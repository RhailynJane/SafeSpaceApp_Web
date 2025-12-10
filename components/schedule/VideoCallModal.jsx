"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video as VideoIcon, Mic, MicOff, VideoOff, PhoneOff, Loader2, AlertCircle, Radio, Brain, Phone } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import AgoraRTC from "agora-rtc-sdk-ng";
import { AgoraRTCProvider, useLocalCameraTrack, useLocalMicrophoneTrack, useJoin, usePublish, useRemoteUsers } from "agora-rtc-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { summarizeConversation } from "@/lib/summarizeConversation";
import { ConversationSummaryModal } from "./ConversationSummaryModal";

const AgoraVideoCall = ({ channelName, onLeave, agoraToken, agoraAppId, onTranscriptUpdate, onShowSummary }) => {
  const { user } = useUser();
  
  const [activeConnection, setActiveConnection] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Speech recognition hook
  const { 
    finalTranscript,
    interimTranscript,
    isListening, 
    isSupported: isSpeechSupported,
    isMicrophoneAccessGranted,
    startListening, 
    stopListening,
    error: speechError
  } = useSpeechRecognition();

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

  const handleToggleRecording = () => {
    if (!isSpeechSupported) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    if (isRecording) {
      console.log('⏹️ Stopping recording');
      stopListening();
      setIsRecording(false);
      
      // After a short delay to ensure finalTranscript is updated
      setTimeout(() => {
        if (finalTranscript && finalTranscript.trim()) {
          console.log('📝 Showing transcript view. Transcript length:', finalTranscript.length);
          if (onShowSummary) onShowSummary(true);
        }
      }, 100);
    } else {
      console.log('🔴 Starting recording');
      startListening();
      setIsRecording(true);
    }
  };

  const handleEndCall = () => {
    setActiveConnection(false);
    if (isRecording) {
      stopListening();
    }
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

  // Update parent with transcript when recording
  useEffect(() => {
    if (onTranscriptUpdate && finalTranscript) {
      onTranscriptUpdate(finalTranscript);
    }
  }, [finalTranscript, onTranscriptUpdate]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-auto relative">
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

        {/* Live Transcription Overlay */}
        {isRecording && (finalTranscript || interimTranscript) && (
          <div className="absolute bottom-4 left-4 right-4 max-w-3xl mx-auto bg-black/80 backdrop-blur-sm rounded-lg p-4 shadow-xl border border-white/10">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mt-1" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm leading-relaxed">
                  {finalTranscript && <span className="text-white">{finalTranscript}</span>}
                  {interimTranscript && (
                    <span className="text-gray-400 italic ml-1">{interimTranscript}</span>
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {Math.round((finalTranscript?.length || 0) / 5)} words recorded
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 border-t flex-wrap">
        <Button
          variant={isMuted ? "destructive" : "outline"}
          size="icon"
          onClick={handleToggleMute}
          className="rounded-full w-12 h-12"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>

        <Button
          variant={isVideoOff ? "destructive" : "outline"}
          size="icon"
          onClick={handleToggleVideo}
          className="rounded-full w-12 h-12"
          title={isVideoOff ? "Turn on camera" : "Turn off camera"}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
        </Button>

        {isSpeechSupported && isMicrophoneAccessGranted && (
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            onClick={handleToggleRecording}
            className="rounded-full w-12 h-12 relative"
            title={isRecording ? "Stop recording" : "Start recording conversation"}
          >
            <Radio className="w-5 h-5" />
            {isRecording && (
              <span className="absolute inset-0 rounded-full border-2 border-red-500 animate-pulse" />
            )}
          </Button>
        )}

        {isSpeechSupported && !isMicrophoneAccessGranted && (
          <Button
            variant="outline"
            size="icon"
            disabled
            className="rounded-full w-12 h-12 opacity-50 cursor-not-allowed"
            title="Microphone access denied. Allow in browser settings."
          >
            <Radio className="w-5 h-5" />
          </Button>
        )}

        {!isSpeechSupported && (
          <Button
            variant="outline"
            size="icon"
            disabled
            className="rounded-full w-12 h-12 opacity-50 cursor-not-allowed"
            title="Speech recognition not supported in your browser"
          >
            <Radio className="w-5 h-5" />
          </Button>
        )}

        <Button
          variant="destructive"
          size="icon"
          onClick={handleEndCall}
          className="rounded-full w-12 h-12"
          title="End call"
        >
          <PhoneOff className="w-5 h-5" />
        </Button>
      </div>

      {/* Recording Status */}
      {isRecording && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <p className="text-sm text-red-700 dark:text-red-300">
              <strong>Recording...</strong> {isListening && "🎤 Listening"} {finalTranscript && `${Math.round(finalTranscript.length / 5)} words`}
            </p>
          </div>
          {speechError && (
            <p className="text-xs text-red-600 dark:text-red-400 ml-4">⚠️ {speechError}</p>
          )}
          {!isListening && !speechError && finalTranscript && (
            <p className="text-xs text-red-600 dark:text-red-400 ml-4">✓ Transcript captured</p>
          )}
        </div>
      )}

      {/* Speech Error Display (when not recording) */}
      {!isRecording && isSpeechSupported && speechError && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            ⚠️ Audio Issue: {speechError}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            • Check microphone is connected and enabled
            • Ensure you've granted microphone permission to this browser
            • Try a different browser (Chrome, Safari, or Edge)
          </p>
        </div>
      )}
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
  const [showSummary, setShowSummary] = useState(false);
  const [conversationSummary, setConversationSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [recordedTranscript, setRecordedTranscript] = useState(null);

  const roomName = useMemo(() => {
    if (appointment?._id) return `appt-${appointment._id}`;
    if (appointment?.id) return `appt-${appointment.id}`;
    if (recipientUserId && currentUserId) return `pair-${currentUserId}-${recipientUserId}`;
    return "safespace-call";
  }, [appointment?._id, appointment?.id, recipientUserId, currentUserId]);

  // Automatically show summary panel when transcript is available
  useEffect(() => {
    if (recordedTranscript && recordedTranscript.trim()) {
      console.log('📝 Transcript available, showing summary panel');
      setShowSummary(true);
    }
  }, [recordedTranscript]);

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
    
    // If there's a transcript, save it and show summary option
    // This will be passed from AgoraVideoCall component
    setShowSummary(!!recordedTranscript);
  };

  const handleGenerateSummary = async () => {
    if (!recordedTranscript) return;
    
    setSummaryLoading(true);
    try {
      const summary = await summarizeConversation(recordedTranscript);
      setConversationSummary(summary);
    } catch (error) {
      console.error('Error generating summary:', error);
      setError(`Failed to generate summary: ${error.message}`);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleCloseSummary = () => {
    setShowSummary(false);
    setConversationSummary(null);
    setRecordedTranscript(null);
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

        <div className="flex-1 min-h-0 flex gap-4">
          {/* Main video area */}
          <div className="flex-1 min-w-0">
            {callStatus === "idle" ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Phone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Call ended</p>
                </div>
              </div>
            ) : error ? (
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
                  onTranscriptUpdate={setRecordedTranscript}
                  onShowSummary={setShowSummary}
                />
              </AgoraRTCProvider>
            ) : null}
          </div>

          {/* Summary/Transcript panel on the side */}
          {showSummary && (recordedTranscript || conversationSummary) && (
            <div className="w-80 flex flex-col bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700 overflow-hidden">
              {conversationSummary ? (
                <>
                  {/* Assessment Results */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-500" />
                      Assessment
                    </h3>

                    {conversationSummary.assessment && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Summary</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{conversationSummary.assessment}</p>
                      </div>
                    )}

                    {conversationSummary.emotionalState && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Emotional State</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{conversationSummary.emotionalState}</p>
                      </div>
                    )}

                    {conversationSummary.supportiveMessage && (
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-900 dark:text-blue-100 italic">{conversationSummary.supportiveMessage}</p>
                      </div>
                    )}

                    {conversationSummary.keyInsights && conversationSummary.keyInsights.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Key Insights</p>
                        <ul className="space-y-1">
                          {conversationSummary.keyInsights.map((insight, i) => (
                            <li key={i} className="text-xs text-gray-700 dark:text-gray-300 flex gap-2">
                              <span className="text-blue-500 flex-shrink-0">•</span>
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {conversationSummary.coping_strategies && conversationSummary.coping_strategies.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Coping Strategies</p>
                        <ul className="space-y-1">
                          {conversationSummary.coping_strategies.map((strategy, i) => (
                            <li key={i} className="text-xs text-gray-700 dark:text-gray-300 flex gap-2">
                              <span className="text-green-500 flex-shrink-0">✓</span>
                              <span>{strategy}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Close button */}
                  <div className="p-4 border-t dark:border-gray-700">
                    <Button 
                      onClick={() => handleCloseSummary()}
                      className="w-full"
                      variant="outline"
                    >
                      Close Assessment
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Transcript view */}
                  <div className="flex-1 overflow-y-auto p-4 border-b dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                      <Radio className="w-4 h-4 text-blue-500 animate-pulse" />
                      Transcript
                    </h3>
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {recordedTranscript}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-4 border-t dark:border-gray-700 flex gap-2 flex-col">
                    {summaryLoading ? (
                      <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs">Analyzing...</span>
                      </div>
                    ) : (
                      <>
                        <Button 
                          onClick={handleGenerateSummary}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm py-2"
                        >
                          <Brain className="w-4 h-4 mr-2" />
                          Analyze
                        </Button>
                        <Button 
                          onClick={() => handleCloseSummary()} 
                          variant="outline"
                          className="w-full text-sm py-2"
                        >
                          Skip
                        </Button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <ConversationSummaryModal 
          open={!!conversationSummary}
          onOpenChange={handleCloseSummary}
          summary={conversationSummary}
          transcript={recordedTranscript}
        />
      </DialogContent>
    </Dialog>
  );
}
