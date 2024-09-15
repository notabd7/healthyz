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
let pastAppointments = [];

// New endpoint to set patient history
app.post('/api/set-patient-history', (req, res) => {
  patientHistory = req.body;
  res.json({ message: 'Patient history set successfully' });
});

app.post('/api/set-past-appointments', (req, res) => {
  pastAppointments = req.body.pastAppointments;
  res.json({ message: 'Past appointments set successfully' });
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
        content: generateAIPrompt(patientHistory, pastAppointments, translatedText)
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

app.post('/api/get-conclusion', async (req, res) => {
  const { chatHistory } = req.body;
  
  try {
    const conclusion = await generateConclusion(chatHistory, patientHistory, pastAppointments);
    res.json({ conclusion });
  } catch (error) {
    console.error('Error generating conclusion:', error);
    res.status(500).json({ error: 'Failed to generate conclusion' });
  }
});

async function generateConclusion(chatHistory, patientHistory, pastAppointments) {
  const prompt = generateAIPrompt(patientHistory, pastAppointments, "Generate a conclusion for this chat session.");
  
  const conclusionResponse = await openai.chat.completions.create({
    messages: [
      { role: "system", content: prompt },
      ...chatHistory,
    ],
    model: "gpt-4o-mini",
  });

  return conclusionResponse.choices[0].message.content;
}

const generateAIPrompt = (patientHistory, pastAppointments, currentQuery) => {
  return `
    You are a medical assistant. You have the following information about the patient:

    Patient's Medical History and other important information:
    ${JSON.stringify(patientHistory)}

    Past Appointments (most recent first):
    ${pastAppointments.map(app => `
      Date: ${app.time_stamp_created}
      Medical History: ${app.medical_history}
      Question & Answer session with an Ai model: ${app.QnA}
      Conclusions of each session: ${app.conclusion}
    `).join('\n')}

    Current Query: ${currentQuery}

    Based on this information, please ask specific diagnostic oriented questions aimed to narrow down and ultimately diagnose the patient's condition, you can stop after you have enough information to make a conclusion nut always ask at least 10 questions.
  `;
};

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});