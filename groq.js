const axios = require('axios');

async function getReply(prompt) {
  const groqKey = process.env.GROQ_API_KEY;
  
  if (!groqKey) {
    console.log("FALTA GROQ_API_KEY en Render");
    return "Dame un momento Rey, estoy configurando mi cerebro nuevo.";
  }

  try {
    console.log("Probando Groq Llama...");
    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    }, {
      headers: { 
        Authorization: `Bearer ${groqKey}`, 
        'Content-Type': 'application/json' 
      }
    });
    
    const texto = res.data.choices[0].message.content;
    console.log("OK con Groq - Respuesta lista");
    return texto;
    
  } catch (e) {
    const err = e.response?.data?.error?.message || e.message;
    console.log("Fallo Groq:", err);
    return null;
  }
}

module.exports = { getReply, getGeminiReply: getReply };
