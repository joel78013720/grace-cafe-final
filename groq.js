const axios = require('axios');
const { buildPrompt, getFechaNicaragua } = require('./prompt');
const inventory = require('./inventory');

const chats = new Map();

function cerebroLocal(t, from) {
  const lower = t.toLowerCase();
  
  // BYPASS ANTI-BUCLE: Si preguntan café, brownies, torta, responde directo sin saludar
  if (lower.includes('cafe') || lower.includes('café')) {
    return `Sí, tenemos café con leche a C$110 y café helado a C$120, recién hecho ☕️ ¿Cuántos querés?`;
  }
  if (lower.includes('brownie')) {
    return `Sí, brownies a C$90 cada uno, recién horneados. ¿Cuántos?`;
  }
  if (lower.includes('torta')) {
    return `Tenemos torta de chocolate a C$120. Por ahora solo chocolate. ¿Cuántas?`;
  }
  if (lower.includes('esposa')) {
    return `Perfecto, ¿cómo se llama para dejarlo a su nombre?`;
  }
  if (lower.includes('hola') || lower.includes('hooa') || lower.includes('hoola')) {
    return `Dale, aquí estoy ☕️ ¿Qué necesitas?`;
  }
  
  return `Dale, aquí estoy ☕️ ¿Qué necesitas?`;
}

async function getReply(userText, from = 'cliente') {
  if (!chats.has(from)) chats.set(from, []);
  const history = chats.get(from);
  
  const lower = userText.toLowerCase().trim();
  
  // FIX 1: Si es pregunta corta repetida como "Cafe?", no uses Groq, responde directo
  if (lower === 'cafe?' || lower === 'cafe' || lower === 'café' || lower === 'café?' || lower === 'cafes?' || lower === 'cafés?') {
    const reply = cerebroLocal(lower, from);
    history.push({ role: 'user', content: userText });
    history.push({ role: 'assistant', content: reply });
    console.log('BYPASS CAFE ->', reply);
    return reply;
  }
  
  if (lower.includes('brownie') && lower.length < 15) {
    const reply = cerebroLocal(lower, from);
    history.push({ role: 'user', content: userText });
    history.push({ role: 'assistant', content: reply });
    return reply;
  }

  history.push({ role: 'user', content: userText });
  if (history.length > 20) history.splice(0, history.length - 20);

  try {
    const { fechaTexto } = getFechaNicaragua();
    console.log('📅 Para IA:', fechaTexto, '| Msg:', userText);

    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: buildPrompt() },
        ...history.slice(-8)
      ],
      max_tokens: 120,
      temperature: 0.5
    }, { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, timeout: 15000 });

    let reply = res.data.choices[0].message.content.trim();
    if (!reply) throw new Error('Vacio');
    
    history.push({ role: 'assistant', content: reply });
    return reply;
  } catch (e) {
    console.log('GROQ FALLÓ:', e.response?.data?.error?.message || e.message);
    const local = cerebroLocal(userText, from);
    history.push({ role: 'assistant', content: local });
    return local;
  }
}

module.exports = { getReply };
