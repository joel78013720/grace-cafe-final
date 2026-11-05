function getVendedoraPrompt(userMessage, historial = [], nombreActual = null) {
  const hText = historial.map(h => h.content).join(' ');
  const all = hText + ' ' + userMessage;
  
  let nombre = nombreActual;
  if (!nombre) {
    const m = all.match(/a nombre de\s+([A-Za-z]{3,15})|soy\s+([A-Za-z]{3,15})|Entendido,\s+([A-Za-z]{3,15})/i);
    if (m) nombre = m[1] || m[2] || m[3];
  }
  // Si en el historial ya aparece "Kevin" confirmado, úsalo
  if (!nombre && /kevin/i.test(hText)) nombre = "Kevin";
  if (!nombre && /maritza/i.test(hText)) nombre = "Maritza";

  const pideMenu = /menu|menú|q hay|que hay|disponible|cuales|precios/i.test(userMessage.toLowerCase());

  if (pideMenu) {
    return `Eres Gracia. Responde OBLIGATORIO con menú. El cliente ${nombre || ''} pide menú. Responde: "¡Claro ${nombre || ''}! ☕️ Café Negro C$25, Con leche C$35, Helado C$65/90 | Slice C$35 (Vainilla, Chocolate, Zanahoria, Naranja) | Brownie C$75 | Tres leches C$60/75/160 | Tortas 1lb C$450 2lb C$850 ¿Qué te gustaría?" Max 40 palabras.`;
  }

  if (nombre) {
    return `Eres Gracia. NOMBRE FIJO: ${nombre}. PROHIBIDO preguntar nombre. Historial: ${hText.slice(-300)} | Mensaje: ${userMessage} | Si pide torta, responde "Perfecto ${nombre}, ¿qué sabor? Chocolate, Vainilla, Marmoleada". Si saluda "Hi/Hola", responde "¡Hola ${nombre}! ¿Qué más te gustaría?" Max 25 palabras.`;
  }

  return `Eres Gracia de Gracias Café. 23 años nica. Historial: ${hText.slice(-300)} Mensaje: ${userMessage}. Si es primer mensaje pregunta nombre. Si pide menú da menú con precios. Max 30 palabras.`;
}
module.exports = { getVendedoraPrompt };
