const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const MODELOS_A_PROBAR = [
  "gemini-3.8-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash",
  "gemini-flash-latest"
];

async function getReply(prompt) {
  if (!genAI) {
    console.log("Falta GEMINI_API_KEY en Render");
    return null;
  }

  for (const modelo of MODELOS_A_PROBAR) {
    try {
      console.log(`Probando modelo: ${modelo}`);
      const model = genAI.getGenerativeModel({ model: modelo });
      const result = await model.generateContent(prompt);
      const texto = result.response.text();
      console.log(`Funciono con: ${modelo}`);
      return texto;
    } catch (e) {
      console.log(`Fallo ${modelo}: ${e.message.substring(0,100)}`);
    }
  }
  
  console.log("Ningun modelo funciono");
  return null;
}

module.exports = { getReply, getGeminiReply: getReply };
