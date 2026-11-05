const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

let pedidos = [];
const memoria = new Map();
const vistos = new Set();
const ultimaInteraccion = new Map();
const bloqueados = new Set();
const OWNER_NUMBER = "50583872855";

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
    let rawText = message.text?.body || message.image?.caption || "";
    if (!rawText) return;

    if (/^\s*STOP\s*$/i.test(rawText)) { bloqueados.add(from); await enviarWhatsApp(from, "Entendido 🫶 No te enviaremos más promos."); return; }
    if (/QUIERO PROMOS/i.test(rawText)) { bloqueados.delete(from); await enviarWhatsApp(from, "¡Perfecto! Ya estás en promos ☕️"); return; }

    if (!memoria.has(from)) memoria.set(from, { historial: [], nombre: null });
    const data = memoria.get(from);

    // GUARDA NOMBRE PERMANENTE - FIX INDEPENDIENTE
    const mNombre = rawText.match(/(?:a nombre de|soy|me llamo|mi nombre es)\s+([A-Za-zÁÉÍÓÚáéíóú ]{2,25})/i);
    if (mNombre) data.nombre = mNombre[1].trim();
    else if (/^[A-Za-z]{3,20}$/.test(rawText.trim()) && !/^(hola|menu|si|no|bueno|hi|hey|q|que|buenas|hola)$/i.test(rawText.trim())) {
      const lastBot = data.historial.slice(-1)[0];
      if (lastBot && /nombre|llamas/i.test(lastBot.content) && !data.nombre) data.nombre = rawText.trim();
    }
    if (!data.nombre && /kevin/i.test(data.historial.map(h=>h.content).join(' '))) data.nombre = "Kevin";
    if (!data.nombre && /maritza/i.test(data.historial.map(h=>h.content).join(' '))) data.nombre = "Maritza";

    data.historial.push({ role: "user", content: rawText });
    if (data.historial.length > 14) data.historial.shift();
    ultimaInteraccion.set(from, Date.now());

    const { getReply } = require('./groq');
    let respuesta;

    if (from === OWNER_NUMBER) {
      if (rawText.toUpperCase().startsWith("ESTADO:")) {
        const textoEstado = rawText.replace(/ESTADO:/i, "").trim();
        pedidos.push({ telefono: "ESTADO", nombre: "PROMO", mensaje: textoEstado, fecha: new Date().toLocaleString("es-NI") });
        await enviarWhatsApp(from, `✅ Guardé: "${textoEstado}" - Escribe ENVIAR PROMO`); return;
      }
      if (/ENVIAR PROMO/i.test(rawText)) {
        const ahora = Date.now(); const ventana = 86400000;
        const ultimos = [...ultimaInteraccion.entries()].filter(([tel,t])=> tel!==OWNER_NUMBER && (ahora-t)<ventana && !bloqueados.has(tel)).map(([tel])=>tel).slice(-15);
        const ultimaPromo = pedidos.filter(p=>p.telefono==="ESTADO").slice(-1)[0];
        if(!ultimaPromo){ await enviarWhatsApp(from, "No hay promo"); return; }
        if(ultimos.length===0){ await enviarWhatsApp(from, "⚠️ Nadie en ventana 24h"); return; }
        for(const cli of ultimos) await enviarWhatsApp(cli, `☕️ *Gracias Café*\n\n${ultimaPromo.mensaje}`);
        await enviarWhatsApp(from, `✅ Enviada a ${ultimos.length}`); return;
      }
      try { const { getOwnerPrompt } = require('./owner'); respuesta = await getReply(getOwnerPrompt(rawText, data.historial)); }
      catch { respuesta = await getReply(`Responde corto a dueña: ${rawText}`); }
      await enviarWhatsApp(from, respuesta); data.historial.push({ role: "assistant", content: respuesta }); return;
    }

    // CLIENTE
    let promptVendedora;
    try { const { getVendedoraPrompt } = require('./vendedora'); promptVendedora = getVendedoraPrompt(rawText, data.historial, data.nombre); }
    catch(e) { console.log("Fallo vendedora:", e.message); promptVendedora = `Eres Gracia. Cliente ${data.nombre || ''} dice: ${rawText}. Responde corto.`; }

    respuesta = await getReply(promptVendedora);

    // FORMATO BONITO QUE PEDISTE - NO HISTORIAL
    const fullHist
