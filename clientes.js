const axios = require('axios');

async function getReply(prompt) {
  try {
    console.log("Probando Groq con modelo nuevo...");
    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: "openai/gpt-oss-20b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 600
    }, {
      headers: { 
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 
        'Content-Type': 'application/json' 
      },
      timeout: 20000
    });
    console.log("OK con Groq");
    return res.data.choices[0].message.content;
  } catch (e) {
    console.log("Fallo Groq:", e.response?.data || e.message);
    return null;
  }
}
module.exports = { getReply };
