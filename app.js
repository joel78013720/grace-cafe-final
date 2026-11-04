const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzv6p_LciorvNrzxJq-jCRj-bh25iaBVlTeZmjtUxZDfTmp3dikZ2OYvLWnjg7rpkHQBQ/exec';
const GROQ_KEY = process.env.GROQ_API_KEY;

async function preguntarGroq(msg){
  if(!GROQ_KEY) return null;
  try{
    const r = await axios.post('https://api.groq.com/openai/v1/chat/completions',{
      model:'llama-3.3-70b-versatile',
      messages:[
        {role:'system', content:'Eres Grace de Grace Cafe Nicaragua. Hablas natural, nica, amable, corto. Vendes cafe, pan, desayunos. Si te piden pedido, pide nombre, que quiere, cantidad, fecha y pago. No suenas robot.'},
        {role:'user', content:msg}
      ],
      temperature:0.8
    },{headers:{Authorization:`Bearer ${GROQ_KEY}`}});
    return r.data.choices[0].message.content;
  }catch(e){ console.log(e.message); return null; }
}

app.post('/webhook', async (req,res)=>{
  const mensaje = req.body.mensaje || '';
  let respuesta = await preguntarGroq(mensaje);
  if(!respuesta) respuesta = 'Hola! Soy Grace de Grace Cafe ☕️ ¿Qué te gustaría pedir hoy?';
  
  if(mensaje.toLowerCase().includes('quiero') || mensaje.toLowerCase().includes('pedido')){
    await axios.post(SHEET_URL,{cliente:'WhatsApp', telefono:'57388733', pedido:mensaje, cantidad:1, fecha_entrega:'Hoy', pago:'Por definir', estado:'Nuevo'}).catch(()=>{});
  }
  res.json({respuesta});
});

app.get('/', (req,res)=>res.send('Grace Cafe + Groq Activo'));
app.listen(process.env.PORT || 3000, ()=>console.log('Bot corriendo'));
