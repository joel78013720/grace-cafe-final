const express = require('express');
const { getReply } = require('./gemini');
const { getOwnerPrompt } = require('./owner');
const { getVendedoraPrompt } = require('./vendedora');
const { getMenuText } = require('./menu');
const axios = require('axios');

const app = express();
app.use(express.json());

const mensajesVistos = new Set();

app.post('/webhook', async (req, res) => {
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return res.sendStatus(200);

    if (mensajesVistos.has(message.id)) return res.sendStatus(200);
    mensajesVistos.add(message.id);
    setTimeout(() => mensajesVistos.delete(message.id), 1000 * 60 * 10);

    const from = message.from;
    const text = message.text?.body?.toLowerCase() || "";
    const rawText = message.text?.body || "";

    console.log(`Mensaje de ${from}: ${text}`);

    let respuesta;

    if (text.includes("disponib") || text.includes("menu") || text.includes("carta") || text.includes("tienen") || text.includes("tenes")) {
      respuesta = getMenuText();
    } else if (from === process.env.OWNER_NUMBER) {
      const prompt = getOwnerPrompt(rawText);
      respuesta = await getReply(prompt);
    } else {
      const prompt = getVendedoraPrompt(rawText);
      respuesta = await getReply(prompt);
    }

    if (respuesta) await enviarWhatsApp(from, respuesta);
    res.sendStatus(200);
  } catch (e) {
    console.log("Webhook error:", e.message);
    res.sendStatus(200);
  }
});

async function enviarWhatsApp(to, body) {
  try {
    await axios.post(`https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
      messaging_product: "whatsapp",
      to: to,
      text: { body: body }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.log("WA Error:", err.response?.data || err.message);
  }
}

app.get('/', (req, res) => res.send('Bot Gracias Cafe Live'));
app.listen(10000, () => console.log('Server en 10000'));
