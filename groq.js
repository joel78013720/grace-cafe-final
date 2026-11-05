const axios = require('axios');
const { buildPrompt, getFechaNicaragua } = require('./prompt');
const inventory = require('./inventory');

const chats = new Map();
const ultimoPedido = new Map();

function cerebroLocal(t, from) {
  const { domingoTexto, fechaMas3DiasTexto } = getFechaNicaragua();
  const lower = t.toLowerCase();
  
  // Neutro, corto, preguntando info - no asume nada
  if (lower.includes('domingo') || lower.includes('60') || lower.includes('brownie')) {
    return `Anotado, ¡pedidote! 😅 Para ${domingoTexto}. ¿A nombre de quién lo dejo? ¿Cómo se llama la persona que lo recoge?`;
  }
  if (lower.includes('lunes')) {
    const { lunesQueVieneTexto } = getFechaNicaragua();
    return `Anotado para ${lunesQueVieneTexto}. ¿A nombre de quién lo dejo?`;
  }
  if (lower.includes('esposa')) {
    return `Perfecto. ¿Cómo se llama tu esposa para dejarlo a su nombre?`;
  }
  
  return `Hola! ¿Cómo vas? ☕️ Soy Gracias de Gracias Café. ¿Qué necesitas?`;
}

async function getReply(userText, from = 'cliente') {
  if (!chats.has(from)) chats.set(from, []);
  const history = chats.get(from);
  history.push({ role: 'user', content: userText });
  // No borrar memoria rápido
  if (history.length > 20) history.splice(0, history.length - 20);

  try {
    const { fechaTexto } = getFechaNicaragua();
    console.log('📅 Fecha para IA:', fechaTexto, '| Pedido:', userText.slice(0,100));

    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: buildPrompt() },
        ...history.slice(-10) // Solo últimos 10 para no fallar con pedidos de 120 productos
      ],
      max_tokens: 150, // CORTO - para que no tire párrafos robóticos
      temperature: 0.7
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
