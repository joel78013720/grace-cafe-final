const express = require('express');
const { getReply } = require('./geminis');
const { getOwnerPrompt } = require('./owner');
const { getVendedoraPrompt } = require('./vendedora');
const { getMenuText } = require('./menu');

const app = express();
app.use(express.json());

// ESTO EVITA QUE REPITA 2 VECES EL MENSAJE
const mensajesVistos = new Set();

app.post('/webhook', async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];
    
    if (!message) return res.sendStatus(200);

    const messageId = message.id;
    const from = message.from;
    const text = message.text?.body?.toLowerCase() || "";

    // Si ya vimos este ID, no contestar de nuevo
    if (mensajesVistos.has(messageId)) {
      return res.sendStatus(200);
    }
    mensajesVistos.add(messageId);
    setTimeout(() => mensajesVistos.delete(messageId), 1000 * 60 * 10);

    console.log(`Mensaje de ${from}: ${text}`);

    let respuesta;

    // 1. SI PIDE MENU / DISPONIBLE
    if (text.includes("disponible") || text.includes("menu") || text.includes("que tienen") || text.includes("que tenes") || text.includes("carta")) {
      respuesta = getMenuText();
    } 
    // 2. SI ES DUEÑO
    else if (from === process.env.OWNER_NUMBER) {
      const prompt = getOwnerPrompt(text);
      respuesta = await getReply(prompt);
    } 
    // 3. SI ES CLIENTE NORMAL
    else {
      const prompt = getVendedoraPrompt(text);
      respuesta = await getReply(prompt);
    }

    if (respuesta) {
      await enviarWhatsApp(from, respuesta);
    }

    res.sendStatus(200);
  } catch (e) {
    console.log("Webhook error:", e.message);
    res.sendStatus(200);
  }
});

async function enviarWhatsApp(to, body) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  
  await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to,
      text: { body: body }
    })
  });
}

app.get('/', (req, res) => res.send('Bot Gracias Cafe Live'));
app.listen(10000, () => console.log('Server en 10000'));
