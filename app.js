const express = require('express');
const { getReply } = require('./groq');
const axios = require('axios');

const app = express();
app.use(express.json());

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('Webhook verificado');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

const mensajesVistos = new Set();

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return;

    if (mensajesVistos.has(message.id)) return;
    mensajesVistos.add(message.id);
    setTimeout(() => mensajesVistos.delete(message.id), 600000);

    const from = message.from;
    const rawText = message.text?.body || "";
    console.log(`De ${from}: ${rawText}`);

    let respuesta;
    if (from === process.env.OWNER_NUMBER) {
      const { getOwnerPrompt } = require('./owner');
      respuesta = await getReply(getOwnerPrompt(rawText));
    } else {
      const { getVendedoraPrompt } = require('./vendedora');
      respuesta = await getReply(getVendedoraPrompt(rawText));
    }

    if (!respuesta) {
      respuesta = "Hola Rey! Soy de Gracias Café ☕️ ¿En qué te ayudo hoy?";
    }

    await enviarWhatsApp(from, respuesta);
  } catch (e) {
    console.log("Webhook error:", e.message);
  }
});

async function enviarWhatsApp(to, body) {
  try {
    await axios.post(`https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
      messaging_product: "whatsapp", to, text: { body }
    }, { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } });
    console.log(`Enviado a ${to}`);
  } catch (err) {
    console.log("WA Error:", err.response?.data || err.message);
  }
}

app.get('/', (req, res) => res.send('Gracias Cafe Live con Groq - SOLO IA'));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server en ${PORT} con Groq SOLO IA`));
