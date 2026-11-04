const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzv6p_LciorvNrzxJq-jCRj-bh25iaBVlTeZmjtUxZDfTmp3dikZ2OYvLWnjg7rpkHQBQ/exec';
const GROQ_KEY = process.env.GROQ_API_KEY;
const VERIFY_TOKEN = 'graciascafe123';

async function preguntarGroq(msg){
  if(!GROQ_KEY){ console.log("NO GROQ_API_KEY"); return null; }
  try{
    const r = await axios.post('https://api.groq.com/openai/v1/chat/completions',{
      model:'llama-3.3-70b-versatile',
      messages:[
        {role:'system', content:'Eres Grace de Grace Cafe Nicaragua. Habla nica, fresca, corta, amable. Vendes cafe, panes, desayunos.'},
        {role:'user', content:msg}
      ],
      temperature:0.8
    },{headers:{Authorization:`Bearer ${GROQ_KEY}`}});
    return r.data.choices[0].message.content;
  }catch(e){ console.log("ERROR GROQ", e.message); return null; }
}

app.get('/webhook', (req,res)=>{
  console.log("GET webhook verify:", req.query);
  if(req.query['hub.verify_token'] === VERIFY_TOKEN){
    console.log("TOKEN OK - Enviando challenge");
    return res.send(req.query['hub.challenge']);
  }
  console.log("TOKEN MAL");
  res.send('Grace Cafe Activo');
});

app.post('/webhook', async (req,res)=>{
  console.log("POST LLEGO:", JSON.stringify(req.body).substring(0,500));
  let mensaje = req.body.mensaje || req.body.message || "";
  let phoneId = null;
  let from = null;

  try{
    if(req.body.entry){
      const entry = req.body.entry[0].changes[0].value;
      phoneId = entry.metadata?.phone_number_id;
      const msgObj = entry.messages?.[0];
      if(msgObj){
        from = msgObj.from;
        mensaje = msgObj.text?.body || mensaje;
      }
    }
  }catch(e){}

  if(!mensaje){ return res.sendStatus(200); }
  console.log("Mensaje de cliente:", mensaje);

  let respuesta = await preguntarGroq(mensaje);
  if(!respuesta) respuesta = 'Hola! Soy Grace de Grace Cafe ☕️ ¿Qué te gustaría pedir hoy?';

  console.log("Respuesta IA:", respuesta);

  // Guardar en Sheets si es pedido
  if(mensaje.toLowerCase().includes('quiero') || mensaje.toLowerCase().includes('pedido') || mensaje.toLowerCase().includes('cafe')){
    axios.post(SHEET_URL,{cliente:'WhatsApp', telefono:from||'57388733', pedido:mensaje, cantidad:1, fecha_entrega:'Hoy', pago:'Por definir', estado:'Nuevo'}).catch(()=>{});
  }

  // Si viene de WhatsApp Cloud, responder directo a WhatsApp
  if(from && phoneId && process.env.WHATSAPP_TOKEN){
     await axios.post(`https://graph.facebook.com/v20.0/${phoneId}/messages`,{
       messaging_product:'whatsapp', to:from, text:{body:respuesta}
     },{headers:{Authorization:`Bearer ${process.env.WHATSAPP_TOKEN}`}}).catch(e=>console.log("Error enviando WA", e.response?.data || e.message));
     return res.sendStatus(200);
  }

  // Si viene de tu puente viejo
  res.json({respuesta});
});

app.get('/', (req,res)=>res.send('Grace Cafe + Groq Activo'));
app.listen(process.env.PORT || 10000, ()=>console.log('Bot corriendo'));
