const express = require('express');
const axios = require('axios');
const { google } = require('googleapis');
const app = express();
app.use(express.json());

const SHEET_URL = 'https://script.google.com/macros/s/AKfycbxZzzUnLFI9k-GnvKG35i0Z00JkJy3vd2MiFVpIFsA2Wa4KapI_F16eqYuPkFdE87jLKQ/exec';
const GROQ_KEY = process.env.GROQ_API_KEY;

// ===== CONFIG CALENDARIO FINAL =====
const CALENDAR_ID = 'ropashein14@gmail.com'; // DUEÑA
const OWNER_CALENDAR = 'rochajoel611@gmail.com'; // VOS CON PERMISO #4

async function preguntarGroq(msg){
  if(!GROQ_KEY) return null;
  try{
    const r = await axios.post('https://api.groq.com/openai/v1/chat/completions',{
      model:'llama-3.3-70b-versatile',
      messages:[
        {role:'system', content:'Eres Grace de Grace Cafe Nicaragua. Hablas natural, nica, amable, corto. Vendes cafe, pan, desayunos. Si te piden pedido, pide nombre, que quiere, cantidad, fecha y pago. No suenas robot. Cuando tomes pedido confirma: nombre, pedido, fecha, total.'},
        {role:'user', content:msg}
      ],
      temperature:0.8
    },{headers:{Authorization:`Bearer ${GROQ_KEY}`}});
    return r.data.choices[0].message.content;
  }catch(e){ console.log('Groq error', e.message); return null; }
}

// ===== NUEVA FUNCION - CREAR EN CALENDARIO DE ELLA =====
async function crearEnCalendarioDeElla(pedidoTexto, cliente) {
  try {
    if (!process.env.GOOGLE_CREDENTIALS) {
      console.log('No hay GOOGLE_CREDENTIALS, no se crea en calendario');
      return;
    }
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
      scopes: ['https://www.googleapis.com/auth/calendar']
    });
    const calendar = google.calendar({ version: 'v3', auth });

    // Pedido para mañana 3pm por defecto
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    mañana.setHours(15, 0, 0, 0);
    const fin = new Date(mañana.getTime() + 60*60*1000);

    const event = {
      summary: `PEDIDO: ${cliente} - ${pedidoTexto.substring(0,30)}`,
      description: `CLIENTE: ${cliente}\nTEL: 85219636\nPEDIDO: ${pedidoTexto}\n\nSheet: ${SHEET_URL}\nDueña: ${CALENDAR_ID}\nCreado por: ${OWNER_CALENDAR}`,
      start: { dateTime: mañana.toISOString(), timeZone: 'America/Managua' },
      end: { dateTime: fin.toISOString(), timeZone: 'America/Managua' },
      colorId: '11' // Rojo
    };

    const res = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      resource: event
    });
    console.log('✅ PEDIDO CREADO EN CALENDARIO DE ELLA:', CALENDAR_ID, res.data.htmlLink);
  } catch (e) {
    console.error('❌ Error calendario:', e.message);
  }
}

app.post('/webhook', async (req,res)=>{
  const mensaje = req.body.mensaje || '';
  let respuesta = await preguntarGroq(mensaje);
  if(!respuesta) respuesta = 'Hola! Soy Grace de Grace Cafe ☕️ ¿Qué te gustaría pedir hoy?';
  
  // Si es pedido, guarda en Sheet Y en calendario de ella
  if(mensaje.toLowerCase().includes('quiero') || mensaje.toLowerCase().includes('pedido') || mensaje.toLowerCase().includes('cafe') || mensaje.toLowerCase().includes('pan')){
    // 1. Sheet (como ya tenías)
    await axios.post(SHEET_URL,{
      cliente:'WhatsApp', 
      telefono:'57388733', 
      pedido:mensaje, 
      cantidad:1, 
      fecha_entrega:'Mañana 3pm', 
      pago:'Por definir', 
      estado:'Nuevo'
    }).catch(()=>{});

    // 2. Calendario de ropashein14@gmail.com (NUEVO)
    await crearEnCalendarioDeElla(mensaje, 'Cliente WhatsApp');
  }
  res.json({respuesta});
});

app.get('/', (req,res)=>res.send(`Grace Cafe + Groq + Calendario ${CALENDAR_ID} Activo - Owner ${OWNER_CALENDAR}`));
app.listen(process.env.PORT || 3000, ()=>console.log('Bot corriendo'));
