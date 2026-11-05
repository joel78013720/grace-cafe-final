const axios = require('axios');

const MODELOS_A_PROBAR = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-2.0-flash",
  "gemini-flash-latest"
];

async function getReply(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("Falta GEMINI_API_KEY en Render");
    return null;
  }

  for (const modelo of MODELOS_A_PROBAR) {
    try {
      console.log(`Probando modelo directo: ${modelo}`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;
      
      const res = await axios.post(url, {
        contents: [{ parts: [{ text: prompt }] }]
      }, { timeout: 15000 });

      const texto = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (texto) {
        console.log(`Funciono con: ${modelo}`);
        return texto;
      }
    } catch (e) {
      const err = e.response?.data?.error?.message || e.message;
      console.log(`Fallo ${modelo}: ${err.substring(0,120)}`);
    }
  }

  console.log("Ningun modelo funciono - revisa GEMINI_API_KEY");
  return null;
}

module.exports = { getReply, getGeminiReply: getReply };
