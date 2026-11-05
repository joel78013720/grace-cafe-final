const axios = require('axios');
const { buildPrompt, getFechaNicaragua } = require('./prompt');
const inventory = require('./inventory');

const chats = new Map();
const ultimoPedido = new Map();

function cerebroLocal(t, from) {
  const { lunesQueVieneTexto } = getFechaNicaragua();
  if (t.toLowerCase().includes('lunes')) return `¡Perfecto reina! Te lo agendo para ${lunesQueVieneTexto} 👑 ¿A qué hora lo querés?`;
  return `Soy Gracias de Gracias Café ☕️ ¿qué te antoja hoy?`;
}

async function getReply(userText, from = 'cliente') {
  if (!chats.has(from)) chats.set(from, []);
  const history = chats.get(from);
  history.push({ role: 'user', content: userText });
  if (history.length > 12) history.shift();

  try {
    const { fechaTexto } = getFechaNicaragua();
    console.log('📅 Fecha para IA:', fechaTexto);

    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: buildPrompt() },
        ...history
      ],
      max_tokens: 600,
      temperature: 0.85
    }, { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, timeout: 15000 });

    let reply = res.data.choices[0].message.content.trim();
    
    if (reply.toLowerCase().includes('brownie') && userText.toLowerCase().includes('cafe')) {
      ultimoPedido.set(from, { detalle: reply, total: 2110 });
    }

    history.push({ role: 'assistant', content: reply });
    return reply;
  } catch (e) {
    console.log('GROQ FALLÓ:', e.response?.data || e.message);
    const local = cerebroLocal(userText, from);
    history.push({ role: 'assistant', content: local });
    return local;
  }
}

module.exports = { getReply };
