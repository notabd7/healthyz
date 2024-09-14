import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './SavedProfile.css';

const SavedProfile = () => {
  const [profile, setProfile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    const savedProfile = JSON.parse(localStorage.getItem('healthProfile'));
    const clientInfo = JSON.parse(localStorage.getItem('clientInfo'));
    if (savedProfile && clientInfo) {
      setProfile({ ...savedProfile, ...clientInfo });
    }
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleMicrophoneClick = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await sendAudioForProcessing(audioBlob);
      };
    }
  };

  const sendAudioForProcessing = async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');

    try {
      const response = await fetch('http://localhost:3001/api/transcribe-and-chat', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Processing failed');
      }

      const data = await response.json();
      setTranscribedText(data.transcription);
      setTranslatedText(data.translation);
      setChatHistory(prevHistory => [
        ...prevHistory,
        { type: 'assistant', text: data.assistantResponse },
        { type: 'user', text: data.translation }
      ]);
    } catch (error) {
      console.error('Error:', error);
      setChatHistory(prevHistory => [
        ...prevHistory,
        { type: 'assistant', text: 'Sorry, there was an error processing your speech.' }
      ]);
    }
  };

  if (!profile) {
    return <div className="saved-profile-card">No saved profile found.</div>;
  }

  return (
    <div className="saved-profile-container">
    <div className="left-section">
      <div className="microphone-section">
        <img 
          src="/Microphone.png" 
          alt="Microphone" 
          className="microphone-image"
          onClick={handleMicrophoneClick}
          role="button"
          tabIndex={0}
        />
        <p className="start-chat-text">
          {isRecording ? 'Recording...' : 'Start Chat...'}
        </p>
      </div>

      <div className="saved-profile-card">
        <h2>Saved Profile</h2>
        <p><strong>Name:</strong> {profile.name}</p>
        <p><strong>Age:</strong> {profile.age}</p>
        <p><strong>Gender:</strong> {profile.gender}</p>
        <p><strong>Height:</strong> {profile.height}</p>
        <p><strong>Weight:</strong> {profile.weight}</p>
        <p><strong>Medical History:</strong> {profile.medicalHistory}</p>
        <p><strong>Current Medications:</strong> {profile.currentMedications}</p>
        <p><strong>Allergies:</strong> {profile.allergies}</p>
      </div>
      {transcribedText && (
          <div className="transcribed-text">
            <h3>Transcribed:</h3>
            <p>{transcribedText}</p>
          </div>
        )}
        {translatedText && (
          <div className="translated-text">
            <h3>Translated:</h3>
            <p>{translatedText}</p>
          </div>
        )}
      </div>
      <div className="right-section">
        <div className="chat-container" ref={chatContainerRef}>
          {chatHistory.map((message, index) => (
            <div key={index} className={`chat-message ${message.type}`}>
              <p>{message.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default SavedProfile;