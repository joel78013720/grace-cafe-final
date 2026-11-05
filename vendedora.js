function getVendedoraPrompt(userMessage, historial = [], nombreActual = null) {
  const hText = historial.map(h => h.content).join(' ');
  let nombre = nombreActual;
  if (!nombre && /kevin/i.test(hText)) nombre = "Kevin";
  if (!nombre && /maritza/i.test(hText)) nombre = "Maritza";
  const m = (hText + ' ' + userMessage).match(/a nombre de\s+([A-Za-z]{3,15})/i);
  if (m) nombre = m[1];
  const pideMenu = /menu|menú|q hay|que hay|disponible|precios/i.test(userMessage.toLowerCase());
  if (pideMenu) return `Eres Gracia. Responde OBLIGATORIO menú: "¡Claro ${nombre||''}! Café Negro C$25, Con leche C$35, Helado C$65/90, Slice C$35, Brownie C$75, Tres leches C$60/75/160, Tortas 1lb C$450 2lb C$850. ¿Qué te gustaría?" Max 40 palabras.`;
  if (nombre) return `Eres Gracia. NOMBRE FIJO ${nombre}. PROHIBIDO preguntar nombre. Historial: ${hText.slice(-300)} Mensaje: ${userMessage}. Si pide torta di "Perfecto ${nombre}, ¿qué sabor?" Si saluda "Hi" di "¡Hola ${nombre}!". Max 25 palabras.`;
  return `Eres Gracia de Gracias Café. 23 años nica. Mensaje: ${userMessage} Historial: ${hText.slice(-300)} Si es primer mensaje pide nombre. Max 30 palabras.`;
}
module.exports = { getVendedoraPrompt };
