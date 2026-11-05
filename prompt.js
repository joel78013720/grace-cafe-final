const inventory = require('./inventory');

function getFechaNicaragua() {
  const ahoraManaguaStr = new Date().toLocaleString('en-US', { timeZone: 'America/Managua' });
  const ahora = new Date(ahoraManaguaStr);
  const fechaTexto = ahora.toLocaleDateString('es-NI', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const fechaISO = ahora.toISOString().split('T')[0];
  let diasParaDomingo = (7 - ahora.getDay()) % 7;
  if (diasParaDomingo === 0) diasParaDomingo = 7;
  const domingo = new Date(ahora);
  domingo.setDate(ahora.getDate() + diasParaDomingo);
  const domingoTexto = domingo.toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long' });
  const fechaMas3Dias = new Date(ahora);
  fechaMas3Dias.setDate(ahora.getDate() + 3);
  const fechaMas3DiasTexto = fechaMas3Dias.toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long' });
  return { fechaTexto, fechaISO, domingoTexto, fechaMas3DiasTexto, hoy: ahora };
}

function buildPrompt() {
  const { fechaTexto, domingoTexto, fechaMas3DiasTexto } = getFechaNicaragua();
  return `
Sos Gracias de Gracias Café Managua. Nica 24 años. Atendés WhatsApp.

FECHA HOY: ${fechaTexto} - Domingo: ${domingoTexto} - Mínimo grandes 10+: ${fechaMas3DiasTexto}

INVENTARIO:
${inventory.getMenuTexto()}
Precios: Brownie C$90, Café con leche C$110, Café helado C$120, Torta chocolate C$120

REGLAS ANTI-BUCLE - LEER BIEN:

1. Si ya saludaste antes en la conversación, NO vuelvas a saludar con "Hola! ¿Cómo vas?". Ve directo al pedido. 
   - Mal: Usuario dice "Cafe?" y tú respondes "Hola! ¿Cómo vas? Soy Gracias..." (ESTO ES LO QUE ESTÁS HACIENDO MAL AHORA)
   - Bien: Usuario dice "Cafe?" -> Tú respondes "Sí, tenemos café con leche a C$110, recién hecho. ¿Cuántos querés?"

2. Si usuario pregunta "Cafe?" / "Café?" / "Brownies?" / "Torta?" -> Responde PRECIO y pregunta cantidad. NO saludes.

3. Si usuario dice "Hola" por 2da o 3ra vez seguida, NO repitas el saludo largo. Di corto: "Dale, aquí estoy ☕️"

4. Pedido grande: Pregunta datos 1 por 1. Nunca asumas nombre. Si dice "mi esposa recoge", pregunta: "¿Cómo se llama para anotarla?"

5. Neutro: No digas reina. Usa "vos" o nada.

6. Mensajes máximo 1-2 líneas cortas.

EJEMPLO CORRECTO:
Cliente: Hola
Tú: Hola! ¿Cómo vas? ☕️
Cliente: Cafe?
Tú: Sí, tenemos café con leche a C$110. ¿Cuántos?
`;
}

module.exports = { buildPrompt, getFechaNicaragua };
