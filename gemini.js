const axios = require('axios');
const { buildPrompt } = require('./prompt');
const inventory = require('./inventory');

const chats = new Map();

async function getReply(userText, from = 'cliente') {
  if (!chats.has(from)) chats.set(from, []);
  const history = chats.get(from);
  
  history.push({ role: 'user', content: userText });
  if (history.length > 20) history.splice(0, history.length - 20);

  const inventarioTexto = inventory.getMenuTexto();
  const systemPrompt = buildPrompt(inventarioTexto);

  const contents = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    { role: 'model', parts: [{ text: 'Entendido, recepcionista de Gracias Café lista. Saludo según hora, sin decir reina, respuestas cortas y vendedoras.' }] }
  ];
  
  for (const msg of history.slice(-10)) {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    });
  }

  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      { contents },
      { timeout: 20000 }
    );
    const reply = res.data.candidates[0].content.parts[0].text.trim();
    history.push({ role: 'assistant', content: reply });
    console.log('GEMINI OK:', reply);
    return reply;
  } catch (e) {
    console.log('GEMINI FALLÓ:', e.response?.data || e.message);
    return `Dame un segundito que reviso eso, ¿cuántos cafés me decías?`;
  }
}

module.exports = { getReply };
