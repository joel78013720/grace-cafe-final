const { Groq } = require('groq-sdk');

// Inicializar el cliente de Groq utilizando la variable de entorno GROQ_API_KEY
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
});

/**
 * Obtiene una respuesta del modelo Llama 3.3 a través de Groq SDK.
 * 
 * @param {string} prompt - El prompt del sistema o instrucción completa.
 * @returns {string} - La respuesta generada por el modelo o un mensaje alternativo si ocurre un error.
 */
async function getReply(prompt) {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.warn('[Groq SDK] Advertencia: Falta la variable de entorno GROQ_API_KEY.');
      return '¡Hola! Gracias por escribirnos a Gracias Café. En un momento le atendemos con mucho gusto.';
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      max_tokens: 400,
      temperature: 0.6
    });

    if (chatCompletion && chatCompletion.choices && chatCompletion.choices.length > 0) {
      return chatCompletion.choices[0]?.message?.content || '¡Gracias por visitar Gracias Café! ¿En qué le podemos servir hoy?';
    }

    return '¡Gracias por visitar Gracias Café! ¿En qué le podemos servir hoy?';
  } catch (error) {
    // Manejo de errores seguro para evitar que la aplicación crashee en Render
    console.error('[Error Groq API]:', error.message || error);
    return '¡Hola! En un momento le tomamos su pedido con mucho gusto.';
  }
}

module.exports = {
  getReply
};
