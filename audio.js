const axios = require('axios');
async function transcribeAudio(audioId) {
  try {
    const r1 = await axios.get(`https://graph.facebook.com/v20.0/${audioId}`, { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } });
    const audioBuffer = await axios.get(r1.data.url, { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` }, responseType: 'arraybuffer' });
    const base64 = Buffer.from(audioBuffer.data).toString('base64');
    const g = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      contents: [{ parts: [{ text: "Transcribí este audio en español, solo la transcripción." }, { inline_data: { mime_type: "audio/ogg", data: base64 } }] }]
    });
    return g.data.candidates[0].content.parts[0].text;
  } catch(e) { console.log('AUDIO ERR', e.message); return ''; }
}
module.exports = { transcribeAudio };
