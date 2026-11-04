const axios = require('axios');
const { buildPrompt } = require('./prompt');

async function getReply(userMsg) {
  try {
    const r = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: buildPrompt() },
        { role: 'user', content: userMsg }
      ],
      temperature: 0.8
    }, { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } });
    return r.data.choices[0].message.content;
  } catch (e) {
    console.log('Groq fail', e.response?.data || e.message);
    return 'Hola! Soy de Gracias Café ☕️ ¿Qué te antoja hoy, rey/reina?';
  }
}
module.exports = { getReply };
