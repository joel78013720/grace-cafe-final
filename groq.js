const axios = require('axios');
const { buildPrompt } = require('./prompt');
const inventory = require('./inventory');

const chats = new Map();

// CEREBRO LOCAL - IGUALITO A LA IA, PARA CUANDO GROQ SE DUERME
function cerebroLocal(t) {
  t = t.toLowerCase();
  const hora = new Date().getHours();
  let saludo = hora < 12 ? 'Buenos días' : hora > 18 ? 'Buenas noches' : 'Buenas tardes';
  
  const cafes = inventory.getDisponibles().filter(i => 
    i.nombre.toLowerCase().includes('café') || i.nombre.toLowerCase().includes('cafe') || 
    i.nombre.toLowerCase().includes('latte') || i.nombre.toLowerCase().includes('capuccino')
  ).map(i => `• ${i.nombre} - C$${i.precio}`).join('\n');

  if (t.match(/^(oe|hola|buenas|hey|hello|que tal)\b/) || t.length < 5) {
    return `${saludo} rey! 😁 Soy Gracias de Gracias Café. ¿Cómo te ayudo hoy?`;
  }
  if (t.includes('de cual') || t.includes('cual tienen') || t.includes('que cafe') || t.includes('que tienen') || (t.includes('quiero') && t.includes('cafe'))) {
    return `Dale rey, de café tenemos:\n${cafes}\n\nTodo con Café Toro 100% de Matagalpa, de altura, bien nica ☕️ ¿Heladito o calientito te va?`;
  }
  if (t.includes('friolenta') || t.includes('frio') || t.includes('llover') || t.includes('lluvia')) {
    if (t.includes('jaña') || t.includes('novia') || t.includes('ella')) {
      return `Mirá rey, para tu jaña friolenta con esta lluvia, 100% Café Caliente con Leche + Brownie. Te explico por qué: el fresco le va a dar más frío y va a tiritar, el calientito la apapacha y la endulza. Quedas como un rey detallista 👑 ¿Te lo armo?`;
    }
    return `Con este frío y lluvia rey, andate por lo calientito: Capuccino o Café Caliente con Leche. El fresco te enfría más. ¿Cuántos?`;
  }
  if (t.includes('que valen') || t.includes('precio') || t.includes('menu')) {
    return `Esto tenemos hoy rey:\n${inventory.getMenuTexto()}\n¿Cual te antoja?`;
  }
  if (t.includes('usan') && t.includes('cafe')) {
    return `Usamos Café Toro 100% de Matagalpa rey, de altura, lavado, intenso y afrutado. Puro nica, nada aguado ☕️🇳🇮`;
  }
  return `Cuéntame rey, ¿lo quieres calientito o heladito? Decime para quién es y te recomiendo el ideal con su por qué.`;
}

async function getReply(userText, from = 'cliente') {
  // Memoria
  if (!chats.has(from)) chats.set(from, []);
  const history = chats.get(from);
  history.push({ role: 'user', content: userText });
  if (history.length > 8) history.shift();

  // 1. INTENTO DE DESPERTAR IA - GROQ
  try {
    if (!process.env.GROQ_API_KEY) {
      console.log('❌ NO HAY GROQ_API_KEY EN RENDER');
      throw new Error('No key');
    }

    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: buildPrompt() },
        ...history
      ],
      max_tokens: 400,
      temperature: 0.85, // Más humana
      top_p: 0.9
    }, { 
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      timeout: 12000 
    });

    let reply = res.data.choices[0].message.content.trim();
    console.log('✅ IA DESPIERTA:', reply.slice(0,50));
    history.push({ role: 'assistant', content: reply });
    return reply;

  } catch (e) {
    // 2. SI GROQ FALLA, USA EL CEREBRO LOCAL (NO SE NOTA QUE ES LOCAL)
    console.log('⚠️ IA DORMIDA, USANDO CEREBRO LOCAL:', e.response?.data?.error?.message || e.message);
    const localReply = cerebroLocal(userText);
    history.push({ role: 'assistant', content: localReply });
    return localReply;
  }
}

module.exports = { getReply };
