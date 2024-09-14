const readline = require("readline");
const OpenAI = require("openai");
require("dotenv").config();

// Initialize OpenAI API client with the API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


let chatHistory = [];

console.log(
  `\n# # # # # # # # # # # # # # # # # # # # #\n# Welcome to your AI-powered medical chat #\n# # # # # # # # # # # # # # # # # # # # #\n`
);

// Function to set up the readline interface for user input
const setupReadlineInterface = () => {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
};

// Function to chat with the AI
async function chat(userInput) {
  try {
    // Prepare messages for the chatbot, including the user input
    const messages = [
      {
        role: "system",
        content:
          "You are a helpful medical assistant. People come to you with their medical issues. Your job is to use their medical history and description of what they are feeling to ask smart follow up questions, you have to ask one question at a time and carefully think about what question to ask next, to accurately diagnose what is wrong, when the user says end chat you are to generate notes for the doctor, sharing your precise summary of the patients account and question answer session",
      },
      ...chatHistory,
      { role: "user", content: userInput },
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
      { role: "user", content: userInput },
      { role: "assistant", content: chatResponseText }
    );

    // Log the assistant's response to the terminal
    console.log(`>> Assistant: ${chatResponseText}`);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Main function to run the chat
async function runChat() {
  const rl = setupReadlineInterface();

  console.log("Type your message and press Enter. Type 'end chat' to quit.");

  const askQuestion = () => {
    rl.question(">> You: ", async (userInput) => {
      if (userInput.toLowerCase() === 'end chat') {
        await chat(userInput);
        console.log("Goodbye!");
        
        rl.close();
        return;
      }

      await chat(userInput);
      askQuestion();
    });
  };

  askQuestion();
}

// Start the chat
runChat();