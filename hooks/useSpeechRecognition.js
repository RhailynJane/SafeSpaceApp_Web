import { useEffect, useRef, useState } from 'react';

export function useSpeechRecognition() {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check browser support for Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.language = 'en-US';

      recognition.onstart = () => {
        console.log('🎙️ Speech recognition started');
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptSegment = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            final += transcriptSegment + ' ';
          } else {
            interim += transcriptSegment;
          }
        }

        if (final) {
          setTranscript((prev) => prev + final);
          console.log('📝 Final transcript:', final);
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = (event) => {
        console.error('❌ Speech recognition error:', event.error);
      };

      recognition.onend = () => {
        console.log('🎙️ Speech recognition ended');
        setIsListening(false);
      };

      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
      };
    } else {
      console.warn('Web Speech API not supported in this browser');
      setIsSupported(false);
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setInterimTranscript('');
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const resetTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  return {
    transcript: transcript + interimTranscript,
    finalTranscript: transcript,
    interimTranscript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}
