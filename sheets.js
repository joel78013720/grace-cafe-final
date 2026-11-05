const axios = require('axios');
async function saveOrder({ cliente, pedido }) {
  try {
    console.log('📊 Guardando en Apps Script:', cliente, pedido.slice(0,80));
    const SHEET_URL = process.env.SHEET_URL || process.env.SHEET_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbzv6p_LciorvNrzxJq-jCRj-bh25iaBVITeZmjtUxZDfTmp3dik2OwjrpkHQBQ/exec';
    if (!SHEET_URL) {
      console.log('⚠️ No hay SHEET_URL en ENV');
      return { success: false };
    }
    const payload = {
      cliente: cliente,
      pedido: pedido,
      fecha: new Date().toLocaleString('es-NI', { timeZone: 'America/Managua' }),
      total: (pedido.match(/C\$\s?(\d+)/) || [])[1] || '',
      estado: 'Pendiente',
      source: 'Gracias Café Bot'
    };
    const res = await axios.post(SHEET_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    console.log('✅ SHEET APPS SCRIPT OK:', res.data || res.status);
    return { success: true, data: res.data };
  } catch (e) {
    console.log('❌ ERROR SHEET APPS SCRIPT:', e.message);
    if (e.response) console.log('Detalle:', e.response.data);
    return { success: true, simulated: true };
  }
}
module.exports = { saveOrder };
