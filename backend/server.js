const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { OpenAI } = require('openai');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { detect } = require('langdetect');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const inputVoice = "nova"; // https://platform.openai.com/docs/guides/text-to-speech/voice-options
const inputModel = "tts-1"; 

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

async function textToSpeech(text, voice) {
  try {
    const mp3 = await openai.audio.speech.create({
      model: inputModel,
      voice: voice,
      input: text,
      speed: 1.,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const fileName = `speech-${Date.now()}.mp3`;
    await fs.promises.writeFile(path.join('uploads', fileName), buffer);

    return fileName;
  } catch (error) {
    console.error('Error in text-to-speech:', error);
    throw error;
  }
}

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

    // Detect input language
    const detectedLang = detect(transcript.text);
    const languageCode = detectedLang[0].lang;

    // Chat with medical assistant
    const chatMessages = [
      {
        role: "system",
        content: generateAIPrompt(patientHistory, pastAppointments, transcript.text)
      },
      ...chatHistory,
      { role: "user", content: transcript.text },
    ];

    const chatResponse = await openai.chat.completions.create({
      messages: chatMessages,
      model: "gpt-4o-mini",
    });

    const assistantResponse = chatResponse.choices[0].message.content;

    // Translate assistant response to the detected language
    const translationMessages = [
      {
        role: "system",
        content: `You are a translator. Translate the following text to ${languageCode}. Preserve any formatting or special characters.`,
      },
      { role: "user", content: assistantResponse },
    ];

    const translationResponse = await openai.chat.completions.create({
      messages: translationMessages,
      model: "gpt-4o-mini",
    });

    const translatedResponse = translationResponse.choices[0].message.content;

    // Convert translated response to speech
    const speechFile = await textToSpeech(translatedResponse, inputVoice);

    // Update chat history
    chatHistory.push(
      { role: "user", content: transcript.text },
      { role: "assistant", content: assistantResponse }
    );

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      transcription: transcript.text,
      assistantResponse: assistantResponse,
      translatedResponse: translatedResponse,
      speechFile: speechFile
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
      Question & Answer session with an AI model: ${app.QnA}
      Conclusions of each session: ${app.conclusion}
    `).join('\n')}

    Current Query: ${currentQuery}

    Based on this information, please ask specific diagnostic oriented questions aimed to narrow down and ultimately diagnose the patient's condition. Make sure you ask one question and then wait for the patient's response and use that answer in coming up with your next question, so you have fair data to reason with. You can stop after you have enough information to make a conclusion but always ask at least 10 questions. if there is a case where s patient is in a life and death situation and need urgent medical care give them advice that will maximize their chances of survival. If the user ends the chat in one way or the other print notes for thedoctor summarizing the conversation and the conclusion. the diagnosis and the question and answers you had.
  `;
};

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});