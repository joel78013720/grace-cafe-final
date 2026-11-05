const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINIS_API_KEY || process.env.GEMINI_API_KEY || process.env.GEMINI_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

async function getGeminisReply(prompt) {
  if (!genAI) {
    console.log("Falta GEMINIS_API_KEY en Render");
    return null;
  }
  try {
    // Modelo nuevo que SI existe en 2026
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (e) {
    console.log("Geminis error:", e.message);
    // Intento con fallback
    try {
      const model2 = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
      const result2 = await model2.generateContent(prompt);
      return result2.response.text();
    } catch(e2) {
      console.log("Fallback error:", e2.message);
      return null;
    }
  }
}

async function getGeminiReply(p){ return getGeminisReply(p); }
async function getReply(p){ return getGeminisReply(p); }

module.exports = { getGeminisReply, getGeminiReply, getReply };
