const { spawn } = require('child_process');
const fs = require('fs');

console.log("Audio recording test");

const outputFile = 'output.wav';
const duration = 5; // Record for 5 seconds

const audioDevice = 'default';
const sox = spawn('sox', ['-d', '-t', 'waveaudio', outputFile, 'trim', '0', duration.toString()]);

console.log(`Recording for ${duration} seconds...`);

sox.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

sox.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

sox.on('close', (code) => {
  console.log(`Recording saved to ${outputFile}`);
  console.log(`Child process exited with code ${code}`);
});