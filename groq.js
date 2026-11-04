const axios = require('axios');
const { buildPrompt } = require('./prompt');

const chats = new Map();

async function getReply(userText, from = 'cliente') {
  if (!chats.has(from)) chats.set(from, []);
  const history = chats.get(from);
  history.push({ role: 'user', content: userText });
  if (history.length > 10) history.shift();

  // SOLO saludo ultra corto en local, todo lo demás lo resuelve la IA
  const t = userText.toLowerCase().trim();
  if (t.length <= 3 && ['oe','ola'].includes(t)) {
    return `Buenas noches rey! 😁 Soy Gracias. ¿En qué te ayudo?`;
  }

  try {
    if (!process.env.GROQ_API_KEY) throw new Error('No GROQ_API_KEY');

    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: buildPrompt() },
        ...history
      ],
      max_tokens: 500,
      temperature: 0.9, // Más viva, más creativa
      top_p: 0.95
    }, { 
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      timeout: 15000 
    });

    let reply = res.data.choices[0].message.content.trim();
    console.log('✅ IA VIVA:', reply.slice(0,80));
    history.push({ role: 'assistant', content: reply });
    return reply;

  } catch (e) {
    console.log('⚠️ IA dormida:', e.response?.data?.error?.message || e.message);
    // Fallback que también tiene vida, no robot
    return `Uff rey se me fue el internet un toquesito 😅 pero te escucho. Decime de nuevo qué querías y te resuelvo.`;
  }
}

module.exports = { getReply };
