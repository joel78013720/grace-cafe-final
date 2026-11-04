const axios = require('axios');
const { buildPrompt } = require('./prompt');
const inventory = require('./inventory');

const chats = new Map();
const ultimoPedido = new Map();

function cerebroLocal(t, from) {
  t = t.toLowerCase();
  const hora = new Date().getHours();
  let saludo = hora < 12 ? 'Buenos días' : hora > 18 ? 'Buenas noches' : 'Buenas tardes';
  const cafes = inventory.getDisponibles().filter(i => i.nombre.toLowerCase().includes('café') || i.nombre.toLowerCase().includes('cafe') || i.nombre.toLowerCase().includes('latte') || i.nombre.toLowerCase().includes('capuccino')).map(i => `• ${i.nombre} - C$${i.precio}`).join('\n');

  if (t.match(/^(oe|hola|buenas|hey|hello|que tal)\b/) || t.trim().length < 5) return `${saludo} rey! 😁 Soy Gracias de Gracias Café. ¿Cómo te ayudo hoy?`;

  if (t.includes('cuanto') && (t.includes('serian') || t.includes('valen') || t.includes('vale'))) {
    const pedido = ultimoPedido.get(from);
    if (pedido) return `Dale rey, te queda así:\n${pedido.detalle}\nTotal: C$${pedido.total} ¿Te lo armo?`;
    return `Esto tenemos hoy rey:\n${inventory.getMenuTexto()}`;
  }
  if (t.includes('de cual') || t.includes('cual tienen') || t.includes('que cafe') || (t.includes('quiero') && t.includes('cafe'))) return `Dale rey, de café tenemos:\n${cafes}\n\nTodo con Café Toro 100% de Matagalpa ☕️ ¿Heladito o calientito?`;
  
  return `Cuéntame rey, ¿calientito o heladito?`;
}

async function getReply(userText, from = 'cliente') {
  if (!chats.has(from)) chats.set(from, []);
  const history = chats.get(from);
  history.push({ role: 'user', content: userText });
  if (history.length > 8) history.shift();

  try {
    if (!process.env.GROQ_API_KEY) throw new Error('No GROQ_API_KEY');

    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'openai/gpt-oss-20b', // <--- ESTE ES EL NUEVO, EL LLAMA YA MURIO
      messages: [
        { role: 'system', content: buildPrompt() + `\nSi preguntan cuanto serian, suma: Cafe Caliente con Leche C$110 + Brownie C$90 = C$200` },
        ...history
      ],
      max_tokens: 400,
      temperature: 0.8
    }, { 
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      timeout: 12000 
    });

    let reply = res.data.choices[0].message.content.trim();
    console.log('✅ IA VIVA CON GPT-OSS:', reply.slice(0,60));
    if (reply.toLowerCase().includes('brownie')) ultimoPedido.set(from, { detalle: `• Café Caliente con Leche C$110\n• Brownie C$90`, total: 200 });
    history.push({ role: 'assistant', content: reply });
    return reply;

  } catch (e) {
    const msg = e.response?.data?.error?.message || e.message;
    console.log('⚠️ GROQ FALLÓ:', msg);
    const localReply = cerebroLocal(userText, from);
    history.push({ role: 'assistant', content: localReply });
    return localReply;
  }
}

module.exports = { getReply };
