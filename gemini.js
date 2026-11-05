const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

async function getGeminiReply(prompt) {
  if (!genAI) {
    console.log("Falta GEMINI_API_KEY en Render");
    return null;
  }
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (e) {
    console.log("Gemini error:", e.message);
    return null;
  }
}

async function getReply(prompt) {
  return getGeminiReply(prompt);
}

module.exports = { getGeminiReply, getReply };
