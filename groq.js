const axios = require('axios');
async function getReply(prompt) {
  const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
    max_tokens: 500
  }, {
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }
  });
  return res.data.choices[0].message.content;
}
module.exports = { getReply };
