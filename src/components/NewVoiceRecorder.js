// import React, { useEffect, useState, useRef } from 'react';
// import WaveSurfer from 'wavesurfer.js';
// import RecordPlugin from 'wavesurfer.js/dist/plugins/record.esm.js';

// const NewVoiceRecorder = ({ startRecording, stopRecording, isRecording }) => {
//   const wavesurferRef = useRef(null);
//   const recordRef = useRef(null);
//   const progressRef = useRef(null);

//   useEffect(() => {
//     // Initialize WaveSurfer and RecordPlugin
//     wavesurferRef.current = WaveSurfer.create({
//       container: '#mic',
//       waveColor: 'rgba(75, 0, 130, 1)', // Wave color
//       progressColor: 'rgba(128, 0, 128, 1)', // Progress color
//       cursorColor: '#8B008B',
//       barWidth: 3,
//       barGap: 1,
//       barHeight: 1,
//       barMinHeight: 2,
//       height: 200,
//       responsive: true,
//       scrollParent: true,
//       minPxPerSec: 20,
//     });

//     recordRef.current = wavesurferRef.current.registerPlugin(
//       RecordPlugin.create({ renderRecordedAudio: false })
//     );

//     recordRef.current.on('record-end', (blob) => {
//       const url = URL.createObjectURL(blob);
//       console.log('Recording URL:', url);
//     });

//     return () => {
//       if (wavesurferRef.current) {
//         wavesurferRef.current.destroy();
//       }
//     };
//   }, []);

//   // Handle external start/stop actions via props
//   useEffect(() => {
//     if (isRecording && recordRef.current) {
//       recordRef.current.startRecording();
//     } else if (!isRecording && recordRef.current?.isRecording()) {
//       recordRef.current.stopRecording();
//     }
//   }, [isRecording]);

//   return (
//     <div>
//       <div id="mic" style={{ border: '1px solid #ddd', borderRadius: '4px', marginTop: '1rem', width: '900px' }}></div>
//       <p ref={progressRef} style={{ fontFamily: 'Poppins, sans-serif' }}>00:00</p>
//     </div>
//   );
// };

// export default NewVoiceRecorder;



