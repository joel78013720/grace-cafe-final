const axios = require('axios');
async function notifyOwner(pedido, cliente){
  const ownerPhone = process.env.OWNER_PHONE || process.env.OWNER_NUMBER;
  if(!ownerPhone || !process.env.PHONE_NUMBER_ID) return;
  const msg = `🔔 PEDIDO PERSONALIZADO de ${cliente}: ${pedido}`;
  try{
    await axios.post(`https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`, {
      messaging_product:'whatsapp', to: ownerPhone, text:{body: msg}
    }, { headers:{ Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` }});
    console.log('📲 Avisado al dueño');
  }catch(e){ console.log('OWNER ERROR', e.message); }
}
module.exports = { notifyOwner };
