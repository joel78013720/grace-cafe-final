const axios = require('axios');
const FormData = require('form-data');

async function transcribeAudio(audioId) {
  try {
    const mediaRes = await axios.get(`https://graph.facebook.com/v20.0/${audioId}`, {
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` }
    });
    const audioFile = await axios.get(mediaRes.data.url, {
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
      responseType: 'arraybuffer'
    });
    const form = new FormData();
    form.append('file', audioFile.data, { filename: 'audio.ogg', contentType: 'audio/ogg' });
    form.append('model', 'whisper-large-v3');
    const transRes = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${process.env.GROQ_API_KEY}` }
    });
    return transRes.data.text;
  } catch(e) {
    console.log('Audio fail', e.response?.data || e.message);
    return null;
  }
}
module.exports = { transcribeAudio };
