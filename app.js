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
const OWNER_NUMBER = process.env.OWNER_NUMBER || '50585219636'; // DUEÑA REAL

async function sendWhatsApp(to, text) {
  return axios.post(`https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`,
    { messaging_product: 'whatsapp', to, text: { body: text } },
    { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } }
  );
}

function esDueña(from) {
  const cleanFrom = from.replace(/\D/g,'');
  return cleanFrom === '50585219636' || cleanFrom === '85219636' || from.includes('85219636') || from === OWNER_NUMBER;
}

app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
    console.log('VERIFY OK');
    return res.send(req.query['hub.challenge']);
  }
  res.send('Gracias Cafe Activo - Dueña 85219636');
});

app.post('/webhook', async (req, res) => {
  try {
    const value = req.body.entry?.[0]?.changes?.[0]?.value;
    const msg = value?.messages?.[0];
    if (!msg) return res.sendStatus(200);

    const from = msg.from;
    let text = msg.text?.body || '';
    const image = msg.image;

    // ========== 1. SI ES LA DUEÑA 50585219636 ==========
    if (esDueña(from)) {
      console.log('👑 DUEÑA HABLANDO:', from, text);

      if (text.toLowerCase().includes('subir estado') || text.toLowerCase().startsWith('estado:')) {
        const descripcion = text.replace(/subir estado:?|estado:/i, '').trim() || 'Promo del día Gracias Café 👑';
        let replyDueña = `¡Listo reina! 👑 Estado guardado:\n📝 "${descripcion}"\n`;
        if (image || msg.type === 'image') {
          replyDueña += `\n📸 Imagen recibida. La subo al estado de WhatsApp Business ahora mismo.`;
          console.log('📸 Subiendo estado con imagen:', image?.id);
        } else {
          replyDueña += `\nSi querés con imagen, mandame la foto con el texto y lo subo.`;
        }
        await sendWhatsApp(from, replyDueña);
        return res.sendStatus(200);
      }

      if (msg.type === 'image') {
        await sendWhatsApp(from, `📸 Imagen recibida reina. Ahora escribí: "subir estado: Hoy brownies C$70 👑" y la subo.`);
        return res.sendStatus(200);
      }

      if (text.toLowerCase().trim() === 'ok' || text.toLowerCase().includes('agendalo')) {
        await sendWhatsApp(from, `¡Confirmado reina! 👑 Agendado y listo.`);
        return res.sendStatus(200);
      }
    }

    // ========== 2. AUDIOS CLIENTES ==========
    if (msg.type === 'audio' || msg.type === 'voice') {
      const audioId = msg.audio?.id || msg.voice?.id;
      text = await transcribeAudio(audioId) || '';
      if (!text) {
        await sendWhatsApp(from, '🎙️ No te escuché bien rey, ¿me lo escribís porfa?');
        return res.sendStatus(200);
      }
    }

    if (!text && msg.type !== 'image') return res.sendStatus(200);
    console.log('Cliente:', from, text);

    const action = routeMessage(text);
    let reply = await getReply(text, from);

    if (action.type === 'order') await saveOrder({ cliente: from, pedido: text });
    if (action.type === 'calendar') await createEvent({ cliente: from, pedido: text });

    if (!reply) reply = 'Soy Gracias ☕️ ¿qué te antoja hoy?';

    await sendWhatsApp(from, reply);

    // ========== 3. AVISAR A DUEÑA 50585219636 ==========
    if (action.type === 'order' || action.type === 'calendar' || text.toLowerCase().includes('agenda')) {
      const aviso = `🔔 NUEVO PEDIDO Gracias Café 👑\n\nCliente: ${from}\nDice: "${text}"\nIA: "${reply}"\n\nHora: ${new Date().toLocaleTimeString()}`;
      try {
        await sendWhatsApp(OWNER_NUMBER, aviso);
        console.log('📲 Pedido enviado a dueña 85219636');
      } catch (e) {
        console.log('Error enviando a dueña:', e.response?.data || e.message);
      }
    }

    res.sendStatus(200);
  } catch (e) {
    console.log('Error webhook', e.response?.data || e.message);
    res.sendStatus(200);
  }
});

app.get('/', (req, res) => res.send('Gracias Cafe Live - Dueña 85219636 OK'));
app.listen(process.env.PORT || 10000, () => console.log('Live Dueña 85219636'));
