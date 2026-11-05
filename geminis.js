const { GoogleGenerativeAI } = require("@google/generative-ai");

// Soporta GEMINIS_API_KEY o GEMINI_API_KEY
const apiKey = process.env.GEMINIS_API_KEY || process.env.GEMINI_API_KEY || process.env.GEMINI_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

async function getGeminisReply(prompt) {
  if (!genAI) {
    console.log("Falta GEMINIS_API_KEY en Render");
    return null;
  }
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (e) {
    console.log("Geminis error:", e.message);
    return null;
  }
}

async function getGeminiReply(prompt) {
  return getGeminisReply(prompt);
}

async function getReply(prompt) {
  return getGeminisReply(prompt);
}

module.exports = { getGeminisReply, getGeminiReply, getReply };
