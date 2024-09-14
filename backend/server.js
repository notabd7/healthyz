const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { OpenAI } = require('openai');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Set up multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, 'audio-' + Date.now() + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Chat history and patient history
let chatHistory = [];
let patientHistory = {};

// New endpoint to set patient history
app.post('/api/set-patient-history', (req, res) => {
  patientHistory = req.body;
  res.status(200).json({ message: 'Patient history set successfully' });
});

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('No audio file received');
    }

    console.log('Received audio file:', req.file);

    // Transcribe audio
    const audioFile = fs.createReadStream(req.file.path);
    const transcript = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });

    console.log('Transcription result:', transcript.text);

    // Translate if necessary
    const translationMessages = [
      {
        role: "system",
        content: "You are a translator. The input is going to be in either of the three languages: Urdu, English, or Punjabi. Translate it to English. If it's already in English, simply repeat it.",
      },
      { role: "user", content: transcript.text },
    ];

    const translationResponse = await openai.chat.completions.create({
      messages: translationMessages,
      model: "gpt-4o-mini",
    });

    const translatedText = translationResponse.choices[0].message.content;

    console.log('Translated text:', translatedText);

    // Chat with medical assistant
    const chatMessages = [
      {
        role: "system",
        content: "You are a helpful medical assistant. People come to you with their medical issues. Your job is to use their medical history and description of what they are feeling to ask smart follow up questions, you have to ask one question at a time and carefully think about what question to ask next, to accurately diagnose what is wrong, when the user says end chat you are to generate notes for the doctor, sharing your precise summary of the patients account and question answer session",
      },
      {
        role: "system",
        content: `Patient History: ${JSON.stringify(patientHistory)}, in your questions and summary for the patient make sure you take in account their medical history and other information you have about them, your questions should be accurate, also address them by their first name ${patientHistory.firstName}`,
      },
      ...chatHistory,
      { role: "user", content: translatedText },
    ];

    const chatResponse = await openai.chat.completions.create({
      messages: chatMessages,
      model: "gpt-4o-mini",
    });

    const assistantResponse = chatResponse.choices[0].message.content;

    // Update chat history
    chatHistory.push(
      { role: "user", content: translatedText },
      { role: "assistant", content: assistantResponse }
    );

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      transcription: transcript.text,
      translation: translatedText,
      assistantResponse: assistantResponse
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred during processing.', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});