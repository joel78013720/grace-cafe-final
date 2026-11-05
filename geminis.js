const { GoogleGenerativeAI } = require("@google/generative-ai");

// Soporta GEMINIS_API_KEY o GEMINIS_API_KEY
const apiKey = process.env.GEMINIS_API_KEY || process.env.GEMINIS_API_KEY || process.env.GEMINIS_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

async function getGeminisReply(prompt) {
  if (!genAI) {
    console.log("Falta GEMINIS_API_KEY en Render");
    return null;
  }
  try {
    const model = genAI.getGenerativeModel({ model: "geminis-1.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (e) {
    console.log("Geminis error:", e.message);
    return null;
  }
}

// Para compatibilidad con lo que busca app.js
async function getReply(prompt) {
  return getGeminisReply(prompt);
}

module.exports = { getGeminisReply, getReply };
