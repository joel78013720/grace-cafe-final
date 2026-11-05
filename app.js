const express = require('express');
const { getReply } = require('./groq');
const axios = require('axios');
const app = express();
app.use(express.json());

let pedidos = [];
const memoria = new Map(); 
const vistos = new Set();
const pendientesEspeciales = new Map(); // Guarda pedidos especiales para que la dueña los confirme

const OWNER_NUMBER = process.env.OWNER_NUMBER || "50585219636"; // +505 8521 9636

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
    const rawText = message.text?.body || "";
    if (!memoria.has(from)) memoria.set(from, []);
    const historial = memoria.get(from);
    historial.push({ role: "user", content: rawText });
    if (historial.length > 14) historial.shift();

    let respuesta;

    // === CASO 1: MENSAJE DE LA DUEÑA ===
    if (from === OWNER_NUMBER) {
      // Si la dueña escribe: CONFIRMO 505xxxxxxx para sábado C$1200
      const matchConfirma = rawText.match(/CONFIRMO\s+(\d{8,15})/i);
      if (matchConfirma) {
        const clienteDestino = matchConfirma[1];
        const { getOwnerPrompt } = require('./owner');
        respuesta = await getReply(getOwnerPrompt(rawText, historial));
        // Reenvia al cliente final
        await enviarWhatsApp(clienteDestino, respuesta);
        await enviarWhatsApp(from, `✅ Enviado al cliente ${clienteDestino}: \n${respuesta}`);
      } else {
        const { getOwnerPrompt } = require('./owner');
        respuesta = await getReply(getOwnerPrompt(rawText, historial));
        await enviarWhatsApp(from, respuesta);
      }
    } 
    // === CASO 2: CLIENTE NORMAL ===
    else {
      const { getVendedoraPrompt } = require('./vendedora');
      respuesta = await getReply(getVendedoraPrompt(rawText, historial));

      const textoCombinado = (rawText + " " + respuesta).toLowerCase();
      const esEspecial = /entera|entero|decorativo|cumple|personalizado|esposa|regalo|pastel.*entero/i.test(textoCombinado);
      const clienteDiceSi = /^(si\b|s[ií]\b|confirmo|confirmado|dale|si eso|si quiero|perfecto|ok|listo|voy en|llego en|llego|estar[eé] ah[ií])/i.test(rawText.trim().toLowerCase());
      const iaPidioConfirmacionAntes = historial.slice(-3, -1).some(h => h.role === 'assistant' && /me confirma/i.test(h.content));

      let debeEnviarAlDueno = false;
      let tipoPedido = "";

      if (esEspecial) {
        debeEnviarAlDueno = true;
        tipoPedido = "🌟 ENCARGO ESPECIAL";
        pendientesEspeciales.set(from, historial.map(h=>h.content).join('\n'));
      }

      // Solo si la IA ya pidió confirmación y ahora el cliente dice SI -> es pedido confirmado
      if (clienteDiceSi && iaPidioConfirmacionAntes && !esEspecial) {
        debeEnviarAlDueno = true;
        tipoPedido = "✅ PEDIDO CONFIRMADO";
      }

      if (debeEnviarAlDueno) {
        const aviso = `${tipoPedido} - Gracias Café\n\nCliente: ${from}\nTel: wa.me/${from}\n\nHISTORIAL:\n${historial.map(h=>`> ${h.content}`).join('\n')}\n\nPAGO: 50% anticipo en local, 50% al retirar.\nPara confirmar un encargo, responda: CONFIRMO ${from} para [fecha] C$[precio]`;
        await enviarWhatsApp(OWNER_NUMBER, aviso);
        console.log("Enviado al dueño: " + tipoPedido);
      }
    }

    historial.push({ role: "assistant", content: respuesta });
    pedidos.push({ telefono: from, mensaje: rawText, respuesta: respuesta, fecha: new Date().toLocaleString("es-NI", {timeZone: 'America/Managua'}) });
    
    if (from !== OWNER_NUMBER) {
       await enviarWhatsApp(from, respuesta);
    }

  } catch(e){ console.log("ERROR:", e.message, e.response?.data); }
});

app.get('/dashboard', (req,res)=>{
  let html = `<meta name="viewport" content="width=device-width"><style>body{font-family:sans-serif;padding:15px;background:#FFF8F0}.card{background:#fff;padding:12px;margin:8px 0;border-radius:12px;box-shadow:0 1px 3px #0001}.badge{padding:2px 8px;border-radius:10px;font-size:12px;color:#fff}.ok{background:#22c55e}.esp{background:#f59e0b}</style><h2>☕️ Panel Gracias Café</h2><p>Pedidos totales: ${pedidos.length} | Dueña: ${OWNER_NUMBER}</p><p><b>Para confirmar encargos:</b> La dueña debe escribir: CONFIRMO [numero cliente] para [fecha] C$[precio]</p>`;
  pedidos.slice().reverse().slice(0,100).forEach(p=>{
    const esConf = p.respuesta && /confirmada|reservada/i.test(p.respuesta);
    html+=`<div class="card"><b>📱 ${p.telefono}</b> <span class="badge ${esConf?'ok':'esp'}">${p.fecha}</span><br>💬 Cliente: ${p.mensaje}<br>🤖 Gracia: ${p.respuesta}<br></div>`;
  });
  res.send(html);
});

app.get('/', (req,res)=>res.send('V8 Gracias Café Activo - <a href="/dashboard">Ver Dashboard</a>'));

async function enviarWhatsApp(to, body) {
  const phoneId = process.env.WHATSAPP_PHONE_ID || process.env.PHONE_NUMBER_ID;
  if (!phoneId || !process.env.WHATSAPP_TOKEN) { console.log("Falta PHONE_ID o TOKEN"); return; }
  try {
    await axios.post(`https://graph.facebook.com/v20.0/${phoneId}/messages`, { messaging_product:"whatsapp", to, text:{body}}, { headers:{Authorization:`Bearer ${process.env.WHATSAPP_TOKEN}`}});
  } catch(err){ console.log("Error WA:", err.response?.data || err.message); }
}

app.listen(process.env.PORT || 10000, ()=>console.log("V8 Gracias Café listo - Dueña: " + OWNER_NUMBER));
