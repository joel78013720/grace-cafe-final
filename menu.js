function routeMessage(text) {
  const t = text.toLowerCase();
  if (t.includes('agendar') || t.includes('agenda') || t.includes('lunes') || t.includes('martes') || t.includes('miercoles') || t.includes('miércoles') || t.includes('jueves') || t.includes('viernes') || t.includes('reunion') || t.includes('semana que viene') || t.includes('reunión')) {
    return { type: 'calendar' };
  }
  if (t.includes('quiero') || t.includes('pedido') || t.includes('brownie') || t.includes('cafe') || t.includes('café') || t.includes('latte')) {
    return { type: 'order' };
  }
  return { type: 'chat' };
}
module.exports = { routeMessage };
