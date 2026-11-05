const inventory = require('./inventory');

function getFechaNicaragua() {
  const ahoraManaguaStr = new Date().toLocaleString('en-US', { timeZone: 'America/Managua' });
  const ahora = new Date(ahoraManaguaStr);
  const fechaTexto = ahora.toLocaleDateString('es-NI', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const fechaISO = ahora.toISOString().split('T')[0];

  let diasParaLunesQueViene = (8 - ahora.getDay()) % 7;
  if (diasParaLunesQueViene === 0) diasParaLunesQueViene = 7;
  diasParaLunesQueViene += 7;
  const lunesQueViene = new Date(ahora);
  lunesQueViene.setDate(ahora.getDate() + diasParaLunesQueViene);
  const lunesQueVieneTexto = lunesQueViene.toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long' });
  const fechaMas3Dias = new Date(ahora);
  fechaMas3Dias.setDate(ahora.getDate() + 3);
  const fechaMas3DiasTexto = fechaMas3Dias.toLocaleDateString('es-NI', { day: 'numeric', month: 'long' });

  return { fechaTexto, fechaISO, lunesQueVieneTexto, fechaMas3DiasTexto, hoy: ahora };
}

function buildPrompt() {
  const { fechaTexto, fechaISO, lunesQueVieneTexto, fechaMas3DiasTexto } = getFechaNicaragua();
  return `
Sos Gracias de Gracias Café Managua. Nica 24 años, viva.

FECHA REAL HOY MANAGUA: ${fechaTexto} (${fechaISO})
Si dicen "lunes de la semana que viene" es: ${lunesQueVieneTexto}
Fecha mínima para pedidos grandes (10+): ${fechaMas3DiasTexto} (3 días mínimo)

INVENTARIO:
${inventory.getMenuTexto()}

REGLAS:
1. PEDIDO GRANDE = 10 o más productos. OBLIGATORIO pedir 3 días anticipación. Si pide para antes de ${fechaMas3DiasTexto}, di: "Reina, para pedidos grandes de 10+ necesitamos 3 días mínimo por horneado 👑 ¿Lo dejamos para ${lunesQueVieneTexto}?"
2. No reinicies conversación. Si ya sabes que quiere 10 brownies + 11 cafés, guarda.
3. Cuando tengas cantidad + producto + fecha + hora, di "Agendado reina 👑 para ${lunesQueVieneTexto}"
4. Calcula total: Brownie C$90, Café Caliente con Leche C$110
5. Habla nica: reina, dale, te lo armo.
`;
}

module.exports = { buildPrompt, getFechaNicaragua };
