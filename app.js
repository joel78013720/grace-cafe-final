const express = require('express');
const { getReply } = require('./groq');
const axios = require('axios');

const app = express();
app.use(express.json());

// --- BASE DE DATOS SIMPLE DE PEDIDOS ---
let pedidos = []; // Aqui se guardan todos

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
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

    // Guardar pedido
    const nuevoPedido = {
      id: Date.now(),
      telefono: from,
      mensaje: rawText,
      fecha: new Date().toLocaleString("es-NI"),
      tipo: "normal"
    };

    let respuesta;
    if (from === process.env.OWNER_NUMBER) {
      const { getOwnerPrompt } = require('./owner');
      respuesta = await getReply(getOwnerPrompt(rawText));
    } else {
      const { getVendedoraPrompt } = require('./vendedora');
      respuesta = await getReply(getVendedoraPrompt(rawText));
      
      // DETECTAR SI ES PEDIDO ESPECIAL -> TRASPASO AL PROPIETARIO
      const esEspecial = rawText.toLowerCase().includes("entera") || rawText.toLowerCase().includes("entero") || rawText.toLowerCase().includes("encargo") || rawText.toLowerCase().includes("personalizado") || rawText.toLowerCase().includes("cumple") || (respuesta && respuesta.toLowerCase().includes("consulto al propietario"));

      if (esEspecial) {
        nuevoPedido.tipo = "ESPECIAL - Torta Entera";
        // Le escribe automaticamente al propietario
        const avisoAlDueño = `🔔 NUEVO PEDIDO ESPECIAL - Gracias Café\n\nCliente: ${from}\nDice: ${rawText}\n\nRespuesta de IA: ${respuesta}\n\nRespondé a este cliente desde tu WhatsApp.`;
        await enviarWhatsApp(process.env.OWNER_NUMBER, avisoAlDueño);
        console.log("Pedido especial traspasado al dueño");
      }
    }

    pedidos.push(nuevoPedido);
    if (pedidos.length > 100) pedidos.shift(); // guarda los ultimos 100

    if (!respuesta) respuesta = "Hola! Gracias por escribir a Gracias Café ☕️ ¿En qué le ayudamos?";
    await enviarWhatsApp(from, respuesta);

  } catch (e) {
    console.log("Webhook error:", e.message);
  }
});

// --- DASHBOARD PARA TU CLIENTE ---
app.get('/dashboard', (req, res) => {
  let html = `
  <html><head><meta charset="utf-8"><title>Gracias Café - Dashboard</title>
  <style>body{font-family:sans-serif;padding:20px;background:#FFF8F0} .card{background:white;padding:15px;margin:10px 0;border-radius:10px;box-shadow:0 2px 5px #ddd} .especial{background:#FFE0B2} h1{color:#5D4037}</style>
  </head><body>
  <h1>☕️ Gracias Café - Panel de Pedidos</h1>
  <p>Horario: Mar a Vie 5:30pm - 9:40pm | Total pedidos hoy: ${pedidos.length}</p>
  <a href="/api/pedidos" target="_blank">Ver API JSON para tu Calendario</a>
  <hr>
  `;
  pedidos.slice().reverse().forEach(p => {
    html += `<div class="card ${p.tipo.includes('ESPECIAL')?'especial':''}"><b>${p.tipo}</b><br>📱 ${p.telefono}<br>💬 ${p.mensaje}<br><small>${p.fecha}</small></div>`;
  });
  html += `</body></html>`;
  res.send(html);
});

app.get('/api/pedidos', (req, res) => res.json(pedidos));
app.get('/', (req, res) => res.redirect('/dashboard'));

async function enviarWhatsApp(to, body) {
  const phoneId = process.env.WHATSAPP_PHONE_ID || process.env.PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;
  try {
    await axios.post(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      messaging_product: "whatsapp", to, text: { body }
    }, { headers: { Authorization: `Bearer ${token}` } });
    console.log(`Enviado a ${to}`);
  } catch (err) {
    console.log("WA Error:", err.response?.data || err.message);
  }
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`V2 Live en ${PORT}`));
