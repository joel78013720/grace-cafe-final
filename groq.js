const axios = require('axios');
const { buildPrompt } = require('./prompt');
async function getReply(userMsg) {
  try {
    const r = await axios.post('https://api.groq.com/openai/v1/chat/completions',{
      model:'llama-3.1-8b-instant',
      messages:[{role:'system', content: buildPrompt()},{role:'user', content: userMsg}],
      temperature:0.7
    },{headers:{Authorization:`Bearer ${process.env.GROQ_API_KEY}`}});
    return r.data.choices[0].message.content.slice(0,300);
  } catch(e){
    console.log('Groq fail', e.response?.data || e.message);
    if(userMsg.toLowerCase().includes('cafe') || userMsg.toLowerCase().includes('café')) {
      return 'Dale rey, un cafecito ☕️ ¿lo querés helado o caliente? ¿Cuántos?';
    }
    return 'Soy Gracias de Gracias Café ☕️ ¿qué te antoja hoy?';
  }
}
module.exports={getReply};
