const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const axios = require('axios');
const fs = require('fs');

async function getReply(prompt) {
  const c = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 450,
    temperature: 0.6
  });
  return c.choices[0].message.content;
}

async function transcribirAudio(audioId) {
  try {
    const token = process.env.WHATSAPP_TOKEN;
    const r1 = await axios.get(`https://graph.facebook.com/v20.0/${audioId}`, { headers: { Authorization: `Bearer ${token}` } });
    const r2 = await axios.get(r1.data.url, { headers: { Authorization: `Bearer ${token}` }, responseType: 'arraybuffer' });
    fs.writeFileSync('/tmp/audio.ogg', r2.data);
    const tr = await groq.audio.transcriptions.create({ file: fs.createReadStream('/tmp/audio.ogg'), model: "whisper-large-v3", language: "es" });
    return tr.text;
  } catch(e){ console.log("AUDIO ERR", e.message); return null; }
}

module.exports = { getReply, transcribirAudio };
