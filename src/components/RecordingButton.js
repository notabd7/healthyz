import React, { useState } from 'react';
import { VoiceRecorder } from 'react-voice-recorder-player'; // Import the correct component
import './RecordingButton.css';


const RecordingButton = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');

  const handleStart = () => {
    setIsRecording(true);
  };

  const handleStop = (audioBlob) => {
    setIsRecording(false);
    try {
      const url = URL.createObjectURL(audioBlob);
      setAudioURL(url);
    } catch (error) {
      console.error('Failed to create object URL:', error);
    }
  };

  const handleReset = () => {
    setAudioURL('');
  };
  return (
    <div className="recording-button-container">
      <VoiceRecorder
        isRecording={isRecording}
        onStart={handleStart}
        onStop={handleStop}
        onReset={handleReset}
        
        style={{ display: 'none' }} // Hide the default UI
      />
      { <div className="controls-container">
        {!isRecording ? (
          <button
            className="record-button"
            onClick={handleStart}
          >
            Start Recording
          </button>
        ) : (
          <div className="waveform-container">
            <div className="waveform"></div>
          </div>
        )}
        {audioURL && (
          <div className="audio-preview">
            <h3>Recording:</h3>
            <audio controls src={audioURL}></audio>
            <button onClick={handleReset} className="reset-button">Reset</button>
          </div>
        )}
      </div> }
    </div>
  );
};

export default RecordingButton;

