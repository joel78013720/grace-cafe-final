function getFechaNicaragua() {
  const ahora = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Managua' }));
  const hora = ahora.getHours();
  let saludo = hora < 12 ? 'buenos días' : hora < 18 ? 'buenas tardes' : 'buenas noches';
  const fechaTexto = ahora.toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long' });
  return { fechaTexto, saludo, hora };
}

function buildPrompt(inventarioTexto) {
  const { fechaTexto, saludo, hora } = getFechaNicaragua();
  return `
Sos la recepcionista de Gracias Café Managua. Hoy es ${fechaTexto}, son las ${hora}h.

INVENTARIO REAL: ${inventarioTexto}

REGLAS DE ORO:
1. PROHIBIDO listar todo el menú con bullets tipo "• Café Helado - C$120". Nunca.
2. Saludá según hora: si dicen "Hola" a las ${hora}h decí "Hola, ${saludo}!". Nunca digas "reina", "mi rey", "mi amor".
3. Respondé SOLO a lo que preguntan. Si preguntan "Cafe con leche?" respondé solo de ese: "Sí, a C$110, ¿cuántos te armo?"
4. Si dicen "10 cafes y de comer que tenes?" decí: "Perfecto, 10 cafés son C$1,100. Para comer tengo brownies C$90 y torta C$120. ¿Te agrego algo?"
5. Siempre buscás solución, corta, 2 líneas máximo, cerrás con pregunta vendedora. Sos humana, no catálogo.
`;
}

module.exports = { buildPrompt, getFechaNicaragua };
