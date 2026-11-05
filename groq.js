const axios = require('axios');
const { buildPrompt, getFechaNicaragua } = require('./prompt');
const inventory = require('./inventory');

const chats = new Map();

function cerebroLocal(t) {
  // Este ya no es tonto, este busca en tu inventario real
  try {
    const menu = inventory.getMenuTexto();
    const lower = t.toLowerCase();
    
    if (lower.includes('comer') || lower.includes('comida') || lower.includes('que tenes') || lower.includes('que tienes') || lower.includes('para comer')) {
      return `Claro! Para comer tengo:\n${menu}\n¿Qué te gustaría? ¿Brownies o torta?`;
    }
    
    // Para cualquier otra cosa, responde con menú completo - nunca "Dale aquí estoy"
    return `Dale! Tenemos esto hoy:\n${menu}\nDecime qué querés y te lo armo.`;
  } catch (e) {
    return `Tenemos café con leche C$110, café helado C$120, brownies C$90 y torta chocolate C$120. ¿Qué te gustaría pedir?`;
  }
}

async function getReply(userText, from = 'cliente') {
  if (!chats.has(from)) chats.set(from, []);
  const history = chats.get(from);
  history.push({ role: 'user', content: userText });
  if (history.length > 20) history.splice(0, history.length - 20);

  try {
    console.log('🧠 IA PENSANDO:', userText);
    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.1-8b-instant', // Este nunca se cae
      messages: [
        { role: 'system', content: buildPrompt() },
        ...history.slice(-10)
      ],
      max_tokens: 200,
      temperature: 0.6
    }, { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, timeout: 20000 });

    let reply = res.data.choices[0].message.content.trim();
    if (!reply) throw new Error('Vacio');
    
    console.log('✅ IA RESPONDIÓ:', reply);
    history.push({ role: 'assistant', content: reply });
    return reply;
    
  } catch (e) {
    console.log('⚠️ GROQ FALLÓ, USANDO CEREBRO LOCAL INTELIGENTE:', e.response?.data?.error?.message || e.message);
    const local = cerebroLocal(userText);
    history.push({ role: 'assistant', content: local });
    return local;
  }
}

module.exports = { getReply };
