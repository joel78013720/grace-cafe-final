const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

let pedidos = [];
const memoria = new Map();
const vistos = new Set();
const ultimaInteraccion = new Map();
const OWNER_NUMBER = "50583872855";

app.get('/webhook', (req,res)=>{
  if(req.query['hub.mode']==='subscribe' && req.query['hub.verify_token']===process.env.VERIFY_TOKEN) return res.status(200).send(req.query['hub.challenge']);
  res.sendStatus(403);
});

app.post('/webhook', async (req,res)=>{
  res.sendStatus(200);
  try{
    const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if(!msg || vistos.has(msg.id)) return;
    vistos.add(msg.id); setTimeout(()=>vistos.delete(msg.id),600000);
    const from = msg.from;
    let rawText = msg.text?.body || msg.image?.caption || "";

    if(msg.audio){
      const { transcribirAudio } = require('./groq');
      const t = await transcribirAudio(msg.audio.id);
      if(t) rawText = t;
    }
    if(!rawText) return;

    if(!memoria.has(from)) memoria.set(from,{historial:[], nombre:null});
    const data = memoria.get(from);
    const mN = rawText.match(/(?:a nombre de|soy|me llamo|mi nombre es)\s+([A-Za-zÁÉÍÓÚáéíóú ]{2,25})/i);
    if(mN) data.nombre = mN[1].trim();
    if(/^[A-Za-zÁÉÍÓÚ]{3,15}$/.test(rawText.trim()) && /nombre|llamas/i.test(data.historial.slice(-1)[0]?.content||'')) data.nombre = rawText.trim();

    data.historial.push({role:"user", content:rawText});
    if(data.historial.length>20) data.historial.shift();
    ultimaInteraccion.set(from, Date.now());

    const { getReply } = require('./groq');

    if(from===OWNER_NUMBER){
      if(rawText.toUpperCase().startsWith("ESTADO:")){
        pedidos.push({telefono:"ESTADO", nombre:"PROMO", mensaje: rawText.replace(/ESTADO:/i,'').trim(), fecha:new Date().toLocaleString("es-NI"), recojo:"-", total:"-"});
        await enviar(from, "✅ Promo guardada"); return;
      }
      if(/ENVIAR PROMO/i.test(rawText)){
        const clientes = [...ultimaInteraccion.entries()].filter(([tel])=>tel!==OWNER_NUMBER).slice(-20).map(([tel])=>tel);
        const promo = pedidos.filter(p=>p.telefono==="ESTADO").slice(-1)[0];
        if(!promo){ await enviar(from,"No hay promo guardada"); return; }
        for(const c of clientes) await enviar(c, `☕️ *Gracias Café*\n\n${promo.mensaje}\n\nMartes a viernes 5:30pm-9:40pm\nSolo recoger`);
        await enviar(from,`✅ Enviada a ${clientes.length} clientes`); return;
      }
      if(/CALENDARIO|PEDIDOS/i.test(rawText)){
        let txt = "📅 CALENDARIO\n";
        pedidos.slice(-10).forEach(p=> txt+=`• ${p.nombre} - ${p.mensaje} - Recojo ${p.recojo} - ${p.telefono}\n`);
        await enviar(from, txt); return;
      }
      const { getOwnerPrompt } = require('./owner');
      const r = await getReply(getOwnerPrompt(rawText, data.historial));
      await enviar(from, r); return;
    }

    const { getVendedoraPrompt } = require('./vendedora');
    const respuesta = await getReply(getVendedoraPrompt(rawText, data.historial, data.nombre));

    const esTortaEntera = /torta entera|pastel entero|encargo|libra/i.test(rawText);
    const fechaRecojo = new Date(Date.now() + (esTortaEntera ? 3*86400000 : 86400000));

    if(esTortaEntera || /personalizado|fuera de menu|no esta en menu/i.test(respuesta.toLowerCase())){
      await enviar(OWNER_NUMBER, `🔔 PEDIDO\nNombre: ${data.nombre||'Sin nombre'}\nPedido: ${rawText}\nRecojo: ${fechaRecojo.toLocaleDateString("es-NI")}\nTel: wa.me/${from}\nResponde APRUEBO C$xxx o RECHAZO`);
      pedidos.push({telefono:from, nombre:data.nombre||'Sin nombre', mensaje:rawText, fecha:new Date().toLocaleString("es-NI"), recojo: fechaRecojo.toLocaleDateString("es-NI"), total: esTortaEntera ? "C$450 1lb / C$850 2lb - Adelanto 50%" : "Por confirmar"});
    } else if (/slice|brownie|cup|cake|tres leches|fresco|café|granizado/i.test(rawText.toLowerCase())){
      pedidos.push({telefono:from, nombre:data.nombre||'Sin nombre', mensaje:rawText, fecha:new Date().toLocaleString("es-NI"), recojo: fechaRecojo.toLocaleDateString("es-NI"), total:"C$35-160"});
    }

    data.historial.push({role:"assistant", content:respuesta});
    await enviar(from, respuesta);

  }catch(e){ console.log(e.message); }
});

app.get('/dashboard', (req,res)=>{
  let html = `<html><head><meta name="viewport" content="width=device-width"><style>body{font-family:sans-serif;padding:12px;background:#FFF8F0} .card{border:1px solid #E8D5C4;background:white;padding:12px;margin:8px 0;border-radius:12px}</style></head><body><h2>☕️ Gracias Café - Panel Dueña</h2><h3>📅 Calendario de Recojos (torta entera +3 días)</h3>`;
  pedidos.slice().reverse().slice(0,100).forEach(p=>{
    html+=`<div class="card"><b>${p.nombre}</b> - ${p.telefono}<br>📦 ${p.mensaje}<br>💰 ${p.total}<br>📅 Recojo: ${p.recojo}<br><small>${p.fecha}</small></div>`;
  });
  html+=`</body></html>`;
  res.send(html);
});

app.get('/', (req,res)=>res.send('Gracias Café V-FINAL OK'));

async function enviar(to, body){
  try{
    await axios.post(`https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {messaging_product:"whatsapp", to, text:{body}},
      {headers:{Authorization:`Bearer ${process.env.WHATSAPP_TOKEN}`}});
  }catch(e){ console.log("WA ERR", e.response?.data || e.message); }
}

app.listen(process.env.PORT||10000, ()=>console.log("V-FINAL listo"));
