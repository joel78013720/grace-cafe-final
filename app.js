const express = require('express');
const { getReply } = require('./groq');
const axios = require('axios');
const app = express();
app.use(express.json());

let pedidos = [];
const memoria = new Map(); 
const vistos = new Set();
const ultimaInteraccion = new Map();
const bloqueados = new Set();

const OWNER_NUMBER = process.env.OWNER_NUMBER || "50585219636";

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
    const esFoto = !!message.image;
    if (!rawText && !esFoto) return;

    // === FILTRO STOP ANTI-BAN ===
    if (/^\s*STOP\s*$/i.test(rawText)) {
      bloqueados.add(from);
      await enviarWhatsApp(from, "Entendido 🫶 No te enviaremos más promos. Si quieres volver, escribe: QUIERO PROMOS");
      return;
    }
    if (/QUIERO PROMOS/i.test(rawText)) {
      bloqueados.delete(from);
      await enviarWhatsApp(from, "¡Perfecto! Ya estás de nuevo en promos ☕️");
      return;
    }

    if (!memoria.has(from)) memoria.set(from, []);
    const historial = memoria.get(from);
    historial.push({ role: "user", content: rawText + (esFoto ? " [FOTO]" : "") });
    if (historial.length > 14) historial.shift();
    ultimaInteraccion.set(from, Date.now());

    let respuesta;

    // === CASO 1: DUEÑA ===
    if (from === OWNER_NUMBER) {
      // Flujo ESTADO con foto
      if (rawText.toUpperCase().startsWith("ESTADO:")) {
        const textoEstado = rawText.replace(/ESTADO:/i, "").trim();
        pedidos.push({ telefono: "ESTADO / PROMO", mensaje: textoEstado + (esFoto ? " (con foto)" : ""), fecha: new Date().toLocaleString("es-NI", {timeZone: 'America/Managua'}), tipo: "Promo" });
        await enviarWhatsApp(from, `✅ Guardé tu promo:\n"${textoEstado}"\n📸 Foto: ${esFoto ? 'Sí' : 'No'}\n\n¿La envío solo a clientes de 24h? Escribe: ENVIAR PROMO`);
        return;
      }
      if (/ENVIAR PROMO/i.test(rawText)) {
        const ahora = Date.now();
        const ventana = 24 * 60 * 60 * 1000;
        const ultimos = [...ultimaInteraccion.entries()].filter(([tel,t])=> tel!==OWNER_NUMBER && (ahora-t)<ventana && !bloqueados.has(tel)).map(([tel])=>tel).slice(-15);
        const ultimaPromo = pedidos.filter(p=>p.telefono==="ESTADO / PROMO").slice(-1)[0];
        if(!ultimaPromo){ await enviarWhatsApp(from, "No hay promo. Manda ESTADO: primero"); return; }
        if(ultimos.length===0){ await enviarWhatsApp(from, "⚠️ Nadie en ventana 24h, no se envía para evitar ban."); return; }
        for(const cli of ultimos){
          await enviarWhatsApp(cli, `☕️ *Gracias Café - Hoy*\n\n${ultimaPromo.mensaje}\n\nTe esperamos 5:30pm-9:40pm\n_Responde STOP para no recibir promos_`);
        }
        await enviarWhatsApp(from, `✅ Enviada a ${ultimos.length} clientes (24h).`);
        return;
      }

      // Confirmación de encargo
      const matchConfirma = rawText.match(/CONFIRMO\s+(\d{8,15})/i);
      if (matchConfirma) {
        const clienteDestino = matchConfirma[1];
        const { getOwnerPrompt } = require('./owner');
        respuesta = await getReply(getOwnerPrompt(rawText, historial));
        await enviarWhatsApp(clienteDestino, respuesta);
       
