import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './SavedProfile.css';

const SavedProfile = () => {
  const [profile, setProfile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const [chatHistory, setChatHistory] = useState([]);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const chatContainerRef = useRef(null);
  const isFirstInteractionRef = useRef(true);

  useEffect(() => {
    const savedProfile = JSON.parse(localStorage.getItem('healthProfile'));
    console.log(savedProfile);
    const clientInfo = JSON.parse(localStorage.getItem('clientInfo'));
    if (savedProfile && clientInfo) {
      const combinedProfile = { ...savedProfile, ...clientInfo };
      setProfile(combinedProfile);
      
      // Send the profile to the server
      sendProfileToServer(combinedProfile);
    }
    // Initialize chat with AI's first question
    setChatHistory([{ type: 'assistant', text: "How are you doing today?"}]);
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
      const response = await fetch('http://localhost:3001/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Processing failed');
      }

      const data = await response.json();
      

      // Update chat history with user's response first, then AI's question
      setChatHistory(prevHistory => [
        ...prevHistory,
        { type: 'user', text: data.translation },
        { type: 'assistant', text: data.assistantResponse }
      ]);

      isFirstInteractionRef.current = false;
    } catch (error) {
      console.error('Error:', error);
      setChatHistory(prevHistory => [
        ...prevHistory,
        { type: 'assistant', text: 'Sorry, there was an error processing your speech.' }
      ]);
    }
  };

  const sendProfileToServer = async (profileData) => {
    try {
      const response = await fetch('http://localhost:3001/api/set-patient-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error('Failed to send profile to server');
      }

      console.log('Profile sent to server successfully');
    } catch (error) {
      console.error('Error sending profile to server:', error);
    }
  };

  if (!profile) {
    return <div className="saved-profile-card">No saved profile found.</div>;
  }

  const renderBulletPoints = (items) => {
    if (!items) return null;
    const itemList = Array.isArray(items) ? items : items.split(', ');
    return (
      <ul>
        {itemList.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    );
  };

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
          <p><strong>Name:</strong> {profile.firstName} {profile.lastName}</p>
          <p><strong>Age:</strong> {profile.age}</p>
          <p><strong>Gender:</strong> {profile.gender}</p>
          <p><strong>Height:</strong> {profile.height} cm</p>
          <p><strong>Weight:</strong> {profile.weight} kg</p>
          <p><strong>Blood Type:</strong> {profile.bloodType}</p>
          <p><strong>Children:</strong> {profile.children}</p>
          
          <h3>Medical History</h3>
          <p><strong>Family History:</strong></p>
          {renderBulletPoints(profile.familyHistory)}
          
          <p><strong>Infectious Areas Visited:</strong></p>
          {renderBulletPoints(profile.infectiousAreas)}
          
          <p><strong>Sexual Activity:</strong> {profile.sexualActivity}</p>
          
          <p><strong>Alcohol Consumption:</strong> {profile.alcohol}</p>
          
          <p><strong>Tobacco Use:</strong> {profile.tobacco}</p>
          
          <p><strong>Chronic Conditions:</strong></p>
          {renderBulletPoints(profile.chronicConditions)}
          
          <p><strong>Allergies:</strong></p>
          {renderBulletPoints(profile.allergies)}
          
          <p><strong>Surgeries:</strong></p>
          {renderBulletPoints(profile.surgeries)}
          
          <p><strong>Recent Changes:</strong> {profile.recentChanges}</p>
        </div>
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
