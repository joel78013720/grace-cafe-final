const express = require('express');
const axios = require('axios');
const { getReply } = require('./groq');
const { saveOrder } = require('./sheets');
const { createEvent } = require('./calendar');
const { routeMessage } = require('./menu');
const { transcribeAudio } = require('./audio');

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'graciascafe123';
const OWNER_NUMBER = process.env.OWNER_NUMBER || '50585219636';

async function sendWhatsApp(to, text) {
  return axios.post(`https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`,
    { messaging_product: 'whatsapp', to, text: { body: text } },
    { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } }
  );
}

function esDueña(from) {
  const c = from.replace(/\D/g,'');
  return c === '50585219636' || c.includes('85219636');
}

app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) return res.send(req.query['hub.challenge']);
  res.send('Gracias Cafe Activo');
});

app.post('/webhook', async (req, res) => {
  try {
    const value = req.body.entry?.[0]?.changes?.[0]?.value;
    const msg = value?.messages?.[0];
    if (!msg) return res.sendStatus(200);

    const from = msg.from;
    let text = msg.text?.body || '';

    if (esDueña(from)) {
      if (text.toLowerCase().includes('subir estado') || text.toLowerCase().startsWith('estado:')) {
        const desc = text.replace(/subir estado:?|estado:/i, '').trim() || 'Promo Gracias Café';
        await sendWhatsApp(from, `¡Listo reina! 👑 Estado guardado: "${desc}" 📸`);
        return res.sendStatus(200);
      }
      if (msg.type === 'image') {
        await sendWhatsApp(from, `📸 Imagen recibida reina. Escribí: "subir estado: texto promo"`);
        return res.sendStatus(200);
      }
    }

    if (msg.type === 'audio' || msg.type === 'voice') {
      const audioId = msg.audio?.id || msg.voice?.id;
      text = await transcribeAudio(audioId) || '';
      if (!text) { await sendWhatsApp(from, '🎙️ No te escuché bien rey'); return res.sendStatus(200); }
    }

    if (!text && msg.type !== 'image') return res.sendStatus(200);

    const action = routeMessage(text);
    let reply = await getReply(text, from);

    if (action.type === 'order') await saveOrder({ cliente: from, pedido: text });
    if (action.type === 'calendar') await createEvent({ cliente: from, pedido: text });
    if (!reply) reply = 'Soy Gracias ☕️ ¿qué te antoja hoy?';

    await sendWhatsApp(from, reply);

    if (action.type === 'order' || action.type === 'calendar' || text.toLowerCase().includes('agenda')) {
      const aviso = `🔔 NUEVO PEDIDO Gracias Café 👑\nCliente: ${from}\nDice: "${text}"\nIA: "${reply}"`;
      try { await sendWhatsApp(OWNER_NUMBER, aviso); } catch(e){}
    }

    res.sendStatus(200);
  } catch (e) { console.log(e.response?.data || e.message); res.sendStatus(200); }
});

app.get('/', (req, res) => res.send('Gracias Cafe Live - Dueña 85219636 OK'));
app.listen(process.env.PORT || 10000, () => console.log('Live Dueña OK'));
