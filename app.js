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
    if (historial.length > 14) historial
