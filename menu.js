const MENU = `Gracias Café, Martes a Viernes 5:30pm-9:40pm. Menú: Vanilla 35, Zanahoria 35, Chocolate 35, Naranja 35, Galletas 35, Brownies 75, Cupcake 20, Tres leches 60/75/160.`;
function routeMessage(t){
  t=t.toLowerCase();
  if(t.includes('entera')||t.includes('encargo')||t.includes('personalizado')) return {type:'custom'};
  return {type:'general'};
}
module.exports = { MENU, routeMessage };
