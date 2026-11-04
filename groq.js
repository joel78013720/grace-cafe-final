const axios = require('axios');
const { buildPrompt } = require('./prompt');
const inventory = require('./inventory');

const chats = new Map();

function respuestaLocal(text) {
  const t = text.toLowerCase();
  const esFriolenta = t.includes('friolenta') || t.includes('frio') || t.includes('friolenta');
  const esLluvia = t.includes('llover') || t.includes('lluvia') || t.includes('va a llover') || t.includes('llueva');
  const esJaña = t.includes('jaña') || t.includes('novia') || t.includes('ella');
  const preguntaCafe = t.includes('que cafe') || t.includes('cual cafe') || t.includes('usan');

  if (preguntaCafe) {
    return `Mirá rey, usamos Café Toro 100% de Matagalpa, de altura, lavado. Te lo recomiendo porque es intenso, afrutado y bien nica, no es café comercial aguado. Ese es el que usamos para todo ☕️🇳🇮`;
  }

  // CASO ESTRELLA: JAÑA FRIOLENTA + LLUVIA
  if (esJaña && esFriolenta && esLluvia) {
    return `Mirá rey, te recomiendo el Café Caliente con Leche + Brownie. ¿Por qué? Porque si ella es friolenta y va a llover, el fresco le va a dar más frío y va a tiritar. En cambio el calientito con leche la apapacha, le calienta las manitas y el brownie la endulza. Ahí quedas como un rey detallista 👑☕️ ¿Te lo armo?`;
  }

  if (esFriolenta && esLluvia) {
    return `Te recomiendo Café Caliente con Leche o Capuccino rey. ¿Por qué? Porque con lluvia y frío, el cuerpo pide calor. El helado o fresco te va a enfriar más. El caliente te levanta y te mantiene activo. ¿Cuál te llevo?`;
  }

  if (t.includes('cafe o fresco') || t.includes('cafe o un fresco')) {
    if (esFriolenta || esLluvia) {
      return `Café de una rey. Te explico: si es friolenta y va a llover, el fresco es mala idea porque le da más frío. El café caliente la cuida. Llevate Latte Caliente, es suave y la va a calentar rico.`;
    } else {
      return `Si hace calor, andate por el Café Helado con Mocha rey. Te lo recomiendo porque refresca, es dulce y pega rico con el calorón 🧊`;
    }
  }

  if (t.includes('que valen') || t.includes('precio') || t.includes('menu') || t.includes('que tenes')) {
    return `Dale pues, esto tenemos hoy:\n${inventory.getMenuTexto()}\n\nDecime qué se te antoja y te digo por qué te conviene.`;
  }

  return `Dale rey, tenemos:\n${inventory.getMenuTexto()}\nDecime para quién es y dónde va a estar y te recomiendo el ideal con su por qué.`;
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
      temperature: 0.7,
    }, { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, timeout: 8000 });

    let reply = res.data.choices[0].message.content.trim();
    history.push({ role: 'assistant', content: reply });
    return reply;
  } catch (e) {
    console.log('Groq fail, usando cerebro local');
    return respuestaLocal(userText);
  }
}

module.exports = { getReply };
