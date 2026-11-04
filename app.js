const express = require('express');
const axios = require('axios');
const { getReply } = require('./groq');
const { saveOrder } = require('./sheets');
const { createEvent } = require('./calendar');
const { routeMessage } = require('./menu');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'graciascafe123';

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
    const text = msg.text?.body || '';
    console.log('Cliente:', text);

    const action = routeMessage(text);
    let reply = '';

    if (action.type === 'calendar') {
      await createEvent({ cliente: from, pedido: text });
      reply = await getReply(text);
    } else {
      reply = await getReply(text);
      if (action.type === 'order') {
        await saveOrder({ cliente: from, pedido: text });
      }
    }

    await axios.post(`https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`,
      { messaging_product: 'whatsapp', to: from, text: { body: reply } },
      { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } }
    );

    res.sendStatus(200);
  } catch (e) {
    console.log('Error webhook', e.response?.data || e.message);
    res.sendStatus(200);
  }
});

app.get('/', (req, res) => res.send('Gracias Cafe Final Live - Todo Listo'));
app.listen(process.env.PORT || 10000, () => console.log('Live'));
