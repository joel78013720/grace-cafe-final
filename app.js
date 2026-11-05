const express = require('express');
const { getReply } = require('./gemini');
const { getVendedoraPrompt } = require('./vendedora');
const { getMenuText } = require('./menu');
const axios = require('axios');

const app = express();
app.use(express.json());

// VERIFICACION DE WEBHOOK - ESTO ES LO QUE TE FALTABA
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
  res.sendStatus(200); // Responder rapido para que no se duerma
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return;

    if (mensajesVistos.has(message.id)) return;
    mensajesVistos.add(message.id);
    setTimeout(() => mensajesVistos.delete(message.id), 600000);

    const from = message.from;
    const rawText = message.text?.body || "";
    const text = rawText.toLowerCase();

    console.log(`De ${from}: ${rawText}`);

    let respuesta;
    if (text.includes("disponib") || text.includes("menu") || text.includes("carta") || text.includes("tienen") || text.includes("tenes")) {
      respuesta = getMenuText();
    } else if (from === process.env.OWNER_NUMBER) {
      const { getOwnerPrompt } = require('./owner');
      respuesta = await getReply(getOwnerPrompt(rawText)) || "Dime Rey, ¿qué hacemos?";
    } else {
      const { getVendedoraPrompt } = require('./vendedora');
      respuesta = await getReply(getVendedoraPrompt(rawText)) || getMenuText();
    }

    if (respuesta) await enviarWhatsApp(from, respuesta);
  } catch (e) {
    console.log("Webhook error:", e.message);
  }
});

async function enviarWhatsApp(to, body) {
  try {
    await axios.post(`https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
      messaging_product: "whatsapp", to, text: { body }
    }, {
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` }
    });
    console.log(`Enviado a ${to}`);
  } catch (err) {
    console.log("WA Error:", err.response?.data || err.message);
  }
}

app.get('/', (req, res) => res.send('Gracias Cafe Live'));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server en ${PORT}`));
