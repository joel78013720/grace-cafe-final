const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

let pedidos = [];
const memoria = new Map(); // ahora guarda {historial: [], nombre: null}
const vistos = new Set();
const ultimaInteraccion = new Map();
const bloqueados = new Set();

const OWNER_NUMBER = "50583872855";

function getVendedoraPrompt(userMessage, historial, nombreActual) {
  try {
    const { getVendedoraPrompt: fn } = require('./vendedora');
    return fn(userMessage, historial, nombreActual);
  } catch(e) {
    return `Eres Gracia. Responde corto. Historial: ${historial.slice(-5).join('|')} Mensaje: ${userMessage}`;
  }
}

function getOwnerPrompt(userMessage, historial) {
  try {
    const { getOwnerPrompt: fn } = require('./owner');
    return fn(userMessage, historial);
  } catch(e) {
    return `Eres asistente de la dueña. Responde corto a: ${userMessage}`;
  }
}

app.get('/webhook', (req, res) => {
  const token = req.query['hub.verify_token'];
  if (req.query['hub.mode'] === 'subscribe' && token === process.env.VERIFY_TOKEN) return res.status(200).send(req.query['hub.challenge']);
  res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const entry = req.body.entry?.[0]?.changes?.[0]?.value;
    const message = entry?.messages?.[0];
    if (!message || vistos.has(message.id)) return;
    vistos.add(message.id);
    setTimeout(()=>vistos.delete(message.id), 600000);

    const from = message.from;
    let rawText = message.text?.body || message.image?.caption || "";
    if (!rawText) return;

    if (/^\s*STOP\s*$/i.test(rawText)) {
      bloqueados.add(from);
      await enviarWhatsApp(from, "Entendido 🫶 No te enviaremos más promos. Escribe: QUIERO PROMOS para volver.");
      return;
    }
    if (/QUIERO PROMOS/i.test(rawText)) {
      bloqueados.delete(from);
      await enviarWhatsApp(from, "¡Perfecto! Ya estás de nuevo en promos ☕️");
      return;
    }

    if (!memoria.has(from)) memoria.set(from, { historial: [], nombre: null });
    const data = memoria.get(from);
    
    // Detecta nombre y lo guarda PERMANENTE
    const matchNombre = rawText.match(/(?:a nombre de|soy|me llamo|mi nombre es)\s+([A-Za-zÁÉÍÓÚáéíóú ]{2,25})/i);
    if (matchNombre) data.nombre = matchNombre[1].trim();
    else if (/^[A-Za-zÁÉÍÓÚáéíóú]{3,20}$/.test(rawText.trim()) && !/^(hola|menu|si|no|bueno|hi|hey|q|que)$/i.test(rawText.trim())) {
      if (!data.nombre) data.nombre = rawText.trim();
    }

    data.historial.push({ role: "user", content: rawText });
    if (data.historial.length > 14) data.historial.shift();
    ultimaInteraccion.set(from, Date.now());

    let respuesta;

    if (from === OWNER_NUMBER) {
      const { getReply } = require('./groq');
      if (rawText.toUpperCase().startsWith("ESTADO:")) {
        const textoEstado = rawText.replace(/ESTADO:/i, "").trim();
        pedidos.push({ telefono: "ESTADO", nombre: "PROMO", mensaje: textoEstado, fecha: new Date().toLocaleString("es-NI", {timeZone: 'America/Managua'}) });
        await enviarWhatsApp(from, `✅ Guardé promo: "${textoEstado}" - Escribe ENVIAR PROMO`);
        return;
      }
      if (/ENVIAR PROMO/i.test(rawText)) {
        const ahora = Date.now();
        const ventana = 24 * 60 * 60 * 1000;
        const ultimos = [...ultimaInteraccion.entries()].filter(([tel,t])=> tel!==OWNER_NUMBER && (ahora-t)<ventana && !bloqueados.has(tel)).map(([tel])=>tel).slice(-15);
        const ultimaPromo = pedidos.filter(p=>p.telefono==="ESTADO").slice(-1)[0];
        if(!ultimaPromo){ await enviarWhatsApp(from, "No hay promo"); return; }
        if(ultimos.length===0){ await enviarWhatsApp(from, "⚠️ Nadie en ventana 24h"); return; }
        for(const cli of ultimos) await enviarWhatsApp(cli, `☕️ *Gracias Café*\n\n${ultimaPromo.mensaje}`);
        await enviarWhatsApp(from, `✅ Enviada a ${ultimos.length}`);
        return;
      }
      respuesta = await getReply(getOwnerPrompt(rawText, data.historial));
      await enviarWhatsApp(from, respuesta);
      data.historial.push({ role: "assistant", content: respuesta });
      return;
    }

    const { getReply } = require('./groq');
    respuesta = await getReply(getVendedoraPrompt(rawText, data.historial, data.nombre));

    const lowerResp = respuesta.toLowerCase();
    const esEspecial = /entera|libra|torta|vainilla|chocolate|30 persona|encargo/i.test((rawText + " " + respuesta).toLowerCase());
    const clienteDiceSi = /^(si|sí|confirmo)/i.test(rawText.trim());

    if (esEspecial || clienteDiceSi) {
      // FORMATO QUE PEDISTE
      let pedidoStr = rawText;
      if (/30.*cafe|cafe.*30/i.test(data.historial.map(h=>h.content).join(' '))) pedidoStr = "30 cafés y 8 slices de vainilla";
      if (/torta entera/i.test(data.historial.map(h=>h.content).join(' ').toLowerCase())) {
        const sabor = data.historial.map(h=>h.content).join(' ').toLowerCase().includes('chocolate') ? 'chocolate' : 'a definir';
        pedidoStr = `1 torta entera de ${sabor}`;
      }
      
      let total = "";
      if (pedidoStr.includes("30 cafés")) total = "C$1330"; // 30*35 + 8*35 = 1330
      if (pedidoStr.includes("torta")) total = "C$850 (2 libras)";

      const fechaRecojo = new Date();
      fechaRecojo.setDate(fechaRecojo.getDate() + 3);

      const aviso = `Nombre: ${data.nombre || 'Sin nombre'}\nPedido: ${pedidoStr}\nTotal: ${total || 'Por cotizar'}\nPasa a recoger El dia ${fechaRecojo.toLocaleDateString("es-NI")}\nTel: wa.me/${from}\n\n¿Le confirmamos su orden?`;
      await enviarWhatsApp(OWNER_NUMBER, aviso);
    }

    data.historial.push({ role: "assistant", content: respuesta });
    pedidos.push({ telefono: from, nombre: data.nombre || 'Sin nombre', mensaje: rawText, fecha: new Date().toLocaleString("es-NI") });
    await enviarWhatsApp(from, respuesta);

  } catch(e){ console.log("ERROR:", e.message, e.stack); }
});

app.get('/dashboard', (req,res)=>{
  let html = `<h2>☕️ Panel 83872855</h2>`;
  pedidos.slice().reverse().slice(0,100).forEach(p=>{ html+=`<div style="border:1px solid #ccc;padding:8px;margin:5px"><b>${p.telefono}</b> - ${p.nombre}<br>${p.mensaje}</div>`; });
  res.send(html);
});
app.get('/', (req,res)=>res.send('Activo V21 Independiente'));
async function enviarWhatsApp(to, body) {
  const phoneId = process.env.WHATSAPP_PHONE_ID || process.env.PHONE_NUMBER_ID;
  if (!phoneId || !process.env.WHATSAPP_TOKEN) return;
  try {
    await axios.post(`https://graph.facebook.com/v20.0/${phoneId}/messages`, { messaging_product:"whatsapp", to, text:{body}}, { headers:{Authorization:`Bearer ${process.env.WHATSAPP_TOKEN}`}});
  } catch(err){ console.log("Error WA:", err.response?.data || err.message); }
}
app.listen(process.env.PORT || 10000, ()=>console.log("V21 listo"));
