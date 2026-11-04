const axios = require('axios');
const { buildPrompt } = require('./prompt');
const inventory = require('./inventory');

// Memoria simple para no olvidar contexto
const chats = new Map();

async function getReply(userText, from = 'cliente') {
  const SYSTEM = buildPrompt();
  
  if (!chats.has(from)) chats.set(from, []);
  const history = chats.get(from);
  history.push({ role: 'user', content: userText });
  if (history.length > 6) history.shift(); // guarda ultimos 6

  const messages = [{ role: 'system', content: SYSTEM }, ...history];

  try {
    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 350,
      temperature: 0.8,
    }, { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } });

    let reply = res.data.choices[0].message.content.trim();
    history.push({ role: 'assistant', content: reply });
    return reply;
  } catch (e) {
    console.log('Groq fail', e.response?.data || e.message);
    return `Uy rey, se me lagueó un toque 😅 Pero mirá lo que tenemos hoy:\n${inventory.getMenuTexto()}\n¿Cuál te va?`;
  }
}
module.exports = { getReply };
