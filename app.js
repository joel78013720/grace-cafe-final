const express = require('express');
const { getReply } = require('./groq');
const axios = require('axios');
const app = express();
app.use(express.json());

let pedidos = [];
const memoria = new Map(); // MEMORIA POR CLIENTE

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) return res.status(200).send(challenge);
  res.sendStatus(403);
});

const vistos = new Set();
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return;
    if (vistos.has(message.id)) return;
    vistos.add(message.id);
    setTimeout(() => vistos.delete(message.id), 600000);

    const from = message.from;
    const rawText = message.text?.body || "";
    console.log(`De ${from}: ${rawText}`);

    if (!memoria.has(from)) memoria.set(from, []);
    const historial = memoria.get(from);
    historial.push({ role: "user", content: rawText });
    if (historial.length > 10) historial.shift();

    let respuesta;
    if (from === process.env.OWNER_NUMBER) {
      const { getOwnerPrompt } = require('./owner');
      respuesta = await getReply(getOwnerPrompt(rawText, historial));
    } else {
      const { getVendedoraPrompt } = require('./vendedora');
      respuesta = await getReply(getVendedoraPrompt(rawText, historial));

      const esEspecial = /entera|entero|encargo|personalizado|cumple|boda/i.test(rawText) || (respuesta && respuesta.toLowerCase().includes("propietario"));
      if (esEspecial) {
        const aviso = `🔔 PEDIDO ESPECIAL Gracias Café\nCliente: ${from}\nMensaje: ${rawText}\nHistorial: ${historial.map(h=>h.content).join(' | ')}`;
        await enviarWhatsApp(process.env.OWNER_NUMBER, aviso);
      }
    }

    if (historial) {
      historial.push({ role: "assistant", content: respuesta });
    }

    pedidos.push({ telefono: from, mensaje: rawText, respuesta, fecha: new Date().toLocaleString("es-NI"), total: respuesta });
    
    await enviarWhatsApp(from, respuesta);
  } catch (e) { console.log("Error:", e.message); }
});

app.get('/dashboard', (req, res) => {
  let html = `<html><head><meta name="viewport" content="width=device-width"><style>body{font-family:sans-serif;padding:15px;background:#FFF8F0}.card{background:#fff;padding:12px;margin:8px 0;border-radius:10px}</style></head><body><h2>☕️ Gracias Café Dashboard</h2><p>Total: ${pedidos.length}</p>`;
  pedidos.slice().reverse().slice(0,50).forEach(p=>{ html += `<div class="card">📱${p.telefono}<br>💬${p.mensaje}<br>🤖${p.respuesta}<br><small>${p.fecha}</small></div>`; });
  html+=`</body></html>`;
  res.send(html);
});
app.get('/api/pedidos', (req,res)=>res.json(pedidos));
app.get('/', (req,res)=>res.send('Gracias Cafe V3 con Memoria Activo - <a href="/dashboard">Ver Dashboard</a>'));

async function enviarWhatsApp(to, body) {
  const phoneId = process.env.WHATSAPP_PHONE_ID || process.env.PHONE_NUMBER_ID;
  try {
    await axios.post(`https://graph.facebook.com/v20.0/${phoneId}/messages`, { messaging_product:"whatsapp", to, text:{body}}, { headers:{Authorization:`Bearer ${process.env.WHATSAPP_TOKEN}`}});
  } catch(err){ console.log("WA Error:", err.response?.data || err.message); }
}
const PORT = process.env.PORT || 10000;
app.listen(PORT, ()=>console.log("V3 con memoria listo"));
