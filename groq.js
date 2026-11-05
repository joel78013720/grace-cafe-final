const axios = require('axios');
const { buildPrompt, getFechaNicaragua } = require('./prompt');
const inventory = require('./inventory');

const chats = new Map();
const ultimoPedido = new Map();

function cerebroLocal(t, from) {
  const { lunesQueVieneTexto, domingoTexto, fechaMas3DiasTexto } = getFechaNicaragua();
  const lower = t.toLowerCase();
  
  if (lower.includes('lunes')) return `¡Perfecto reina! Te lo agendo para ${lunesQueVieneTexto} 👑 ¿A qué hora lo querés?`;
  if (lower.includes('domingo')) return `¡Wow pedidote para domingo! 👑 Reina para pedidos grandes necesitamos 3 días mínimo. Lo más pronto es ${fechaMas3DiasTexto}. ¿Confirmamos tu pedido de ${t.slice(0,60)} para el Domingo ${domingoTexto} a las 3pm?`;
  if (lower.includes('60') || lower.includes('brownie')) return `¡Pedidote reina! 👑 Vi que querés 60 brownies + cafés. Total aprox C$12,140. Para pedidos grandes de 10+ necesitamos 3 días. ¿Lo agendamos para el Domingo? ¿A nombre de quién?`;
  
  return `Soy Gracias de Gracias Café ☕️ ¿me repetís tu pedido? Se me fue un momentito el internet reina.`;
}

async function getReply(userText, from = 'cliente') {
  if (!chats.has(from)) chats.set(from, []);
  const history = chats.get(from);
  history.push({ role: 'user', content: userText });
  // FIX: No borres de 1 en 1, deja 20 mensajes
  if (history.length > 20) history.splice(0, history.length - 20);

  try {
    const { fechaTexto, fechaISO } = getFechaNicaragua();
    console.log('📅 Fecha para IA:', fechaTexto, '| Pedido:', userText.slice(0,100));

    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: buildPrompt() },
        ...history.slice(-10) // FIX: Manda solo últimos 10 para no pasar tokens con pedido de 120 productos
      ],
      max_tokens: 700,
      temperature: 0.8
    }, { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, timeout: 20000 });

    let reply = res.data.choices[0].message.content.trim();
    
    if (!reply) throw new Error('Vacio');
    
    if (reply.toLowerCase().includes('brownie') && userText.toLowerCase().includes('cafe')) {
      ultimoPedido.set(from, { detalle: reply, total: 2110 });
    }

    history.push({ role: 'assistant', content: reply });
    return reply;
  } catch (e) {
    console.log('GROQ FALLÓ:', e.response?.data?.error?.message || e.response?.data || e.message);
    const local = cerebroLocal(userText, from);
    history.push({ role: 'assistant', content: local });
    return local;
  }
}

module.exports = { getReply };
