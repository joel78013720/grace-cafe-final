const axios = require('axios');
const { buildPrompt } = require('./prompt');
const inventory = require('./inventory');

const chats = new Map();

function respuestaLocal(text) {
  const t = text.toLowerCase().trim();
  const esFriolenta = t.includes('friolenta') || t.includes('frio');
  const esLluvia = t.includes('llover') || t.includes('lluvia');
  const esJaña = t.includes('jaña') || t.includes('novia') || t.includes('ella');
  const preguntaCafe = t.includes('que cafe') || t.includes('cual cafe') || t.includes('usan');

  // 1. SALUDOS - PARA NO VERSE ROBOT
  if (['oe', 'oee', 'oeh', 'hola', 'buenas', 'buena', 'hey', 'hello', 'que tal', 'k tal'].some(w => t === w || t.startsWith(w + ' '))) {
    const hora = new Date().getHours();
    let saludo = 'Buenas tardes';
    if (hora < 12) saludo = 'Buenos días';
    if (hora > 18) saludo = 'Buenas noches';
    return `${saludo} rey! 😁 Soy Gracias de Gracias Café. ¿Cómo te ayudo hoy?`;
  }

  if (t.length <= 3) { // Mensajes cortos tipo "Oe" "Ya" "Ok"
    return `Dime rey, te escucho 👂 ¿Qué te apetece hoy?`;
  }

  if (preguntaCafe) {
    return `Mirá rey, usamos Café Toro 100% de Matagalpa, de altura. Te lo recomiendo porque es intenso y bien nica, no es café aguado ☕️ ¿Quieres probar uno?`;
  }

  if (esJaña && esFriolenta && esLluvia) {
    return `Mirá, para tu jaña friolenta con esta lluvia que viene, te recomiendo Café Caliente con Leche + Brownie. ¿Por qué? Porque el fresco le va a dar más frío y va a tiritar, en cambio el calientito la apapacha y la endulza. Ahí quedas como un rey detallista 👑 ¿Te lo armo?`;
  }

  if (t.includes('cafe o fresco')) {
    if (esFriolenta || esLluvia) {
      return `Café de una rey. Si es friolenta y va a llover, el fresco es mala idea. Llevate el Latte Caliente, la va a calentar rico.`;
    }
  }

  if (t.includes('que valen') || t.includes('precio') || t.includes('que tenes') || t.includes('menu')) {
    return `Esto tenemos hoy rey:\n${inventory.getMenuTexto()}\n¿Cual te va?`;
  }

  // Fallback general ya no tira menú de golpe, pregunta primero
  return `Cuéntame rey, ¿es para vos o para tu jaña? ¿Quiere algo calientito o fresquito? Así te recomiendo el ideal.`;
}

async function getReply(userText, from = 'cliente') {
  try {
    if (!chats.has(from)) chats.set(from, []);
    const history = chats.get(from);
    history.push({ role: 'user', content: userText });
    if (history.length > 6) history.shift();

    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: buildPrompt() }, ...history],
      max_tokens: 400,
      temperature: 0.8,
    }, { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, timeout: 8000 });

    let reply = res.data.choices[0].message.content.trim();
    history.push({ role: 'assistant', content: reply });
    return reply;
  } catch (e) {
    console.log('Groq fail');
    return respuestaLocal(userText);
  }
}

module.exports = { getReply };
