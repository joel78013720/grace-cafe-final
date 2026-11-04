const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
app.use(bodyParser.json());
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'graciascafe123';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || '';
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || '';
const PORT = process.env.PORT || 10000;

app.get('/', (req,res)=>{res.send(`<h1>Grace Cafe Activo</h1><p>Webhook: https://grace-cafe-final.onrender.com/webhook</p><p>Verify: ${VERIFY_TOKEN}</p><a href="/webhook">Probar</a>`)});

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else if (!mode) {
    res.send('Grace Cafe Webhook activo');
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;
    if (body.entry?.[0]?.changes?.[0]?.value?.messages) {
      const msg = body.entry[0].changes[0].value.messages[0];
      const from = msg.from;
      const text = msg.text?.body.toLowerCase() || '';
      let reply = text.includes('menu')||text.includes('hola') ? "☕ Grace Café Menu:\n1 Americano C$80\n2 Latte C$120\n3 Capuccino C$120\n4 Moca C$140\nEscribe número" : "Escribe *menu*";
      if (WHATSAPP_TOKEN && PHONE_NUMBER_ID) {
        await axios.post(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
          {messaging_product:"whatsapp",to:from,text:{body:reply}},
          {headers:{Authorization:`Bearer ${WHATSAPP_TOKEN}`}});
      }
    }
    res.sendStatus(200);
  } catch(e){res.sendStatus(200);}
});
app.listen(PORT, ()=>console.log('Grace Cafe en',PORT));
