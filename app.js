const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'graciascafe123';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

app.get('/', (req, res) => res.send('Grace Cafe Activo - Horario Mar-Vie 5pm-10pm'));

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) return res.status(200).send(challenge);
  res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return res.sendStatus(200);

    const from = message.from;
    let text = (message.text?.body || '').toLowerCase().trim();

    const menu = `☕ *Grace Café Menu:*
🍫 1 - Brownies C$70
🧊 2 - Café Helado C$65
🍰 3 - Tortas chocolate C$35
🍪 4 - Galletas avena C$40

⏰ Horario: Mar-Vie 5pm-10pm
📦 Pedidos con 3 a 5 días de anticipación

Escribe el número o nombre`;

    let reply = '';

    if (['hola','menu','menú','inicio','buenas','hello'].some(p=>text.includes(p))) {
      reply = `¡Hola! Bienvenido a *Grace Café* 🙏\n\n${menu}`;
    } else if (text.includes('brownie') || text === '1') {
      reply = `✅ *Brownies C$70* anotado\n\n💰 Se aparta con 50% (C$35) y 50% al entregar.\n📅 ¿Para qué fecha? (mínimo 3 días, máximo 5 días)\n\nEj: "Viernes 8 Nov"`;
    } else if (text.includes('helado') || text.includes('café helado') || text === '2') {
      reply = `✅ *Café Helado C$65* anotado\n\n💰 50% al apartar (C$32.5)\n📅 ¿Para qué fecha lo quieres?`;
    } else if (text.includes('torta') || text.includes('chocolate') || text === '3') {
      reply = `✅ *Tortas chocolate C$35* anotado\n\n📅 ¿Para cuándo? Recuerda 3-5 días anticipación.`;
    } else if (text.includes('galleta') || text.includes('avena') || text === '4') {
      reply = `✅ *Galletas avena* - Consulta stock del día\n\nActualmente puede estar agotado. ¿Cuántas quieres y para qué fecha?`;
    } else if (text.includes('ordenar') || text.includes('apartar') || text.includes('pedido') || text.match(/\d+ nov|\d+ dic|viernes|lunes|martes|miercoles|jueves/)) {
      reply = `¡Perfecto! 🙏\n\nTu pedido queda agendado en Grace Café.\n📌 *Importante:*\n• 50% al apartar\n• 50% al entregar\n• Retiro en local Mar-Vie 5pm-10pm\n\nTe confirmo por aquí cuando esté listo. ¿A nombre de quién lo aparto?`;
    } else if (text.includes('precio') || text.includes('cuanto')) {
      reply = menu;
    } else {
      reply = `No te entendí bien, pero aquí tienes el menú 👇\n\n${menu}\n\nEscribe el nombre: brownies, café helado, tortas o galletas`;
    }

    await axios.post(
      `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`,
      { messaging_product: 'whatsapp', to: from, text: { body: reply } },
      { headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' } }
    );
    
    res.sendStatus(200);
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.sendStatus(200);
  }
});

app.listen(process.env.PORT || 10000, () => console.log('Grace Cafe Bot REAL corriendo'));
