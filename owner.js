const axios = require('axios');
async function notifyOwner(pedido, cliente){
  try{
    const ownerPhone = process.env.OWNER_PHONE || process.env.OWNER_NUMBER;
    if(!ownerPhone) return;
    const url = `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`;
    await axios.post(url, {
      messaging_product:'whatsapp', to: ownerPhone, text:{body:`🔔 PEDIDO PERSONALIZADO ${cliente}: ${pedido}`}
    }, { headers:{ Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` }});
  }catch(e){ console.log('OWNER ERROR', e.message); }
}
module.exports = { notifyOwner };
