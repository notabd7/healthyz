const Microphone = require("node-microphone");
const fs = require("fs");
const readline = require("readline");
const axios = require("axios");
const FormData = require("form-data");
const OpenAI = require("openai");
require("dotenv").config();

// Initialize OpenAI API client with the provided API key
const secretKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI({
  apiKey: secretKey,
});

// Variables to store chat history and other components
let chatHistory = []; // To store the conversation history
let mic, outputFile, micStream, rl; // Microphone, output file, microphone stream, and readline interface

console.log(
  `\n# # # # # # # # # # # # # # # # # # # #\n# Welcome to your AI-powered voice chat #\n# # # # # # # # # # # # # # # # # # # # #\n`
);

// These are the main functions
// 1. setupReadlineInterface()
// 2. startRecording()
// 3. stopRecordingAndProcess()
// 4. transcribeAndChat()
// 5. streamedAudio()

// See diagram for overview of how they interact
// http://www.plantuml.com/plantuml/png/fPJ1ZjCm48RlVefHJY34Fi0Uq5QbYoeMKUqMxQKNaqnJ2tTisHEWF3sUD6jvJSCY4QbLFVdcZ-Vttzn4re67erMwPHVWIyIWV2gPrdXD34r47lmzwiuQmZKnXhrkyTNh1dI41xbPyI9uZwqBdQ7-YPDYpJcViGLrc-1QZ34tk4gNWwRO1lCL4xmyQ9x8RQxN-W7r4Rl5q1cNLOkQKkFkuUqxEF-uXZKPDjgQNmXvqXtTcSX8i7S1FkB91unHaME4OFe3Wzld_lScUgjFq6m4WfLe0Blp-F3WKNzBmpPAN2wVUsj2P2YQAlsHlvvaicd5_kL60hQfeyTG8d8d8rdZasbtz1WCespF3Um7lZKMdtXfg6VAebTNLurIrZaFkGPtQQaWNTfoKLvJ6ilresSmNTNqvToPcPc_V6Hc2nkSBroGPOPaaPb9QdHXHLrfGCcB3qM-KjiKKXW3bDa2gHgAnOu-867GZ23fJND4xoZYZCgpg2QXfQFl67ARd5krY-ST5oGsSen_xP6cbw8i8OP5hmqrempQYF2e3SjnxwTNoF-VTPNr3B-S-OpMsHVlBgIVyCVb0FpZFq5Wf4x9HqdwLp_FPYoyjwRLR1ofUIyMT9BN2dpc0mRO7ZHbUsQi4Vq_nEjtsKYfyN2M7EoRvVmMCZ0h8wFTfA_XQ7y3

// Function to set up the readline interface for user input
const setupReadlineInterface = () => {
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true, // Make sure the terminal can capture keypress events
  });

  readline.emitKeypressEvents(process.stdin, rl);

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  // Handle keypress events
  process.stdin.on("keypress", (str, key) => {
    if (
      key &&
      (key.name.toLowerCase() === "return" ||
        key.name.toLowerCase() === "enter")
    ) {
      if (micStream) {
        stopRecordingAndProcess();
      } else {
        startRecording();
      }
    } else if (key && key.ctrl && key.name === "c") {
      process.exit(); // Handle ctrl+c for exiting
    } else if (key) {
      console.log("Exiting application...");
      process.exit(0);
    }
  });

  console.log("Press Enter when you're ready to start speaking.");
};

// Function to start recording audio from the microphone
const startRecording = () => {
  mic = new Microphone();
  outputFile = fs.createWriteStream("output.wav");
  micStream = mic.startRecording();

  // Write incoming data to the output file
  micStream.on("data", (data) => {
    outputFile.write(data);
  });

  // Handle microphone errors
  micStream.on("error", (error) => {
    console.error("Error: ", error);
  });

  console.log("Recording... Press Enter to stop");
};

// Function to stop recording and process the audio
const stopRecordingAndProcess = () => {
  mic.stopRecording();
  outputFile.end();
  console.log(`Recording stopped, processing audio...`);
  transcribeAndChat(); // Transcribe the audio and initiate chat
};

// Default voice setting for text-to-speech
const inputVoice = "echo"; // https://platform.openai.com/docs/guides/text-to-speech/voice-options
const inputModel = "tts-1"; // https://platform.openai.com/docs/guides/text-to-speech/audio-quality

// Update transcribeAndChat function
async function transcribeAndChat() {
  const filePath = "output.wav";

  // Prepare form data for the transcription request
  const form = new FormData();
  form.append("file", fs.createReadStream(filePath));
  form.append("model", "whisper-1");
  form.append("response_format", "text");

  try {
    // Post the audio file to OpenAI for transcription
    const transcriptionResponse = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    // Extract transcribed text from the response
    const transcribedText = transcriptionResponse.data;

    // Translate the transcribed text to English if it's in Urdu
    const translationMessages = [
      {
        role: "system",
        content: "You are a translator. The input is going to be in either of the three languages: Urdu, English, or Punjabi. Translate it to English. If it's already in English, simply repeat it.",
      },
      { role: "user", content: transcribedText },
    ];

    const translationResponse = await openai.chat.completions.create({
      messages: translationMessages,
      model: "gpt-4o-mini",
    });

    const translatedText = translationResponse.choices[0].message.content;

    console.log(`>> You said (translated): ${translatedText}`);

    // Prepare messages for the chatbot, including the translated text
    const messages = [
      {
        role: "system",
        content:
          "You are a helpful medical assistant. People come to you with their medical issues. Your job is to use their medical history and description of what they are feeling to ask smart follow up questions, you have to ask one question at a time and carefully think about what question to ask next, to accurately diagnose what is wrong, when the user says end chat you are to generate notes for the doctor, sharing your precise summary of the patients account and question answer session",
      },
      ...chatHistory,
      { role: "user", content: translatedText },
    ];

    // Send messages to the chatbot and get the response
    const chatResponse = await openai.chat.completions.create({
      messages: messages,
      model: "gpt-4o-mini",
    });

    // Extract the chat response
    const chatResponseText = chatResponse.choices[0].message.content;

    // Update chat history with the latest interaction
    chatHistory.push(
      { role: "user", content: translatedText },
      { role: "assistant", content: chatResponseText }
    );

    // Log the assistant's response to the terminal
    console.log(`>> Assistant said: ${chatResponseText}`);

    // Reset microphone stream and prompt for new recording
    micStream = null;
    console.log("Press Enter to speak again, or any other key to quit.\n");
  } catch (error) {
    // Handle errors from the transcription or chatbot API
    if (error.response) {
      console.error(
        `Error: ${error.response.status} - ${error.response.statusText}`
      );
    } else {
      console.error("Error:", error.message);
    }
  }
}

// Initialize the readline interface
setupReadlineInterface();