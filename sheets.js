const axios = require('axios');
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzv6p_LciorvNrzxJq-jCRj-bh25iaBVITeZmjtUxZDfTmp3dikZ2OYvLWnjg7rpkHQBQ/exec';

async function saveOrder({ cliente, pedido }) {
  try {
    await axios.post(SHEET_URL, {
      cliente, telefono: cliente, pedido, cantidad: 1,
      fecha_entrega: 'Hoy', pago: 'Por definir', estado: 'Nuevo',
      fecha: new Date().toLocaleString()
    });
    console.log('Sheets OK');
  } catch (e) { console.log('Sheets fail'); }
}
module.exports = { saveOrder };
