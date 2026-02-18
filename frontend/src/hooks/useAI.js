import { useState, useEffect, useRef, useCallback } from 'react';

export const useAI = (isActive) => {
  const [emotion, setEmotion] = useState('Neutral'); // Neutral, Happy, Sad, Surprised, Thinking
  const [attentionScore, setAttentionScore] = useState(100);
  const [isFocused, setIsFocused] = useState(true);
  const [gestures, setGestures] = useState(null);
  const [captions, setCaptions] = useState([]);
  const [isAvatarMode, setIsAvatarMode] = useState(false);
  const [isRecordingProtected, setIsRecordingProtected] = useState(false);
  const [deepfakeRisk, setDeepfakeRisk] = useState(0);

  // Stats for post-call analytics
  const stats = useRef({
    emotions: { Happy: 0, Thinking: 0, Neutral: 0, Surprised: 0, Sad: 0 },
    attentionTimeline: [],
    speakingTime: 0,
    startTime: Date.now(),
  });

  useEffect(() => {
    if (!isActive) return;

    // --- Speech Recognition (Live Captions) ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;

    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');

        // Only update if we have a final result or it's long enough
        if (event.results[0].isFinal) {
          setCaptions(prev => {
            const newCaptions = [...prev, { id: Date.now(), text: event.results[0][0].transcript }];
            return newCaptions.slice(-3); // Keep last 3
          });
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error", event.error);
      };

      try {
        recognition.start();
      } catch (e) {
        // Ignore if already started
      }
    }

    // Simulation of AI detection
    const interval = setInterval(() => {
      // Mock Emotion Detection
      const emotionsList = ['Neutral', 'Thinking', 'Happy', 'Surprised', 'Focused'];
      const randomEmotion = emotionsList[Math.floor(Math.random() * emotionsList.length)];
      if (Math.random() > 0.7) {
        setEmotion(randomEmotion);
        stats.current.emotions[randomEmotion] = (stats.current.emotions[randomEmotion] || 0) + 1;
      }

      // Mock Attention Tracking
      const factor = Math.random() > 0.9 ? -10 : 2;
      setAttentionScore(prev => Math.min(100, Math.max(0, prev + factor)));

      setIsFocused(prev => {
        const next = attentionScore > 40;
        return next;
      });

      stats.current.attentionTimeline.push({
        time: (Date.now() - stats.current.startTime) / 1000,
        score: attentionScore
      });

      // Mock Deepfake Detection
      if (Math.random() > 0.99) {
        setDeepfakeRisk(prev => Math.min(100, prev + 15));
      } else {
        setDeepfakeRisk(prev => Math.max(0, prev - 5));
      }

    }, 3000);

    return () => {
      clearInterval(interval);
      if (recognition) recognition.stop();
    };
  }, [isActive, attentionScore]);

  const addCaption = useCallback((text) => {
    setCaptions(prev => [...prev.slice(-3), { id: Date.now(), text }]);
  }, []);

  const triggerGesture = useCallback((gesture) => {
    setGestures(gesture);
    setTimeout(() => setGestures(null), 2000);
  }, []);

  return {
    emotion,
    attentionScore,
    isFocused,
    gestures,
    captions,
    isAvatarMode,
    setIsAvatarMode,
    isRecordingProtected,
    deepfakeRisk,
    addCaption,
    triggerGesture,
    stats: stats.current
  };
};
