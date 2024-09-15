import React, { useState, useEffect, useRef } from 'react';

import './SavedProfile.css';

import { createClient } from '@supabase/supabase-js';

// Use REACT_APP_ prefix for environment variables:
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

// ... rest of your code

const supabase = createClient(supabaseUrl, supabaseKey)

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials are not set. Please check your environment variables.');
}


const SavedProfile = () => {
  const [profile, setProfile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatEnded, setIsChatEnded] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const chatContainerRef = useRef(null);
  const [pastAppointments, setPastAppointments] = useState([]);

  useEffect(() => {
    const savedProfile = JSON.parse(localStorage.getItem('healthProfile'));
    const clientInfo = JSON.parse(localStorage.getItem('clientInfo'));
    if (savedProfile && clientInfo) {
      const combinedProfile = { ...savedProfile, ...clientInfo };
      setProfile(combinedProfile);
      
      // Fetch past appointments
      fetchPastAppointments(combinedProfile);
      
      // Send the profile to the server
      sendProfileToServer(combinedProfile);
    }
    // Initialize chat with AI's first question
    setChatHistory([{ type: 'assistant', text: "How are you doing today?" }]);
  }, []);

  const fetchPastAppointments = async (profile) => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('appointments, time_stamp_created')
        .eq('first_name', profile.firstName)
        .eq('last_name', profile.lastName)
        .eq('contact', profile.contactNumber)
        .order('time_stamp_created', { ascending: false });

      if (error) throw error;

      const formattedAppointments = data.map(item => ({
        ...item.appointments,
        time_stamp_created: item.time_stamp_created
      }));

      setPastAppointments(formattedAppointments);
      
      // Send past appointments to the server
      sendPastAppointmentsToServer(formattedAppointments);
    } catch (error) {
      console.error('Error fetching past appointments:', error);
    }
  };

  const sendPastAppointmentsToServer = async (appointments) => {
    try {
      const response = await fetch('http://localhost:3001/api/set-past-appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pastAppointments: appointments }),
      });

      if (!response.ok) {
        throw new Error('Failed to send past appointments to server');
      }

      console.log('Past appointments sent to server successfully');
    } catch (error) {
      console.error('Error sending past appointments to server:', error);
    }
  };

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

      if (data.translation.toLowerCase().includes('end chat')) {
        setIsChatEnded(true);
        // Get the conclusion from the AI
        const conclusionResponse = await fetch('http://localhost:3001/api/get-conclusion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ chatHistory }),
        });

        if (!conclusionResponse.ok) {
          throw new Error('Failed to get conclusion');
        }

        const conclusionData = await conclusionResponse.json();
        
        // Add the conclusion to chat history
        setChatHistory(prevHistory => [
          ...prevHistory,
          { type: 'user', text: data.translation },
          { type: 'assistant', text: conclusionData.conclusion }
        ]);

        // Send data to Supabase
        await sendDataToSupabase(conclusionData.conclusion);
      } else {
        // Update chat history with user's response first, then AI's question
        setChatHistory(prevHistory => [
          ...prevHistory,
          { type: 'user', text: data.translation },
          { type: 'assistant', text: data.assistantResponse }
        ]);
      }
    } catch (error) {
      console.error('Error:', error);
      setChatHistory(prevHistory => [
        ...prevHistory,
        { type: 'assistant', text: 'Sorry, there was an error processing your speech.' }
      ]);
    }
  };

  const sendDataToSupabase = async (conclusion) => {
    try {
      console.log('Attempting to send data to Supabase:', {
        firstName: profile.firstName,
        lastName: profile.lastName,
        contactNumber: profile.contactNumber,
        conclusion: conclusion
      });

      const { data, error } = await supabase
        .from('patients')
        .insert([
          {
            "first_name": profile.firstName,
            "last_name": profile.lastName,
            "contact": profile.contactNumber,
            appointments: {
              medical_history: JSON.stringify(profile),
              QnA: chatHistory.map(msg => `${msg.type}: ${msg.text}`).join('\n'),
              conclusion: conclusion
            },
            time_stamp_created: new Date().toISOString()
          }
        ]);

      if (error) throw error;
      console.log('Data added to Supabase successfully:', data);
    } catch (error) {
      console.error('Error sending data to Supabase:', error);
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

  const handleNewChat = async () => {
    // Send data to Supabase if there's a chat history
    if (chatHistory.length > 1) {
      const lastAIMessage = chatHistory.filter(msg => msg.type === 'assistant').pop();
      const conclusion = lastAIMessage ? lastAIMessage.text : "No conclusion available.";
      await sendDataToSupabase(conclusion);
    }

    // Clear chat history and start new chat
    setChatHistory([{ type: 'assistant', text: "How are you doing today?" }]);
    setIsChatEnded(false);
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
        {isChatEnded && (
          <p className="chat-ended-message">Chat ended. Data has been saved.</p>
        )}
        <button className="new-chat-button" onClick={handleNewChat}>
          New Chat
        </button>
      </div>
    </div>
  );
};

export default SavedProfile;
