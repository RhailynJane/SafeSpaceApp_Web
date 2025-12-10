import { useEffect, useRef, useState, useCallback } from 'react';

export function useSpeechRecognition() {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState('');
  const [isMicrophoneAccessGranted, setIsMicrophoneAccessGranted] = useState(null);

  // Check microphone access on mount
  useEffect(() => {
    const checkMicrophoneAccess = async () => {
      try {
        // Try to get microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('✅ Microphone access GRANTED');
        setIsMicrophoneAccessGranted(true);
        // Stop the stream immediately - we just wanted to check permission
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.error('❌ Microphone access DENIED:', err.name, err.message);
        setIsMicrophoneAccessGranted(false);
        
        if (err.name === 'NotAllowedError') {
          setError('Microphone permission denied. Allow access in browser settings.');
        } else if (err.name === 'NotFoundError') {
          setError('No microphone found on this device.');
        } else if (err.name === 'NotReadableError') {
          setError('Microphone is already in use by another app.');
        } else {
          setError(`Microphone access error: ${err.message}`);
        }
      }
    };

    checkMicrophoneAccess();
  }, []);

  useEffect(() => {
    // Check browser support for Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('❌ Web Speech API not supported in this browser');
      setIsSupported(false);
      return;
    }

    try {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.language = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('🎙️ Speech recognition started');
        setIsListening(true);
        setError('');
      };

      recognition.onresult = (event) => {
        console.log('📊 Speech recognition onresult event:', {
          resultIndex: event.resultIndex,
          resultsLength: event.results.length,
          isFinal: event.results[event.results.length - 1]?.isFinal
        });

        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptSegment = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;
          
          console.log(`📝 Segment ${i}:`, {
            text: transcriptSegment,
            confidence: confidence,
            isFinal: event.results[i].isFinal
          });

          if (event.results[i].isFinal) {
            final += transcriptSegment + ' ';
          } else {
            interim += transcriptSegment;
          }
        }

        if (final) {
          setTranscript((prev) => {
            const updated = prev + final;
            console.log('✅ Transcript updated:', updated);
            return updated;
          });
        }
        if (interim) {
          setInterimTranscript(interim);
          console.log('🔤 Interim text:', interim);
        }
      };

      recognition.onerror = (event) => {
        console.error('❌ Speech recognition error:', {
          error: event.error,
          errorCode: event.error.code || 'unknown'
        });
        setError(`Error: ${event.error}`);
        
        // Common error handling
        if (event.error === 'network') {
          setError('Network error. Check your connection.');
        } else if (event.error === 'no-speech') {
          setError('No speech detected. Speak louder or closer to the microphone.');
        } else if (event.error === 'audio-capture') {
          setError('Microphone not found or not accessible. Check your audio device.');
        } else if (event.error === 'not-allowed') {
          setError('Microphone permission denied. Allow access in browser settings.');
        } else if (event.error === 'service-not-allowed') {
          setError('Speech recognition service not allowed.');
        }
      };

      recognition.onend = () => {
        console.log('🎙️ Speech recognition ended');
        setIsListening(false);
      };

      recognition.onsoundstart = () => {
        console.log('🔊 Sound detected by microphone');
      };

      recognition.onsoundend = () => {
        console.log('🔇 No more sound detected');
      };

      return () => {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch (err) {
            console.error('Error aborting recognition:', err);
          }
        }
      };
    } catch (err) {
      console.error('❌ Error initializing speech recognition:', err);
      setError('Failed to initialize speech recognition');
      setIsSupported(false);
    }
  }, []);

  const startListening = useCallback(() => {
    if (!isMicrophoneAccessGranted) {
      console.error('Microphone access not granted');
      setError('Microphone access denied. Please check browser settings.');
      return;
    }

    if (!recognitionRef.current) {
      console.error('Speech recognition not initialized');
      setError('Speech recognition not available');
      return;
    }

    if (isListening) {
      console.warn('Already listening');
      return;
    }

    try {
      console.log('🎤 Starting speech recognition...');
      setTranscript('');
      setInterimTranscript('');
      setError('');
      recognitionRef.current.start();
    } catch (err) {
      console.error('Error starting recognition:', err);
      setError(err.message || 'Failed to start recording');
    }
  }, [isListening, isMicrophoneAccessGranted]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) {
      console.error('Speech recognition not initialized');
      return;
    }

    if (!isListening) {
      console.warn('Not currently listening');
      return;
    }

    try {
      console.log('⏹️ Stopping speech recognition...');
      recognitionRef.current.stop();
    } catch (err) {
      console.error('Error stopping recognition:', err);
      setError(err.message || 'Failed to stop recording');
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError('');
    console.log('🔄 Transcript reset');
  }, []);

  return {
    transcript: transcript + interimTranscript,
    finalTranscript: transcript,
    interimTranscript,
    isListening,
    isSupported,
    error,
    isMicrophoneAccessGranted,
    startListening,
    stopListening,
    resetTranscript,
  };
}
