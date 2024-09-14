import React, { useState, useEffect, useRef } from 'react';
import { VoiceRecorder } from 'react-voice-recorder-player'; // Import the correct component
import Wavesurfer from 'wavesurfer.js';
import './RecordingButton.css';


const RecordingButton = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const wavesurferRef = useRef(null);
  const waveformContainerRef = useRef(null);

  useEffect(() => {
    // Initialize Wavesurfer
    if (waveformContainerRef.current) {
      wavesurferRef.current = Wavesurfer.create({
        container: waveformContainerRef.current,
        waveColor: '#6f42c1',
        progressColor: '#5a2a8b',
        height: 100,
        barWidth: 2,
        barRadius: 3
      });
    }

    return () => {
      // Cleanup Wavesurfer instance
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    // Load audio URL into Wavesurfer
    if (audioURL && wavesurferRef.current) {
      wavesurferRef.current.load(audioURL);
    }
  }, [audioURL]);

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
      {/* Custom UI */}
      <div className="controls-container">
        {!isRecording ? (
          <button
            className="record-button"
            onClick={handleStart}
          >
            Start Recording
          </button>
        ) : (
          <>
            <button
              className="stop-button"
              onClick={() => handleStop(null)} // Add logic to stop recording
            >
              Stop Recording
            </button>
            <div className="waveform-container" ref={waveformContainerRef}></div>
          </>
        )}
        {audioURL && (
          <div className="audio-preview">
            <h3>Recording:</h3>
            <audio controls src={audioURL}></audio>
            <button onClick={handleReset} className="reset-button">Reset</button>
          </div>
        )}
      </div>
    </div>
  );
  // return (
  //   <div className="recording-button-container">


  //     <VoiceRecorder
  //       isRecording={isRecording}
  //       onStart={handleStart}
  //       onStop={handleStop}
  //       onReset={handleReset}
        
  //       style={{ display: 'none' }} // Hide the default UI
  //     />
  //     { <div className="controls-container">
  //       {!isRecording ? (
  //         <button
  //           className="record-button"
  //           onClick={handleStart}
  //         >
  //           Start Recording
  //         </button>
  //       ) : (
  //         <div className="waveform-container">
  //           <div className="waveform"></div>
  //         </div>
  //       )}
  //       {audioURL && (
  //         <div className="audio-preview">
  //           <h3>Recording:</h3>
  //           <audio controls src={audioURL}></audio>
  //           <button onClick={handleReset} className="reset-button">Reset</button>
  //         </div>
  //       )}
  //     </div> }
  //   </div>
  // );
};

export default RecordingButton;

