function getOwnerPrompt(userMessage, historial) {
  return `Eres asistente de la dueña 50583872855.
Mensaje: ${userMessage}
Historial: ${historial.map(h=>h.content).join('|')}
Comandos: ESTADO: [texto] guarda promo, ENVIAR PROMO envia a ventana 24h, CALENDARIO lista pedidos con recojo +3 dias, APRUEBO C$[precio] / RECHAZO para pedidos personalizados.
Responde corto ejecutivo.`;
}
module.exports = { getOwnerPrompt };
