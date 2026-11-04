const axios = require('axios');
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzv6p_LciorvNrzxJq-jCRj-bh25iaBVITeZmjtUxZDfTmp3dikZ2OYvLWnjg7rpkHQBQ/exec';

async function createEvent({ cliente, pedido }) {
  try {
    await axios.post(SHEET_URL, {
      action: 'calendar', cliente, pedido,
      yo: 'rochajoel611@gmail.com',
      ella: 'ropashein14@gmail.com',
      fecha: new Date().toISOString()
    });
    console.log('Calendar OK');
  } catch (e) { console.log('Calendar fail'); }
}
module.exports = { createEvent };
