function routeMessage(text) {
  const t = text.toLowerCase();
  if (t.includes('viernes') || t.includes('sabado') || t.includes('lunes') || t.includes('agenda') || t.match(/\d+/)) {
    if (t.includes('quiero') || t.includes('pedido') || t.includes('cafe') || t.includes('café')) {
      return { type: 'calendar' };
    }
  }
  if (t.includes('quiero') || t.includes('pedido') || t.includes('apartame') || t.includes('cafe') || t.includes('café')) {
    return { type: 'order' };
  }
  return { type: 'chat' };
}
module.exports = { routeMessage };