import React, { useEffect, useState, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RecordPlugin from 'wavesurfer.js/dist/plugins/record.esm.js';
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;700&display=swap" rel="stylesheet"></link>

const NewVoiceRecorder = () => {
  const [scrollingWaveform, setScrollingWaveform] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const wavesurferRef = useRef(null);
  const recordRef = useRef(null);
  const micSelectRef = useRef(null);
  const progressRef = useRef(null);
  const pauseButtonRef = useRef(null);
  const recButtonRef = useRef(null);

  useEffect(() => {
    // Initialize WaveSurfer and RecordPlugin
    wavesurferRef.current = WaveSurfer.create({
      container: '#mic',
      waveColor: 'rgba(75, 0, 130, 1)', // Darker wave color
      progressColor: 'rgba(128, 0, 128, 1)', // Darker progress color
      cursorColor: '#8B008B', // Color for the cursor (optional)
      barWidth: 3, // Increase bar width for thicker bars
      barGap: 1, // Small gap between bars for a clean look
      barHeight: 1, // Scale the bar height up for taller bars
      barMinHeight: 2, // Minimum bar height for low signals
      height: 200, // Height of the waveform container
      responsive: true, // Waveform resizes with container
      scrollParent: true, // Enable scrolling as the audio progresses
      minPxPerSec: 100, // Slow down the scrolling for that smooth "voice memo" effect
      normalize: true
    });

    recordRef.current = wavesurferRef.current.registerPlugin(
      RecordPlugin.create({ scrollingWaveform, renderRecordedAudio: false })
    );

    recordRef.current.on('record-end', (blob) => {
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
    });

    recordRef.current.on('record-progress', (time) => {
      updateProgress(time);
    });

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, [scrollingWaveform]);

  useEffect(() => {
    // Populate microphone selection
    RecordPlugin.getAvailableAudioDevices().then((devices) => {
      if (micSelectRef.current) {
        micSelectRef.current.innerHTML = '';
        devices.forEach((device) => {
          const option = document.createElement('option');
          option.value = device.deviceId;
          option.text = device.label || device.deviceId;
          micSelectRef.current.appendChild(option);
        });
      }
    });
  }, []);

  const handleRecordClick = () => {
    if (recordRef.current.isRecording() || recordRef.current.isPaused()) {
      recordRef.current.stopRecording();
      setRecording(false);
    } else {
      recordRef.current.startRecording({ deviceId }).then(() => {
        setRecording(true);
      });
    }
  };

  const handlePauseClick = () => {
    if (recordRef.current.isPaused()) {
      recordRef.current.resumeRecording();
      pauseButtonRef.current.textContent = 'Pause';
    } else {
      recordRef.current.pauseRecording();
      pauseButtonRef.current.textContent = 'Resume';
    }
  };

  const updateProgress = (time) => {
    // time will be in milliseconds, convert it to mm:ss format
    const formattedTime = [
      Math.floor((time % 3600000) / 60000), // minutes
      Math.floor((time % 60000) / 1000), // seconds
    ]
      .map((v) => (v < 10 ? '0' + v : v))
      .join(':');
    if (progressRef.current) {
      progressRef.current.textContent = formattedTime;
    }
  };

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif' }}>
    <h1>What can we help you with?</h1>

    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <button
        ref={recButtonRef}
        onClick={handleRecordClick}
        style={{
          backgroundColor: !recording ? '#8B008B' : '#4B0082',
          color: 'white',
          border: 'none',
          padding: '20px 10px',
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '21px',
          fontFamily: 'Poppins, san-serif',
          fontWeight: 'bold',
          width: '150px',
          height: '150px',
          marginBottom: '20px',
          marginLeft: '100px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          transition: 'box-shadow 0.3s ease',
          background: `linear-gradient(135deg, #8B008B, #4B0082)`,
          border: '2px solid #fff',
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#6A006A'; // Darker purple on hover
          e.target.style.transform = 'scale(1.05)'; // Slightly larger on hover
          e.target.style.boxShadow = '0 6px 10px rgba(0, 0, 0, 0.2)'; // Enhanced shadow on hover
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = !recording ? '#8B008B' : '#4B0082'; // Return to original background
          e.target.style.transform = 'scale(1)'; // Reset scale
          e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'; // Reset shadow
        }}
      >
        {recording ? 'Submit' : 'Begin'}
      </button>


     <div id="mic" style={{ border: '1px solid #ddd', borderRadius: '4px', marginTop: '1rem', width: '900px'  }}></div>

     <button
      ref={pauseButtonRef}
      onClick={handlePauseClick}
      style={{ display: recording ? 'inline' : 'none', 
      marginBottom: '20px',
      color: 'white',
      border: 'none',
      padding: '20px 10px',
      cursor: 'pointer',
      fontSize: '21px',
      fontFamily: 'Poppins, san-serif',
      fontWeight: 'bold',
      width: '120px',
      height: '50px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      transition: 'box-shadow 0.3s ease',
      background: `linear-gradient(135deg, #8B008B, #4B0082)`,
      border: '2px solid #fff',
    }}
    >
      {recordRef.current?.isPaused() ? 'Resume Recording' : 'Pause Recording'}
    </button>

    <p ref={progressRef}
    style= {{fontFamily: 'Poppins, san-serif'}}>00:00</p>

    </div>
   
    

    <div style={{ marginBottom: '20px' }}>
      <select
        ref={micSelectRef}
        onChange={(e) => setDeviceId(e.target.value)}
        style={{
          padding: '10px',
          fontSize: '16px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: '#f9f9f9',
          color: '#333',
          cursor: 'pointer',
          width: '200px',
          maxWidth: '100%',
          fontFamily: 'Poppins, sans-serif'
        }}
      >
        <option value="" hidden>Select mic</option>
      </select>
    </div>

  

    

    {/* <div id="recordings" style={{ margin: '1rem 0' }}>
      {recordedUrl && (
        <>
          <button
            onClick={() => WaveSurfer.create({
              container: '#recordings',
              waveColor: 'rgb(200, 100, 0)',
              progressColor: 'rgb(100, 50, 0)',
              url: recordedUrl,
            }).playPause()}
          >
            Play
          </button>
          <a href={recordedUrl} download={`recording.${recordedUrl.split('.').pop()}`}>
            Download recording
          </a>
        </>
      )}
    </div> */}
  </div>
  );
};


export default NewVoiceRecorder;