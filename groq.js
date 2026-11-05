const axios = require('axios');

async function getReply(prompt) {
  const groqKey = process.env.GROQ_API_KEY;
  
  if (!groqKey) {
    console.log("FALTA GROQ_API_KEY");
    return null;
  }

  try {
    console.log("Probando Groq Llama...");
    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 600
    }, {
      headers: { 
        Authorization: `Bearer ${groqKey}`, 
        'Content-Type': 'application/json' 
      },
      timeout: 15000
    });
    
    const texto = res.data.choices[0]?.message?.content;
    console.log("OK con Groq");
    return texto;
    
  } catch (e) {
    console.log("Fallo Groq:", e.response?.data || e.message);
    // Si falla el 70b, prueba con el 8b nuevo
    try {
      console.log("Probando modelo backup...");
      const res2 = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 600
      }, {
        headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' }
      });
      console.log("OK con Groq backup");
      return res2.data.choices[0]?.message?.content;
    } catch (e2) {
      console.log("Fallo backup:", e2.response?.data || e2.message);
      return null;
    }
  }
}

module.exports = { getReply, getGroqReply: getReply };
