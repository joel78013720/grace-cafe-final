const express = require('express');
const axios = require('axios');
const { MENU, routeMessage } = require('./menu');
const { askGemini } = require('./geminis');
const { saveOrder } = require('./sheets');
const { createEvent } = require('./calendar');
const { potenciarRespuesta } = require('./vendedora');
const { notifyOwner } = require('./owner');

const app = express();
app.use(express.json());

app.get('/', (req,res)=> res.send('Gracias Cafe BOT Gemini Live - Martes a Viernes 5:30pm-9:40pm'));

app.get('/webhook', (req,res)=>{
  if(req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) return res.send(req.query['hub.challenge']);
  res.sendStatus(403);
});

app.post('/webhook', async (req,res)=>{
  try{
    const entry = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if(!entry) return res.sendStatus(200);
    const from = entry.from;
    const text = entry.text?.body || '[Audio]';
    
    const route = routeMessage(text);
    
    let prompt = `${MENU}
Cliente: "${text}"
Hora Managua: ${new Date().toLocaleString('es-NI', {timeZone:'America/Managua'})}
Responde breve (max 3 lineas), amable y cariñosa, como recepcionista. Si es fuera de menú o personalizado, di que lo pasaras al propietario.`;

    let respuesta = await askGemini(prompt);
    if(!respuesta) respuesta = "Hola corazón 💛 Gracias por escribir a Gracias Café. Estamos Martes a Viernes 5:30pm a 9:40pm, solo para recoger o disfrutar aquí. ¿Qué te gustaría?";

    // Potenciador de ventas (brownie con café, empaque bonito)
    respuesta = potenciarRespuesta(respuesta, text);

    // Si es pedido personalizado o fuera de menú, avisa al dueño
    if(route.type === 'custom' || text.toLowerCase().includes('entera') || text.toLowerCase().includes('encargo') || text.toLowerCase().includes('personalizado')){
      await notifyOwner(text, from);
    }

    // Guardar en Sheet y Calendario (soporta SHEET_URL y SHEETS_URL)
    await saveOrder({ cliente: from, pedido: text, telefono: from, respuesta, tipo: route.type });
    await createEvent({ cliente: from, pedido: text, respuesta, fecha: new Date().toISOString() });

    if(process.env.PHONE_NUMBER_ID && process.env.WHATSAPP_TOKEN){
      await axios.post(`https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`, {
        messaging_product: 'whatsapp', to: from, text: { body: respuesta }
      }, { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` }});
    }
    res.sendStatus(200);
  } catch(e){ console.log('ERROR', e.message); res.sendStatus(200); }
});

app.listen(process.env.PORT || 10000, ()=> console.log(`Gracias Cafe BOT Gemini en puerto ${process.env.PORT || 10000}`));
