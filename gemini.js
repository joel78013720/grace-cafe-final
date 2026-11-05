const axios = require('axios');
async function askGemini(prompt){
  try{
    const res = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, { contents:[{parts:[{text:prompt}]}] });
    return res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  }catch(e){ console.log('GEMINI ERROR', e.response?.data||e.message); return null; }
}
module.exports = { askGemini };
