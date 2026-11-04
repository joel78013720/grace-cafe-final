const axios = require('axios');
const { buildPrompt } = require('./prompt');
async function getReply(userMsg) {
  const msg = userMsg.toLowerCase();
  try {
    const r = await axios.post('https://api.groq.com/openai/v1/chat/completions',{
      model:'openai/gpt-oss-20b',
      messages:[{role:'system', content: buildPrompt()},{role:'user', content: userMsg}],
      temperature:0.7,
      max_tokens:200
    },{headers:{Authorization:`Bearer ${process.env.GROQ_API_KEY}`}});
    return r.data.choices[0].message.content.slice(0,300);
  } catch(e){
    console.log('Groq fail', e.response?.data || e.message);
    if(msg.includes('fresq') || msg.includes('jugo')) {
      return '¡De una! 🧃 Tengo fresquito de cacao, jamaica y tamarindo. ¿Cuál querés?';
    }
    if(msg.includes('menu') || msg.includes('tenes') || msg.includes('tienes')) {
      return '¡Claro! Café helado C$120, caliente C$100, fresquitos C$80, brownies y tortas ☕️ ¿qué te antoja?';
    }
    if(msg.includes('cafe') || msg.includes('café')) {
      return 'Dale rey, un cafecito ☕️ ¿lo querés helado o caliente? ¿Cuántos?';
    }
    return 'Soy Gracias de Gracias Café ☕️ ¿qué te antoja hoy?';
  }
}
module.exports={getReply};
