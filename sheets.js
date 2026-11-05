const axios = require('axios');
async function saveOrder(data){
  try{
    const url = process.env.SHEETS_URL;
    if(!url) return;
    await axios.post(url, {...data, fecha: new Date().toISOString()});
    console.log('📊 Guardado Sheet OK', data);
  } catch(e){ console.log('❌ SHEET ERROR', e.message); }
}
module.exports = { saveOrder };
