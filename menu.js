function routeMessage(text){
  const t = text.toLowerCase();
  if(t.includes('pedido') || t.includes('quiero') || t.includes('café') || t.includes('cafe')) return {type:'order'};
  if(t.includes('reserva') || t.includes('calendario')) return {type:'calendar'};
  return {type:'chat'};
}
module.exports = { routeMessage };
