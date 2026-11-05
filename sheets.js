const axios = require('axios');
async function saveOrder(data){
  try{
    const url = process.env.SHEETS_URL || process.env.SHEET_URL;
    if(!url) return;
    await axios.post(url, {...data, fecha: new Date().toISOString()});
    console.log('📊 Guardado OK', data.pedido);
  } catch(e){ console.log('❌ SHEET ERROR', e.message); }
}
module.exports = { saveOrder };
