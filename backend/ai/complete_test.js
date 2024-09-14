const Microphone = require("node-microphone");
const fs = require("fs");
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
let mic, outputFile, micStream; // Microphone, output file, microphone stream

// Function to start recording audio from the microphone
const startRecording = () => {
  return new Promise((resolve, reject) => {
    mic = new Microphone();
    outputFile = fs.createWriteStream("output.wav");
    micStream = mic.startRecording();

    // Write incoming data to the output file
    micStream.on("data", (data) => {
      outputFile.write(data);
    });

    // Handle microphone errors
    micStream.on("error", (error) => {
      reject(error);
    });

    // Resolve the promise when recording is stopped
    micStream.on("close", () => {
      resolve();
    });
  });
};

// Function to stop recording
const stopRecording = () => {
  return new Promise((resolve) => {
    mic.stopRecording();
    outputFile.end(() => {
      resolve();
    });
  });
};

// Function to transcribe and chat
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

    console.log(`>> Assistant said: ${chatResponseText}`);

    return { userText: translatedText, assistantText: chatResponseText };
  } catch (error) {
    console.error("Error:", error.message);
    throw error;
  }
}

// Main function to run speech recognition
export async function runSpeechRecognition() {
  try {
    console.log("Starting recording...");
    await startRecording();
    
    // Record for 5 seconds (you can adjust this duration)
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log("Stopping recording...");
    await stopRecording();
    
    console.log("Processing audio...");
    const result = await transcribeAndChat();
    
    return result;
  } catch (error) {
    console.error("Speech recognition error:", error);
    throw error;
  }
}