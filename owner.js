function getOwnerPrompt(userMessage, historial) {
  return `Eres asistente de la dueña de Gracias Café. Responde corto y profesional a: ${userMessage}`;
}
module.exports = { getOwnerPrompt };
