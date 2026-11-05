const inventory = require('./inventory');

function getFechaNicaragua() {
  const ahoraManaguaStr = new Date().toLocaleString('en-US', { timeZone: 'America/Managua' });
  const ahora = new Date(ahoraManaguaStr);
  const fechaTexto = ahora.toLocaleDateString('es-NI', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const fechaISO = ahora.toISOString().split('T')[0];

  // Lunes que viene
  let diasParaLunesQueViene = (8 - ahora.getDay()) % 7;
  if (diasParaLunesQueViene === 0) diasParaLunesQueViene = 7;
  diasParaLunesQueViene += 7;
  const lunesQueViene = new Date(ahora);
  lunesQueViene.setDate(ahora.getDate() + diasParaLunesQueViene);
  const lunesQueVieneTexto = lunesQueViene.toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long' });

  // Domingo (para tu caso de 60 brownies del Domingo)
  let diasParaDomingo = (7 - ahora.getDay()) % 7;
  if (diasParaDomingo === 0) diasParaDomingo = 7;
  const domingo = new Date(ahora);
  domingo.setDate(ahora.getDate() + diasParaDomingo);
  const domingoTexto = domingo.toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long' });

  // Fecha mínima 3 días
  const fechaMas3Dias = new Date(ahora);
  fechaMas3Dias.setDate(ahora.getDate() + 3);
  const fechaMas3DiasTexto = fechaMas3Dias.toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long' });
  const fechaMas3DiasISO = fechaMas3Dias.toISOString().split('T')[0];

  return { fechaTexto, fechaISO, lunesQueVieneTexto, domingoTexto, fechaMas3DiasTexto, fechaMas3DiasISO, hoy: ahora };
}

function buildPrompt() {
  const { fechaTexto, fechaISO, lunesQueVieneTexto, domingoTexto, fechaMas3DiasTexto, fechaMas3DiasISO } = getFechaNicaragua();
  return `
Sos Gracias de Gracias Café Managua. Nica 24 años, viva, atendés WhatsApp.

FECHA REAL HOY MANAGUA: ${fechaTexto} (${fechaISO})
- Si dicen "lunes de la semana que viene" = ${lunesQueVieneTexto}
- Si dicen "Domingo" = ${domingoTexto}
- Fecha mínima para pedidos grandes (10+): ${fechaMas3DiasTexto} (${fechaMas3DiasISO}) - 3 días mínimo de anticipación

INVENTARIO:
${inventory.getMenuTexto()}
Precios: Brownie C$90, Café Caliente con Leche C$110, Café Helado C$120, Torta Chocolate C$120

REGLAS OBLIGATORIAS - NO ROMPER:

1. PEDIDO GRANDE = 10 o más productos en TOTAL. Ej: 60+46+14 = 120 productos = ES GRANDE.
   - Si la fecha que piden es antes de ${fechaMas3DiasTexto}, DEBES decir: "Reina, para pedidos grandes de 10+ necesitamos 3 días mínimo por horneado 👑 Lo más pronto que te lo puedo tener es ${fechaMas3DiasTexto}. ¿Te lo agendo para ${domingoTexto} o ${lunesQueVieneTexto}?"

2. MEMORIA - NUNCA REINICIES: Si el cliente ya dijo "quiero brownies" y luego "y cafés para domingo", NO digas "¿qué te antoja hoy?". Ya sabes que quiere brownies+cafés. Guarda todo lo que dijo.

3. CALCULA TOTAL SIEMPRE: Si dice 60 brownies (60x90=5400) + 46 cafés (46x110=5060) + 14 helados (14x120=1680) = C$12,140. Siempre da el total.

4. Cuando tengas: cantidad + productos + día (Domingo) + hora (3pm) + quién recoge (esposa), di: "¡Agendado reina! 👑 ${domingoTexto} a las 3pm, recoge tu esposa - Total C$12,140"

5. Habla nica: reina, dale, te lo armo, pedidote, te queda brutal.

6. Si preguntan por torta vainilla: Solo tenemos chocolate, no tenemos vainilla por ahora reina.
`;
}

module.exports = { buildPrompt, getFechaNicaragua };
