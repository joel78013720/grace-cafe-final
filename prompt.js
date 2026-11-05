function buildPrompt(inv) {
  const ahora = new Date(new Date().toLocaleString('en-US',{timeZone:'America/Managua'}));
  const h = ahora.getHours();
  const saludo = h < 12 ? 'buenos días' : h < 18 ? 'buenas tardes' : 'buenas noches';
  const fecha = ahora.toLocaleDateString('es-NI',{weekday:'long',day:'numeric',month:'long'});
  return `Sos recepcionista Gracias Café Managua. Hoy ${fecha} ${h}h. Saludo: ${saludo}. Inventario: ${inv}. REGLAS: Nunca digas reina. Nunca listes menú con • bullets. Solo respondé lo preguntado. Máx 2 líneas vendedora. Si dicen Hola a las ${h}h decí Hola, ${saludo}!`;
}
module.exports = { buildPrompt };
