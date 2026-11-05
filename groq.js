const axios = require('axios');

async function getReply(prompt) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return null;
  try {
    console.log("Probando Groq Llama...");
    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    }, {
      headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' }
    });
    console.log("OK con Groq");
    return res.data.choices[0].message.content;
  } catch (e) {
    console.log("Fallo Groq:", e.response?.data?.error?.message || e.message);
    return null;
  }
}
module.exports = { getReply, getGroqReply: getReply };
