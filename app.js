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
const MI_NUMERO_PRUEBA = "50583872855";

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

    if (from === OWNER_NUMBER) {
      if (rawText.toUpperCase().startsWith("ESTADO:")) {
        const textoEstado = rawText.replace(/ESTADO:/i, "").trim();
        pedidos.push({ telefono: "ESTADO / PROMO", nombre: "PROMO", mensaje: textoEstado + (esFoto ? " (con foto)" : ""), fecha: new Date().toLocaleString("es-NI", {timeZone: 'America/Managua'}), tipo: "Promo" });
        await enviarWhatsApp(from, `✅ Guardé tu promo:\n"${textoEstado}"\n📸 Foto: ${esFoto ? 'Sí' : 'No'}\n¿La envío? Escribe: ENVIAR PROMO`);
        return;
      }
      if (/ENVIAR PROMO/i.test(rawText)) {
        const ahora = Date.now();
        const ventana = 24 * 60 * 60 * 1000;
        const ultimos = [...ultimaInteraccion.entries()].filter(([tel,t])=> tel!==OWNER_NUMBER && (ahora-t)<ventana && !bloqueados.has(tel)).map(([tel])=>tel).slice(-15);
        const ultimaPromo = pedidos.filter(p=>p.telefono==="ESTADO / PROMO").slice(-1)[0];
        if(!ultimaPromo){ await enviarWhatsApp(from, "No hay promo"); return; }
        if(ultimos.length===0){ await enviarWhatsApp(from, "⚠️ Nadie en ventana 24h"); return; }
        for(const cli of ultimos){
          await enviarWhatsApp(cli, `☕️ *Gracias Café*\n\n${ultimaPromo.mensaje}\n_Responde STOP para no recibir promos_`);
        }
        await enviarWhatsApp(from, `✅ Enviada a ${ultimos.length} clientes`);
        return;
      }
      const matchConfirma = rawText.match(/CONFIRMO\s+(\d{8,15})/i);
      const { getOwnerPrompt } = require('./owner');
      if (matchConfirma) {
        const clienteDestino = matchConfirma[1];
        respuesta = await getReply(getOwnerPrompt(rawText, historial));
        await enviarWhatsApp(clienteDestino, respuesta);
        await enviarWhatsApp(from, `✅ Enviado a ${clienteDestino}:\n${respuesta}`);
      } else {
        respuesta = await getReply(getOwnerPrompt(rawText, historial));
        await enviarWhatsApp(from, respuesta);
      }
      historial.push({ role: "assistant", content: respuesta });
      return;
    } 

    const { getVendedoraPrompt } = require('./vendedora');
    respuesta = await getReply(getVendedoraPrompt(rawText, historial));

    const todoElTexto = historial.map(h=>h.content).join(' ') + ' ' + rawText;
    const matchNombre = todoElTexto.match(/(?:soy|me llamo|a nombre de|mi nombre es)\s+([A-Za-zÁÉÍÓÚáéíóú]+)/i);
    const nombreCliente = matchNombre ? matchNombre[1] : 'Sin nombre';

    const textoCombinado = (rawText + " " + respuesta).toLowerCase();
    const esEspecial = /entera|entero|libra|libras|cumple|personalizado|regalo|aniversario|tematica|vainilla|30 persona/i.test(textoCombinado);
    const clienteDiceSi = /^(si\b|s[ií]\b|confirmo)/i.test(rawText.trim().toLowerCase());
    const iaPidioConfirmacionAntes = historial.slice(-3, -1).some(h => h.role === 'assistant' && /me confirma/i.test(h.content));

    let debeEnviarAlDueno = false;
    let tipoPedido = "";
    if (esEspecial) { debeEnviarAlDueno = true; tipoPedido = "🌟 ENCARGO ESPECIAL"; }
    if (clienteDiceSi && iaPidioConfirmacionAntes) { debeEnviarAlDueno = true; tipoPedido = "✅ PEDIDO CONFIRMADO"; }

    if (debeEnviarAlDueno) {
      const aviso = `${tipoPedido}\nCliente: ${nombreCliente} - wa.me/${from}\nTel: ${from}\n\nHISTORIAL:\n${historial.map(h=>`> ${h.content}`).join('\n')}\n\nBot: ${respuesta}`;
      await enviarWhatsApp(MI_NUMERO_PRUEBA, aviso);
      console.log("AVISO A PRUEBA 83872855 ENVIADO");
    }

    historial.push({ role: "assistant", content: respuesta });
    pedidos.push({ telefono: from, nombre: nombreCliente, mensaje: rawText + (esFoto ? " [FOTO]" : ""), respuesta: respuesta, fecha: new Date().toLocaleString("es-NI", {timeZone: 'America/Managua'}) });
    await enviarWhatsApp(from, respuesta);

  } catch(e){ console.log("ERROR:", e.message); }
});

app.get('/dashboard', (req,res)=>{
  let html = `<meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:sans-serif;padding:15px;background:#FFF8F0}.card{background:#fff;padding:12px;margin:8px 0;border-radius:12px}</style><h2>☕️ Panel Gracias Café - Prueba 83872855</h2>`;
  pedidos.slice().reverse().slice(0,150).forEach(p=>{ html+=`<div class="card"><b>📱 ${p.telefono}</b> - 👤 ${p.nombre}<br><small>${p.fecha}</small><br>💬 ${p.mensaje}</div>`; });
  res.send(html);
});

app.get('/', (req,res)=>res.send('Activo V18 - Pruebas a 83872855'));
async function enviarWhatsApp(to, body) {
  const phoneId = process.env.WHATSAPP_PHONE_ID || process.env.PHONE_NUMBER_ID;
  if (!phoneId || !process.env.WHATSAPP_TOKEN) return;
  try {
    await axios.post(`https://graph.facebook.com/v20.0/${phoneId}/messages`, { messaging_product:"whatsapp", to, text:{body}}, { headers:{Authorization:`Bearer ${process.env.WHATSAPP_TOKEN}`}});
  } catch(err){ console.log("Error WA:", err.response?.data || err.message); }
}
app.listen(process.env.PORT || 10000, ()=>console.log("V18 listo - 83872855"));
