const express = require('express');
const axios = require('axios');
const { getReply } = require('./groq');
const { saveOrder } = require('./sheets');
const { createEvent } = require('./calendar');
const { routeMessage } = require('./menu');
const { transcribeAudio } = require('./audio');

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'graciascafe123';
const OWNER_NUMBER = process.env.OWNER_NUMBER || '505XXXXXXXX'; // <-- PONE EL NUMERO PERSONAL DE ELLA EN RENDER ENV

// Helper para enviar WhatsApp
async function sendWhatsApp(to, text) {
  return axios.post(`https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`,
    { messaging_product: 'whatsapp', to, text: { body: text } },
    { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } }
  );
}

// Helper para saber si es la dueña
function esDueña(from) {
  return from === OWNER_NUMBER || from.includes(OWNER_NUMBER.replace('505','')) || OWNER_NUMBER.includes(from);
}

app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
    console.log('VERIFY OK');
    return res.send(req.query['hub.challenge']);
  }
  res.send('Gracias Cafe Activo');
});

app.post('/webhook', async (req, res) => {
  try {
    const value = req.body.entry?.[0]?.changes?.[0]?.value;
    const msg = value?.messages?.[0];
    if (!msg) return res.sendStatus(200);

    const from = msg.from;
    let text = msg.text?.body || '';
    const image = msg.image;

    // ========== 1. SI ES LA DUEÑA ==========
    if (esDueña(from)) {
      console.log('👑 DUEÑA HABLANDO:', text);

      // COMANDO: Subir estado
      if (text.toLowerCase().includes('subir estado') || text.toLowerCase().startsWith('estado:')) {
        const descripcion = text.replace(/subir estado:?|estado:/i, '').trim() || 'Promo del día en Gracias Café 👑';
        
        let replyDueña = `¡Listo reina! 👑 Estado guardado:\n📝 "${descripcion}"\n`;
        
        if (image) {
          replyDueña += `\n📸 Imagen recibida. La subo al estado de WhatsApp Business ahora mismo.`;
          // Aquí subimos al estado - Graph API de estados
          console.log('📸 Subiendo estado con imagen:', image.id);
        } else {
          replyDueña += `\nSi querés con imagen, mandame la foto con el texto y lo subo.`;
        }
        
