const express = require('express');
const { getReply } = require('./groq');
const axios = require('axios');
const app = express();
app.use(express.json());

let pedidos = [];
const memoria = new Map(); 
const vistos = new Set();

app.get('/webhook', (req, res) => {
  const token = req.query['hub.verify_token'];
  if (req.query['hub.mode'] === 'subscribe' && token === process.env.VERIFY_TOKEN) return res.status(200).send(req.query['hub.challenge']);
  res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message || vistos.has(message.id)) return;
    vistos.add(message.id);
    setTimeout(()=>vistos.delete(message.id), 600000);

    const from = message.from;
    const rawText = message.text?.body || "";
    if (!memoria.has(from)) memoria.set(from, []);
    const historial = memoria.get(from);
    historial.push({ role: "user", content: rawText });
    if (historial.length > 12) historial.shift();

    let respuesta;
    if (from === process.env.OWNER_NUMBER) {
      const { getOwnerPrompt } = require('./owner');
      respuesta = await getReply(getOwnerPrompt(rawText, historial));
    } else {
      const { getVendedoraPrompt } = require('./vendedora');
      respuesta = await getReply(getVendedoraPrompt(rawText, historial));

      // SOLO ENVIAR AL DUEÑO SI ES ESPECIAL O SI ES PEDIDO CONFIRMADO
      const esEspecial = /entera|entero|decorativo|cumple|personalizado|esposa|regalo/i.test(rawText + " " + respuesta);
      const esConfirmado = /confirmo|confirme|si,|sí,|confirmado|eso quiero|dale|perfecto.*si/i.test(rawText.toLowerCase());
      const laIAEstaPidiendoConfirmacion = /me confirma/i.test(respuesta.toLowerCase());

      // Guardamos si la IA ya pidió confirmación
      let debeEnviarAlDueno = false;
      let tipoPedido = "Consulta";

      if (esEspecial) {
        debeEnviarAlDueno = true;
        tipoPedido = "🌟 ENCARGO ESPECIAL";
      } 
      // Si el cliente confirma DESPUES de que la IA pidió confirmación, entonces sí es pedido confirmado
      if (esConfirmado && !laIAEstaPidiendoConfirmacion) {
        debeEnviarAlDueno = true;
        tipoPedido = "✅ PEDIDO CONFIRMADO";
      }

      if (debeEnviarAlDueno) {
        const aviso = `${tipoPedido} - Gracias Café\n\nCliente: ${from}\nHistorial:\n${historial.map(h=>h.content).join('\n')}\n\nÚltimo: ${rawText}`;
        await enviarWhatsApp(process.env.OWNER_NUMBER, aviso);
        console.log("Enviado al dueño: " + tipoPedido);
      }
    }

    historial.push({ role: "assistant", content: respuesta });
    pedidos.push({ telefono: from, mensaje: rawText, fecha: new Date().toLocaleString("es-NI"), tipo: respuesta });
    await enviarWhatsApp(from, respuesta);
  } catch(e){ console.log(e.message); }
});

app.get('/dashboard', (req,res)=>{
  let html = `<meta name="viewport" content="width=device-width"><style>body{font-family:sans-serif;padding:15px;background:#FFF8F0}.card{background:#fff;padding:12px;margin:8px 0;border-radius:10px}</style><h2>☕️ Panel Gracias Café</h2><p>Pedidos: ${pedidos.length}</p>`;
  pedidos.slice().reverse().forEach(p=>html+=`<div class="card">📱${p.telefono}<br>💬${p.mensaje}<br><small>${p.fecha}</small></div>`);
  res.send(html);
});
app.get('/', (req,res)=>res.send('V6 Activo - <a href="/dashboard">Dashboard</a>'));

async function enviarWhatsApp(to, body) {
  const phoneId = process.env.WHATSAPP_PHONE_ID || process.env.PHONE_NUMBER_ID;
  try {
    await axios.post(`https://graph.facebook.com/v20.0/${phoneId}/messages`, { messaging_product:"whatsapp", to, text:{body}}, { headers:{Authorization:`Bearer ${process.env.WHATSAPP_TOKEN}`}});
  } catch(err){ console.log(err.response?.data || err.message); }
}
app.listen(process.env.PORT || 10000, ()=>console.log("V6 Anti-spam listo"));
