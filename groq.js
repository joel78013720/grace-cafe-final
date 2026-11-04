const axios = require('axios');
const { buildPrompt } = require('./prompt');

async function getReply(userMsg) {
  const msg = (userMsg || '').toLowerCase();
  let aiText = '';
  try {
    const r = await axios.post('https://api.groq.com/openai/v1/chat/completions',{
      model:'openai/gpt-oss-20b',
      messages:[
        {role:'system', content: buildPrompt()},
        {role:'user', content: userMsg}
      ],
      temperature:0.7,
      max_tokens:200
    },{
      headers:{
        Authorization:`Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type':'application/json'
      }
    });
    aiText = r.data?.choices?.[0]?.message?.content || '';
  } catch(e){
    console.log('Groq fail', e.response?.data || e.message);
  }

  // Si la IA no devolvió nada, usamos respaldo que SIEMPRE tiene texto
  if (!aiText || aiText.trim() === '') {
    if(msg.includes('pastel') || msg.includes('torta') || msg.includes('postre') || msg.includes('brownie')) {
      return '¡Sí! 🍰 Tenemos brownies C$90, torta de chocolate y cheesecake C$120. ¿Cuál te antoja?';
    }
    if(msg.includes('fresq') || msg.includes('jugo')) {
      return '¡De una! 🧃 Tengo fresquito de cacao, jamaica y tamarindo. ¿Cuál querés?';
    }
    if(msg.includes('cafe') || msg.includes('café')) {
      return 'Dale rey, un cafecito ☕️ ¿lo querés helado o caliente? ¿Cuántos?';
    }
    return 'Soy Gracias de Gracias Café ☕️ ¿qué te antoja hoy?';
  }

  return aiText.slice(0,300);
}

module.exports={getReply};
